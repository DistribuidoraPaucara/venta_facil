<?php

namespace App\Console\Commands;

use App\Models\ConversionUnidadProducto;
use App\Models\PrecioProducto;
use App\Models\Producto;
use App\Models\TipoPrecio;
use App\Models\UnidadMedida;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Crea el precio de tipo FRIO (= precio de VENTA + incremento) para los productos con
 * unidad PAQUETE que tienen producto hijo, y para esos hijos.
 *
 * Por cada fila de precio VENTA activa crea una fila FRIO con la misma unidad de medida,
 * así el precio por PAQUETE y por UNIDAD quedan ambos cubiertos. En la venta se elige el
 * tipo de precio FRIO cuando corresponde. No crea productos ni toca el stock.
 *
 * Sin --ejecutar solo muestra lo que haría.
 */
class CrearPreciosFrio extends Command
{
    protected $signature = 'precios:crear-frio
                            {--ejecutar : Crear los precios (sin esto solo muestra lo que haría)}
                            {--actualizar : Si ya existe el precio FRIO, recalcularlo como VENTA + incremento}
                            {--empresa= : Limitar a una empresa}
                            {--ids= : Solo estos productos, padres o hijos (IDs separados por coma)}
                            {--excluir= : No tocar estos productos (IDs separados por coma)}
                            {--incluir-cigarrillos : No excluir las cajetillas (CJT., CJTE., CAJTE., CAJETILLA) ni sus paquetes}
                            {--tipo=FRIO : Código del tipo de precio a crear}
                            {--incremento=1 : Monto que se suma al precio de venta}';

    protected $description = 'Crea el precio FRIO (venta +1) en productos PAQUETE con hijo y en sus hijos';

    /** Cajetillas de cigarrillos: no tiene sentido un precio frío */
    private const PATRON_CIGARRILLOS = '/^\s*(CJTE?|CAJTE|CAJETILLA)\b/i';

    public function handle(): int
    {
        $codigoTipo = strtoupper(trim((string) $this->option('tipo')));
        $incremento = (float) $this->option('incremento');
        $ejecutar   = (bool) $this->option('ejecutar');
        $actualizar = (bool) $this->option('actualizar');

        $productos = $this->productos();
        if ($productos->isEmpty()) {
            $this->warn('No hay productos PAQUETE con hijo (ni hijos) que coincidan con los filtros.');

            return self::SUCCESS;
        }

        $unidades = UnidadMedida::pluck('codigo', 'id');
        $filas    = [];
        $creados  = 0;
        $sinTipo  = [];

        foreach ($productos as ['producto' => $producto, 'rol' => $rol]) {
            $tipoVenta = $this->tipoPrecioId('VENTA', $producto->empresa_id);
            $tipoFrio  = $this->tipoPrecioId($codigoTipo, $producto->empresa_id);
            if (! $tipoFrio) {
                $sinTipo[$producto->empresa_id] = true;
                continue;
            }

            $preciosVenta = PrecioProducto::where('producto_id', $producto->id)
                ->where('tipo_precio_id', $tipoVenta)
                ->where('activo', true)
                ->get();
            if ($preciosVenta->isEmpty()) {
                $filas[] = [$this->etiqueta($producto), $rol, '-', '-', 'omitido: sin precio de venta'];
                continue;
            }

            foreach ($preciosVenta as $venta) {
                $unidad = $venta->unidad_medida_id ? ($unidades[$venta->unidad_medida_id] ?? "#{$venta->unidad_medida_id}") : '-';
                // Precio de venta en 0 = sin cargar: un FRIO de 0 + 1 no tendría sentido
                if ((float) $venta->precio <= 0) {
                    $filas[] = [$this->etiqueta($producto), $rol, $unidad, $this->numero($venta->precio) . ' → -', '⚠️ omitido: precio de venta en 0'];
                    continue;
                }

                $nuevoPrecio = round((float) $venta->precio + $incremento, 4);
                $existente   = PrecioProducto::where('producto_id', $producto->id)
                    ->where('tipo_precio_id', $tipoFrio)
                    ->where(fn($q) => $venta->unidad_medida_id
                        ? $q->where('unidad_medida_id', $venta->unidad_medida_id)
                        : $q->whereNull('unidad_medida_id'))
                    ->first();

                if ($existente && (! $actualizar || (float) $existente->precio === $nuevoPrecio)) {
                    $estado = 'ya tiene ' . $this->numero($existente->precio);
                } elseif (! $ejecutar) {
                    $estado = $existente ? 'se actualizará' : 'se creará';
                } else {
                    DB::transaction(fn() => $this->guardar($venta, $existente, $tipoFrio, $nuevoPrecio, $codigoTipo, $incremento));
                    $estado = $existente ? 'actualizado' : 'creado';
                    $creados++;
                }

                $filas[] = [
                    $this->etiqueta($producto),
                    $rol,
                    $unidad,
                    $this->numero($venta->precio) . ' → ' . $this->numero($nuevoPrecio),
                    $estado,
                ];
            }
        }

        foreach (array_keys($sinTipo) as $empresaId) {
            $this->error("La empresa {$empresaId} no tiene el tipo de precio {$codigoTipo}: créalo primero (Tipos de precio).");
        }
        if ($filas) {
            $this->table(['Producto', 'Rol', 'Unidad', "VENTA → {$codigoTipo}", 'Estado'], $filas);
        }

        $this->newLine();
        if (! $ejecutar) {
            $this->info('Simulación: no se guardó nada. Revisa la lista y vuelve a ejecutar con --ejecutar.');
        } else {
            $this->info("✅ {$creados} precio(s) {$codigoTipo} guardados.");
        }

        return self::SUCCESS;
    }

    private function guardar(PrecioProducto $venta, ?PrecioProducto $existente, int $tipoFrio, float $precio, string $codigo, float $incremento): void
    {
        $motivo = "Precio {$codigo} = VENTA + {$this->numero($incremento)} (precios:crear-frio)";

        if ($existente) {
            $existente->update([
                'precio'                     => $precio,
                'activo'                     => true,
                'motivo_cambio'              => $motivo,
                'fecha_ultima_actualizacion' => now(),
            ]);

            return;
        }

        $frio                             = $venta->replicate();
        $frio->tipo_precio_id             = $tipoFrio;
        $frio->nombre                     = $codigo;
        $frio->precio                     = $precio;
        $frio->es_precio_base             = false;
        $frio->motivo_cambio              = $motivo;
        $frio->fecha_inicio               = now();
        $frio->fecha_ultima_actualizacion = now();
        $frio->save();
    }

    /**
     * Productos PAQUETE con producto hijo y esos hijos, sin repetir.
     *
     * @return Collection<int, array{producto: Producto, rol: string}>
     */
    private function productos(): Collection
    {
        $ids     = $this->listaIds('ids');
        $excluir = $this->listaIds('excluir');

        $conversiones = ConversionUnidadProducto::query()
            ->whereNotNull('producto_destino_id')
            ->whereHas('producto', function ($q) {
                $q->withoutGlobalScopes()
                    ->whereHas('unidad', fn($u) => $u->where('nombre', 'ILIKE', 'paquete')
                        ->orWhereIn(DB::raw('UPPER(codigo)'), ['PAQ', 'PQ']))
                    ->when($this->option('empresa'), fn($e) => $e->where('empresa_id', (int) $this->option('empresa')));
            })
            ->get(['producto_id', 'producto_destino_id']);

        $todos = Producto::withoutGlobalScopes()
            ->whereIn('id', $conversiones->pluck('producto_id')->merge($conversiones->pluck('producto_destino_id'))->unique())
            ->get()
            ->keyBy('id');

        $resultado = collect();
        foreach ($conversiones as $conv) {
            $padre = $todos[$conv->producto_id] ?? null;
            $hijo  = $todos[$conv->producto_destino_id] ?? null;
            if (! $padre || ! $hijo) {
                continue;
            }
            // Un paquete de cigarrillos se reconoce por su hijo (la cajetilla)
            if (! $this->option('incluir-cigarrillos') && preg_match(self::PATRON_CIGARRILLOS, $hijo->nombre)) {
                continue;
            }
            foreach ([[$padre, 'padre (paquete)'], [$hijo, 'hijo']] as [$producto, $rol]) {
                if (($ids && ! in_array($producto->id, $ids, true)) || in_array($producto->id, $excluir, true)) {
                    continue;
                }
                $resultado[$producto->id] ??= ['producto' => $producto, 'rol' => $rol];
            }
        }

        return $resultado->sortBy(fn($r) => mb_strtolower($r['producto']->nombre))->values();
    }

    /** @var array<string, int|null> */
    private array $tipos = [];

    private function tipoPrecioId(string $codigo, ?int $empresaId): ?int
    {
        return $this->tipos["{$codigo}-{$empresaId}"] ??= TipoPrecio::withoutGlobalScopes()
            ->whereRaw('UPPER(codigo) = ?', [$codigo])
            ->where('empresa_id', $empresaId)
            ->where('activo', true)
            ->value('id');
    }

    private function etiqueta(Producto $p): string
    {
        return '#' . $p->id . ' ' . mb_strimwidth($p->nombre, 0, 36, '…');
    }

    private function listaIds(string $opcion): array
    {
        return array_values(array_filter(array_map('intval', explode(',', (string) $this->option($opcion)))));
    }

    private function numero(float|string|null $n): string
    {
        $n = (float) $n;

        return $n == floor($n) ? (string) (int) $n : rtrim(rtrim(number_format($n, 4, '.', ''), '0'), '.');
    }
}
