<?php

namespace App\Services;

use App\Models\ConversionUnidadProducto;
use App\Models\DetalleFraccionamiento;
use App\Models\FraccionamientoMasivo;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockLimite;
use App\Models\StockProducto;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Fraccionamiento masivo: varios productos padre → sus productos hijo, en un almacén.
 *
 * - Cada detalle es UN par padre → hijo con su propia cantidad de padre (un padre con varios hijos manda un
 *   detalle por hijo; el padre se descuenta la suma de sus detalles, no la cantidad repetida en cada uno).
 * - Antes de mover nada se valida, por padre, que la suma pedida no supere su disponible en el almacén.
 * - El padre se descuenta de sus lotes del almacén, los que vencen antes primero (no de un solo lote).
 * - El hijo debe ser una conversión configurada del padre.
 */
class FraccionamientoMasivoService
{
    public function registrar(
        int $almacenId,
        int $sectorId,
        array $detalles,
        string $razon = 'fraccionamiento_manual',
        ?string $notas = null
    ): FraccionamientoMasivo {
        return DB::transaction(function () use ($almacenId, $sectorId, $detalles, $razon, $notas) {
            if (empty($detalles)) {
                throw new \Exception('Debe haber al menos un detalle de fraccionamiento');
            }

            foreach ($detalles as $detalle) {
                $this->validarDetalle($detalle);
            }
            $this->validarStockSuficiente($almacenId, $detalles);

            // Sector del encabezado: el del límite del primer padre o, si no tiene, el de su stock en el almacén
            if (! $sectorId) {
                $padreId  = $detalles[0]['producto_padre_id'];
                $sectorId = StockLimite::where('producto_id', $padreId)->where('almacen_id', $almacenId)->value('sector_id')
                    ?? StockProducto::where('producto_id', $padreId)->where('almacen_id', $almacenId)->value('sector_id');

                if (! $sectorId) {
                    throw new \Exception('No se puede determinar el sector del fraccionamiento');
                }
            }

            $fraccionamientoMasivo = FraccionamientoMasivo::create([
                'almacen_id'            => $almacenId,
                'sector_id'             => $sectorId,
                'usuario_id'            => Auth::id(),
                'fecha_fraccionamiento' => now(),
                'razon'                 => $razon,
                'notas'                 => $notas,
                'cantidad_detalles'     => count($detalles),
            ]);

            foreach ($detalles as $numero => $detalle) {
                $this->procesarDetalle($fraccionamientoMasivo, $detalle, $numero + 1);
            }

            Log::info('Fraccionamiento masivo registrado exitosamente', [
                'fraccionamiento_masivo_id' => $fraccionamientoMasivo->id,
                'cantidad_detalles'         => count($detalles),
            ]);

            return $fraccionamientoMasivo->load('detalles');
        });
    }

    private function validarDetalle(array $detalle): void
    {
        $productoPadre = Producto::findOrFail($detalle['producto_padre_id']);
        $productoHijo  = Producto::findOrFail($detalle['producto_hijo_id']);

        if ($productoPadre->id === $productoHijo->id) {
            throw new \Exception('El producto padre y hijo no pueden ser el mismo');
        }

        if ($detalle['cantidad_padre'] <= 0 || $detalle['cantidad_hijo'] <= 0) {
            throw new \Exception('Las cantidades deben ser mayores a 0');
        }

        $esConversion = ConversionUnidadProducto::where('producto_id', $productoPadre->id)
            ->where('producto_destino_id', $productoHijo->id)
            ->where('activo', true)
            ->exists();
        if (! $esConversion) {
            throw new \Exception("{$productoHijo->nombre} no es un producto hijo de {$productoPadre->nombre}");
        }
    }

    /**
     * La suma de lo que se fracciona de cada padre no puede superar su disponible en el almacén (todos sus lotes).
     */
    private function validarStockSuficiente(int $almacenId, array $detalles): void
    {
        $pedidoPorPadre = collect($detalles)
            ->groupBy('producto_padre_id')
            ->map(fn ($ds) => round($ds->sum(fn ($d) => (float) $d['cantidad_padre']), 6));

        foreach ($pedidoPorPadre as $padreId => $pedido) {
            $disponible = (float) StockProducto::where('producto_id', $padreId)
                ->where('almacen_id', $almacenId)
                ->sum('cantidad_disponible');

            if ($pedido > $disponible + 0.000001) {
                $nombre = Producto::find($padreId)?->nombre ?? "#{$padreId}";
                throw new \Exception(
                    "Stock insuficiente de {$nombre} en el almacén. Disponible: " . $this->numero($disponible) . ', a fraccionar: ' . $this->numero($pedido)
                );
            }
        }
    }

    private function procesarDetalle(FraccionamientoMasivo $fm, array $d, int $num): void
    {
        $almacenId = $fm->almacen_id;
        $cpPadre   = (float) $d['cantidad_padre'];
        $cpHijo    = (float) $d['cantidad_hijo'];
        $pp        = Producto::findOrFail($d['producto_padre_id']);
        $ph        = Producto::findOrFail($d['producto_hijo_id']);
        $documento = "FM-{$fm->id}";
        $obs       = "Fraccionamiento masivo #{$fm->id}: {$this->numero($cpPadre)} {$pp->nombre} → {$this->numero($cpHijo)} {$ph->nombre}";

        // 1) Padre: descontar de sus lotes del almacén, los que vencen antes primero
        $lotes = StockProducto::where('producto_id', $pp->id)
            ->where('almacen_id', $almacenId)
            ->where('cantidad_disponible', '>', 0)
            ->orderByRaw('fecha_vencimiento IS NULL')
            ->orderBy('fecha_vencimiento')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        $restante    = $cpPadre;
        $sectorPadre = null;
        foreach ($lotes as $lote) {
            if ($restante <= 0.000001) {
                break;
            }
            $sacar        = min($restante, (float) $lote->cantidad_disponible);
            $sectorPadre ??= $lote->sector_id;
            $this->moverStock($lote, -$sacar, 'SALIDA_FRACCIONAMIENTO', $obs, $documento, $fm->id);
            $restante -= $sacar;
        }
        if ($restante > 0.000001) {
            // Ya validado en validarStockSuficiente; solo por si otro proceso lo consumió en el medio
            throw new \Exception("Stock insuficiente de {$pp->nombre}: faltan {$this->numero($restante)}");
        }

        // 2) Hijo: su registro sin vencimiento del almacén (mismo sector que el padre primero) o uno nuevo
        $stockHijo = $this->stockHijo($ph->id, $almacenId, $sectorPadre);
        $this->moverStock($stockHijo, $cpHijo, 'ENTRADA_FRACCIONAMIENTO', $obs, $documento, $fm->id);

        DetalleFraccionamiento::create([
            'fraccionamiento_masivo_id' => $fm->id,
            'producto_padre_id'         => $pp->id,
            'producto_hijo_id'          => $ph->id,
            'unidad_padre_id'           => $pp->unidad_medida_id,
            'unidad_hijo_id'            => $ph->unidad_medida_id,
            'cantidad_padre'            => $cpPadre,
            'cantidad_hijo'             => $cpHijo,
            'factor_conversion'         => $d['factor_conversion'] ?? ($cpHijo / $cpPadre),
            'numero_linea'              => $num,
        ]);
    }

    private function stockHijo(int $productoHijoId, int $almacenId, ?int $sectorPadre): StockProducto
    {
        $existente = StockProducto::where('producto_id', $productoHijoId)
            ->where('almacen_id', $almacenId)
            ->whereNull('fecha_vencimiento')
            ->when($sectorPadre, fn ($q) => $q->orderByRaw('CASE WHEN sector_id = ? THEN 0 ELSE 1 END', [$sectorPadre]))
            ->orderBy('id')
            ->lockForUpdate()
            ->first();
        if ($existente) {
            return $existente;
        }

        // Sin registro: en el sector de su límite, o el del padre (StockProducto::creating pone el genérico si no hay)
        $sector = StockLimite::where('producto_id', $productoHijoId)->where('almacen_id', $almacenId)->value('sector_id') ?? $sectorPadre;

        return StockProducto::create([
            'producto_id'         => $productoHijoId,
            'almacen_id'          => $almacenId,
            'sector_id'           => $sector,
            'cantidad'            => 0,
            'cantidad_disponible' => 0,
            'cantidad_reservada'  => 0,
        ]);
    }

    private function moverStock(StockProducto $stock, float $cantidad, string $tipo, string $obs, string $documento, int $fmId): void
    {
        $antes = [
            'cantidad'            => (float) $stock->cantidad,
            'cantidad_disponible' => (float) $stock->cantidad_disponible,
            'cantidad_reservada'  => (float) ($stock->cantidad_reservada ?? 0),
        ];

        $stock->cantidad            = $antes['cantidad'] + $cantidad;
        $stock->cantidad_disponible = $antes['cantidad_disponible'] + $cantidad;
        $stock->save();

        MovimientoInventario::create([
            'stock_producto_id'             => $stock->id,
            'cantidad'                      => $cantidad,
            'cantidad_anterior'             => $antes['cantidad_disponible'],
            'cantidad_posterior'            => $stock->cantidad_disponible,
            'cantidad_total_anterior'       => $antes['cantidad'],
            'cantidad_total_posterior'      => $stock->cantidad,
            'cantidad_disponible_anterior'  => $antes['cantidad_disponible'],
            'cantidad_disponible_posterior' => $stock->cantidad_disponible,
            'cantidad_reservada_anterior'   => $antes['cantidad_reservada'],
            'cantidad_reservada_posterior'  => $antes['cantidad_reservada'],
            'tipo'                          => $tipo,
            'observacion'                   => $obs,
            'numero_documento'              => $documento,
            'fecha'                         => now(),
            'user_id'                       => Auth::id(),
            'referencia_tipo'               => 'fraccionamiento_masivo',
            'referencia_id'                 => $fmId,
        ]);
    }

    private function numero(float $n): string
    {
        return rtrim(rtrim(number_format($n, 2, '.', ''), '0'), '.');
    }
}
