<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AdminConfigPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🔐 Asignando permisos de configuración al admin...');

        // Crear el permiso si no existe
        Permission::firstOrCreate(
            ['name' => 'admin.config'],
            ['guard_name' => 'web']
        );

        // Obtener los roles que necesitan este permiso
        $admin = Role::where('name', 'admin')->first();
        $superAdmin = Role::where('name', 'Super Admin')->first();

        // Asignar el permiso a admin
        if ($admin) {
            $admin->givePermissionTo('admin.config');
            $this->command->info('✓ Permiso admin.config asignado a admin');
        }

        // Asignar el permiso a Super Admin
        if ($superAdmin) {
            $superAdmin->givePermissionTo('admin.config');
            $this->command->info('✓ Permiso admin.config asignado a Super Admin');
        }

        $this->command->info('✅ Completado exitosamente');
    }
}
