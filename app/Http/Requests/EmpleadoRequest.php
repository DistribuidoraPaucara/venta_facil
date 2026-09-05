<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class EmpleadoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $empresaId = Auth::user()?->empresa_id;

        $rules = [
            'nombre'                => 'required|string|max:255',
            'ci'                    => 'nullable|string|max:20',
            'telefono'              => 'nullable|string|max:20',
            'direccion'             => 'nullable|string|max:255',
            'fecha_ingreso'         => 'required|date',
            'estado'                => 'nullable|in:Activo,Inactivo,Suspendido,Vacaciones,activo,inactivo,vacaciones,licencia',
            'crear_usuario'         => 'boolean',
            'puede_acceder_sistema' => 'boolean',
            'rol'                   => 'nullable|string',
            'usernick'              => ['nullable', 'string', 'max:100', Rule::unique('users')->where('empresa_id', $empresaId)],
            'email'                 => ['nullable', 'email', 'max:255', Rule::unique('users')->where('empresa_id', $empresaId)],
            'password'              => 'nullable|string|min:8|confirmed',
        ];

        // Verificar si estamos editando un empleado o creando uno nuevo
        if ($this->route('empleado')) {
            // Edición de empleado
            $rules['codigo_empleado'] = [
                'nullable',
                'string',
                'max:20',
                Rule::unique('empleados')->ignore($this->route('empleado')->id)->where('empresa_id', $empresaId),
            ];

            // Si estamos editando, permitir actualizar email y usernick del usuario relacionado
            if ($this->route('empleado')->user_id) {
                $rules['email'] = [
                    'nullable',
                    'email',
                    'max:255',
                    Rule::unique('users')->ignore($this->route('empleado')->user_id)->where('empresa_id', $empresaId),
                ];

                $rules['usernick'] = [
                    'nullable',
                    'string',
                    'max:100',
                    Rule::unique('users')->ignore($this->route('empleado')->user_id)->where('empresa_id', $empresaId),
                ];
            }
        } else {
            // Creación de empleado
            $rules['codigo_empleado'] = ['nullable', 'string', 'max:20', Rule::unique('empleados')->where('empresa_id', $empresaId)];
        }

        return $rules;
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'nombre.required'     => 'El nombre es obligatorio.',
            'ci.required'         => 'El número de documento de identidad es obligatorio.',
            'ci.string'           => 'El número de documento de identidad debe ser texto.',
            'telefono.required'   => 'El número de teléfono es obligatorio.',
            'estado.in'           => 'El estado del empleado no es válido.',
            'email.required_if'   => 'El email es obligatorio cuando se crea un usuario.',
            'email.unique'        => 'Este email ya está en uso por otro usuario.',
            'usernick.unique'     => 'Este nombre de usuario ya está en uso.',
            'password.min'        => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed'  => 'La confirmación de contraseña no coincide.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Ya no hay lógica de preparación necesaria
    }
}
