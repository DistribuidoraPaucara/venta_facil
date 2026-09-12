<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\FraccionamientoMasivo;
use App\Services\FraccionamientoMasivoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FraccionamientoMasivoApiController extends Controller
{
    public function __construct(
        private FraccionamientoMasivoService $service
    ) {}

    /**
     * POST /api/fraccionamientos-masivos
     * Registrar múltiples fraccionamientos en una sola operación
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'almacen_id' => 'required|integer|exists:almacenes,id',
                'sector_id' => 'nullable|integer|exists:sectores,id',
                'razon' => 'required|in:fraccionamiento_manual,fraccionamiento_compra,reagrupamiento,ajuste_inventario',
                'notas' => 'nullable|string|max:1000',
                'detalles' => 'required|array|min:1',
                'detalles.*.producto_padre_id' => 'required|integer|exists:productos,id',
                'detalles.*.cantidad_padre' => 'required|numeric|min:0.01',
                'detalles.*.producto_hijo_id' => 'required|integer|exists:productos,id',
                'detalles.*.cantidad_hijo' => 'required|numeric|min:0.01',
                'detalles.*.factor_conversion' => 'nullable|numeric|min:0.01',
            ]);

            // Obtener sector automáticamente del producto padre si no se proporciona
            $sectorId = $validated['sector_id'];
            if (!$sectorId && !empty($validated['detalles'])) {
                $productoPadreId = $validated['detalles'][0]['producto_padre_id'];
                $stockLimite = \App\Models\StockLimite::where('producto_id', $productoPadreId)
                    ->where('almacen_id', $validated['almacen_id'])
                    ->first();
                if ($stockLimite) {
                    $sectorId = $stockLimite->sector_id;
                }
            }

            $fm = $this->service->registrar(
                $validated['almacen_id'],
                $sectorId,
                $validated['detalles'],
                $validated['razon'],
                $validated['notas'] ?? null
            );

            return ApiResponse::success(
                $fm->conRelaciones()->first(),
                'Fraccionamiento masivo registrado exitosamente',
                201
            );
        } catch (\Exception $e) {
            Log::error('Error en fraccionamiento masivo', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return ApiResponse::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/fraccionamientos-masivos
     * Listar fraccionamientos masivos
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = FraccionamientoMasivo::conRelaciones();

            if ($request->has('almacen_id')) {
                $query->where('almacen_id', $request->integer('almacen_id'));
            }

            if ($request->has('usuario_id')) {
                $query->where('usuario_id', $request->integer('usuario_id'));
            }

            $fms = $query
                ->orderByDesc('fecha_fraccionamiento')
                ->paginate($request->integer('per_page', 15));

            return ApiResponse::success($fms);
        } catch (\Exception $e) {
            Log::error('Error al listar fraccionamientos masivos', [
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::error('Error al listar', 500);
        }
    }

    /**
     * GET /api/fraccionamientos-masivos/{id}
     */
    public function show(FraccionamientoMasivo $fraccionamientoMasivo): JsonResponse
    {
        try {
            return ApiResponse::success($fraccionamientoMasivo->conRelaciones()->first());
        } catch (\Exception $e) {
            Log::error('Error al obtener fraccionamiento masivo', [
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::error('Error al obtener', 500);
        }
    }
}
