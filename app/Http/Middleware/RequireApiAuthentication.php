<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Exige autenticación (sesión web o token Sanctum) en TODAS las rutas de la API,
 * salvo las que están en la lista pública. Así una ruta nueva nunca queda abierta
 * por olvido.
 *
 * Las rutas que requieren un permiso específico se protegen además con
 * middleware `permission:...` en su definición.
 */
class RequireApiAuthentication
{
    /**
     * Rutas de API que deben ser accesibles sin sesión.
     * - login/register: necesarios para obtener el token.
     * - banners y notificaciones públicas: contenido para pantallas previas al login.
     * - imprimir / descargar-imagen de proformas: enlaces compartidos con el cliente.
     */
    private const RUTAS_PUBLICAS = [
        'api/login',
        'api/register',
        'api/banners-publicitarios',
        'api/notificaciones/public/list',
        'api/proformas/*/imprimir',
        'api/proformas/*/descargar-imagen',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is(self::RUTAS_PUBLICAS)) {
            return $next($request);
        }

        foreach (['sanctum', 'web'] as $guard) {
            if (Auth::guard($guard)->check()) {
                // Deja el guard resuelto como predeterminado para que Spatie
                // (permission:...) y $request->user() usen el usuario autenticado.
                Auth::shouldUse($guard);

                return $next($request);
            }
        }

        return response()->json([
            'message' => 'No autenticado.',
        ], 401);
    }
}
