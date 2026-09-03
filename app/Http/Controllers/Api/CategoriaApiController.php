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
     * API: Listar todas las categorías (filtradas por empresa del usuario)
     * GET /api/app/categorias-crud
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->integer('per_page', 20);
            $searchTerm = $request->string('q', '');

            // ✨ NUEVO: Filtrar por empresa del usuario
            $query = Categoria::porEmpresa();

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
     * API: Crear nueva categoría (se asigna automáticamente a la empresa del usuario)
     * POST /api/app/categorias-crud
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // ✨ NUEVO: Validar nombre único POR EMPRESA (no globalmente)
            $empresaId = auth()->user()?->empresa_id;

            $validated = $request->validate([
                'nombre' => [
                    'required',
                    'string',
                    'max:255',
                    "unique:categorias,nombre,NULL,id,empresa_id,{$empresaId}"
                ],
                'descripcion' => ['nullable', 'string', 'max:1000'],
                'activo' => ['nullable', 'boolean'],
            ]);

            $validated['activo'] = $validated['activo'] ?? true;
            // ✨ NUEVO: Agregar empresa_id automáticamente
            $validated['empresa_id'] = $empresaId;

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
     * API: Obtener una categoría por ID (validando que pertenezca a la empresa del usuario)
     * GET /api/app/categorias-crud/{id}
     */
    public function show($id): JsonResponse
    {
        try {
            // ✨ NUEVO: Validar que pertenezca a la empresa del usuario
            $categoria = Categoria::porEmpresa()->findOrFail($id);

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
     * API: Actualizar categoría (validando que pertenezca a la empresa del usuario)
     * PUT /api/app/categorias-crud/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            // ✨ NUEVO: Validar que pertenezca a la empresa del usuario
            $categoria = Categoria::porEmpresa()->findOrFail($id);
            $empresaId = auth()->user()?->empresa_id;

            $validated = $request->validate([
                'nombre' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:255',
                    "unique:categorias,nombre,{$categoria->id},id,empresa_id,{$empresaId}"
                ],
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
     * API: Eliminar categoría (validando que pertenezca a la empresa del usuario)
     * DELETE /api/app/categorias-crud/{id}
     */
    public function destroy($id): JsonResponse
    {
        try {
            // ✨ NUEVO: Validar que pertenezca a la empresa del usuario
            $categoria = Categoria::porEmpresa()->findOrFail($id);

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
