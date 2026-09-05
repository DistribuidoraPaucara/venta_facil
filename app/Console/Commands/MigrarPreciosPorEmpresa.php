<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Models\PrecioProducto;
use App\Models\Producto;
use App\Models\TipoPrecio;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrarPreciosPorEmpresa extends Command
{
    protected $signature = 'precios:migrar-por-empresa {--empresa_id=} {--dry-run}';

    protected $description = 'Migra precios de productos para que usen tipos de precio de su propia empresa';

    public function handle()
    {
        $empresaId = $this->option('empresa_id');
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn("⚠️  Modo DRY-RUN: Los cambios NO se guardarán");
            $this->newLine();
        }

        $this->info("🔄 Iniciando migración de precios por empresa...");
        $this->newLine();

        // Si no se especifica empresa, procesar todas
        if (!$empresaId) {
            $empresas = Empresa::where('activa', true)->get();
            $this->info("📋 Procesando " . $empresas->count() . " empresas");
        } else {
            $empresas = Empresa::where('id', $empresaId)->get();
            if ($empresas->isEmpty()) {
                $this->error("❌ Empresa con ID {$empresaId} no encontrada");
                return 1;
            }
        }

        $totalProductos = 0;
        $totalPreciosMigrados = 0;
        $totalTiposPrecioActualizados = 0;

        foreach ($empresas as $empresa) {
            $this->info("👤 Procesando empresa: {$empresa->nombre} (ID: {$empresa->id})");
            $this->newLine();

            // Obtener tipos de precio de esta empresa
            $tiposPrecioEmpresa = TipoPrecio::where('empresa_id', $empresa->id)
                ->pluck('id')
                ->toArray();

            if (empty($tiposPrecioEmpresa)) {
                $this->warn("   ⚠️  No tiene tipos de precio definidos");
                continue;
            }

            $this->info("   📊 Tipos de precio de la empresa: " . count($tiposPrecioEmpresa));

            // Obtener productos de esta empresa
            $productos = Producto::where('empresa_id', $empresa->id)
                ->get();

            $this->info("   📦 Productos encontrados: " . $productos->count());

            if ($productos->isEmpty()) {
                $this->warn("   ⚠️  No tiene productos");
                continue;
            }

            $bar = $this->output->createProgressBar($productos->count());
            $bar->start();

            foreach ($productos as $producto) {
                // Obtener precios del producto que NO usan tipos de precio de su empresa
                $preciosIncorrectos = PrecioProducto::where('producto_id', $producto->id)
                    ->whereNotIn('tipo_precio_id', $tiposPrecioEmpresa)
                    ->where('tipo_precio_id', '!=', null)
                    ->get();

                foreach ($preciosIncorrectos as $precio) {
                    $tipoOriginal = $precio->tipoPrecio;
                    $totalPreciosMigrados++;

                    // Buscar tipo de precio equivalente en la empresa (por código o nombre)
                    $tipoNuevo = TipoPrecio::where('empresa_id', $empresa->id)
                        ->where(function ($q) use ($tipoOriginal) {
                            $q->where('codigo', $tipoOriginal?->codigo)
                              ->orWhere('nombre', $tipoOriginal?->nombre);
                        })
                        ->first();

                    if ($tipoNuevo) {
                        if (!$dryRun) {
                            $precio->update([
                                'tipo_precio_id' => $tipoNuevo->id,
                                'fecha_ultima_actualizacion' => now(),
                            ]);
                        }
                        $totalTiposPrecioActualizados++;
                    } else {
                        $this->line("   ⚠️  No se encontró equivalente para tipo '{$tipoOriginal?->nombre}' en empresa {$empresa->nombre}");
                    }
                }

                $totalProductos++;
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->newLine();
        }

        // Resumen final
        $this->info("✅ Migración " . ($dryRun ? "(SIMULADA) " : "") . "completada!");
        $this->info("   📦 Productos procesados: {$totalProductos}");
        $this->info("   ✏️  Precios con tipo incorrecto: {$totalPreciosMigrados}");
        $this->info("   🔄 Tipos de precio actualizados: {$totalTiposPrecioActualizados}");

        if ($dryRun) {
            $this->warn("\n⚠️  Fue modo DRY-RUN. Para aplicar los cambios, ejecuta sin --dry-run:");
            $this->line("   php artisan precios:migrar-por-empresa" . ($empresaId ? " --empresa_id={$empresaId}" : ""));
        }

        return 0;
    }
}
