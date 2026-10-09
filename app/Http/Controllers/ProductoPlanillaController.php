<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Services\Producto\ProductoPlanillaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Carga y descarga masiva de productos mediante planilla Excel.
 *
 * Por defecto trabaja sobre la empresa del usuario. Quien tenga el permiso "empresas.manage"
 * puede elegir otra empresa (p. ej. para migrar los productos de una empresa nueva).
 */
class ProductoPlanillaController extends Controller
{
    private const PERMISO_OTRAS_EMPRESAS = 'empresas.manage';
    private const PERMISO_STOCK          = 'inventario.ajuste.procesar';

    public function __construct(private ProductoPlanillaService $planillaService)
    {
    }

    public function index(Request $request): Response
    {
        $puedeElegir = $this->puedeElegirEmpresa($request);

        return Inertia::render('productos/importar-exportar', [
            'columnas'         => ProductoPlanillaService::COLUMNAS,
            'maxFilas'         => ProductoPlanillaService::MAX_FILAS,
            'puedeElegirEmpresa' => $puedeElegir,
            'puedeImportarStock' => (bool) $request->user()->can(self::PERMISO_STOCK),
            'empresaUsuarioId' => $request->user()->empresa_id,
            'empresas'         => Empresa::query()
                ->when(! $puedeElegir, fn($q) => $q->where('id', $request->user()->empresa_id))
                ->orderByDesc('activo')
                ->orderBy('nombre_comercial')
                ->get(['id', 'nombre_comercial', 'razon_social', 'activo'])
                ->map(fn(Empresa $e) => [
                    'id'        => $e->id,
                    'nombre'    => $e->nombre_comercial ?: $e->razon_social,
                    'activo'    => (bool) $e->activo,
                    'productos' => \App\Models\Producto::withoutGlobalScope('empresa')->where('empresa_id', $e->id)->count(),
                ]),
        ]);
    }

    /**
     * GET productos/importar-exportar/descargar?empresa_id=X&inactivos=1
     */
    public function descargar(Request $request): StreamedResponse
    {
        $empresa = $this->resolverEmpresa($request);

        return $this->planillaService->paraEmpresa($empresa)->descargar($request->boolean('inactivos'));
    }

    /**
     * POST productos/importar-exportar/validar — revisa la planilla sin guardar nada.
     */
    public function validar(Request $request): JsonResponse
    {
        $archivo = $this->validarArchivo($request);
        $empresa = $this->resolverEmpresa($request);

        try {
            $resultado = $this->planillaService->paraEmpresa($empresa)->validar($archivo, $this->incluirStock($request));
        } catch (\Throwable $e) {
            return $this->errorLectura($e);
        }

        return response()->json($this->respuesta($resultado, $empresa));
    }

    /**
     * POST productos/importar-exportar/importar — valida y guarda (todo o nada).
     */
    public function importar(Request $request): JsonResponse
    {
        $archivo = $this->validarArchivo($request);
        $empresa = $this->resolverEmpresa($request);

        try {
            $resultado = $this->planillaService->paraEmpresa($empresa)->importar($archivo, $this->incluirStock($request));
        } catch (\Throwable $e) {
            return $this->errorLectura($e);
        }

        if ($resultado['importado']) {
            Log::info('📦 [ProductoPlanilla] Importación de productos', [
                'user_id'            => auth()->id(),
                'empresa_usuario_id' => auth()->user()?->empresa_id,
                'empresa_destino_id' => $empresa->id,
                'archivo'            => $archivo->getClientOriginalName(),
                'resumen'            => $resultado['resumen'],
                'nuevos'             => $resultado['nuevos'],
                'stock'              => $resultado['stock']['resumen'] ?? null,
                'catalogos'          => $resultado['catalogos']['resumen'] ?? null,
                'documento'          => $resultado['documento'] ?? null,
            ]);
        }

        return response()->json(
            $this->respuesta($resultado, $empresa) + ['importado' => $resultado['importado']],
            $resultado['importado'] ? 200 : 422
        );
    }

    /**
     * Importar stock mueve inventario: requiere además el permiso de ajustes de inventario.
     */
    private function incluirStock(Request $request): bool
    {
        if (! $request->boolean('incluir_stock')) {
            return false;
        }
        if (! $request->user()->can(self::PERMISO_STOCK)) {
            abort(403, 'No tienes permiso para ajustar inventario.');
        }

        return true;
    }

    private function puedeElegirEmpresa(Request $request): bool
    {
        return (bool) $request->user()?->can(self::PERMISO_OTRAS_EMPRESAS);
    }

    /**
     * Empresa destino: la del usuario, u otra si tiene permiso para elegirla.
     */
    private function resolverEmpresa(Request $request): Empresa
    {
        $propia    = (int) $request->user()->empresa_id;
        $empresaId = (int) ($request->input('empresa_id') ?: $propia);

        if ($empresaId !== $propia && ! $this->puedeElegirEmpresa($request)) {
            abort(403, 'No tienes permiso para gestionar productos de otra empresa.');
        }

        return Empresa::findOrFail($empresaId);
    }

    private function validarArchivo(Request $request): UploadedFile
    {
        $request->validate([
            'archivo'       => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:5120'],
            'empresa_id'    => ['nullable', 'integer', 'exists:empresas,id'],
            'incluir_stock' => ['nullable', 'boolean'],
        ], [
            'archivo.mimes' => 'El archivo debe ser Excel (.xlsx, .xls) o CSV.',
            'archivo.max'   => 'El archivo no puede pesar más de 5 MB.',
        ]);

        return $request->file('archivo');
    }

    /**
     * Se envían todas las filas (máx. MAX_FILAS) con solo los campos que muestra la vista previa;
     * la paginación y el filtrado se hacen en el navegador.
     */
    private function respuesta(array $resultado, Empresa $empresa): array
    {
        return [
            'empresa' => ['id' => $empresa->id, 'nombre' => $empresa->nombre_comercial ?: $empresa->razon_social],
            'resumen' => $resultado['resumen'],
            'nuevos'  => $resultado['nuevos'],
            'stock'   => $resultado['stock'] ? [
                'resumen' => $resultado['stock']['resumen'],
                'muestra' => $resultado['stock']['filas'],
            ] : null,
            'documento' => $resultado['documento'] ?? null,
            'catalogos' => isset($resultado['catalogos']) ? [
                'resumen' => $resultado['catalogos']['resumen'],
                'nuevos'  => $resultado['catalogos']['nuevos'],
                // Solo los cambios de registros existentes (los nuevos ya van en "nuevos")
                'actualizados' => array_values(array_map(
                    fn($c) => ['tipo' => $c['tipo'], 'id' => $c['id'], 'fila' => $c['fila'], 'campos' => array_keys($c['datos'])],
                    array_filter($resultado['catalogos']['cambios'], fn($c) => $c['accion'] === 'actualizar')
                )),
                'compartidosEditables' => app(\App\Services\Producto\PlanillaCatalogosService::class)->compartidosEditables(),
            ] : null,
            'errores' => $resultado['errores'],
            'muestra' => array_map(fn($f) => [
                'fila'         => $f['fila'],
                'accion'       => $f['accion'],
                'sku'          => $f['sku'],
                'nombre'       => $f['nombre'],
                'categoria'    => $f['categoria'],
                'marca'        => $f['marca'],
                'precio_costo' => $f['precio_costo'],
                'precio_venta' => $f['precio_venta'],
            ], $resultado['filas']),
        ];
    }

    private function errorLectura(\Throwable $e): JsonResponse
    {
        Log::error('❌ [ProductoPlanilla] Error procesando planilla', [
            'user_id' => auth()->id(),
            'error'   => $e->getMessage(),
        ]);

        return response()->json([
            'message' => 'No se pudo procesar el archivo: ' . $e->getMessage(),
        ], 422);
    }
}
