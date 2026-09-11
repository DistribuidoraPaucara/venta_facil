<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\MovimientoFraccionamiento;
use App\Services\FraccionamientoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FraccionamientoApiController extends Controller
{
    public function __construct(
        private FraccionamientoService $fraccionamientoService
    ) {}

    /**
     * POST /api/fraccionamientos
     * Crear un nuevo fraccionamiento
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'producto_padre_id' => 'required|integer|exists:productos,id',
                'cantidad_padre' => 'required|numeric|min:0.01',
                'producto_hijo_id' => 'required|integer|exists:productos,id|different:producto_padre_id',
                'cantidad_hijo' => 'required|numeric|min:0.01',
                'almacen_id' => 'required|integer|exists:almacenes,id',
                'sector_id' => 'required|integer|exists:sectores,id',
                'razon' => 'required|in:fraccionamiento_manual,fraccionamiento_compra,reagrupamiento,ajuste_inventario',
                'notas' => 'nullable|string|max:1000',
            ]);

            $movimiento = $this->fraccionamientoService->fraccionar(
                $validated['producto_padre_id'],
                $validated['cantidad_padre'],
                $validated['producto_hijo_id'],
                $validated['cantidad_hijo'],
                $validated['almacen_id'],
                $validated['sector_id'],
                $validated['razon'],
                $validated['notas'] ?? null
            );

            return ApiResponse::success(
                $movimiento->load([
                    'productoPadre:id,nombre,sku',
                    'productoHijo:id,nombre,sku',
                    'unidadPadre:id,nombre,codigo',
                    'unidadHijo:id,nombre,codigo',
                    'almacen:id,nombre',
                    'sector:id,nombre',
                    'usuario:id,name,email',
                ]),
                'Fraccionamiento realizado exitosamente',
                201
            );
        } catch (\Exception $e) {
            Log::error('❌ Error al crear fraccionamiento', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'request' => $request->all(),
            ]);

            return ApiResponse::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/fraccionamientos
     * Listar fraccionamientos con filtros
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = MovimientoFraccionamiento::query()
                ->conRelaciones();

            // Filtros
            if ($request->has('producto_padre_id')) {
                $query->where('producto_padre_id', $request->integer('producto_padre_id'));
            }

            if ($request->has('producto_hijo_id')) {
                $query->where('producto_hijo_id', $request->integer('producto_hijo_id'));
            }

            if ($request->has('almacen_id')) {
                $query->where('almacen_id', $request->integer('almacen_id'));
            }

            if ($request->has('sector_id')) {
                $query->where('sector_id', $request->integer('sector_id'));
            }

            if ($request->has('razon')) {
                $query->where('razon', $request->string('razon'));
            }

            if ($request->has('fecha_desde')) {
                $query->where('fecha_fraccionamiento', '>=', $request->date('fecha_desde'));
            }

            if ($request->has('fecha_hasta')) {
                $query->where('fecha_fraccionamiento', '<=', $request->date('fecha_hasta'));
            }

            if ($request->has('usuario_id')) {
                $query->where('usuario_id', $request->integer('usuario_id'));
            }

            $movimientos = $query
                ->orderByDesc('fecha_fraccionamiento')
                ->paginate($request->integer('per_page', 15));

            return ApiResponse::success($movimientos);
        } catch (\Exception $e) {
            Log::error('❌ Error al listar fraccionamientos', [
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::error('Error al listar fraccionamientos', 500);
        }
    }

    /**
     * GET /api/fraccionamientos/{movimiento}
     * Obtener detalle de un fraccionamiento
     */
    public function show(MovimientoFraccionamiento $movimiento): JsonResponse
    {
        try {
            return ApiResponse::success(
                $movimiento->load([
                    'productoPadre:id,nombre,sku,es_fraccionado',
                    'productoHijo:id,nombre,sku,es_fraccionado',
                    'unidadPadre:id,nombre,codigo',
                    'unidadHijo:id,nombre,codigo',
                    'almacen:id,nombre',
                    'sector:id,nombre',
                    'usuario:id,name,email',
                    'empresa:id,nombre',
                ])
            );
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener fraccionamiento', [
                'error' => $e->getMessage(),
                'movimiento_id' => $movimiento->id,
            ]);

            return ApiResponse::error('Error al obtener fraccionamiento', 500);
        }
    }

    /**
     * DELETE /api/fraccionamientos/{movimiento}/revertir
     * Revertir un fraccionamiento (soft delete)
     */
    public function revertir(MovimientoFraccionamiento $movimiento): JsonResponse
    {
        try {
            $this->fraccionamientoService->revertir($movimiento);

            return ApiResponse::success(
                null,
                'Fraccionamiento revertido exitosamente'
            );
        } catch (\Exception $e) {
            Log::error('❌ Error al revertir fraccionamiento', [
                'error' => $e->getMessage(),
                'movimiento_id' => $movimiento->id,
                'user_id' => auth()->id(),
            ]);

            return ApiResponse::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/fraccionamientos/producto/{productoId}/historial
     * Obtener historial de fraccionamientos de un producto
     */
    public function historialProducto(int $productoId): JsonResponse
    {
        try {
            $historial = $this->fraccionamientoService->obtenerHistorialProducto($productoId);

            return ApiResponse::success($historial);
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener historial', [
                'error' => $e->getMessage(),
                'producto_id' => $productoId,
            ]);

            return ApiResponse::error('Error al obtener historial', 500);
        }
    }

    /**
     * GET /api/fraccionamientos/producto/{productoPadreId}/estadisticas
     * Obtener estadísticas de fraccionamiento
     */
    public function estadisticas(int $productoPadreId, Request $request): JsonResponse
    {
        try {
            $dias = $request->integer('dias', 30);
            $stats = $this->fraccionamientoService->obtenerEstadisticas($productoPadreId, $dias);

            return ApiResponse::success($stats);
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener estadísticas', [
                'error' => $e->getMessage(),
                'producto_padre_id' => $productoPadreId,
            ]);

            return ApiResponse::error('Error al obtener estadísticas', 500);
        }
    }

    /**
     * GET /api/inventario/fraccionamientos/productos/disponibles
     * Obtener productos activos de la empresa para fraccionamientos con stock y límites
     */
    public function productosDisponibles(): JsonResponse
    {
        try {
            $empresaId = auth()->user()?->empresa_id;

            $productos = \App\Models\Producto::where('activo', true)
                ->where('empresa_id', $empresaId)
                ->select('id', 'nombre', 'sku', 'unidad_medida_id')
                ->with([
                    'unidad:id,nombre,codigo',
                    'stock:id,producto_id,almacen_id,sector_id,cantidad,cantidad_disponible',
                    'stock.almacen:id,nombre',
                    'stock.sector:id,nombre',
                    'stockLimites:id,producto_id,almacen_id,sector_id,stock_minimo,stock_maximo,capacidad_advertencia',
                ])
                ->orderBy('nombre')
                ->get()
                ->map(function ($producto) {
                    // Agrupar stocks por almacén y sector
                    $stocksPorUbicacion = $producto->stock?->map(function ($stock) {
                        return [
                            'id' => $stock->id,
                            'almacen_id' => $stock->almacen_id,
                            'almacen_nombre' => $stock->almacen?->nombre,
                            'sector_id' => $stock->sector_id,
                            'sector_nombre' => $stock->sector?->nombre,
                            'cantidad' => (float) $stock->cantidad,
                            'cantidad_disponible' => (float) $stock->cantidad_disponible,
                        ];
                    })->toArray() ?? [];

                    // Agrupar límites por almacén y sector
                    $limitesPorUbicacion = $producto->stockLimites?->map(function ($limite) {
                        return [
                            'id' => $limite->id,
                            'almacen_id' => $limite->almacen_id,
                            'sector_id' => $limite->sector_id,
                            'stock_minimo' => (int) $limite->stock_minimo,
                            'stock_maximo' => (int) $limite->stock_maximo,
                            'capacidad_advertencia' => (int) $limite->capacidad_advertencia,
                        ];
                    })->toArray() ?? [];

                    return [
                        'id' => $producto->id,
                        'nombre' => $producto->nombre,
                        'sku' => $producto->sku,
                        'unidad_medida_id' => $producto->unidad_medida_id,
                        'unidad_nombre' => $producto->unidad?->nombre ?? 'Unidad',
                        'stocks' => $stocksPorUbicacion,
                        'limites' => $limitesPorUbicacion,
                        'stock_total' => collect($stocksPorUbicacion)->sum('cantidad'),
                    ];
                });

            return ApiResponse::success($productos);
        } catch (\Exception $e) {
            Log::error('❌ Error al obtener productos disponibles', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return ApiResponse::error('Error al obtener productos', 500);
        }
    }
}
