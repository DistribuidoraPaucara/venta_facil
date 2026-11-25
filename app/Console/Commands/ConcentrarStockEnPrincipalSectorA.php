<?php

namespace App\Console\Commands;

use App\Models\Almacen;
use App\Models\Sector;
use App\Models\StockProducto;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Deja el stock Y los límites (stock_limites) de la empresa en un solo almacén (el principal) y un solo sector (A).
 *
 * Por defecto solo SIMULA (no escribe nada). Con --ejecutar aplica los cambios en una transacción.
 *
 * Stock (stock_productos):
 * - Filas en otros almacenes (ej. FRIO, SALA) pasan al almacén principal, sector A.
 * - Filas del almacén principal en otro sector pasan al sector A.
 * - Si ya existe una fila con el mismo producto, almacén, sector y lote, las cantidades se suman a esa fila
 *   y la fila original se elimina (soft delete).
 * - No se registran movimientos de inventario: solo se reubica el stock existente.
 *
 * Límites (stock_limites), por producto:
 * - Si ya tiene límite en almacén principal sector A, se conserva ese y se eliminan los demás.
 * - Si no, se reubica el más reciente al principal sector A y se eliminan los demás.
 * - Productos sin límites no se crean.
 */
class ConcentrarStockEnPrincipalSectorA extends Command
{
    protected $signature = 'stocks:concentrar-principal-sector-a
        {--empresa_id= : Empresa a procesar (por defecto, la del almacén principal)}
        {--almacen_id= : Almacén destino (por defecto, el que se llama "Almacen Principal" de la empresa)}
        {--sector=A : Nombre del sector destino (se crea en el almacén si no existe)}
        {--ejecutar : Aplica los cambios. Sin esta opción solo muestra lo que cambiaría}';

    protected $description = 'Asigna el stock y los límites de la empresa al almacén principal, sector A';

    public function handle(): int
    {
        $almacen = $this->resolverAlmacenDestino();
        if (! $almacen) {
            return self::FAILURE;
        }

        $empresaId = (int) $almacen->empresa_id;
        $nombreSec = trim((string) $this->option('sector')) ?: 'A';
        $ejecutar  = (bool) $this->option('ejecutar');

        $this->info(($ejecutar ? '⚠️  EJECUTANDO' : '🔎 SIMULACIÓN (no se escribe nada)') . " — empresa {$empresaId}");
        $this->line("   Destino: {$almacen->nombre} (id {$almacen->id}), sector {$nombreSec}");
        $this->newLine();

        $sector = Sector::query()->where('almacen_id', $almacen->id)->where('nombre', $nombreSec)->first();

        $filas   = $this->filasDeStockAMover($empresaId, $almacen, $nombreSec);
        $limites = $this->planLimites($empresaId, $almacen, $sector?->id);

        $this->info('Stock:');
        if ($filas->isEmpty()) {
            $this->line('   ✅ Todo el stock ya está en ' . $almacen->nombre . ', sector ' . $nombreSec . '.');
        } else {
            $this->table(
                ['Almacén origen', 'Filas a mover', 'Productos', 'Cantidad total'],
                $filas->groupBy('almacen_id')->map(fn ($g, $id) => [
                    Almacen::find($id)?->nombre ?? "id {$id}",
                    $g->count(),
                    $g->pluck('producto_id')->unique()->count(),
                    number_format((float) $g->sum('cantidad'), 4, '.', ''),
                ])->values()->all()
            );
        }

        $this->info('Límites (stock_limites):');
        $this->line("   Productos con límites: {$limites['productos']}");
        $this->line("   Se conservan (ya en destino): {$limites['conservar']}");
        $this->line("   Se reubican al destino: {$limites['mover']}");
        $this->line("   Se eliminan (sobrantes): {$limites['eliminar']}");

        if (! $ejecutar) {
            $this->newLine();
            $this->comment('Revisa lo anterior. Para aplicar los cambios ejecuta el mismo comando con --ejecutar.');
            return self::SUCCESS;
        }

        DB::transaction(function () use ($almacen, $nombreSec, $empresaId, $filas) {
            $sector = Sector::firstOrCreate(
                ['almacen_id' => $almacen->id, 'nombre' => $nombreSec],
                [
                    'es_generico'  => false,
                    'descripcion'  => $nombreSec,
                    'stock_minimo' => 1,
                    'stock_maximo' => 50,
                    'empresa_id'   => $empresaId,
                ]
            );

            $movidas = 0;
            $fusionadas = 0;

            foreach ($filas as $fila) {
                // Ya existe una fila igual en destino (mismo producto, almacén, sector y lote): sumar y eliminar la original
                $destino = StockProducto::query()
                    ->where('producto_id', $fila->producto_id)
                    ->where('almacen_id', $almacen->id)
                    ->where('sector_id', $sector->id)
                    ->whereRaw('COALESCE(lote, \'\') = ?', [(string) $fila->lote])
                    ->whereNull('deleted_at')
                    ->where('id', '!=', $fila->id)
                    ->lockForUpdate()
                    ->first();

                if ($destino) {
                    // La suma debe cumplir cantidad = disponible + reservada: se suman las tres
                    $destino->cantidad            = (float) $destino->cantidad + (float) $fila->cantidad;
                    $destino->cantidad_disponible = (float) $destino->cantidad_disponible + (float) $fila->cantidad_disponible;
                    $destino->cantidad_reservada  = (float) $destino->cantidad_reservada + (float) $fila->cantidad_reservada;
                    $destino->save();

                    StockProducto::whereKey($fila->id)->delete();
                    $fusionadas++;
                } else {
                    StockProducto::whereKey($fila->id)->update([
                        'almacen_id' => $almacen->id,
                        'sector_id'  => $sector->id,
                    ]);
                    $movidas++;
                }
            }

            $this->info("✅ Stock: filas reubicadas {$movidas} · fusionadas {$fusionadas}");

            $limites = $this->aplicarLimites($empresaId, $almacen, $sector->id);
            $this->info("✅ Límites: conservados {$limites['conservar']} · reubicados {$limites['mover']} · eliminados {$limites['eliminar']}");
        });

        return self::SUCCESS;
    }

    /** Filas de stock de la empresa que no están ya en el almacén destino + sector destino. */
    private function filasDeStockAMover(int $empresaId, Almacen $almacen, string $nombreSec)
    {
        return StockProducto::query()
            ->join('productos', 'productos.id', '=', 'stock_productos.producto_id')
            ->where('productos.empresa_id', $empresaId)
            ->whereNull('stock_productos.deleted_at')
            ->where(function ($q) use ($almacen, $nombreSec) {
                $q->where('stock_productos.almacen_id', '!=', $almacen->id)
                    ->orWhereNull('stock_productos.sector_id')
                    ->orWhereRaw('stock_productos.sector_id NOT IN (SELECT id FROM sectores WHERE almacen_id = ? AND nombre = ?)', [$almacen->id, $nombreSec]);
            })
            ->select('stock_productos.*')
            ->get();
    }

    /**
     * Resumen de límites que quedarían. Para cada producto con límites en la empresa:
     * - conservar: ya tiene uno en destino (almacén + sector destino)
     * - mover: no tiene en destino; se reubica el más reciente
     * - eliminar: todos los demás
     */
    private function planLimites(int $empresaId, Almacen $almacen, ?int $sectorDestinoId): array
    {
        $resumen = ['productos' => 0, 'conservar' => 0, 'mover' => 0, 'eliminar' => 0];

        $porProducto = DB::table('stock_limites as l')
            ->join('productos as p', 'p.id', '=', 'l.producto_id')
            ->where('p.empresa_id', $empresaId)
            ->select('l.*')
            ->get()
            ->groupBy('producto_id');

        foreach ($porProducto as $limites) {
            $resumen['productos']++;
            $enDestino = $sectorDestinoId
                ? $limites->first(fn ($l) => (int) $l->almacen_id === $almacen->id && (int) $l->sector_id === $sectorDestinoId)
                : null;

            if ($enDestino) {
                $resumen['conservar']++;
                $resumen['eliminar'] += $limites->count() - 1;
            } else {
                $resumen['mover']++;
                $resumen['eliminar'] += $limites->count() - 1;
            }
        }

        return $resumen;
    }

    /** Aplica el plan de límites: deja uno por producto en el destino y elimina el resto. */
    private function aplicarLimites(int $empresaId, Almacen $almacen, int $sectorDestinoId): array
    {
        $resumen = ['conservar' => 0, 'mover' => 0, 'eliminar' => 0];

        $porProducto = DB::table('stock_limites as l')
            ->join('productos as p', 'p.id', '=', 'l.producto_id')
            ->where('p.empresa_id', $empresaId)
            ->select('l.*')
            ->orderByDesc('l.updated_at')
            ->orderByDesc('l.id')
            ->get()
            ->groupBy('producto_id');

        foreach ($porProducto as $limites) {
            $conservar = $limites->first(fn ($l) => (int) $l->almacen_id === $almacen->id && (int) $l->sector_id === $sectorDestinoId)
                ?? $limites->first(); // no tiene en destino: se reubica el más reciente

            if ((int) $conservar->almacen_id === $almacen->id && (int) $conservar->sector_id === $sectorDestinoId) {
                $resumen['conservar']++;
            } else {
                DB::table('stock_limites')->where('id', $conservar->id)->update([
                    'almacen_id' => $almacen->id,
                    'sector_id'  => $sectorDestinoId,
                    'updated_at' => now(),
                ]);
                $resumen['mover']++;
            }

            $eliminar = $limites->where('id', '!=', $conservar->id)->pluck('id');
            if ($eliminar->isNotEmpty()) {
                DB::table('stock_limites')->whereIn('id', $eliminar)->delete();
                $resumen['eliminar'] += $eliminar->count();
            }
        }

        return $resumen;
    }

    private function resolverAlmacenDestino(): ?Almacen
    {
        if ($id = $this->option('almacen_id')) {
            $almacen = Almacen::find($id);
            if (! $almacen) {
                $this->error("No existe el almacén {$id}.");
            }
            return $almacen;
        }

        $query = Almacen::query()->whereRaw('LOWER(nombre) = ?', ['almacen principal']);
        if ($empresa = $this->option('empresa_id')) {
            $query->where('empresa_id', $empresa);
        }

        $candidatos = $query->get();
        if ($candidatos->count() !== 1) {
            $this->error(
                $candidatos->isEmpty()
                    ? 'No se encontró un almacén "Almacen Principal". Usa --almacen_id.'
                    : 'Hay varios almacenes "Almacen Principal". Usa --almacen_id o --empresa_id.'
            );
            return null;
        }

        return $candidatos->first();
    }
}
