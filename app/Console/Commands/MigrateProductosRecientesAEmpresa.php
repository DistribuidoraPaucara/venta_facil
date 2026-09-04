<?php

namespace App\Console\Commands;

use App\Models\Almacen;
use App\Models\Producto;
use App\Models\Sector;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateProductosRecientesAEmpresa extends Command
{
    protected $signature = 'productos:migrate-recientes {--from-date=2026-09-02} {--to-date=2026-09-04} {--empresa_id=2} {--almacen_id=4} {--sector_id=20}';

    protected $description = 'Migra productos creados en fecha específica a otra empresa y almacén';

    public function handle()
    {
        $fromDate = $this->option('from-date');
        $toDate = $this->option('to-date');
        $empresaId = $this->option('empresa_id');
        $almacenId = $this->option('almacen_id');
        $sectorId = $this->option('sector_id');

        $this->info("🔄 Iniciando migración de productos recientes...");
        $this->info("   Fecha desde: {$fromDate}");
        $this->info("   Fecha hasta: {$toDate}");
        $this->info("   Empresa destino ID: {$empresaId}");
        $this->info("   Almacén destino ID: {$almacenId}");
        $this->info("   Sector destino ID: {$sectorId}");
        $this->newLine();

        // Validar que existan almacén y sector
        $almacen = Almacen::find($almacenId);
        $sector = Sector::find($sectorId);

        if (!$almacen) {
            $this->error("❌ Almacén con ID {$almacenId} no encontrado");
            return 1;
        }

        if (!$sector) {
            $this->error("❌ Sector con ID {$sectorId} no encontrado");
            return 1;
        }

        $this->info("✅ Almacén: {$almacen->nombre}");
        $this->info("✅ Sector: {$sector->nombre}");
        $this->newLine();

        // 1️⃣ BUSCAR productos creados en la fecha especificada
        $productosRecientes = Producto::whereBetween('fecha_creacion', [$fromDate, $toDate . ' 23:59:59'])
            ->get();

        $this->info("📦 Productos encontrados en el rango: {$productosRecientes->count()}");

        if ($productosRecientes->isEmpty()) {
            $this->warn("⚠️  No se encontraron productos en el rango especificado");
            return 0;
        }

        $this->newLine();

        // Crear barra de progreso
        $bar = $this->output->createProgressBar($productosRecientes->count());
        $bar->start();

        $productosActualizados = 0;
        $stocksActualizados = 0;

        foreach ($productosRecientes as $producto) {
            DB::transaction(function () use (
                $producto,
                $empresaId,
                $almacenId,
                $sectorId,
                &$productosActualizados,
                &$stocksActualizados
            ) {
                // 2️⃣ ACTUALIZAR empresa del producto
                $producto->update(['empresa_id' => $empresaId]);
                $productosActualizados++;

                // 3️⃣ ACTUALIZAR almacén y sector de su stock
                $stocksUpdate = DB::table('stock_productos')
                    ->where('producto_id', $producto->id)
                    ->update([
                        'almacen_id' => $almacenId,
                        'sector_id' => $sectorId,
                        'fecha_actualizacion' => now(),
                    ]);

                $stocksActualizados += $stocksUpdate;
            });

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->newLine();

        // Resumen
        $this->info("✅ Migración completada!");
        $this->info("   ✏️  Productos actualizados a empresa {$empresaId}: {$productosActualizados}");
        $this->info("   📦 Registros de stock actualizados: {$stocksActualizados}");
        $this->newLine();

        // Verificación final
        $productosEnEmpresa = Producto::where('empresa_id', $empresaId)
            ->whereBetween('fecha_creacion', [$fromDate, $toDate . ' 23:59:59'])
            ->count();

        $stocksEnAlmacen = DB::table('stock_productos')
            ->whereIn('producto_id',
                Producto::where('empresa_id', $empresaId)
                    ->whereBetween('fecha_creacion', [$fromDate, $toDate . ' 23:59:59'])
                    ->pluck('id')
            )
            ->where('almacen_id', $almacenId)
            ->count();

        $this->info("📊 Verificación final:");
        $this->info("   - Productos en empresa {$empresaId}: {$productosEnEmpresa}");
        $this->info("   - Stocks en almacén {$almacenId}: {$stocksEnAlmacen}");

        return 0;
    }
}
