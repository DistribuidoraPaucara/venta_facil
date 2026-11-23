<?php

namespace App\Console\Commands;

use App\Models\AperturaCaja;
use App\Models\CierreCaja;
use App\Models\EstadoCierre;
use App\Models\MovimientoCaja;
use App\Models\TipoOperacionCaja;
use App\Services\CierreCajaService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Cierra manualmente una apertura de caja que quedó abierta.
 *
 * Replica la lógica de CajaController::cerrarCaja (cierre PENDIENTE + ajuste por diferencia),
 * pero desde consola. Por defecto NO escribe nada: solo muestra el cálculo.
 *
 * Ejemplos:
 *   php artisan cajas:cerrar-antigua 5 --monto-real=1234.50            (simulación)
 *   php artisan cajas:cerrar-antigua 5 --monto-real=1234.50 --ejecutar (guarda el cierre)
 *   php artisan cajas:cerrar-antigua 5 --monto-real=1234.50 --fecha=2026-03-02 --ejecutar
 */
class CerrarCajaAntigua extends Command
{
    protected $signature = 'cajas:cerrar-antigua
        {apertura : ID de la apertura de caja a cerrar}
        {--monto-real= : Monto contado físicamente en la caja (obligatorio)}
        {--fecha= : Fecha del cierre (Y-m-d). Por defecto, ahora}
        {--observaciones= : Observaciones del cierre}
        {--ejecutar : Guarda el cierre en la base de datos (sin esta opción solo simula)}';

    protected $description = 'Cierra manualmente una apertura de caja que quedó abierta';

    public function handle(CierreCajaService $cierreCajaService): int
    {
        $apertura = AperturaCaja::find($this->argument('apertura'));

        if (! $apertura) {
            $this->error('No existe la apertura ' . $this->argument('apertura') . '.');
            return self::FAILURE;
        }

        if ($apertura->cierre) {
            $this->error("La apertura {$apertura->id} ya tiene un cierre (#{$apertura->cierre->id}).");
            return self::FAILURE;
        }

        if ($this->option('monto-real') === null || ! is_numeric($this->option('monto-real'))) {
            $this->error('Debes indicar el monto contado con --monto-real=<número>.');
            return self::FAILURE;
        }

        $montoReal = (float) $this->option('monto-real');
        $fechaCierre = $this->option('fecha')
            ? Carbon::createFromFormat('Y-m-d', $this->option('fecha'))->endOfDay()
            : now();

        // Mismo cálculo que cerrarCaja
        $datos = $cierreCajaService->calcularDatos($apertura);
        $montoEsperado = (float) ($datos['efectivoEsperado']['total'] ?? 0);
        $diferencia = $montoReal - $montoEsperado;

        $this->table(['Campo', 'Valor'], [
            ['Apertura', $apertura->id],
            ['Caja / usuario', $apertura->caja_id . ' / ' . $apertura->user_id],
            ['Abierta desde', $apertura->fecha],
            ['Fecha del cierre', $fechaCierre->format('Y-m-d H:i')],
            ['Monto esperado', number_format($montoEsperado, 2)],
            ['Monto real (contado)', number_format($montoReal, 2)],
            ['Diferencia', number_format($diferencia, 2)],
        ]);

        if (! $this->option('ejecutar')) {
            $this->warn('SIMULACIÓN: no se guardó nada. Agrega --ejecutar para cerrar la caja.');
            return self::SUCCESS;
        }

        if (! $this->confirm('¿Confirmas el cierre de esta caja? Esta acción escribe en la base de datos.')) {
            $this->line('Cancelado.');
            return self::SUCCESS;
        }

        $cierre = DB::transaction(function () use ($apertura, $montoEsperado, $montoReal, $diferencia, $fechaCierre) {
            $observaciones = $this->option('observaciones') ?: 'Cierre manual desde consola (cajas:cerrar-antigua)';

            $cierre = CierreCaja::create([
                'caja_id'          => $apertura->caja_id,
                'user_id'          => $apertura->user_id,
                'apertura_caja_id' => $apertura->id,
                'fecha'            => $fechaCierre,
                'monto_esperado'   => $montoEsperado,
                'monto_real'       => $montoReal,
                'diferencia'       => $diferencia,
                'observaciones'    => $observaciones,
                'estado_cierre_id' => EstadoCierre::obtenerIdConsolidada(),
            ]);

            if (abs($diferencia) >= 0.01) {
                $tipoOperacion = TipoOperacionCaja::where('codigo', 'AJUSTE')->first();

                if ($tipoOperacion) {
                    MovimientoCaja::create([
                        'caja_id'           => $apertura->caja_id,
                        'apertura_caja_id'  => $apertura->id,
                        'tipo_operacion_id' => $tipoOperacion->id,
                        'numero_documento'  => 'AJUSTE-' . $fechaCierre->format('Ymd') . '-' . $apertura->user_id,
                        'observaciones'     => "Ajuste por diferencia en cierre #{$cierre->id} - " . ($diferencia > 0 ? 'Sobrante' : 'Faltante'),
                        'monto'             => $diferencia,
                        'fecha'             => now(),
                        'user_id'           => $apertura->user_id,
                    ]);
                }
            }

            return $cierre;
        });

        Log::info('Caja cerrada manualmente desde consola', [
            'apertura_id'    => $apertura->id,
            'cierre_id'      => $cierre->id,
            'monto_esperado' => $montoEsperado,
            'monto_real'     => $montoReal,
            'diferencia'     => $diferencia,
        ]);

        $this->info("Caja cerrada. Cierre #{$cierre->id} registrado como CONSOLIDADO.");

        return self::SUCCESS;
    }
}
