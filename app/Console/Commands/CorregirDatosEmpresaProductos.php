<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Corrige productos que usan catálogos de OTRA empresa (datos importados/copiados):
 *  - productos.unidad_medida_id, precios_producto.unidad_medida_id,
 *    conversiones (unidad_base_id / unidad_destino_id)  → unidad equivalente de su empresa
 *  - precios_producto.tipo_precio_id                     → tipo equivalente de su empresa
 *    (si el producto ya tiene ese tipo propio, el precio ajeno sobra y se elimina)
 *  - productos.proveedor_id                              → proveedor equivalente (por nombre)
 *
 * Equivalente = mismo código (sin distinguir mayúsculas) o, si no, mismo nombre.
 * Los catálogos globales (empresa_id NULL, ej. categorías) no se tocan.
 * Si un cambio crearía un duplicado (índices únicos), esa fila se informa y se omite.
 *
 * Sin --ejecutar solo muestra lo que haría. Con --ejecutar todo va en una transacción.
 */
class CorregirDatosEmpresaProductos extends Command
{
    protected $signature = 'productos:corregir-empresa
                            {--ejecutar : Aplicar los cambios (sin esto solo muestra lo que haría)}
                            {--empresa= : Limitar a una empresa}
                            {--vaciar-sin-equivalente : Si no hay equivalente (ej. proveedor), dejar el campo vacío en vez de no tocarlo}';

    protected $description = 'Hace que los productos usen solo unidades, tipos de precio y proveedores de su propia empresa';

    private bool $ejecutar;

    /** @var array<int, array{0:string,1:string,2:string}> filas del informe [qué, detalle, resultado] */
    private array $informe = [];

    /** @var array<string, int> */
    private array $totales = ['corregidos' => 0, 'eliminados' => 0, 'omitidos' => 0, 'sin_equivalente' => 0];

    public function handle(): int
    {
        $this->ejecutar = (bool) $this->option('ejecutar');

        $aplicar = function () {
            $this->unidadesDeProductos();
            $this->unidadesDePrecios();
            $this->unidadesDeConversiones();
            $this->tiposDePrecio();
            $this->proveedores();
        };

        try {
            // En simulación también se usa una transacción y se revierte: así cada paso
            // ve el resultado de los anteriores y el informe es exacto
            DB::beginTransaction();
            $aplicar();
            $this->ejecutar ? DB::commit() : DB::rollBack();
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('No se aplicó nada: ' . $e->getMessage());

            return self::FAILURE;
        }

        if (! $this->informe) {
            $this->info('✅ Ningún producto usa datos de otra empresa.');

            return self::SUCCESS;
        }

        $this->table(['Dato', 'Detalle', 'Resultado'], $this->informe);
        $t = $this->totales;
        $this->line("Corregidos: {$t['corregidos']} · Eliminados (duplicados): {$t['eliminados']} · Omitidos: {$t['omitidos']} · Sin equivalente: {$t['sin_equivalente']}");
        $this->newLine();
        $this->ejecutar
            ? $this->info('✅ Cambios aplicados.')
            : $this->info('Simulación: no se guardó nada. Revisa la lista y vuelve a ejecutar con --ejecutar.');

        return self::SUCCESS;
    }

    // ── 1) Unidad de los productos (UPDATE masivo por cada par unidad ajena → propia) ──
    private function unidadesDeProductos(): void
    {
        $pares = DB::table('productos as p')
            ->join('unidades_medida as u', 'u.id', '=', 'p.unidad_medida_id')
            ->whereNotNull('u.empresa_id')
            ->whereColumn('u.empresa_id', '!=', 'p.empresa_id')
            ->when($this->option('empresa'), fn($q) => $q->where('p.empresa_id', (int) $this->option('empresa')))
            ->selectRaw('p.empresa_id, u.id AS unidad_id, u.codigo, u.nombre, COUNT(*) AS n')
            ->groupBy('p.empresa_id', 'u.id', 'u.codigo', 'u.nombre')
            ->get();

        foreach ($pares as $par) {
            $destino = $this->equivalente('unidades_medida', $par->unidad_id, $par->empresa_id);
            $detalle = "empresa {$par->empresa_id}: {$par->n} producto(s) con '{$par->nombre}' (#{$par->unidad_id})";
            if (! $destino) {
                $this->anotar('Unidad del producto', $detalle, 'sin equivalente: no se toca', 'sin_equivalente');
                continue;
            }
            DB::table('productos')
                ->where('empresa_id', $par->empresa_id)
                ->where('unidad_medida_id', $par->unidad_id)
                ->update(['unidad_medida_id' => $destino->id]);
            $this->anotar('Unidad del producto', $detalle, "→ '{$destino->nombre}' (#{$destino->id})", 'corregidos', (int) $par->n);
        }
    }

    // ── 2) Unidad de los precios (fila por fila: índice único producto+tipo+unidad) ──
    private function unidadesDePrecios(): void
    {
        $filas = $this->ajenas('precios_producto', 'unidad_medida_id', 'unidades_medida', ['tipo_precio_id', 'precio']);

        foreach ($filas as $f) {
            $destino = $this->equivalente('unidades_medida', $f->ref_id, $f->empresa_id);
            $detalle = "precio #{$f->id} de producto #{$f->producto_id} ({$this->num($f->precio)}) en '{$f->ref_nombre}'";
            if (! $destino) {
                $this->anotar('Unidad del precio', $detalle, 'sin equivalente: no se toca', 'sin_equivalente');
                continue;
            }
            $choca = DB::table('precios_producto')
                ->where('producto_id', $f->producto_id)
                ->where('tipo_precio_id', $f->tipo_precio_id)
                ->where('unidad_medida_id', $destino->id)
                ->where('id', '!=', $f->id)
                ->first(['id', 'precio']);
            if ($choca) {
                $this->anotar('Unidad del precio', $detalle, "omitido: ya existe el precio #{$choca->id} ({$this->num($choca->precio)}) en '{$destino->nombre}'", 'omitidos');
                continue;
            }
            DB::table('precios_producto')->where('id', $f->id)->update(['unidad_medida_id' => $destino->id]);
            $this->anotar('Unidad del precio', $detalle, "→ '{$destino->nombre}' (#{$destino->id})", 'corregidos');
        }
    }

    // ── 3) Unidades de las conversiones (índice único producto+base+destino) ──
    private function unidadesDeConversiones(): void
    {
        foreach (['unidad_base_id' => 'base', 'unidad_destino_id' => 'destino'] as $columna => $etiqueta) {
            $filas = $this->ajenas('conversiones_unidad_producto', $columna, 'unidades_medida', ['unidad_base_id', 'unidad_destino_id']);

            foreach ($filas as $f) {
                $destino = $this->equivalente('unidades_medida', $f->ref_id, $f->empresa_id);
                $detalle = "conversión #{$f->id} del producto #{$f->producto_id} (unidad {$etiqueta} '{$f->ref_nombre}')";
                if (! $destino) {
                    $this->anotar('Unidad de conversión', $detalle, 'sin equivalente: no se toca', 'sin_equivalente');
                    continue;
                }
                $nueva = [
                    'unidad_base_id'    => $columna === 'unidad_base_id' ? $destino->id : $f->unidad_base_id,
                    'unidad_destino_id' => $columna === 'unidad_destino_id' ? $destino->id : $f->unidad_destino_id,
                ];
                $choca = DB::table('conversiones_unidad_producto')
                    ->where('producto_id', $f->producto_id)
                    ->where($nueva)
                    ->where('id', '!=', $f->id)
                    ->value('id');
                if ($choca) {
                    $this->anotar('Unidad de conversión', $detalle, "omitido: ya existe la conversión #{$choca} con esas unidades", 'omitidos');
                    continue;
                }
                DB::table('conversiones_unidad_producto')->where('id', $f->id)->update([$columna => $destino->id]);
                $this->anotar('Unidad de conversión', $detalle, "→ '{$destino->nombre}' (#{$destino->id})", 'corregidos');
            }
        }
    }

    // ── 4) Tipo de precio ajeno: pasar al propio o, si ya tiene uno propio, eliminar el sobrante ──
    private function tiposDePrecio(): void
    {
        $filas = $this->ajenas('precios_producto', 'tipo_precio_id', 'tipos_precio', ['unidad_medida_id', 'precio']);

        foreach ($filas as $f) {
            $destino = $this->equivalente('tipos_precio', $f->ref_id, $f->empresa_id);
            $detalle = "precio #{$f->id} de producto #{$f->producto_id}: {$f->ref_codigo} {$this->num($f->precio)} (tipo de empresa {$f->ref_empresa})";
            if (! $destino) {
                $this->anotar('Tipo de precio', $detalle, 'sin equivalente: no se toca', 'sin_equivalente');
                continue;
            }
            // ¿El producto ya tiene su propio precio de ese tipo (en cualquier unidad)?
            $propio = DB::table('precios_producto')
                ->where('producto_id', $f->producto_id)
                ->where('tipo_precio_id', $destino->id)
                ->orderByRaw('unidad_medida_id IS NOT DISTINCT FROM ? DESC', [$f->unidad_medida_id])
                ->first(['id', 'precio']);
            if ($propio) {
                DB::table('precios_producto')->where('id', $f->id)->delete();
                $this->anotar('Tipo de precio', $detalle, "eliminado: ya tiene su {$destino->codigo} propio #{$propio->id} = {$this->num($propio->precio)}", 'eliminados');
                continue;
            }
            DB::table('precios_producto')->where('id', $f->id)->update(['tipo_precio_id' => $destino->id]);
            $this->anotar('Tipo de precio', $detalle, "→ {$destino->codigo} (#{$destino->id})", 'corregidos');
        }
    }

    // ── 5) Proveedor ajeno → equivalente por nombre ──
    private function proveedores(): void
    {
        $pares = DB::table('productos as p')
            ->join('proveedores as r', 'r.id', '=', 'p.proveedor_id')
            ->whereNotNull('r.empresa_id')
            ->whereColumn('r.empresa_id', '!=', 'p.empresa_id')
            ->when($this->option('empresa'), fn($q) => $q->where('p.empresa_id', (int) $this->option('empresa')))
            ->selectRaw('p.empresa_id, r.id AS proveedor_id, r.nombre, COUNT(*) AS n')
            ->groupBy('p.empresa_id', 'r.id', 'r.nombre')
            ->get();

        foreach ($pares as $par) {
            $destino = DB::table('proveedores')
                ->where('empresa_id', $par->empresa_id)
                ->whereRaw('LOWER(TRIM(nombre)) = LOWER(TRIM(?))', [$par->nombre])
                ->first(['id', 'nombre']);
            $detalle = "empresa {$par->empresa_id}: {$par->n} producto(s) con '{$par->nombre}' (#{$par->proveedor_id})";
            $consulta = DB::table('productos')->where('empresa_id', $par->empresa_id)->where('proveedor_id', $par->proveedor_id);

            if ($destino) {
                $consulta->update(['proveedor_id' => $destino->id]);
                $this->anotar('Proveedor', $detalle, "→ '{$destino->nombre}' (#{$destino->id})", 'corregidos', (int) $par->n);
            } elseif ($this->option('vaciar-sin-equivalente')) {
                $consulta->update(['proveedor_id' => null]);
                $this->anotar('Proveedor', $detalle, 'sin equivalente: se deja vacío', 'corregidos', (int) $par->n);
            } else {
                $this->anotar('Proveedor', $detalle, 'sin equivalente: no se toca (créalo en la empresa o usa --vaciar-sin-equivalente)', 'sin_equivalente');
            }
        }
    }

    // ── Helpers ──

    /** Filas de $tabla cuyo $columna apunta a un registro de $ref de otra empresa que la del producto. */
    private function ajenas(string $tabla, string $columna, string $ref, array $extra)
    {
        return DB::table("{$tabla} as t")
            ->join('productos as p', 'p.id', '=', 't.producto_id')
            ->join("{$ref} as r", 'r.id', '=', "t.{$columna}")
            ->whereNotNull('r.empresa_id')
            ->whereColumn('r.empresa_id', '!=', 'p.empresa_id')
            ->when($this->option('empresa'), fn($q) => $q->where('p.empresa_id', (int) $this->option('empresa')))
            ->orderBy('t.id')
            ->get(array_merge(
                ['t.id', 't.producto_id', 'p.empresa_id', 'r.id as ref_id', 'r.empresa_id as ref_empresa', 'r.codigo as ref_codigo', 'r.nombre as ref_nombre'],
                array_map(fn($c) => "t.{$c}", $extra)
            ));
    }

    /** @var array<string, object|null> */
    private array $cacheEquivalentes = [];

    /** Registro de $tabla de la empresa con el mismo código o, si no, el mismo nombre. */
    private function equivalente(string $tabla, int $id, int $empresaId): ?object
    {
        return $this->cacheEquivalentes["{$tabla}-{$id}-{$empresaId}"] ??= (function () use ($tabla, $id, $empresaId) {
            $origen = DB::table($tabla)->find($id);
            if (! $origen) {
                return null;
            }
            $base = fn() => DB::table($tabla)->where('empresa_id', $empresaId);

            return ($origen->codigo ? $base()->whereRaw('UPPER(TRIM(codigo)) = UPPER(TRIM(?))', [$origen->codigo])->first(['id', 'codigo', 'nombre']) : null)
                ?? $base()->whereRaw('UPPER(TRIM(nombre)) = UPPER(TRIM(?))', [$origen->nombre])->first(['id', 'codigo', 'nombre']);
        })();
    }

    private function anotar(string $dato, string $detalle, string $resultado, string $total, int $cantidad = 1): void
    {
        $this->informe[]          = [$dato, $detalle, $resultado];
        $this->totales[$total]   += $cantidad;
    }

    private function num($n): string
    {
        $n = (float) $n;

        return $n == floor($n) ? (string) (int) $n : rtrim(rtrim(number_format($n, 4, '.', ''), '0'), '.');
    }
}
