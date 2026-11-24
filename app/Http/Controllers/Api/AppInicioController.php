<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Almacen;
use App\Models\DetallePagoVenta;
use App\Models\DetalleVenta;
use App\Models\Producto;
use App\Models\StockLimite;
use App\Models\StockProducto;
use App\Models\Venta;
use App\Services\CajaAbiertaService;
use App\Services\DesgloseMovimientoCajaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

/**
 * Resumen para la pantalla de inicio de la app móvil y para el menú lateral.
 * Ventas del día (solo aprobadas), cobro por medio de pago, últimos 7 días,
 * caja abierta del usuario, productos más vendidos y stock bajo.
 */
class AppInicioController extends Controller
{
    public function __construct(
        private CajaAbiertaService $cajaAbierta,
        private DesgloseMovimientoCajaService $desglose,
    ) {
    }

    /**
     * GET /api/app/indicadores
     * Datos ligeros para el menú lateral: caja abierta y productos bajo mínimo.
     */
    public function indicadores(): JsonResponse
    {
        $caja = ['abierta' => false, 'caja_nombre' => null, 'efectivo_en_caja' => 0];
        $apertura = $this->cajaAbierta->obtenerAperturaAbierta();
        if ($apertura) {
            $movimientos = $this->desglose->obtenerDesgloseMovimientos($apertura);
            $caja = [
                'abierta' => true,
                'caja_nombre' => $apertura->caja?->nombre,
                'efectivo_en_caja' => round((float) ($movimientos['totales']['efectivo'] ?? 0), 2),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'caja' => $caja,
                'stock_bajo' => $this->productosBajoMinimo()->count(),
            ],
        ]);
    }

    /**
     * GET /api/app/inicio
     */
    public function resumen(): JsonResponse
    {
        $hoy = today()->toDateString();
        $desde = today()->subDays(6)->toDateString();

        $aprobadas = fn () => Venta::query()->whereHas(
            'estadoDocumento',
            fn ($q) => $q->where('codigo', 'APROBADO'),
        );

        // Ventas de hoy
        $ventasHoy = $aprobadas()->whereDate('fecha', $hoy);
        $total = (float) (clone $ventasHoy)->sum('total');
        $credito = (float) (clone $ventasHoy)->where('politica_pago', 'CREDITO')->sum('total');

        $anuladasHoy = Venta::query()
            ->whereDate('fecha', $hoy)
            ->whereHas('estadoDocumento', fn ($q) => $q->where('codigo', 'ANULADO'))
            ->count();

        // Cobrado hoy por medio de pago
        $efectivo = 0.0;
        $qr = 0.0;
        $otros = 0.0;
        $pagos = DetallePagoVenta::query()
            ->whereHas('venta', fn ($q) => $q->whereDate('fecha', $hoy)
                ->whereHas('estadoDocumento', fn ($e) => $e->where('codigo', 'APROBADO')))
            ->with('tipoPago:id,codigo')
            ->get(['id', 'tipo_pago_id', 'monto']);
        foreach ($pagos as $pago) {
            $monto = (float) $pago->monto;
            match (strtoupper((string) $pago->tipoPago?->codigo)) {
                'EFECTIVO' => $efectivo += $monto,
                'TRANSFERENCIA/QR' => $qr += $monto,
                default => $otros += $monto,
            };
        }

        // Últimos 7 días (incluye hoy), con días sin ventas en 0
        $porDia = [];
        $filas = $aprobadas()->whereBetween('fecha', [$desde, $hoy])->get(['fecha', 'total']);
        foreach ($filas as $fila) {
            $dia = substr((string) $fila->fecha, 0, 10);
            $porDia[$dia] = ($porDia[$dia] ?? 0) + (float) $fila->total;
        }
        $ultimosDias = [];
        for ($i = 6; $i >= 0; $i--) {
            $dia = today()->subDays($i)->toDateString();
            $ultimosDias[] = ['fecha' => $dia, 'total' => round($porDia[$dia] ?? 0, 2)];
        }

        // Productos más vendidos de los últimos 7 días
        $topFilas = DetalleVenta::query()
            ->whereHas('venta', fn ($q) => $q->whereBetween('fecha', [$desde, $hoy])
                ->whereHas('estadoDocumento', fn ($e) => $e->where('codigo', 'APROBADO')))
            ->selectRaw('producto_id, SUM(cantidad) as cantidad, SUM(subtotal) as total')
            ->groupBy('producto_id')
            ->orderByDesc('cantidad')
            ->limit(5)
            ->get();
        $nombres = Producto::query()
            ->whereIn('id', $topFilas->pluck('producto_id'))
            ->pluck('nombre', 'id');
        $topProductos = $topFilas->map(fn ($f) => [
            'producto_id' => (int) $f->producto_id,
            'nombre' => (string) ($nombres[$f->producto_id] ?? 'Producto'),
            'cantidad' => (float) $f->cantidad,
            'total' => round((float) $f->total, 2),
        ])->values();

        // Productos bajo mínimo (regla de stock_limites por almacén)
        $bajos = $this->productosBajoMinimo();
        $stockBajo = [
            'total' => $bajos->count(),
            'items' => $bajos->take(5)->values(),
        ];

        // Caja abierta del usuario (mismo cálculo que la caja de la app)
        $caja = [
            'abierta' => false,
            'caja_nombre' => null,
            'efectivo_en_caja' => 0,
            'transferencias_qr' => 0,
            'entradas' => 0,
            'salidas' => 0,
        ];
        $apertura = $this->cajaAbierta->obtenerAperturaAbierta();
        if ($apertura) {
            $movimientos = $this->desglose->obtenerDesgloseMovimientos($apertura);
            $caja = [
                'abierta' => true,
                'caja_nombre' => $apertura->caja?->nombre,
                'efectivo_en_caja' => round((float) ($movimientos['totales']['efectivo'] ?? 0), 2),
                'transferencias_qr' => round((float) ($movimientos['totales']['transferencia'] ?? 0), 2),
                'entradas' => round((float) ($movimientos['entradas']['total'] ?? 0), 2),
                'salidas' => round((float) ($movimientos['salidas']['total'] ?? 0), 2),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'hoy' => [
                    'fecha' => $hoy,
                    'ventas_count' => (clone $ventasHoy)->count(),
                    'ventas_total' => round($total, 2),
                    'ventas_contado' => round($total - $credito, 2),
                    'ventas_credito' => round($credito, 2),
                    'anuladas' => $anuladasHoy,
                ],
                'pagos_hoy' => [
                    'efectivo' => round($efectivo, 2),
                    'qr' => round($qr, 2),
                    'otros' => round($otros, 2),
                ],
                'ultimos_dias' => $ultimosDias,
                'top_productos' => $topProductos,
                'stock_bajo' => $stockBajo,
                'caja' => $caja,
            ],
        ]);
    }

    /**
     * Productos bajo su stock mínimo, por almacén. Misma regla que el reporte de inventario:
     * el mínimo es la suma de stock_limites del producto en ese almacén; si no tiene, el
     * stock_minimo general del producto. Se compara contra el stock de ese mismo almacén.
     * Solo cuentan los pares producto|almacén con stock o con un mínimo definido.
     *
     * @return Collection<int, array{producto_id:int, nombre:string, almacen:string, stock_actual:float, stock_minimo:float}>
     */
    private function productosBajoMinimo(): Collection
    {
        $empresaId = auth()->user()?->empresa_id;
        $almacenes = Almacen::query()
            ->where('empresa_id', $empresaId)
            ->pluck('nombre', 'id');
        if ($almacenes->isEmpty()) {
            return collect();
        }

        $productos = Producto::query()
            ->where('activo', true)
            ->get(['id', 'nombre', 'stock_minimo'])
            ->keyBy('id');
        if ($productos->isEmpty()) {
            return collect();
        }
        $ids = $productos->keys();
        $idsAlmacenes = $almacenes->keys();

        $stock = StockProducto::query()
            ->whereIn('producto_id', $ids)
            ->whereIn('almacen_id', $idsAlmacenes)
            ->selectRaw('producto_id, almacen_id, SUM(cantidad) as total')
            ->groupBy('producto_id', 'almacen_id')
            ->get()
            ->keyBy(fn ($s) => "{$s->producto_id}|{$s->almacen_id}");

        $limites = StockLimite::query()
            ->whereIn('producto_id', $ids)
            ->whereIn('almacen_id', $idsAlmacenes)
            ->selectRaw('producto_id, almacen_id, SUM(stock_minimo) as minimo')
            ->groupBy('producto_id', 'almacen_id')
            ->get()
            ->keyBy(fn ($l) => "{$l->producto_id}|{$l->almacen_id}");

        $pares = $stock->keys()->merge($limites->keys())->unique();

        return $pares
            ->map(function ($par) use ($productos, $stock, $limites, $almacenes) {
                [$productoId, $almacenId] = array_map('intval', explode('|', (string) $par));
                $producto = $productos[$productoId] ?? null;
                if (! $producto) {
                    return null;
                }

                $minimo = (float) ($limites[$par]->minimo ?? 0) ?: (float) ($producto->stock_minimo ?? 0);
                $actual = (float) ($stock[$par]->total ?? 0);
                if ($minimo <= 0 || $actual >= $minimo) {
                    return null;
                }

                return [
                    'producto_id' => $productoId,
                    'nombre' => (string) $producto->nombre,
                    'almacen' => (string) ($almacenes[$almacenId] ?? ''),
                    'stock_actual' => round($actual, 2),
                    'stock_minimo' => round($minimo, 2),
                ];
            })
            ->filter()
            ->sortBy('nombre')
            ->values();
    }
}
