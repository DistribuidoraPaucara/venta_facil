<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingsEmpresaController extends Controller
{
    /**
     * Mostrar formulario de edición de empresa
     */
    public function edit()
    {
        $user = Auth::user();
        $empresa = $user->empresa;

        // Verificar que el usuario tiene empresa asignada
        if (!$empresa) {
            return redirect('/settings/profile')
                ->with('error', 'No tienes una empresa asignada.');
        }

        // Verificar permisos: solo admin o manager (sin verificar permiso específico)
        if (!$user->hasAnyRole(['admin', 'manager', 'Admin', 'Manager'])) {
            return redirect('/settings/profile')
                ->with('error', 'No tienes permisos para editar la empresa. Solo administradores y managers pueden acceder.');
        }

        return Inertia::render('settings/empresa', [
            'empresa' => [
                'id' => $empresa->id,
                'nombre_comercial' => $empresa->nombre_comercial,
                'razon_social' => $empresa->razon_social,
                'nit' => $empresa->nit,
                'telefono' => $empresa->telefono,
                'email' => $empresa->email,
                'sitio_web' => $empresa->sitio_web,
                'direccion' => $empresa->direccion,
                'ciudad' => $empresa->ciudad,
                'pais' => $empresa->pais,
                'logo_principal' => $empresa->logo_principal,
                'mensaje_footer' => $empresa->mensaje_footer,
                'mensaje_legal' => $empresa->mensaje_legal,
            ],
        ]);
    }

    /**
     * Actualizar información de la empresa
     */
    public function update(Request $request)
    {
        $user = Auth::user();
        $empresa = $user->empresa;

        // Verificar que el usuario tiene empresa asignada
        if (!$empresa) {
            return redirect('/settings/profile')
                ->with('error', 'No tienes una empresa asignada.');
        }

        // Verificar permisos: solo admin o manager (sin verificar permiso específico)
        if (!$user->hasAnyRole(['admin', 'manager', 'Admin', 'Manager'])) {
            return back()
                ->with('error', 'No tienes permisos para editar la empresa. Solo administradores y managers pueden realizar cambios.');
        }

        // Validar datos
        $validated = $request->validate([
            'nombre_comercial' => ['required', 'string', 'max:255'],
            'razon_social' => ['required', 'string', 'max:255'],
            'nit' => ['nullable', 'string', 'max:20'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'sitio_web' => ['nullable', 'url', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:500'],
            'ciudad' => ['nullable', 'string', 'max:100'],
            'pais' => ['nullable', 'string', 'max:100'],
            'logo_principal' => ['nullable', 'file', 'image', 'max:4096', 'mimes:jpeg,png,jpg,gif'],
            'mensaje_footer' => ['nullable', 'string', 'max:500'],
            'mensaje_legal' => ['nullable', 'string'],
        ]);

        // Procesar logo si se sube uno nuevo
        if ($request->hasFile('logo_principal')) {
            // Eliminar logo anterior si existe
            if ($empresa->logo_principal) {
                $logoAnterior = $empresa->logo_principal;
                if (strpos($logoAnterior, 'http') === 0) {
                    $path = str_replace(Storage::disk('public')->url(''), '', $logoAnterior);
                } else {
                    $path = $logoAnterior;
                }
                $path = ltrim($path, '/');
                Storage::disk('public')->delete($path);
            }

            // Guardar nuevo logo
            $file = $request->file('logo_principal');
            $storagePath = $file->store('empresas', 'public');
            $validated['logo_principal'] = '/storage/' . $storagePath;
        } else {
            // Si no se sube logo, no cambiar el actual
            unset($validated['logo_principal']);
        }

        // Actualizar empresa
        $empresa->update($validated);

        \Illuminate\Support\Facades\Log::info('📝 Empresa actualizada', [
            'empresa_id' => $empresa->id,
            'usuario_id' => $user->id,
            'campos' => array_keys($validated),
        ]);

        return back()
            ->with('success', 'Información de la empresa actualizada correctamente.');
    }
}
