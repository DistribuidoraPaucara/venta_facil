<?php

namespace App\Services;

use App\Models\Almacen;
use App\Models\Producto;
use App\Models\StockLimite;
use App\Models\StockProducto;
use Illuminate\Support\Collection;

/**
 * Sugerencias de reposición y compra a partir de stock_limites + stock_productos.
 *
 * Clasifica cada producto con límites en SALA DE VENTAS y/o ALMACÉN PRINCIPAL en:
 *  - reponer:             SALA en o bajo 120% de su mínimo y PRINCIPAL tiene stock → traspasar.
 *  - comprar_almacen:     PRINCIPAL bajo su mínimo (proyectado tras reponer), más lo que
 *                         SALA necesita y PRINCIPAL no alcanza a cubrir.
 *  - compra_directa_sala: SALA en o bajo 120% de su mínimo y el producto NO tiene límite en
 *                         PRINCIPAL (ej. pan: se compra y se vende a diario en sala).
 *
 * Umbrales iguales a la web (ReposicionController::create / ComprasController::index).
 */
class ReposicionSugeridaService
{
    /** stock_maximo por defecto en stock_limites = "sin máximo definido" */
    private const SIN_MAXIMO = 999999;

    /** Reponer SALA al llegar al 120% del mínimo (aviso anticipado, como la web) */
    private const FACTOR_AVISO_SALA = 1.2;

    public function calcular(int $empresaId): array
    {
        $almacenes = Almacen::where('empresa_id', $empresaId)->get(['id', 'nombre']);

        // Mismo criterio de la web para identificar los almacenes
        $principal = $almacenes->first(fn($a) => stripos($a->nombre, 'principal') !== false);
        $sala      = $almacenes->first(fn($a) => stripos($a->nombre, 'sala') !== false
            || stripos($a->nombre, 'venta') !== false);

        $resultado = [
            'almacen_principal'   => $principal ? ['id' => $principal->id, 'nombre' => $principal->nombre] : null,
            'almacen_sala'        => $sala ? ['id' => $sala->id, 'nombre' => $sala->nombre] : null,
            'reponer'             => [],
            'comprar_almacen'     => [],
            'compra_directa_sala' => [],
        ];
        if (! $principal && ! $sala) {
            return $resultado;
        }

        $almacenIds = array_values(array_filter([$principal?->id, $sala?->id]));

        $limites = StockLimite::whereIn('almacen_id', $almacenIds)
            ->with('sector:id,nombre')
            ->get()
            ->groupBy('producto_id');
        if ($limites->isEmpty()) {
            return $resultado;
        }

        $productos = Producto::whereIn('id', $limites->keys())
            ->where('empresa_id', $empresaId)
            ->where('activo', true)
            ->with('unidad:id,nombre,codigo')
            ->get(['id', 'nombre', 'sku', 'unidad_medida_id'])
            ->keyBy('id');

        // Stock disponible por producto y almacén (SoftDeletes excluye lotes eliminados)
        $stocks = StockProducto::whereIn('almacen_id', $almacenIds)
            ->whereIn('producto_id', $productos->keys())
            ->selectRaw('producto_id, almacen_id, SUM(cantidad_disponible) AS total')
            ->groupBy('producto_id', 'almacen_id')
            ->get()
            ->mapWithKeys(fn($s) => ["{$s->producto_id}-{$s->almacen_id}" => (float) $s->total]);

        foreach ($productos as $producto) {
            $limitesProducto = $limites[$producto->id];
            $limSala         = $sala ? $this->limitesDe($limitesProducto, $sala->id) : null;
            $limPrincipal    = $principal ? $this->limitesDe($limitesProducto, $principal->id) : null;
            $stockSala       = $sala ? ($stocks["{$producto->id}-{$sala->id}"] ?? 0.0) : 0.0;
            $stockPrincipal  = $principal ? ($stocks["{$producto->id}-{$principal->id}"] ?? 0.0) : 0.0;

            $base = [
                'producto_id'     => $producto->id,
                'nombre'          => $producto->nombre,
                'sku'             => $producto->sku,
                'unidad'          => $producto->unidad?->codigo ?? $producto->unidad?->nombre,
                'stock_sala'      => $stockSala,
                'stock_principal' => $stockPrincipal,
                'sala'            => $limSala,
                'principal'       => $limPrincipal,
            ];

            // 1) SALA DE VENTAS: ¿necesita stock?
            $reponer       = 0.0;
            $pendienteSala = 0.0;
            if ($limSala && $stockSala <= $limSala['minimo'] * self::FACTOR_AVISO_SALA) {
                $falta         = max(0.0, $limSala['objetivo'] - $stockSala);
                $reponer       = min($falta, max(0.0, $stockPrincipal));
                $pendienteSala = $falta - $reponer;

                if ($reponer > 0) {
                    $resultado['reponer'][] = $base + ['cantidad_sugerida' => $reponer];
                }
                // Sin límite en PRINCIPAL = producto que vive solo en sala (pan)
                if (! $limPrincipal && $pendienteSala > 0) {
                    $resultado['compra_directa_sala'][] = $base + ['cantidad_sugerida' => $pendienteSala];
                }
            }

            // 2) ALMACÉN PRINCIPAL: ¿hay que comprar?
            if ($limPrincipal) {
                // Proyectado: lo que quedará tras traspasar a sala
                $stockPrincipalDespues = $stockPrincipal - $reponer;
                $paraAlmacen = $stockPrincipalDespues < $limPrincipal['minimo']
                    ? max(0.0, $limPrincipal['objetivo'] - $stockPrincipalDespues)
                    : 0.0;
                $total = $paraAlmacen + $pendienteSala;

                if ($total > 0) {
                    $resultado['comprar_almacen'][] = $base + [
                        'cantidad_sugerida'       => $total,
                        'cantidad_para_almacen'   => $paraAlmacen,
                        'cantidad_para_sala'      => $pendienteSala,
                    ];
                }
            }
        }

        foreach (['reponer', 'comprar_almacen', 'compra_directa_sala'] as $grupo) {
            usort($resultado[$grupo], fn($a, $b) => strcasecmp($a['nombre'], $b['nombre']));
        }

        return $resultado;
    }

    /**
     * Mínimo/máximo del producto en un almacén (si tiene varios sectores, el mínimo más
     * bajo y el máximo más alto, como la web). `objetivo` = hasta dónde reponer/comprar:
     * el máximo si está definido; si no, el mínimo.
     */
    private function limitesDe(Collection $limitesProducto, int $almacenId): ?array
    {
        $delAlmacen = $limitesProducto->where('almacen_id', $almacenId);
        if ($delAlmacen->isEmpty()) {
            return null;
        }

        $minimo       = (float) $delAlmacen->min('stock_minimo');
        $maximo       = (float) $delAlmacen->max('stock_maximo');
        $maxDefinido  = $maximo > 0 && $maximo < self::SIN_MAXIMO && $maximo >= $minimo;

        return [
            'minimo'          => $minimo,
            'maximo'          => $maxDefinido ? $maximo : null,
            'objetivo'        => $maxDefinido ? $maximo : $minimo,
            'sectores'        => $delAlmacen->map(fn($l) => $l->sector?->nombre)->filter()->unique()->values()->all(),
        ];
    }
}
