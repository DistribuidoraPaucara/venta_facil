<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AperturaCaja;
use App\Models\DetalleIngreso;
use App\Models\EstadoDocumento;
use App\Models\Ingreso;
use App\Models\MovimientoCaja;
use App\Models\TipoPago;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Ingresos de caja (cabecera + detalles + movimientos de caja positivos).
 *
 * Espejo de Api\EgresosController. Usado por la web (/api/ingresos) y por la app móvil
 * (/api/app/ingresos). Cada detalle debe ser de un tipo de operación de dirección ENTRADA
 * y genera un movimiento de caja por cada forma de pago (efectivo / transferencia-QR).
 */
class IngresosController extends Controller
{
    /**
     * Listar ingresos
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 15);

        $ingresos = Ingreso::with(['tipoOperacion', 'estadoDocumento', 'usuario', 'detalles'])
            ->orderBy('fecha', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $ingresos,
        ]);
    }

    /**
     * POST /api/ingresos (web) y POST /api/app/ingresos (móvil)
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
        try {
            $validated = $request->validate([
                'descripcion' => 'nullable|string|max:500',
                'detalles' => 'required|array|min:1',
                'detalles.*.concepto' => 'required|string|max:255',
                'detalles.*.tipo_operacion_caja_id' => 'required|exists:tipo_operacion_caja,id',
                'detalles.*.monto_efectivo' => 'nullable|numeric|min:0',
                'detalles.*.monto_transferencia' => 'nullable|numeric|min:0',
                'observaciones' => 'nullable|string|max:500',
            ]);

            $totalIngreso = 0.0;
            foreach ($validated['detalles'] as $detalle) {
                $totalPago = (float) ($detalle['monto_efectivo'] ?? 0) + (float) ($detalle['monto_transferencia'] ?? 0);

                if ($totalPago <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "Detalle '{$detalle['concepto']}': Debe ingresar al menos un monto (efectivo o transferencia)",
                    ], 422);
                }

                $tipo = \App\Models\TipoOperacionCaja::find($detalle['tipo_operacion_caja_id']);
                if ($tipo?->direccion !== 'ENTRADA') {
                    return response()->json([
                        'success' => false,
                        'message' => "Detalle '{$detalle['concepto']}': el tipo de operación no es de ingreso",
                    ], 422);
                }

                $totalIngreso += $totalPago;
            }

            $cajaAbierta = AperturaCaja::where('user_id', Auth::id())->abiertas()->latest('fecha')->first();
            if (! $cajaAbierta) {
                return response()->json([
                    'success' => false,
                    'message' => 'Debe tener una caja abierta para registrar ingresos',
                ], 422);
            }

            $estadoAprobado = EstadoDocumento::obtenerEstadoAprobado();

            $ingreso = DB::transaction(function () use ($validated, $totalIngreso, $estadoAprobado, $cajaAbierta) {
                $tipoPagoEfectivoId = TipoPago::where('codigo', 'EFECTIVO')->value('id');
                $tipoPagoTransferenciaId = TipoPago::where('codigo', 'TRANSFERENCIA/QR')->value('id');

                $ingreso = Ingreso::create([
                    'numero' => '0',
                    'tipo_operacion_caja_id' => $validated['detalles'][0]['tipo_operacion_caja_id'],
                    'estado_documento_id' => $estadoAprobado,
                    'usuario_id' => Auth::id(),
                    'fecha' => today(),
                    'descripcion' => $validated['descripcion'] ?? null,
                    'subtotal' => $totalIngreso,
                    'descuento' => 0,
                    'impuesto' => 0,
                    'total' => $totalIngreso,
                    'estado_pago' => 'PAGADA',
                    'monto_pagado' => $totalIngreso,
                    'monto_pendiente' => 0,
                    'observaciones' => $validated['observaciones'] ?? null,
                ]);

                $ingreso->update([
                    'numero' => 'INGR' . now()->format('Ymd') . '-' . str_pad($ingreso->id, 4, '0', STR_PAD_LEFT),
                ]);

                foreach ($validated['detalles'] as $detalle) {
                    $montoEfectivo = (float) ($detalle['monto_efectivo'] ?? 0);
                    $montoTransferencia = (float) ($detalle['monto_transferencia'] ?? 0);
                    $totalPago = $montoEfectivo + $montoTransferencia;

                    DetalleIngreso::create([
                        'ingreso_id' => $ingreso->id,
                        'concepto' => $detalle['concepto'],
                        'cantidad' => 1,
                        'monto_unitario' => $totalPago,
                        'descuento' => 0,
                        'subtotal' => $totalPago,
                        'tipo_operacion_caja_id' => $detalle['tipo_operacion_caja_id'],
                        'monto_efectivo' => $montoEfectivo,
                        'monto_transferencia' => $montoTransferencia,
                    ]);

                    $observacion = trim("Detalle: {$detalle['concepto']} (Ingreso #{$ingreso->numero})");

                    if ($montoEfectivo > 0 && $tipoPagoEfectivoId) {
                        $this->movimiento($ingreso, $cajaAbierta, $detalle, $montoEfectivo, $tipoPagoEfectivoId, $observacion);
                    }
                    if ($montoTransferencia > 0 && $tipoPagoTransferenciaId) {
                        $this->movimiento($ingreso, $cajaAbierta, $detalle, $montoTransferencia, $tipoPagoTransferenciaId, $observacion);
                    }
                }

                return $ingreso;
            });

            Log::info('[Ingresos] Ingreso registrado', [
                'ingreso_id' => $ingreso->id,
                'numero' => $ingreso->numero,
                'total' => $totalIngreso,
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ingreso registrado exitosamente',
                'ingreso_id' => $ingreso->id,
                'numero' => $ingreso->numero,
                'total' => round($totalIngreso, 2),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validación fallida',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('[Ingresos] Error registrando ingreso', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error al guardar el ingreso: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar un ingreso
     */
    public function show(Ingreso $ingreso): JsonResponse
    {
        $ingreso->load(['tipoOperacion', 'estadoDocumento', 'usuario', 'detalles.tipoOperacion']);

        return response()->json([
            'success' => true,
            'data' => $ingreso,
        ]);
    }

    /**
     * Anular un ingreso (elimina sus movimientos de caja)
     */
    public function anular(Ingreso $ingreso): JsonResponse
    {
        try {
            if ($ingreso->estadoDocumento->codigo === 'ANULADO') {
                return response()->json([
                    'success' => false,
                    'message' => 'El ingreso ya está anulado',
                ], 422);
            }

            $estadoAnulado = EstadoDocumento::where('codigo', 'ANULADO')->first();

            DB::transaction(function () use ($ingreso, $estadoAnulado) {
                $movimientosCount = MovimientoCaja::where('ingreso_id', $ingreso->id)->count();

                $ingreso->update([
                    'estado_documento_id' => $estadoAnulado->id,
                    'estado_pago' => 'PENDIENTE',
                    'monto_pagado' => 0,
                    'monto_pendiente' => $ingreso->total,
                ]);

                MovimientoCaja::where('ingreso_id', $ingreso->id)->delete();

                Log::info('[Ingresos] Ingreso anulado - movimientos eliminados', [
                    'ingreso_id' => $ingreso->id,
                    'numero' => $ingreso->numero,
                    'movimientos_eliminados' => $movimientosCount,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Ingreso anulado exitosamente',
            ]);
        } catch (\Throwable $e) {
            Log::error('[Ingresos] Error al anular', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error al anular el ingreso: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function movimiento(Ingreso $ingreso, AperturaCaja $caja, array $detalle, float $monto, int $tipoPagoId, string $observacion): void
    {
        MovimientoCaja::create([
            'caja_id' => $caja->caja_id,
            'user_id' => Auth::id(),
            'apertura_caja_id' => $caja->id,
            'fecha' => now(),
            'monto' => abs($monto), // Positivo: entra dinero a caja
            'observaciones' => $observacion,
            'numero_documento' => $ingreso->numero,
            'tipo_operacion_id' => $detalle['tipo_operacion_caja_id'],
            'tipo_pago_id' => $tipoPagoId,
            'ingreso_id' => $ingreso->id,
        ]);
    }
}
