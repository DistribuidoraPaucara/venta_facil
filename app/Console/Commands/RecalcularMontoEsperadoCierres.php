<?php

namespace App\Console\Commands;

use App\Models\CierreCaja;
use App\Models\MovimientoCaja;
use App\Services\CierreCajaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RecalcularMontoEsperadoCierres extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cajas:recalcular-esperado
        {--id=* : IDs de cierres específicos}
        {--desde= : Cierres desde esta fecha (YYYY-MM-DD)}
        {--hasta= : Cierres hasta esta fecha (YYYY-MM-DD)}
        {--aplicar : Guardar los cambios (sin esta opción solo muestra lo que cambiaría)}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Recalcula monto_esperado y diferencia de cierres de caja (restando vueltos) y sincroniza su movimiento AJUSTE con la diferencia.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $aplicar = (bool) $this->option('aplicar');

        $query = CierreCaja::withoutGlobalScopes()->with('apertura')->orderBy('id');

        if ($ids = $this->option('id')) {
            $query->whereIn('id', $ids);
        }
        if ($desde = $this->option('desde')) {
            $query->where('created_at', '>=', $desde . ' 00:00:00');
        }
        if ($hasta = $this->option('hasta')) {
            $query->where('created_at', '<=', $hasta . ' 23:59:59');
        }

        $filasEsperado = [];
        $filasAjuste = [];
        $ajustesUsados = [];

        foreach ($query->get() as $cierre) {
            if (! $cierre->apertura) {
                continue;
            }

            // Cierres antiguos sin movimientos vinculados a la apertura no se pueden recalcular
            if (! MovimientoCaja::where('apertura_caja_id', $cierre->apertura_caja_id)->exists()) {
                continue;
            }

            // 1️⃣ Monto esperado y diferencia
            $datos = (new CierreCajaService())->calcularDatos($cierre->apertura);
            $nuevoEsperado = round((float) ($datos['efectivoEsperado']['total'] ?? 0), 2);
            $nuevaDiferencia = round((float) $cierre->monto_real - $nuevoEsperado, 2);

            if (abs($nuevoEsperado - (float) $cierre->monto_esperado) >= 0.01) {
                $filasEsperado[] = [
                    $cierre->id,
                    $cierre->created_at?->format('Y-m-d H:i'),
                    number_format((float) $cierre->monto_esperado, 2),
                    number_format($nuevoEsperado, 2),
                    number_format((float) $cierre->monto_real, 2),
                    number_format((float) $cierre->diferencia, 2),
                    number_format($nuevaDiferencia, 2),
                ];

                if ($aplicar) {
                    Log::info('🔧 [cajas:recalcular-esperado] Cierre recalculado', [
                        'cierre_id' => $cierre->id,
                        'monto_esperado_anterior' => $cierre->monto_esperado,
                        'monto_esperado_nuevo' => $nuevoEsperado,
                        'diferencia_anterior' => $cierre->diferencia,
                        'diferencia_nueva' => $nuevaDiferencia,
                    ]);

                    $cierre->update([
                        'monto_esperado' => $nuevoEsperado,
                        'diferencia' => $nuevaDiferencia,
                    ]);
                }
            } else {
                $nuevaDiferencia = round((float) $cierre->diferencia, 2);
            }

            // 2️⃣ Movimiento AJUSTE del cierre: se creó en el mismo instante que el cierre
            $ajuste = MovimientoCaja::where('caja_id', $cierre->caja_id)
                ->whereHas('tipoOperacion', fn($q) => $q->where('codigo', 'AJUSTE'))
                ->where('numero_documento', 'like', 'AJUSTE-%-' . $cierre->user_id)
                ->whereBetween('fecha', [$cierre->created_at->copy()->subMinute(), $cierre->created_at->copy()->addMinute()])
                ->whereNotIn('id', $ajustesUsados)
                ->orderBy('id')
                ->first();

            if (! $ajuste) {
                continue;
            }
            $ajustesUsados[] = $ajuste->id;

            $sinDiferencia = abs($nuevaDiferencia) < 0.01;
            $montoDistinto = abs((float) $ajuste->monto - $nuevaDiferencia) >= 0.01;

            if (! $sinDiferencia && ! $montoDistinto && $ajuste->apertura_caja_id) {
                continue;
            }

            $filasAjuste[] = [
                $cierre->id,
                $ajuste->id,
                number_format((float) $ajuste->monto, 2),
                $sinDiferencia ? 'ELIMINAR (sin diferencia)' : number_format($nuevaDiferencia, 2),
            ];

            if ($aplicar) {
                Log::info('🔧 [cajas:recalcular-esperado] Ajuste de cierre sincronizado', [
                    'cierre_id' => $cierre->id,
                    'movimiento_id' => $ajuste->id,
                    'monto_anterior' => $ajuste->monto,
                    'monto_nuevo' => $sinDiferencia ? null : $nuevaDiferencia,
                ]);

                if ($sinDiferencia) {
                    $ajuste->delete();
                } else {
                    $ajuste->update([
                        'monto' => $nuevaDiferencia,
                        'apertura_caja_id' => $cierre->apertura_caja_id,
                        'observaciones' => "Ajuste por diferencia en cierre #{$cierre->id} - " . ($nuevaDiferencia > 0 ? 'Sobrante' : 'Faltante'),
                    ]);
                }
            }
        }

        if (empty($filasEsperado) && empty($filasAjuste)) {
            $this->info('✅ No hay cierres ni ajustes que corregir.');
            return self::SUCCESS;
        }

        if ($filasEsperado) {
            $this->info('Monto esperado / diferencia:');
            $this->table(['Cierre', 'Fecha', 'Esperado ant.', 'Esperado nuevo', 'Real', 'Dif. ant.', 'Dif. nueva'], $filasEsperado);
        }

        if ($filasAjuste) {
            $this->info('Movimientos AJUSTE:');
            $this->table(['Cierre', 'Movimiento', 'Monto ant.', 'Monto nuevo'], $filasAjuste);
        }

        $aplicar
            ? $this->info('✅ Cambios guardados.')
            : $this->warn('ℹ️ Vista previa. Ejecuta con --aplicar para guardar.');

        return self::SUCCESS;
    }
}
