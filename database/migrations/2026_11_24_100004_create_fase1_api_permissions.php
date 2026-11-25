<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Fase 1 de seguridad de la API: crea los permisos que usan las rutas de API
 * si todavía no existen.
 *
 * Criterio sin pérdida de acceso: un permiso NUEVO se asigna a todos los roles
 * existentes, porque antes cualquier usuario autenticado podía usar esa ruta.
 * Después, cada rol se puede ajustar desde la matriz de permisos.
 */
return new class extends Migration
{
    private const PERMISOS = [
        'inventario.fraccionamientos.manage' => 'Gestionar fraccionamientos de productos (API)',
    ];

    public function up(): void
    {
        foreach (self::PERMISOS as $nombre => $descripcion) {
            if (Permission::where('name', $nombre)->where('guard_name', 'web')->exists()) {
                continue;
            }

            $permiso = Permission::create(['name' => $nombre, 'guard_name' => 'web']);

            Role::where('guard_name', 'web')->get()->each(
                fn (Role $rol) => $rol->givePermissionTo($permiso)
            );
        }
    }

    public function down(): void
    {
        Permission::whereIn('name', array_keys(self::PERMISOS))
            ->where('guard_name', 'web')
            ->delete();
    }
};
