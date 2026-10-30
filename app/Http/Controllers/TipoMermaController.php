<?php

namespace App\Http\Controllers;

use App\Http\Traits\CatalogoColorTrait;
use App\Models\MermaInventario;
use App\Models\TipoMerma;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * TipoMermaController - CRUD de Tipos de Merma
 *
 * La clave se guarda como texto en mermas_inventario.tipo_merma,
 * por eso no se puede cambiar ni eliminar un tipo que ya tiene mermas registradas.
 */
class TipoMermaController extends Controller
{
    use CatalogoColorTrait;

    public function index(Request $request): Response
    {
        $q = trim((string) $request->string('q'));
        $items = TipoMerma::query()
            ->when($q, function ($qq) use ($q) {
                $searchLower = strtolower($q);
                $qq->where(function ($w) use ($searchLower) {
                    $w->whereRaw('LOWER(clave) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(label) like ?', ["%$searchLower%"])
                        ->orWhereRaw('LOWER(descripcion) like ?', ["%$searchLower%"]);
                });
            })
            ->orderBy('label', 'asc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('inventario/tipos-merma/index', [
            'tiposMerma' => $items,
            'filters'    => ['q' => $q],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('inventario/tipos-merma/form', [
            'tipoMerma' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate($this->rules());
        $data['clave']               = strtoupper($data['clave']);
        $data['activo']              = $data['activo'] ?? true;
        $data['requiere_aprobacion'] = $data['requiere_aprobacion'] ?? false;

        TipoMerma::create($this->conClasesColor($data));

        return redirect()->route('inventario.tipos-merma.index')->with('success', 'Tipo de merma creado');
    }

    public function edit(TipoMerma $tipoMerma): Response
    {
        return Inertia::render('inventario/tipos-merma/form', [
            'tipoMerma' => $tipoMerma,
        ]);
    }

    public function update(Request $request, TipoMerma $tipoMerma): RedirectResponse
    {
        $data = $request->validate($this->rules($tipoMerma));
        $data['clave'] = strtoupper($data['clave']);

        if ($data['clave'] !== $tipoMerma->clave && $this->estaEnUso($tipoMerma)) {
            return back()->with('error', "No se puede cambiar la clave de \"{$tipoMerma->label}\" porque ya tiene mermas registradas.");
        }

        $tipoMerma->update($this->conClasesColor($data));

        return redirect()->route('inventario.tipos-merma.index')->with('success', 'Tipo de merma actualizado');
    }

    public function destroy(TipoMerma $tipoMerma): RedirectResponse
    {
        if ($this->estaEnUso($tipoMerma)) {
            return back()->with('error', "\"{$tipoMerma->label}\" ya tiene mermas registradas y no puede ser eliminado. Puedes desactivarlo.");
        }

        $tipoMerma->delete();

        return redirect()->route('inventario.tipos-merma.index')->with('success', 'Tipo de merma eliminado');
    }

    private function rules(?TipoMerma $tipoMerma = null): array
    {
        return [
            'clave'               => ['required', 'string', 'max:50', 'regex:/^[A-Za-z0-9_]+$/', Rule::unique('tipo_mermas', 'clave')->ignore($tipoMerma?->id)],
            'label'               => ['required', 'string', 'max:100'],
            'descripcion'         => ['nullable', 'string', 'max:255'],
            'color'               => ['nullable', Rule::in($this->coloresPermitidos())],
            'requiere_aprobacion' => ['boolean'],
            'activo'              => ['boolean'],
        ];
    }

    private function estaEnUso(TipoMerma $tipoMerma): bool
    {
        return MermaInventario::where('tipo_merma', $tipoMerma->clave)->exists();
    }
}
