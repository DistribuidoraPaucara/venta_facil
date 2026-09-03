<?php
namespace App\Http\Controllers;

use App\Models\TipoPrecio;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TipoPrecioController extends Controller
{
    public function index(Request $request): Response
    {
        $q      = (string) $request->string('q');
        $activo = $request->boolean('activo');

        // ✨ NUEVO: Filtrar por empresa del usuario
        $tipos = TipoPrecio::porEmpresa()
            ->when($q, function ($query) use ($q) {
                $searchLower = strtolower($q);
                $query->whereRaw('LOWER(nombre) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(codigo) like ?', ["%$searchLower%"])
                    ->orWhereRaw('LOWER(descripcion) like ?', ["%$searchLower%"]);
            })
            ->when($request->has('activo'), fn($query) => $query->where('activo', $activo))
            ->withCount('precios')
            ->ordenados()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('tipos-precio/index', [
            'tipos_precio' => $tipos,
            'filters'      => [
                'q'      => $q,
                'activo' => $request->has('activo') ? $activo : null,
            ],
        ]);
    }

    public function create(): Response
    {
        // ✨ NUEVO: Calcular el próximo orden para mostrar como hint
        $proximoOrden = TipoPrecio::porEmpresa()
            ->max('orden') ?? 0;
        $proximoOrden += 1;

        return Inertia::render('tipos-precio/form', [
            'tipo_precio'         => null,
            'colores_disponibles' => $this->getColoresDisponibles(),
            'proximo_orden'       => $proximoOrden, // Para mostrar al usuario (informativo)
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        // ✨ NUEVO: Validar código único POR EMPRESA (no globalmente)
        $empresaId = auth()->user()?->empresa_id;

        $data = $request->validate([
            'codigo'         => [
                'required',
                'string',
                'max:20',
                "unique:tipos_precio,codigo,NULL,id,empresa_id,{$empresaId}"
            ],
            'nombre'         => ['required', 'string', 'max:100'],
            'descripcion'    => ['nullable', 'string', 'max:255'],
            'color'          => ['required', 'string', 'max:20'],
            'es_ganancia'    => ['required', 'boolean'],
            'es_precio_base' => ['nullable', 'boolean'],
            'orden'          => ['nullable', 'integer', 'min:0'],
            'activo'         => ['nullable', 'boolean'],
            'configuracion'  => ['nullable', 'array'],
        ]);

        // ✨ NUEVO: Solo puede haber un precio base activo POR EMPRESA
        if ($data['es_precio_base'] ?? false) {
            TipoPrecio::porEmpresa()
                ->where('es_precio_base', true)
                ->update(['es_precio_base' => false]);
        }

        // Configuración por defecto
        $configuracion            = $data['configuracion'] ?? [];
        $configuracion['icono']   = $configuracion['icono'] ?? ($data['es_ganancia'] ? '💰' : '📦');
        $configuracion['tooltip'] = $configuracion['tooltip'] ?? $data['descripcion'];

        // ✨ NUEVO: Calcular orden automáticamente si no se proporciona
        if (!isset($data['orden']) || $data['orden'] === null) {
            $maxOrden = TipoPrecio::porEmpresa()
                ->max('orden') ?? 0;
            $data['orden'] = $maxOrden + 1;
        }

        // ✨ NUEVO: Agregar empresa_id automáticamente
        TipoPrecio::create([
            'codigo'              => strtoupper($data['codigo']),
            'nombre'              => $data['nombre'],
            'descripcion'         => $data['descripcion'],
            'color'               => $data['color'],
            'es_ganancia'         => $data['es_ganancia'],
            'es_precio_base'      => $data['es_precio_base'] ?? false,
            'porcentaje_ganancia' => isset($configuracion['porcentaje_ganancia']) ? (float) $configuracion['porcentaje_ganancia'] : null,
            'orden'               => $data['orden'],
            'activo'              => $data['activo'] ?? true,
            'es_sistema'          => false,
            'configuracion'       => $configuracion,
            'empresa_id'          => auth()->user()?->empresa_id,
        ]);

        return redirect()->route('tipos-precio.index')
            ->with('success', 'Tipo de precio creado correctamente');
    }

    public function show($id): Response
    {
        // ✨ NUEVO: Validar que pertenezca a la empresa del usuario
        $tipoPrecio = TipoPrecio::porEmpresa()->findOrFail($id);
        $tipoPrecio->loadCount(['precios', 'configuracionesGanancias']);

        $preciosRecientes = $tipoPrecio->precios()
            ->with('producto:id,nombre')
            ->latest('updated_at')
            ->limit(10)
            ->get();

        return Inertia::render('tipos-precio/show', [
            'tipo_precio'       => $tipoPrecio,
            'precios_recientes' => $preciosRecientes,
            'estadisticas'      => [
                'total_precios'         => $tipoPrecio->precios_count,
                'total_configuraciones' => $tipoPrecio->configuraciones_ganancias_count,
                'productos_con_precio'  => $tipoPrecio->precios()->distinct('producto_id')->count(),
            ],
        ]);
    }

    public function edit($id): Response
    {
        // ✨ NUEVO: Validar que pertenezca a la empresa del usuario
        $tipoPrecio = TipoPrecio::porEmpresa()->findOrFail($id);

        return Inertia::render('tipos-precio/form', [
            'tipo_precio'         => $tipoPrecio,
            'colores_disponibles' => $this->getColoresDisponibles(),
            'puede_eliminar'      => $tipoPrecio->puedeEliminarse(),
        ]);
    }

    public function update(Request $request, $id): RedirectResponse
    {
        // ✨ NUEVO: Validar que pertenezca a la empresa del usuario
        $tipoPrecio = TipoPrecio::porEmpresa()->findOrFail($id);
        $empresaId = auth()->user()?->empresa_id;

        $data = $request->validate([
            'codigo'              => [
                'required',
                'string',
                'max:20',
                "unique:tipos_precio,codigo,{$tipoPrecio->id},id,empresa_id,{$empresaId}"
            ],
            'nombre'              => ['required', 'string', 'max:100'],
            'descripcion'         => ['nullable', 'string', 'max:255'],
            'color'               => ['required', 'string', 'max:20'],
            'es_ganancia'         => ['required', 'boolean'],
            'es_precio_base'      => ['nullable', 'boolean'],
            'orden'               => ['required', 'integer', 'min:0'],
            'porcentaje_ganancia' => ['nullable', 'numeric', 'min:0'],
            'activo'              => ['nullable', 'boolean'],
            'configuracion'       => ['nullable', 'array'],
        ]);

        // No permitir editar ciertos campos en tipos de sistema
        if ($tipoPrecio->es_sistema) {
            unset($data['codigo'], $data['es_ganancia'], $data['es_precio_base']);
        }

        // ✨ NUEVO: Solo puede haber un precio base activo POR EMPRESA
        if (($data['es_precio_base'] ?? false) && ! $tipoPrecio->es_precio_base) {
            TipoPrecio::porEmpresa()
                ->where('es_precio_base', true)
                ->update(['es_precio_base' => false]);
        }

        // Actualizar configuración manteniendo valores existentes
        $configuracionActual = $tipoPrecio->configuracion ?? [];
        $configuracionNueva  = array_merge($configuracionActual, $data['configuracion'] ?? []);

        $tipoPrecio->update([
            'codigo'              => strtoupper($data['codigo'] ?? $tipoPrecio->codigo),
            'nombre'              => $data['nombre'],
            'descripcion'         => $data['descripcion'],
            'color'               => $data['color'],
            'es_ganancia'         => $data['es_ganancia'] ?? $tipoPrecio->es_ganancia,
            'es_precio_base'      => $data['es_precio_base'] ?? $tipoPrecio->es_precio_base,
            'porcentaje_ganancia' => isset($configuracionNueva['porcentaje_ganancia']) ? (float) $configuracionNueva['porcentaje_ganancia'] : $tipoPrecio->porcentaje_ganancia,
            'activo'              => $data['activo'] ?? $tipoPrecio->activo,
            'configuracion'       => $configuracionNueva,
        ]);

        return redirect()->route('tipos-precio.index')
            ->with('success', 'Tipo de precio actualizado correctamente');
    }

    public function destroy($id): RedirectResponse
    {
        // ✨ NUEVO: Validar que pertenezca a la empresa del usuario
        $tipoPrecio = TipoPrecio::porEmpresa()->findOrFail($id);

        if (! $tipoPrecio->puedeEliminarse()) {
            return redirect()->route('tipos-precio.index')
                ->with('error', 'No se puede eliminar este tipo de precio. Tiene precios asociados o es un tipo del sistema.');
        }

        $tipoPrecio->delete();

        return redirect()->route('tipos-precio.index')
            ->with('success', 'Tipo de precio eliminado correctamente');
    }

    /**
     * Activar/Desactivar un tipo de precio
     */
    public function toggleActivo($id): RedirectResponse
    {
        // ✨ NUEVO: Validar que pertenezca a la empresa del usuario
        $tipoPrecio = TipoPrecio::porEmpresa()->findOrFail($id);
        $tipoPrecio->update(['activo' => ! $tipoPrecio->activo]);

        $estado = $tipoPrecio->activo ? 'activado' : 'desactivado';

        return redirect()->route('tipos-precio.index')
            ->with('success', "Tipo de precio {$estado} correctamente");
    }

    /**
     * Obtener colores disponibles para la UI
     */
    private function getColoresDisponibles(): array
    {
        return [
            ['value' => 'blue', 'label' => 'Azul', 'class' => 'bg-blue-500'],
            ['value' => 'green', 'label' => 'Verde', 'class' => 'bg-green-500'],
            ['value' => 'purple', 'label' => 'Morado', 'class' => 'bg-purple-500'],
            ['value' => 'orange', 'label' => 'Naranja', 'class' => 'bg-orange-500'],
            ['value' => 'red', 'label' => 'Rojo', 'class' => 'bg-red-500'],
            ['value' => 'indigo', 'label' => 'Índigo', 'class' => 'bg-indigo-500'],
            ['value' => 'pink', 'label' => 'Rosa', 'class' => 'bg-pink-500'],
            ['value' => 'yellow', 'label' => 'Amarillo', 'class' => 'bg-yellow-500'],
            ['value' => 'gray', 'label' => 'Gris', 'class' => 'bg-gray-500'],
            ['value' => 'teal', 'label' => 'Verde azulado', 'class' => 'bg-teal-500'],
        ];
    }
}
