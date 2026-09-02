<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CategoriaApiController extends Controller
{
    /**
     * API: Listar todas las categorías (activas e inactivas)
     * GET /api/app/categorias-crud
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->integer('per_page', 20);
            $searchTerm = $request->string('q', '');

            $query = Categoria::query();

            // Búsqueda
            if ($searchTerm) {
                $query->where('nombre', 'ILIKE', "%{$searchTerm}%")
                    ->orWhere('descripcion', 'ILIKE', "%{$searchTerm}%");
            }

            // Ordenar por ID descendente (más nuevas primero)
            $query->orderBy('id', 'desc');

            $categorias = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'status' => 200,
                'message' => 'Operación exitosa',
                'data' => $categorias,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ [CategoriaApiController] Error al listar', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener categorías',
            ], 500);
        }
    }

    /**
     * API: Crear nueva categoría
     * POST /api/app/categorias-crud
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => ['required', 'string', 'max:255', 'unique:categorias,nombre'],
                'descripcion' => ['nullable', 'string', 'max:1000'],
                'activo' => ['nullable', 'boolean'],
            ]);

            $validated['activo'] = $validated['activo'] ?? true;

            $categoria = Categoria::create($validated);

            Log::info('✅ Categoría creada', [
                'categoria_id' => $categoria->id,
                'nombre' => $categoria->nombre,
            ]);

            return response()->json([
                'success' => true,
                'status' => 201,
                'message' => 'Categoría creada exitosamente',
                'data' => $categoria,
            ], 201);
        } catch (\Exception $e) {
            Log::error('❌ [CategoriaApiController] Error al crear', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear categoría',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * API: Obtener una categoría por ID
     * GET /api/app/categorias-crud/{id}
     */
    public function show(Categoria $categoria): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'status' => 200,
                'message' => 'Operación exitosa',
                'data' => $categoria,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ [CategoriaApiController] Error al obtener', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Categoría no encontrada',
            ], 404);
        }
    }

    /**
     * API: Actualizar categoría
     * PUT /api/app/categorias-crud/{id}
     */
    public function update(Request $request, Categoria $categoria): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nombre' => ['sometimes', 'required', 'string', 'max:255', 'unique:categorias,nombre,' . $categoria->id],
                'descripcion' => ['nullable', 'string', 'max:1000'],
                'activo' => ['nullable', 'boolean'],
            ]);

            $categoria->update($validated);

            Log::info('✅ Categoría actualizada', [
                'categoria_id' => $categoria->id,
                'nombre' => $categoria->nombre,
            ]);

            return response()->json([
                'success' => true,
                'status' => 200,
                'message' => 'Categoría actualizada exitosamente',
                'data' => $categoria,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ [CategoriaApiController] Error al actualizar', [
                'categoria_id' => $categoria->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar categoría',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * API: Eliminar categoría
     * DELETE /api/app/categorias-crud/{id}
     */
    public function destroy(Categoria $categoria): JsonResponse
    {
        try {
            // Verificar si la categoría tiene productos asociados
            if ($categoria->productos()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar la categoría porque tiene productos asociados',
                ], 409);
            }

            $categoriaId = $categoria->id;
            $categoriaNombre = $categoria->nombre;

            $categoria->delete();

            Log::info('✅ Categoría eliminada', [
                'categoria_id' => $categoriaId,
                'nombre' => $categoriaNombre,
            ]);

            return response()->json([
                'success' => true,
                'status' => 200,
                'message' => 'Categoría eliminada exitosamente',
            ]);
        } catch (\Exception $e) {
            Log::error('❌ [CategoriaApiController] Error al eliminar', [
                'categoria_id' => $categoria->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar categoría',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
