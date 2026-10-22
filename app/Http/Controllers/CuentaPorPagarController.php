<?php
namespace App\Http\Controllers;

use App\Models\CuentaPorPagar;
use App\Models\Pago;
use App\Models\Proveedor;
use App\Models\TipoPago;
use App\Services\ImpresionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CuentaPorPagarController extends Controller
{
    public function __construct(private ImpresionService $impresionService) {}
    public function index(Request $request)
    {
        $query = $this->consultaFiltrada($request)->with(['compra.proveedor', 'pagos.tipoPago']);

        // Sorting
        $sortField = in_array($request->get('sort'), self::ORDEN_PERMITIDO, true) ? $request->get('sort') : 'fecha_vencimiento';
        $sortOrder = strtolower((string) $request->get('order')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortField, $sortOrder)->orderBy('id');

        $perPage = in_array((int) $request->get('per_page'), [10, 15, 25, 50, 100], true) ? (int) $request->get('per_page') : 15;
        $cuentas = $query->paginate($perPage)->withQueryString();

        // Estadísticas (solo de la empresa del usuario)
        $base = fn() => $this->deLaEmpresa(CuentaPorPagar::query());
        $estadisticas = [
            'monto_total_pendiente' => $base()->where('estado', '!=', 'PAGADO')->sum('saldo_pendiente'),
            'cuentas_vencidas'      => $base()->where('estado', '!=', 'PAGADO')
                ->where('fecha_vencimiento', '<', now())->count(),
            'monto_total_vencido'   => $base()->where('estado', '!=', 'PAGADO')
                ->where('fecha_vencimiento', '<', now())->sum('saldo_pendiente'),
            'total_mes'             => $base()->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)->sum('monto_original'),
            'promedio_dias_pago'    => 0, // Calcular promedio de días de pago si es necesario
        ];

        return Inertia::render('compras/cuentas-por-pagar/index', [
            'cuentasPorPagar' => [
                'cuentas_por_pagar' => [
                    'data'         => $cuentas->items(),
                    'current_page' => $cuentas->currentPage(),
                    'last_page'    => $cuentas->lastPage(),
                    'per_page'     => $cuentas->perPage(),
                    'total'        => $cuentas->total(),
                    'links'        => $cuentas->linkCollection()->toArray(),
                ],
                'filtros'           => $request->only([...self::FILTROS, 'per_page']),
                'estadisticas'      => $estadisticas,
                'datosParaFiltros'  => [
                    'proveedores' => Proveedor::select('id', 'nombre')
                        ->where('empresa_id', Auth::user()->empresa_id)
                        ->orderBy('nombre')
                        ->get(),
                    'tipos_pago'  => TipoPago::select('id', 'nombre', 'codigo')->where('codigo', '!=', 'CREDITO')->get(),
                ],
            ],
        ]);
    }

    private const FILTROS = ['estado', 'proveedor_id', 'q', 'fecha_vencimiento_desde', 'fecha_vencimiento_hasta', 'solo_vencidas'];
    private const ORDEN_PERMITIDO = ['id', 'fecha_vencimiento', 'saldo_pendiente', 'monto_original', 'created_at', 'estado'];

    /**
     * Reporte PDF de las cuentas que cumplen los filtros del listado (sin paginar).
     * GET compras/cuentas-por-pagar/reporte?accion=stream|download&{filtros}
     */
    public function reporte(Request $request)
    {
        $accion = $request->input('accion', 'stream');

        $sortField = in_array($request->get('sort'), self::ORDEN_PERMITIDO, true) ? $request->get('sort') : 'fecha_vencimiento';
        $sortOrder = strtolower((string) $request->get('order')) === 'desc' ? 'desc' : 'asc';

        $cuentas = $this->consultaFiltrada($request)
            ->with(['compra:id,numero,numero_factura,fecha,proveedor_id', 'compra.proveedor:id,nombre'])
            ->orderBy($sortField, $sortOrder)
            ->orderBy('id')
            ->get();

        $pendientes = $cuentas->where('saldo_pendiente', '>', 0)->where('estado', '!=', 'PAGADO');
        $vencidas   = $pendientes->filter(fn($c) => $c->dias_vencido > 0);
        $totales = [
            'cantidad'       => $cuentas->count(),
            'monto_original' => $cuentas->sum('monto_original'),
            'monto_pagado'   => $cuentas->sum(fn($c) => (float) $c->monto_original - (float) $c->saldo_pendiente),
            'saldo'          => $cuentas->sum('saldo_pendiente'),
            'vencidas'       => $vencidas->count(),
            'saldo_vencido'  => $vencidas->sum('saldo_pendiente'),
        ];

        // Descripción legible de los filtros aplicados
        $filtros = [];
        if ($request->filled('estado'))       $filtros['Estado'] = strtoupper($request->estado);
        if ($request->filled('proveedor_id')) $filtros['Proveedor'] = Proveedor::find($request->proveedor_id)?->nombre ?? "#{$request->proveedor_id}";
        if ($request->filled('q'))            $filtros['Búsqueda'] = $request->q;
        if ($request->filled('fecha_vencimiento_desde')) $filtros['Vence desde'] = \Carbon\Carbon::parse($request->fecha_vencimiento_desde)->format('d/m/Y');
        if ($request->filled('fecha_vencimiento_hasta')) $filtros['Vence hasta'] = \Carbon\Carbon::parse($request->fecha_vencimiento_hasta)->format('d/m/Y');
        if ($request->boolean('solo_vencidas')) $filtros['Solo vencidas'] = 'Sí';

        $html = view('impresion.cuentas_por_pagar.reporte-a4', [
            'cuentas' => $cuentas,
            'totales' => $totales,
            'filtros' => $filtros,
            'empresa' => Auth::user()->empresa ?? \App\Models\Empresa::first(),
            'usuario' => Auth::user(),
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'portrait');
        $nombreArchivo = 'reporte_cuentas_por_pagar_' . now()->format('Ymd_His') . '.pdf';

        return $accion === 'download' ? $pdf->download($nombreArchivo) : $pdf->stream($nombreArchivo);
    }

    /**
     * Filtros del listado (compartidos por index y reporte). Usa los nombres que envía la pantalla
     * (q, fecha_vencimiento_desde/hasta, solo_vencidas); antes se leían search/fecha_desde/fecha_hasta
     * y esos filtros no hacían nada.
     */
    private function consultaFiltrada(Request $request)
    {
        $buscar = trim((string) $request->input('q'));

        return $this->deLaEmpresa(CuentaPorPagar::query())
            ->when($request->estado, fn($q) => $q->whereRaw('UPPER(estado) = ?', [strtoupper($request->estado)]))
            ->when($request->proveedor_id, fn($q) => $q->whereHas('compra', fn($c) => $c->where('proveedor_id', $request->proveedor_id)))
            ->when($buscar !== '', function ($q) use ($buscar) {
                $like = "%{$buscar}%";
                $q->where(function ($sq) use ($buscar, $like) {
                    if (ctype_digit($buscar) && strlen($buscar) <= 9) {
                        $sq->orWhere('id', (int) $buscar)->orWhere('compra_id', (int) $buscar);
                    }
                    $sq->orWhere('referencia_documento', 'ilike', $like)
                        ->orWhereHas('compra', fn($c) => $c->where('numero', 'ilike', $like)
                            ->orWhere('numero_factura', 'ilike', $like)
                            ->orWhereHas('proveedor', fn($p) => $p->where('nombre', 'ilike', $like)));
                });
            })
            ->when($request->fecha_vencimiento_desde, fn($q) => $q->whereDate('fecha_vencimiento', '>=', $request->fecha_vencimiento_desde))
            ->when($request->fecha_vencimiento_hasta, fn($q) => $q->whereDate('fecha_vencimiento', '<=', $request->fecha_vencimiento_hasta))
            ->when($request->boolean('solo_vencidas'), fn($q) => $q->whereDate('fecha_vencimiento', '<', today())
                ->where('estado', '!=', 'PAGADO')
                ->where('saldo_pendiente', '>', 0));
    }

    /** CuentaPorPagar no tiene scope de empresa: se limita por el almacén de la compra. */
    private function deLaEmpresa($query)
    {
        return $query->whereHas('compra', fn($c) => $c->whereIn(
            'almacen_id',
            DB::table('almacenes')->where('empresa_id', Auth::user()->empresa_id)->select('id')
        ));
    }

    public function show(CuentaPorPagar $cuenta)
    {
        $cuenta->load(['compra.proveedor', 'compra.detalles.producto', 'pagos.tipoPago']);

        return Inertia::render('compras/cuentas-por-pagar/show', [
            'cuenta' => $cuenta,
        ]);
    }

    public function actualizarEstado(Request $request, CuentaPorPagar $cuenta)
    {
        $request->validate([
            'estado' => 'required|in:PENDIENTE,PARCIAL,PAGADO,VENCIDO',
        ]);

        $cuenta->update([
            'estado' => $request->estado,
        ]);

        return back()->with('success', 'Estado actualizado correctamente.');
    }

    public function registrarPago(Request $request, CuentaPorPagar $cuentaPorPagar): JsonResponse
    {
        try {
            Log::info('📝 [PAGO CUENTAS POR PAGAR] Iniciando registro de pago', [
                'cuenta_id'  => $cuentaPorPagar->id,
                'usuario_id' => Auth::id(),
            ]);

            // Validar datos
            $validated = $request->validate([
                'monto'                => 'required|numeric|min:0.01',
                'tipo_pago_id'         => [
                    'required',
                    'integer',
                    function ($attribute, $value, $fail) {
                        $tipoPago = TipoPago::find($value);
                        if (! $tipoPago) {
                            $fail('El tipo de pago seleccionado no existe.');
                        }
                    },
                ],
                'fecha_pago'           => 'required|date',
                'numero_recibo'        => 'nullable|string',
                'numero_transferencia' => 'nullable|string',
                'numero_cheque'        => 'nullable|string',
                'observaciones'        => 'nullable|string',
            ]);

            // Ejecutar en transacción
            $pago = DB::transaction(function () use ($validated, $cuentaPorPagar) {
                // Crear registro de pago
                $pago = Pago::create([
                    'numero_pago'          => Pago::generarNumeroPago(),
                    'cuenta_por_pagar_id'  => $cuentaPorPagar->id,
                    'monto'                => $validated['monto'],
                    'tipo_pago_id'         => $validated['tipo_pago_id'],
                    'fecha'                => now(),
                    'fecha_pago'           => $validated['fecha_pago'],
                    'numero_recibo'        => $validated['numero_recibo'],
                    'numero_transferencia' => $validated['numero_transferencia'],
                    'numero_cheque'        => $validated['numero_cheque'],
                    'observaciones'        => $validated['observaciones'],
                    'usuario_id'           => Auth::id(),
                    'estado'               => 'REGISTRADO',
                ]);

                // Actualizar saldo pendiente
                $nuevoSaldo = $cuentaPorPagar->saldo_pendiente - $validated['monto'];
                $cuentaPorPagar->update([
                    'saldo_pendiente' => max(0, $nuevoSaldo),
                    'monto_pagado'    => round((float) $cuentaPorPagar->monto_original - max(0, $nuevoSaldo), 2),
                    'estado'          => $nuevoSaldo <= 0 ? 'PAGADO' : 'PARCIAL',
                ]);

                Log::info('✅ [PAGO CUENTAS POR PAGAR] Pago registrado exitosamente', [
                    'pago_id'     => $pago->id,
                    'cuenta_id'   => $cuentaPorPagar->id,
                    'monto'       => $validated['monto'],
                    'nuevo_saldo' => $nuevoSaldo,
                ]);

                return $pago;
            });

            return response()->json([
                'success' => true,
                'message' => 'Pago registrado exitosamente',
                'data'    => [
                    'pago'   => $pago,
                    'cuenta' => $cuentaPorPagar->fresh(),
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('❌ [PAGO CUENTAS POR PAGAR] Error registrando pago', [
                'cuenta_id'  => $cuentaPorPagar->id,
                'error'      => $e->getMessage(),
                'usuario_id' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Error al registrar el pago: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function export(Request $request)
    {
        $query = CuentaPorPagar::with(['compra.proveedor'])
            ->when($request->estado, function ($q) use ($request) {
                $q->where('estado', $request->estado);
            })
            ->when($request->proveedor_id, function ($q) use ($request) {
                $q->whereHas('compra', function ($subQ) use ($request) {
                    $subQ->where('proveedor_id', $request->proveedor_id);
                });
            });

        $cuentas = $query->get();

        // Aquí implementarías la exportación a Excel
        // Por ahora retornamos los datos como JSON para testing
        return response()->json($cuentas);
    }

    public function anularPago(Request $request, CuentaPorPagar $cuentaPorPagar, Pago $pago): JsonResponse
    {
        try {
            Log::info('🗑️ [ANULAR PAGO CUENTAS POR PAGAR] Iniciando anulación', [
                'pago_id' => $pago->id,
                'cuenta_id' => $cuentaPorPagar->id,
                'usuario_id' => Auth::id(),
            ]);

            // Verificar permisos
            if (!auth()->user()->hasRole(['admin', 'Admin'])) {
                return response()->json(['message' => 'No tienes permiso'], 403);
            }

            // Validar que el pago pertenece a la cuenta
            if ($pago->cuenta_por_pagar_id !== $cuentaPorPagar->id) {
                return response()->json(['message' => 'El pago no pertenece a esta cuenta'], 422);
            }

            $motivo = $request->input('motivo', 'Sin motivo especificado');

            // Ejecutar en transacción
            DB::transaction(function () use ($pago, $cuentaPorPagar, $motivo) {
                // Revertir movimiento de caja
                if ($pago->movimientoCaja) {
                    $movOriginal = $pago->movimientoCaja;
                    $tipoAnulacion = \App\Models\TipoOperacionCaja::where('codigo', 'ANULACION')->firstOrFail();

                    \App\Models\MovimientoCaja::create([
                        'apertura_caja_id' => $movOriginal->apertura_caja_id, // ✅ NUEVO (2026-06-27): Usar apertura del movimiento original
                        'caja_id' => $movOriginal->caja_id,
                        'tipo_operacion_id' => $tipoAnulacion->id,
                        'numero_documento' => $cuentaPorPagar->compra?->numero ?? "CuentaPorPagar#{$cuentaPorPagar->id}",
                        'observaciones' => "REVERSIÓN por anulación de pago #{$pago->id}",
                        'monto' => abs($movOriginal->monto) * -1, // NEGATIVO (inverso del egreso)
                        'fecha' => now(),
                        'user_id' => Auth::id(),
                    ]);
                }

                // Actualizar saldo de la cuenta (restaurar lo que se restó)
                $nuevoSaldo = $cuentaPorPagar->saldo_pendiente + $pago->monto;
                $cuentaPorPagar->update([
                    'saldo_pendiente' => $nuevoSaldo,
                    'monto_pagado' => round(max(0, (float) $cuentaPorPagar->monto_original - $nuevoSaldo), 2),
                    'estado' => $nuevoSaldo >= $cuentaPorPagar->monto_original ? 'PENDIENTE' : 'PARCIAL',
                ]);

                // Marcar pago como anulado
                $pago->update([
                    'estado' => 'ANULADO',
                ]);

                Log::info('✅ [ANULAR PAGO CUENTAS POR PAGAR] Pago anulado exitosamente', [
                    'pago_id' => $pago->id,
                    'cuenta_id' => $cuentaPorPagar->id,
                    'monto' => $pago->monto,
                    'nuevo_saldo' => $nuevoSaldo,
                    'motivo' => $motivo,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Pago anulado exitosamente',
                'data' => [
                    'pago' => $pago->fresh(),
                    'cuenta' => $cuentaPorPagar->fresh(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('❌ [ANULAR PAGO CUENTAS POR PAGAR] Error anulando pago', [
                'pago_id' => $pago->id,
                'cuenta_id' => $cuentaPorPagar->id,
                'error' => $e->getMessage(),
                'usuario_id' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Error al anular el pago: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function imprimirTicket80(Request $request, CuentaPorPagar $cuentaPorPagar)
    {
        // Determinar formato y acción
        $formato = $request->get('formato', 'TICKET_80');
        $accion = $request->get('accion', 'stream');

        Log::info('🖨️ [IMPRESIÓN CUENTAS POR PAGAR] Iniciando impresión', [
            'cuenta_id'  => $cuentaPorPagar->id,
            'usuario_id' => Auth::id(),
            'formato'    => $formato,
            'accion'     => $accion,
            'url_completa' => $request->fullUrl(),
        ]);

        try {
            // Validar formato
            if (!in_array($formato, ['A4', 'TICKET_80', 'TICKET_58'])) {
                $formato = 'TICKET_80';
            }

            Log::info('📝 [IMPRESIÓN CUENTAS POR PAGAR] Llamando ImpresionService', [
                'cuenta_id' => $cuentaPorPagar->id,
                'formato' => $formato,
            ]);

            // Generar PDF usando ImpresionService
            $pdf = $this->impresionService->imprimirCuentaPorPagar($cuentaPorPagar, $formato);

            Log::info('✅ [IMPRESIÓN CUENTAS POR PAGAR] PDF generado exitosamente', [
                'cuenta_id' => $cuentaPorPagar->id,
                'formato' => $formato,
                'accion' => $accion,
            ]);

            $nombreArchivo = "cuenta_por_pagar_{$cuentaPorPagar->id}_{$formato}.pdf";

            return $accion === 'stream'
                ? $pdf->stream($nombreArchivo)
                : $pdf->download($nombreArchivo);

        } catch (\Exception $e) {
            Log::error('❌ [IMPRESIÓN CUENTAS POR PAGAR] ERROR CRÍTICO', [
                'cuenta_id'      => $cuentaPorPagar->id,
                'formato'        => $formato,
                'accion'         => $accion,
                'usuario_id'     => Auth::id(),
                'error_message'  => $e->getMessage(),
                'error_file'     => $e->getFile(),
                'error_line'     => $e->getLine(),
                'error_trace'    => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Error al generar PDF: ' . $e->getMessage());
        }
    }
}
