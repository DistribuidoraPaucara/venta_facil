<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AperturaCaja;
use App\Models\Caja;
use App\Models\CierreCaja;
use App\Models\EstadoCierre;
use App\Models\MovimientoCaja;
use App\Models\TipoOperacionCaja;
use App\Models\TipoPago;
use App\Services\CajaAbiertaService;
use App\Services\DesgloseMovimientoCajaService;
use App\Services\CierreCajaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Caja del usuario para la app móvil.
 *
 * Misma lógica que CajaController (web: abrirCaja / cerrarCaja), pero respondiendo JSON
 * para poder usarla con token. Rutas bajo /api/app/caja.
 */
class CajaAppController extends Controller
{
    public function __construct(private CajaAbiertaService $cajaAbierta)
    {
    }

    /**
     * GET /api/app/caja/estado
     * Caja abierta del usuario (si la hay) y las cajas que puede abrir.
     */
    public function estado(): JsonResponse
    {
        $user = auth()->user();
        $cajas = Caja::where('user_id', $user->id)->where('activa', true)->get(['id', 'nombre']);

        $apertura = $this->cajaAbierta->obtenerAperturaAbierta();
        if (! $apertura) {
            return $this->ok(['abierta' => false, 'apertura' => null, 'cajas' => $cajas], 'Sin caja abierta');
        }

        return $this->ok([
            'abierta' => true,
            'apertura' => $this->formatear($apertura),
            'cajas' => $cajas,
        ], 'Caja abierta');
    }

    /**
     * POST /api/app/caja/abrir
     * Mismos campos que la web: caja_id, monto_apertura_efectivo, monto_apertura_transferencia, observaciones.
     */
    public function abrir(Request $request): JsonResponse
    {
        $request->validate([
            'caja_id'                      => 'nullable|integer|exists:cajas,id',
            'monto_apertura_efectivo'      => 'nullable|numeric|min:0',
            'monto_apertura_transferencia' => 'nullable|numeric|min:0',
            'observaciones'                => 'nullable|string|max:500',
        ]);

        $user = auth()->user();

        if ($this->cajaAbierta->obtenerAperturaAbierta()) {
            return $this->error('Ya tienes una caja abierta sin cerrar. Ciérrala primero.', 409);
        }

        $caja = $request->filled('caja_id')
            ? Caja::with('usuario')->find($request->integer('caja_id'))
            : Caja::where('user_id', $user->id)->where('activa', true)->first();

        if (! $caja) {
            return $this->error('No tienes una caja asignada. Contacta con administración.', 422);
        }
        if (! $caja->activa) {
            return $this->error('La caja seleccionada no está activa.', 422);
        }
        if ((int) $caja->usuario?->empresa_id !== (int) $user->empresa_id) {
            return $this->error('La caja seleccionada no pertenece a tu empresa.', 403);
        }

        $montoEfectivo = (float) ($request->input('monto_apertura_efectivo') ?? 0);
        $montoTransferencia = (float) ($request->input('monto_apertura_transferencia') ?? 0);
        $montoTotal = $montoEfectivo + $montoTransferencia;

        try {
            DB::beginTransaction();

            $apertura = AperturaCaja::create([
                'caja_id'        => $caja->id,
                'user_id'        => $user->id,
                'fecha'          => now(),
                'monto_apertura' => $montoTotal,
                'observaciones'  => $request->input('observaciones'),
            ]);

            $tipoOperacion = TipoOperacionCaja::where('codigo', 'APERTURA')->first();

            if ($montoEfectivo > 0 && $tipoOperacion) {
                MovimientoCaja::create([
                    'caja_id'           => $caja->id,
                    'user_id'           => $user->id,
                    'apertura_caja_id'  => $apertura->id,
                    'tipo_operacion_id' => $tipoOperacion->id,
                    'tipo_pago_id'      => TipoPago::where('codigo', 'EFECTIVO')->value('id'),
                    'numero_documento'  => 'APERTURA-EFECT-' . date('Ymd') . '-' . $user->id,
                    'descripcion'       => 'Apertura de caja (Efectivo) - ' . $caja->nombre,
                    'monto'             => $montoEfectivo,
                    'fecha'             => now(),
                ]);
            }

            if ($montoTransferencia > 0 && $tipoOperacion) {
                MovimientoCaja::create([
                    'caja_id'           => $caja->id,
                    'user_id'           => $user->id,
                    'apertura_caja_id'  => $apertura->id,
                    'tipo_operacion_id' => $tipoOperacion->id,
                    'tipo_pago_id'      => TipoPago::where('codigo', 'TRANSFERENCIA/QR')->value('id'),
                    'numero_documento'  => 'APERTURA-TRANS-' . date('Ymd') . '-' . $user->id,
                    'descripcion'       => 'Apertura de caja (Transferencia/QR) - ' . $caja->nombre,
                    'monto'             => $montoTransferencia,
                    'fecha'             => now(),
                ]);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('[CajaApp] Error abriendo caja: ' . $e->getMessage());
            return $this->error('Error al abrir la caja. Intenta nuevamente.', 500);
        }

        Log::info('[CajaApp] Caja abierta', ['user_id' => $user->id, 'caja_id' => $caja->id, 'monto' => $montoTotal]);

        return $this->ok([
            'abierta' => true,
            'apertura' => $this->formatear($apertura->fresh(['caja', 'cierre'])),
        ], 'Caja abierta exitosamente');
    }

    /**
     * POST /api/app/caja/cerrar
     * monto_real = efectivo contado. La diferencia contra lo esperado queda como ajuste (igual que la web).
     */
    public function cerrar(Request $request): JsonResponse
    {
        $request->validate([
            'monto_real'    => 'required|numeric|min:0',
            'observaciones' => 'nullable|string|max:500',
        ]);

        $user = auth()->user();
        $apertura = $this->cajaAbierta->obtenerAperturaAbierta();
        if (! $apertura) {
            return $this->error('No hay una caja abierta para cerrar.', 404);
        }

        try {
            DB::beginTransaction();

            $datos = (new CierreCajaService())->calcularDatos($apertura);
            $montoEsperado = (float) ($datos['efectivoEsperado']['total'] ?? 0);
            $montoReal = (float) $request->input('monto_real');
            $diferencia = $montoReal - $montoEsperado;

            $cierre = CierreCaja::create([
                'caja_id'          => $apertura->caja_id,
                'user_id'          => $user->id,
                'apertura_caja_id' => $apertura->id,
                'fecha'            => now(),
                'monto_esperado'   => $montoEsperado,
                'monto_real'       => $montoReal,
                'diferencia'       => $diferencia,
                'observaciones'    => $request->input('observaciones'),
                // Cierre consolidado directamente, sin segundo paso de verificación (igual que la web)
                'estado_cierre_id' => EstadoCierre::obtenerIdConsolidada(),
            ]);

            if (abs($diferencia) >= 0.01) {
                $tipoAjuste = TipoOperacionCaja::where('codigo', 'AJUSTE')->first();
                if ($tipoAjuste) {
                    MovimientoCaja::create([
                        'caja_id'           => $apertura->caja_id,
                        'apertura_caja_id'  => $apertura->id,
                        'tipo_operacion_id' => $tipoAjuste->id,
                        'numero_documento'  => 'AJUSTE-' . date('Ymd') . '-' . $user->id,
                        'observaciones'     => "Ajuste por diferencia en cierre #{$cierre->id} - " . ($diferencia > 0 ? 'Sobrante' : 'Faltante'),
                        'monto'             => $diferencia,
                        'fecha'             => now(),
                        'user_id'           => $user->id,
                    ]);
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('[CajaApp] Error cerrando caja: ' . $e->getMessage());
            return $this->error('Error al cerrar la caja. Intenta nuevamente.', 500);
        }

        Log::info('[CajaApp] Caja cerrada', ['user_id' => $user->id, 'cierre_id' => $cierre->id, 'diferencia' => $diferencia]);

        return $this->ok([
            'cierre_id' => $cierre->id,
            'monto_esperado' => round($montoEsperado, 2),
            'monto_real' => round($montoReal, 2),
            'diferencia' => round($diferencia, 2),
        ], 'Caja cerrada exitosamente');
    }

    /**
     * Datos de la apertura con lo calculado hasta ahora (ventas, ingresos, egresos, efectivo esperado).
     */
    /**
     * Resumen con los mismos cálculos que la web (CajaController::index):
     * - Ventas = efectivo + QR cobrados + crédito (detalles de pago).
     * - Efectivo a contar = desglose de movimientos en efectivo (apertura + cobrado − salidas).
     * - Transferencias / QR = desglose de movimientos por transferencia.
     * - Total esperado (efectivo + QR) = apertura + ingresos − egresos (desgloses dinámicos).
     */
    private function formatear(AperturaCaja $apertura): array
    {
        $apertura->loadMissing(['caja', 'cierre']);
        $cierreService = new CierreCajaService();
        $datos = $cierreService->calcularDatos($apertura);

        // Ventas cobradas por medio de pago
        $cobradoEfectivo = 0.0;
        $cobradoQr = 0.0;
        foreach (($datos['detallesPagosVentaPorTipo'] ?? []) as $detalle) {
            $codigo = $detalle['codigo'] ?? '';
            if ($codigo === 'EFECTIVO') {
                $cobradoEfectivo += (float) ($detalle['total'] ?? 0);
            } elseif ($codigo === 'TRANSFERENCIA/QR') {
                $cobradoQr += (float) ($detalle['total'] ?? 0);
            }
        }
        $ventasCredito = (float) ($datos['sumatorialVentasCredito'] ?? 0);

        // Ingresos y egresos dinámicos (igual que la web)
        $ingresos = array_sum(array_map(
            fn ($i) => (float) ($i['total'] ?? 0),
            $cierreService->obtenerDesgloseIngresos($apertura),
        ));
        $egresos = array_sum(array_map(
            fn ($e) => (float) ($e['total'] ?? 0),
            $cierreService->obtenerDesgloseEgresos($apertura),
        ));
        $montoApertura = (float) $apertura->monto_apertura;
        $efectivoEsperado = $montoApertura + $ingresos - $egresos;

        // Efectivo a contar y transferencias: desglose de movimientos por medio de pago
        $desglose = app(DesgloseMovimientoCajaService::class)->obtenerDesgloseMovimientos($apertura);

        return [
            'id'                => $apertura->id,
            'caja_id'           => $apertura->caja_id,
            'caja_nombre'       => $apertura->caja?->nombre,
            'fecha_apertura'    => $apertura->fecha?->toIso8601String(),
            'monto_apertura'    => $montoApertura,
            // Ventas (como la web: efectivo + QR + crédito)
            'ventas_total'      => round($cobradoEfectivo + $cobradoQr + $ventasCredito, 2),
            'ventas_efectivo'   => round($cobradoEfectivo, 2),
            'ventas_qr'         => round($cobradoQr, 2),
            'ventas_credito'    => round($ventasCredito, 2),
            'ingresos'          => round($ingresos, 2),
            'egresos'           => round($egresos, 2),
            'vueltos'           => round((float) ($datos['sumatorialVueltos'] ?? 0), 2),
            'gastos'            => round((float) ($datos['sumatorialGastos'] ?? 0), 2),
            'pagos_creditos'    => round((float) ($datos['montoPagosCreditos'] ?? 0), 2),
            // Lo que debe haber en el cajón (efectivo) y en transferencias/QR
            'efectivo_en_caja'  => round((float) ($desglose['totales']['efectivo'] ?? 0), 2),
            'efectivo_entradas' => round((float) ($desglose['entradas']['efectivo'] ?? 0), 2),
            'efectivo_salidas'  => round((float) ($desglose['salidas']['efectivo'] ?? 0), 2),
            'transferencias_qr' => round((float) ($desglose['totales']['transferencia'] ?? 0), 2),
            // Total esperado = efectivo + QR
            'efectivo_esperado' => round($efectivoEsperado, 2),
        ];
    }

    private function ok(array $data, string $message): JsonResponse
    {
        return response()->json(['success' => true, 'message' => $message, 'data' => $data]);
    }

    private function error(string $message, int $status): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], $status);
    }
}
