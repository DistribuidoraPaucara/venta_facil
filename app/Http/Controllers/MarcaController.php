<?php

namespace App\Http\Controllers;

use App\Http\Traits\SimpleCrudController;
use App\Models\Marca;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Response as InertiaResponse;

/**
 * MarcaController - CRUD de Marcas
 *
 * ✅ CONSOLIDADO: Usa SimpleCrudController trait para web
 * ✅ API Methods: indexApi, storeApi, updateApi, destroyApi
 */
class MarcaController extends Controller
{
    use SimpleCrudController;

    protected function getModel(): string
    {
        return Marca::class;
    }

    protected function getRouteName(): string
    {
        return 'marcas';
    }

    protected function getViewPath(): string
    {
        return 'marcas';
    }

    protected function getResourceName(): string
    {
        return 'marcas';
    }

    protected function getValidationRules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'activo' => ['boolean'],
        ];
    }

    // ======================== API METHODS ========================

    /**
     * GET /api/app/marcas
     * Listar marcas con paginación y búsqueda
     */
    public function indexApi(Request $request): JsonResponse
    {
        try {
            $q = $request->string('q');
            $page = $request->integer('page', 1);
            $perPage = $request->integer('per_page', 20);

            $query = Marca::query();

            if ($q) {
                $searchLower = strtolower($q);
                $query->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"]);
            }

            $paginated = $query
                ->orderBy('id', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'data' => $paginated,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/app/marcas
     * Crear nueva marca
     */
    public function storeApi(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => ['required', 'string', 'max:255'],
                'descripcion' => ['nullable', 'string'],
                'activo' => ['boolean'],
            ]);

            $marca = Marca::create($validated);

            return response()->json([
                'data' => $marca,
                'message' => 'Marca creada correctamente',
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validación fallida',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/app/marcas/{id}
     * Actualizar marca
     */
    public function updateApi(Request $request, int $id): JsonResponse
    {
        try {
            $marca = Marca::findOrFail($id);

            $validated = $request->validate([
                'nombre' => ['required', 'string', 'max:255'],
                'descripcion' => ['nullable', 'string'],
                'activo' => ['boolean'],
            ]);

            $marca->update($validated);

            return response()->json([
                'data' => $marca,
                'message' => 'Marca actualizada correctamente',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validación fallida',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Marca no encontrada',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/app/marcas/{id}
     * Eliminar marca
     */
    public function destroyApi(int $id): JsonResponse
    {
        try {
            $marca = Marca::findOrFail($id);
            $marca->delete();

            return response()->json([
                'message' => 'Marca eliminada correctamente',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Marca no encontrada',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
