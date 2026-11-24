<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AperturaCaja;
use App\Models\MovimientoCaja;
use App\Models\TipoOperacionCaja;
use App\Models\TipoPago;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Ingresos de caja para la app móvil.
 *
 * Igual que los egresos (/api/egresos): cada detalle lleva concepto, tipo de operación
 * y montos en efectivo y transferencia/QR. Cada monto genera un movimiento de caja positivo
 * (entra dinero), con el tipo de pago correspondiente. No hay cabecera de documento.
 */
class IngresosController extends Controller
{
    /**
     * POST /api/app/ingresos
     *
     * {
     *   "descripcion": "Ingresos del día",
     *   "detalles": [
     *     { "concepto": "Préstamo devuelto", "tipo_operacion_caja_id": 5,
     *       "monto_efectivo": 50, "monto_transferencia": 0 }
     *   ],
     *   "observaciones": null
     * }
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'descripcion' => 'nullable|string|max:500',
            'detalles' => 'required|array|min:1',
            'detalles.*.concepto' => 'required|string|max:255',
            'detalles.*.tipo_operacion_caja_id' => 'required|exists:tipo_operacion_caja,id',
            'detalles.*.monto_efectivo' => 'nullable|numeric|min:0',
            'detalles.*.monto_transferencia' => 'nullable|numeric|min:0',
            'observaciones' => 'nullable|string|max:500',
        ]);

        // Cada detalle debe tener al menos un monto y ser un tipo de ingreso (ENTRADA)
        $total = 0.0;
        foreach ($validated['detalles'] as $detalle) {
            $monto = (float) ($detalle['monto_efectivo'] ?? 0) + (float) ($detalle['monto_transferencia'] ?? 0);
            if ($monto <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Detalle '{$detalle['concepto']}': ingrese un monto en efectivo o transferencia",
                ], 422);
            }

            $tipo = TipoOperacionCaja::find($detalle['tipo_operacion_caja_id']);
            if ($tipo?->direccion !== 'ENTRADA') {
                return response()->json([
                    'success' => false,
                    'message' => "Detalle '{$detalle['concepto']}': el tipo de operación no es de ingreso",
                ], 422);
            }

            $total += $monto;
        }

        $caja = AperturaCaja::where('user_id', Auth::id())->abiertas()->latest('fecha')->first();
        if (! $caja) {
            return response()->json([
                'success' => false,
                'message' => 'Debe tener una caja abierta para registrar ingresos',
            ], 422);
        }

        $numero = 'INGR-' . now()->format('YmdHis') . '-' . Auth::id();
        $tipoPagoEfectivo = TipoPago::where('codigo', 'EFECTIVO')->value('id');
        $tipoPagoTransferencia = TipoPago::where('codigo', 'TRANSFERENCIA/QR')->value('id');

        try {
            DB::transaction(function () use ($validated, $caja, $numero, $tipoPagoEfectivo, $tipoPagoTransferencia) {
                foreach ($validated['detalles'] as $detalle) {
                    $efectivo = (float) ($detalle['monto_efectivo'] ?? 0);
                    $transferencia = (float) ($detalle['monto_transferencia'] ?? 0);
                    $observacion = trim('Ingreso: ' . $detalle['concepto'] . ($validated['descripcion'] ? ' - ' . $validated['descripcion'] : ''));

                    if ($efectivo > 0 && $tipoPagoEfectivo) {
                        $this->movimiento($caja, $detalle, $efectivo, $tipoPagoEfectivo, $numero, $observacion);
                    }
                    if ($transferencia > 0 && $tipoPagoTransferencia) {
                        $this->movimiento($caja, $detalle, $transferencia, $tipoPagoTransferencia, $numero, $observacion);
                    }
                }
            });
        } catch (\Throwable $e) {
            Log::error('[Ingresos] Error registrando ingreso', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar el ingreso: ' . $e->getMessage(),
            ], 500);
        }

        Log::info('[Ingresos] Ingreso registrado', ['numero' => $numero, 'total' => $total, 'user_id' => Auth::id()]);

        return response()->json([
            'success' => true,
            'message' => 'Ingreso registrado exitosamente',
            'numero' => $numero,
            'total' => round($total, 2),
        ], 201);
    }

    private function movimiento(AperturaCaja $caja, array $detalle, float $monto, int $tipoPagoId, string $numero, string $observacion): void
    {
        MovimientoCaja::create([
            'caja_id' => $caja->caja_id,
            'user_id' => Auth::id(),
            'apertura_caja_id' => $caja->id,
            'fecha' => now(),
            'monto' => abs($monto), // Positivo: entra dinero a caja
            'observaciones' => $observacion,
            'numero_documento' => $numero,
            'tipo_operacion_id' => $detalle['tipo_operacion_caja_id'],
            'tipo_pago_id' => $tipoPagoId,
        ]);
    }
}
