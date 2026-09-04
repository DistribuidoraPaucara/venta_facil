<?php

namespace App\Console\Commands;

use App\Models\Almacen;
use App\Models\Producto;
use App\Models\Sector;
use App\Models\StockProducto;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateStocksToAlmacen extends Command
{
    protected $signature = 'stocks:migrate-to-almacen {--empresa_id=2} {--almacen_id=4} {--sector_id=19}';

    protected $description = 'Migra todos los stocks de productos de una empresa a un almacén y sector específico';

    public function handle()
    {
        $empresaId = $this->option('empresa_id');
        $almacenId = $this->option('almacen_id');
        $sectorId = $this->option('sector_id');

        $this->info("🔄 Iniciando migración de stocks...");
        $this->info("   Empresa ID: {$empresaId}");
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

        // Obtener todos los productos de la empresa
        $productos = Producto::where('empresa_id', $empresaId)
            ->get();

        $this->info("📦 Procesando {$productos->count()} productos...");
        $this->newLine();

        $bar = $this->output->createProgressBar($productos->count());

        $productosConStock = 0;
        $productosCreados = 0;
        $productosActualizados = 0;

        foreach ($productos as $producto) {
            DB::transaction(function () use (
                $producto,
                $almacenId,
                $sectorId,
                &$productosConStock,
                &$productosCreados,
                &$productosActualizados
            ) {
                // Buscar si ya existe stock para este almacén y sector
                $stockExistente = StockProducto::where('producto_id', $producto->id)
                    ->where('almacen_id', $almacenId)
                    ->where('sector_id', $sectorId)
                    ->first();

                if ($stockExistente) {
                    // Ya existe, no hacer nada
                    $productosConStock++;
                } else {
                    // Buscar todos los stocks del producto en otros almacenes/sectores
                    $stocksOtros = StockProducto::where('producto_id', $producto->id)
                        ->get();

                    if ($stocksOtros->isNotEmpty()) {
                        // Consolidar todos los stocks en el almacén destino
                        $cantidadTotal = $stocksOtros->sum('cantidad');
                        $cantidadDisponibleTotal = $stocksOtros->sum('cantidad_disponible');
                        $cantidadReservadaTotal = $stocksOtros->sum('cantidad_reservada');

                        // Crear nuevo stock consolidado
                        StockProducto::create([
                            'producto_id' => $producto->id,
                            'almacen_id' => $almacenId,
                            'sector_id' => $sectorId,
                            'cantidad' => $cantidadTotal,
                            'cantidad_disponible' => $cantidadDisponibleTotal,
                            'cantidad_reservada' => $cantidadReservadaTotal,
                            'fecha_actualizacion' => now(),
                        ]);

                        // Eliminar stocks antiguos (soft delete)
                        foreach ($stocksOtros as $stock) {
                            $stock->delete();
                        }

                        $productosActualizados++;
                    } else {
                        // No tiene stock, crear uno vacío
                        StockProducto::create([
                            'producto_id' => $producto->id,
                            'almacen_id' => $almacenId,
                            'sector_id' => $sectorId,
                            'cantidad' => 0,
                            'cantidad_disponible' => 0,
                            'cantidad_reservada' => 0,
                            'fecha_actualizacion' => now(),
                        ]);

                        $productosCreados++;
                    }
                }
            });

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->newLine();

        // Resumen
        $this->info("✅ Migración completada!");
        $this->info("   📊 Productos sin cambios (ya en destino): {$productosConStock}");
        $this->info("   ➕ Productos con stock creados: {$productosCreados}");
        $this->info("   ✏️  Productos consolidados: {$productosActualizados}");

        return 0;
    }
}
