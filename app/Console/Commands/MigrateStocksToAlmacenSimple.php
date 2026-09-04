<?php

namespace App\Console\Commands;

use App\Models\Almacen;
use App\Models\Producto;
use App\Models\Sector;
use App\Models\StockProducto;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateStocksToAlmacenSimple extends Command
{
    protected $signature = 'stocks:migrate-simple {--empresa_id=2} {--almacen_id=4} {--sector_id=20}';

    protected $description = 'Migra stocks actualizando almacén y sector (sin duplicar)';

    public function handle()
    {
        $empresaId = $this->option('empresa_id');
        $almacenId = $this->option('almacen_id');
        $sectorId = $this->option('sector_id');

        $this->info("🔄 Iniciando migración SIMPLE de stocks...");
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

        // ✅ SIMPLE: Solo ACTUALIZAR almacen_id y sector_id para stocks de la empresa especificada
        // CRÍTICO: Verificar antes de actualizar
        $productosConteo = Producto::where('empresa_id', $empresaId)->count();
        $stocksAntes = StockProducto::whereIn('producto_id',
            Producto::where('empresa_id', $empresaId)->pluck('id')
        )->count();

        $this->info("📊 Estadísticas:");
        $this->info("   - Productos de empresa {$empresaId}: {$productosConteo}");
        $this->info("   - Registros de stock ANTES: {$stocksAntes}");
        $this->newLine();

        // Actualizar solo stocks de productos que pertenecen a la empresa
        $productosActualizados = DB::table('stock_productos')
            ->whereIn('producto_id', function ($query) use ($empresaId) {
                $query->select('id')
                    ->from('productos')
                    ->where('empresa_id', $empresaId);
            })
            ->update([
                'almacen_id' => $almacenId,
                'sector_id' => $sectorId,
                'fecha_actualizacion' => now(),
            ]);

        $this->info("✏️  Registros actualizados: {$productosActualizados}");

        $this->info("✅ Migración completada!");
        $this->info("   ✏️  Registros actualizados: {$productosActualizados}");
        $this->newLine();

        // Verificar resultado
        $stocksEnAlmacen = StockProducto::whereIn('producto_id', function ($query) use ($empresaId) {
            $query->select('id')->from('productos')->where('empresa_id', $empresaId);
        })
        ->where('almacen_id', $almacenId)
        ->count();

        $this->info("📊 Registros ahora en almacén {$almacenId}: {$stocksEnAlmacen}");

        return 0;
    }
}
