<?php

namespace App\Http\Controllers;

use App\Http\Traits\CatalogoColorTrait;
use App\Models\EstadoMerma;
use App\Models\MovimientoInventario;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * EstadoMermaController - CRUD de Estados de Merma
 *
 * Los estados del sistema (PENDIENTE, APROBADO, RECHAZADO) se usan en el flujo de
 * aprobación de mermas: se pueden editar (nombre, color), pero no cambiar su clave ni eliminarlos.
 */
class EstadoMermaController extends Controller
{
    use CatalogoColorTrait;

    private const ESTADOS_SISTEMA = ['PENDIENTE', 'APROBADO', 'RECHAZADO'];

    public function index(Request $request): Response
    {
        $q = trim((string) $request->string('q'));
        $items = EstadoMerma::query()
            ->when($q, function ($qq) use ($q) {
                $searchLower = strtolower($q);
                $qq->where(function ($w) use ($searchLower) {
                    $w->whereRaw('LOWER(clave) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(label) like ?', ["%$searchLower%"]);
                });
            })
            ->orderBy('id', 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('inventario/estados-merma/index', [
            'estadosMerma' => $items,
            'filters'      => ['q' => $q],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('inventario/estados-merma/form', [
            'estadoMerma' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate($this->rules());
        $data['clave']  = strtoupper($data['clave']);
        $data['activo'] = $data['activo'] ?? true;

        EstadoMerma::create($this->conClasesColor($data));

        return redirect()->route('inventario.estados-merma.index')->with('success', 'Estado de merma creado');
    }

    public function edit(EstadoMerma $estadoMerma): Response
    {
        return Inertia::render('inventario/estados-merma/form', [
            'estadoMerma' => $estadoMerma,
        ]);
    }

    public function update(Request $request, EstadoMerma $estadoMerma): RedirectResponse
    {
        $data = $request->validate($this->rules($estadoMerma));
        $data['clave'] = strtoupper($data['clave']);

        if ($data['clave'] !== $estadoMerma->clave && $this->esDelSistema($estadoMerma)) {
            return back()->with('error', "\"{$estadoMerma->label}\" es un estado del sistema: no se puede cambiar su clave.");
        }

        if ($this->esDelSistema($estadoMerma) && ! ($data['activo'] ?? true)) {
            return back()->with('error', "\"{$estadoMerma->label}\" es un estado del sistema y no puede desactivarse.");
        }

        $estadoMerma->update($this->conClasesColor($data));

        return redirect()->route('inventario.estados-merma.index')->with('success', 'Estado de merma actualizado');
    }

    public function destroy(EstadoMerma $estadoMerma): RedirectResponse
    {
        if ($this->esDelSistema($estadoMerma)) {
            return back()->with('error', "\"{$estadoMerma->label}\" es un estado del sistema y no puede ser eliminado.");
        }

        if (MovimientoInventario::where('estado_merma_id', $estadoMerma->id)->exists()) {
            return back()->with('error', "\"{$estadoMerma->label}\" está asignado a mermas registradas y no puede ser eliminado. Puedes desactivarlo.");
        }

        $estadoMerma->delete();

        return redirect()->route('inventario.estados-merma.index')->with('success', 'Estado de merma eliminado');
    }

    private function rules(?EstadoMerma $estadoMerma = null): array
    {
        return [
            'clave'       => ['required', 'string', 'max:50', 'regex:/^[A-Za-z0-9_]+$/', Rule::unique('estado_mermas', 'clave')->ignore($estadoMerma?->id)],
            'label'       => ['required', 'string', 'max:100'],
            'color'       => ['nullable', Rule::in($this->coloresPermitidos())],
            'activo'      => ['boolean'],
        ];
    }

    private function esDelSistema(EstadoMerma $estadoMerma): bool
    {
        return in_array($estadoMerma->clave, self::ESTADOS_SISTEMA, true);
    }
}
