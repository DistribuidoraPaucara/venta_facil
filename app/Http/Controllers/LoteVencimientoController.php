<?php
namespace App\Http\Controllers;

use App\Models\MovimientoInventario;
use App\Models\StockProducto;
use App\Services\Stock\MovimientoStockService;
use App\Models\Producto;
use App\Models\Almacen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LoteVencimientoController extends Controller
{
    public function index(Request $request)
    {
        // ✅ MODIFICADO: Filtrar por empresa del usuario autenticado
        $empresaId = Auth::user()->empresa_id;

        // Base query usando StockProducto (que tiene lotes y vencimientos actuales)
        $query = StockProducto::with(['producto', 'almacen'])
            ->whereNotNull('lote')  // Solo mostrar registros con lote
            ->whereHas('almacen', function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId);
            })
            ->when($request->producto_id, function ($q) use ($request) {
                $q->where('producto_id', $request->producto_id);
            })
            ->when($request->q, function ($q) use ($request) {
                $q->whereHas('producto', function ($pq) use ($request) {
                    $pq->where('nombre', 'LIKE', "%{$request->q}%")
                       ->orWhere('sku', 'LIKE', "%{$request->q}%")
                       ->orWhereHas('codigosBarra', fn ($cq) => $cq->where('codigo', 'LIKE', "%{$request->q}%"));
                })
                ->orWhere('lote', 'LIKE', "%{$request->q}%");
            })
            ->when($request->estado_vencimiento, function ($q) use ($request) {
                $estado = $request->estado_vencimiento;
                match ($estado) {
                    'VENCIDO' => $q->vencido(),
                    'PROXIMO_VENCER' => $q->proximoVencer(),
                    'VIGENTE' => $q->whereNotNull('fecha_vencimiento')
                        ->where('fecha_vencimiento', '>', now()->addDays(30)),
                    'SIN_VENCIMIENTO' => $q->whereNull('fecha_vencimiento'),
                    default => $q,
                };
            })
            ->when($request->almacen_id, function ($q) use ($request) {
                $q->where('almacen_id', $request->almacen_id);
            });

        // Sorting
        $sortField = $request->get('sort', 'fecha_vencimiento');
        $sortOrder = $request->get('order', 'asc');
        $query->orderBy($sortField, $sortOrder);

        $lotesPaginados = $query->paginate(15)->withQueryString();

        // Costo unitario (precio COSTO de precios_producto) de los productos de esta página
        $costosProducto = (clone $this->costosProductoQuery())
            ->whereIn('pp.producto_id', $lotesPaginados->getCollection()->pluck('producto_id')->unique())
            ->pluck('costo', 'producto_id');

        // Transformar cada lote para agregar campos calculados
        $lotes = $lotesPaginados->through(function ($stock) use ($costosProducto) {
            $costoUnitario = (float) $stock->precio_costo > 0
                ? (float) $stock->precio_costo
                : (float) ($costosProducto[$stock->producto_id] ?? 0);

            return [
                'id' => $stock->id,
                'producto' => $stock->producto,
                'almacen' => $stock->almacen,
                'lote' => $stock->lote,
                'fecha_vencimiento' => $stock->fecha_vencimiento?->toDateString(),
                'cantidad' => $stock->cantidad,
                'cantidad_disponible' => $stock->cantidad_disponible,
                'cantidad_reservada' => $stock->cantidad_reservada,
                'precio_costo' => $costoUnitario,
                'valor_total' => (float) $stock->cantidad * $costoUnitario,
                'dias_para_vencer' => $stock->diasParaVencer(),
                'estado_vencimiento' => $this->determinarEstadoVencimiento($stock),
                'esta_vencido' => $stock->estaVencido(),
            ];
        });

        // Estadísticas
        // ✅ MODIFICADO: Filtrar por empresa del usuario autenticado
        // Se une con el precio COSTO del producto (precios_producto) para valorizar los lotes
        $todosLotes = StockProducto::query()
            ->leftJoinSub($this->costosProductoQuery(), 'costos', 'costos.producto_id', '=', 'stock_productos.producto_id')
            ->whereNotNull('stock_productos.lote')
            ->whereHas('almacen', function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId);
            });

        // Costo del lote si tiene; si no, el precio COSTO del producto
        $valorLoteSql = DB::raw('stock_productos.cantidad * COALESCE(NULLIF(stock_productos.precio_costo, 0), costos.costo, 0)');

        $estadisticas = [
            'total_lotes' => (clone $todosLotes)->count(),
            'lotes_vigentes' => (clone $todosLotes)
                ->whereNotNull('fecha_vencimiento')
                ->where('fecha_vencimiento', '>', now()->addDays(30))
                ->count(),
            'lotes_proximos_vencer' => (clone $todosLotes)->proximoVencer()->count(),
            'lotes_vencidos' => (clone $todosLotes)->vencido()->count(),
            'lotes_criticos' => (clone $todosLotes)
                ->whereNotNull('fecha_vencimiento')
                ->where('fecha_vencimiento', '<=', now()->addDays(7))
                ->where('fecha_vencimiento', '>', now())
                ->count(),
            'valor_total_inventario' => (clone $todosLotes)
                ->sum($valorLoteSql),
            'valor_proximos_vencer' => (clone $todosLotes)
                ->proximoVencer()
                ->sum($valorLoteSql),
            'valor_vencidos' => (clone $todosLotes)
                ->vencido()
                ->sum($valorLoteSql),
        ];

        // Calendario: lotes que vencen en el mes seleccionado (?mes=YYYY-MM)
        try {
            $mes = \Carbon\Carbon::createFromFormat('Y-m', (string) $request->get('mes', now()->format('Y-m')))->startOfMonth();
        } catch (\Throwable $e) {
            $mes = now()->startOfMonth();
        }

        $calendario = StockProducto::with([
                'producto:id,nombre,sku',
                'producto.codigoPrincipal:id,producto_id,codigo',
                'producto.imagenes:id,producto_id,url,es_principal,orden',
                'almacen:id,nombre',
            ])
            ->whereNotNull('lote')
            ->whereHas('almacen', function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId);
            })
            ->whereBetween('fecha_vencimiento', [$mes->toDateString(), $mes->copy()->endOfMonth()->toDateString()])
            ->when($request->producto_id, fn ($q) => $q->where('producto_id', $request->producto_id))
            ->when($request->almacen_id, fn ($q) => $q->where('almacen_id', $request->almacen_id))
            ->orderBy('fecha_vencimiento')
            ->get()
            ->map(function ($stock) {
                $imagenes = $stock->producto?->imagenes ?? collect();
                $imagen   = $imagenes->firstWhere('es_principal', true) ?? $imagenes->sortBy('orden')->first();

                return [
                    'id'                => $stock->id,
                    'producto_id'       => $stock->producto_id,
                    'producto_nombre'   => $stock->producto?->nombre,
                    'sku'               => $stock->producto?->sku ?? $stock->producto?->codigoPrincipal?->codigo,
                    'imagen_url'        => $imagen?->url,
                    'lote'              => $stock->lote,
                    'almacen'           => $stock->almacen?->nombre,
                    'cantidad'          => $stock->cantidad,
                    'fecha_vencimiento' => $stock->fecha_vencimiento?->toDateString(),
                    'estado_vencimiento' => $this->determinarEstadoVencimiento($stock),
                ];
            })
            ->values();

        return Inertia::render('compras/lotes-vencimientos/index', [
            'calendario'    => $calendario,
            'mesCalendario' => $mes->format('Y-m'),
            'lotes'        => $lotes,
            'filtros'      => $request->only(['producto_id', 'estado_vencimiento', 'almacen_id', 'q']),
            'estadisticas' => $estadisticas,
            // ✅ MODIFICADO: Filtrar productos y almacenes por empresa del usuario autenticado
            'productos'    => Producto::where('empresa_id', $empresaId)
                ->select('id', 'nombre')
                ->orderBy('nombre')
                ->get(),
            'almacenes'    => Almacen::where('empresa_id', $empresaId)
                ->select('id', 'nombre')
                ->orderBy('nombre')
                ->get(),
        ]);
    }

    /**
     * Precio de costo por producto: precio activo de tipo COSTO en precios_producto
     * (producto_id => costo). El costo real no se guarda en stock_productos.precio_costo.
     */
    private function costosProductoQuery(): \Illuminate\Database\Query\Builder
    {
        return DB::table('precios_producto as pp')
            ->join('tipos_precio as tp', 'tp.id', '=', 'pp.tipo_precio_id')
            ->where('tp.codigo', 'COSTO')
            ->where('pp.activo', true)
            ->groupBy('pp.producto_id')
            ->select('pp.producto_id', DB::raw('MAX(pp.precio) as costo'));
    }

    /**
     * Determinar el estado de vencimiento de un lote
     */
    private function determinarEstadoVencimiento(StockProducto $stock): string
    {
        if ($stock->estaVencido()) {
            return 'VENCIDO';
        }

        if ($stock->proximoVencer(7)) {
            return 'CRITICO';
        }

        if ($stock->proximoVencer(30)) {
            return 'PROXIMO_VENCER';
        }

        if ($stock->fecha_vencimiento) {
            return 'VIGENTE';
        }

        return 'SIN_VENCIMIENTO';
    }

    /**
     * Actualizar cantidad disponible de un lote
     */
    public function actualizarCantidad(Request $request, StockProducto $stock)
    {
        $request->validate([
            'cantidad_disponible' => 'required|numeric|min:0|max:' . $stock->cantidad,
        ]);

        $stock->update([
            'cantidad_disponible' => $request->cantidad_disponible,
            'cantidad_reservada' => $stock->cantidad - $request->cantidad_disponible,
            'fecha_actualizacion' => now(),
        ]);

        return back()->with('success', 'Cantidad del lote actualizada correctamente.');
    }

    /**
     * Dar de baja un lote (soft delete: marca deleted_at y deja de usarse en el sistema)
     */
    public function darDeBaja(StockProducto $stock, MovimientoStockService $movimientoStockService)
    {
        // Solo lotes de almacenes de la empresa del usuario
        if ($stock->almacen?->empresa_id !== Auth::user()->empresa_id) {
            abort(403, 'No tiene permiso para dar de baja este lote.');
        }

        if ($stock->cantidad_reservada > 0) {
            return back()->withErrors([
                'lote' => "No se puede dar de baja el lote {$stock->lote}: tiene {$stock->cantidad_reservada} unidades reservadas.",
            ]);
        }

        $cantidadBaja = (float) $stock->cantidad;

        try {
            $movimiento = DB::transaction(function () use ($stock, $cantidadBaja, $movimientoStockService) {
                $movimiento = null;

                // Registrar la salida del stock restante en movimientos_inventario (lleva el lote a 0)
                if ($cantidadBaja > 0) {
                    $movimiento = $movimientoStockService->registrarMovimientoYActualizar(
                        $stock->id,
                        -$cantidadBaja,
                        MovimientoInventario::TIPO_SALIDA_AJUSTE,
                        'baja_lote',
                        $stock->id,
                        [
                            'motivo'            => 'Baja de lote',
                            'lote'              => $stock->lote,
                            'fecha_vencimiento' => $stock->fecha_vencimiento?->toDateString(),
                        ],
                        "BAJA-LOTE-{$stock->id}"
                    );
                }

                // Soft delete: marca deleted_at para que el lote no se use más
                $stock->refresh()->delete();

                return $movimiento;
            });
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['lote' => $e->getMessage()]);
        }

        Log::info('LoteVencimientoController::darDeBaja - lote dado de baja', [
            'stock_producto_id' => $stock->id,
            'producto_id'       => $stock->producto_id,
            'almacen_id'        => $stock->almacen_id,
            'lote'              => $stock->lote,
            'cantidad'          => $cantidadBaja,
            'movimiento_id'     => $movimiento?->id,
            'user_id'           => Auth::id(),
        ]);

        return back()->with('success', "Lote {$stock->lote} dado de baja correctamente.");
    }

    /**
     * Exportar lotes a JSON (para testing)
     */
    public function export(Request $request)
    {
        // ✅ MODIFICADO: Filtrar por empresa del usuario autenticado
        $empresaId = Auth::user()->empresa_id;

        $query = StockProducto::with(['producto', 'almacen'])
            ->whereNotNull('lote')
            ->whereHas('almacen', function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId);
            })
            ->when($request->estado_vencimiento, function ($q) use ($request) {
                $estado = $request->estado_vencimiento;
                match ($estado) {
                    'VENCIDO' => $q->vencido(),
                    'PROXIMO_VENCER' => $q->proximoVencer(),
                    default => $q,
                };
            });

        $lotes = $query->get();

        return response()->json($lotes);
    }
}
