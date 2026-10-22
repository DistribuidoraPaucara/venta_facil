<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Permiso propio para el Editor de Productos: `inventario.editor-productos`.
 *
 * La ruta pedía DOS permisos (inventario.ajuste.form Y productos.edit), pero el menú
 * (modulos_sidebar) muestra una opción si el usuario tiene CUALQUIERA de sus permisos.
 * Resultado: roles con solo uno de los dos (cajero, admin) veían la opción y recibían 403.
 * Con un único permiso, menú y ruta coinciden.
 *
 * Se asigna a los roles que hoy tienen ambos permisos, así nadie gana ni pierde acceso.
 */
return new class extends Migration
{
    private const PERMISO = 'inventario.editor-productos';
    private const RUTA    = '/inventario/editor-productos';

    public function up(): void
    {
        $permiso = Permission::firstOrCreate(['name' => self::PERMISO, 'guard_name' => 'web']);

        Role::with('permissions:id,name')->get()
            ->filter(fn($rol) => $rol->hasPermissionTo('inventario.ajuste.form') && $rol->hasPermissionTo('productos.edit'))
            ->each(fn($rol) => $rol->givePermissionTo($permiso));

        DB::table('modulos_sidebar')
            ->where('ruta', self::RUTA)
            ->update(['permisos' => json_encode([self::PERMISO]), 'updated_at' => now()]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        DB::table('modulos_sidebar')
            ->where('ruta', self::RUTA)
            ->update(['permisos' => json_encode(['inventario.ajuste.form']), 'updated_at' => now()]);

        Permission::where('name', self::PERMISO)->where('guard_name', 'web')->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
