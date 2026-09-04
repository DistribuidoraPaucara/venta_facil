<?php

namespace App\Http\Controllers;

use App\Http\Traits\SimpleCrudController;
use App\Models\UnidadMedida;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Inertia\Response as InertiaResponse;

/**
 * UnidadMedidaController - CRUD de Unidades de Medida
 *
 * ✅ CONSOLIDADO: Usa SimpleCrudController trait para web
 * ✅ API Methods: indexApi, storeApi, updateApi, destroyApi
 * Nota: Sobrescribe index() para búsqueda en múltiples campos
 */
class UnidadMedidaController extends Controller
{
    use SimpleCrudController;

    protected function getModel(): string
    {
        return UnidadMedida::class;
    }

    protected function getRouteName(): string
    {
        return 'unidades';
    }

    protected function getViewPath(): string
    {
        return 'unidades';
    }

    protected function getResourceName(): string
    {
        return 'unidades';
    }

    protected function getValidationRules(): array
    {
        $empresaId = auth()->user()?->empresa_id;

        return [
            'codigo' => [
                'required',
                'string',
                'max:10',
                // ✅ Unique por empresa, no global
                Rule::unique('unidades_medida', 'codigo')->where('empresa_id', $empresaId),
            ],
            'nombre' => ['required', 'string', 'max:255'],
            'activo' => ['boolean'],
        ];
    }

    /**
     * Override: búsqueda en nombre Y código (Web)
     */
    public function index(Request $request): InertiaResponse
    {
        $modelClass = $this->getModel();
        $q = $request->string('q');

        $items = $modelClass::porEmpresa()  // ✅ Filtrar por empresa
            ->when($q, function ($query) use ($q) {
                $searchLower = strtolower($q);
                return $query->where(function ($sub) use ($searchLower) {
                    $sub->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(codigo) like ?', ["%$searchLower%"]);
                });
            })
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();

        return inertia($this->getViewPath() . '/index', [
            $this->getResourceName() => $items,
            'filters' => ['q' => $q],
        ]);
    }

    // ======================== API METHODS ========================

    /**
     * GET /api/app/unidades-medida
     * Listar unidades con paginación y búsqueda
     */
    public function indexApi(Request $request): JsonResponse
    {
        try {
            $q = $request->string('q');
            $page = $request->integer('page', 1);
            $perPage = $request->integer('per_page', 20);

            $query = UnidadMedida::porEmpresa();  // ✅ Filtrar por empresa

            if ($q) {
                $searchLower = strtolower($q);
                $query->where(function ($sub) use ($searchLower) {
                    $sub->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(codigo) like ?', ["%$searchLower%"]);
                });
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
     * POST /api/app/unidades-medida
     * Crear nueva unidad
     */
    public function storeApi(Request $request): JsonResponse
    {
        try {
            $empresaId = auth()->user()?->empresa_id;

            $validated = $request->validate([
                'nombre' => ['required', 'string', 'max:255'],
                'codigo' => [
                    'required',
                    'string',
                    'max:10',
                    // ✅ Unique por empresa, no global
                    Rule::unique('unidades_medida', 'codigo')->where('empresa_id', $empresaId),
                ],
                'activo' => ['boolean'],
            ]);

            // Agregar empresa_id automáticamente
            $validated['empresa_id'] = $empresaId;
            $unidad = UnidadMedida::create($validated);

            return response()->json([
                'data' => $unidad,
                'message' => 'Unidad de medida creada correctamente',
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
     * PUT /api/app/unidades-medida/{id}
     * Actualizar unidad
     */
    public function updateApi(Request $request, int $id): JsonResponse
    {
        try {
            $unidad = UnidadMedida::findOrFail($id);
            $empresaId = auth()->user()?->empresa_id;

            $validated = $request->validate([
                'nombre' => ['required', 'string', 'max:255'],
                'codigo' => [
                    'required',
                    'string',
                    'max:10',
                    // ✅ Unique por empresa, excluyendo el registro actual
                    Rule::unique('unidades_medida', 'codigo')
                        ->where('empresa_id', $empresaId)
                        ->ignore($id),
                ],
                'activo' => ['boolean'],
            ]);

            $unidad->update($validated);

            return response()->json([
                'data' => $unidad,
                'message' => 'Unidad de medida actualizada correctamente',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validación fallida',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Unidad de medida no encontrada',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/app/unidades-medida/{id}
     * Eliminar unidad
     */
    public function destroyApi(int $id): JsonResponse
    {
        try {
            $unidad = UnidadMedida::findOrFail($id);
            $unidad->delete();

            return response()->json([
                'message' => 'Unidad de medida eliminada correctamente',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Unidad de medida no encontrada',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
