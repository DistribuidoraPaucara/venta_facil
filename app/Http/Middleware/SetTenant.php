<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * SetTenant Middleware
 *
 * Establece el tenant (empresa) actual basado en el usuario autenticado.
 * Esto permite aislar datos por empresa automáticamente en toda la aplicación.
 */
class SetTenant
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Obtener el usuario autenticado
        $user = auth()->user();

        // Si hay usuario autenticado y tiene empresa_id
        if ($user && $user->empresa_id) {
            // Guardar el tenant (empresa_id) en el contenedor de la app
            app()->instance('tenant_id', $user->empresa_id);
            \Illuminate\Support\Facades\Log::debug('✅ [SetTenant] Tenant establecido', [
                'usuario_id' => $user->id,
                'empresa_id' => $user->empresa_id,
            ]);
        }

        return $next($request);
    }
}
