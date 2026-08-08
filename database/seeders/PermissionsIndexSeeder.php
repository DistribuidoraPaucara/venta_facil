<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionsIndexSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🔐 Creando permiso permissions.index...');

        // Crear el permiso
        $permission = Permission::firstOrCreate(
            ['name' => 'permissions.index'],
            ['guard_name' => 'web']
        );

        $this->command->info('✓ Permiso permissions.index creado');

        // Asignar a admin y Super Admin
        $admin = Role::where('name', 'admin')->first();
        $superAdmin = Role::where('name', 'Super Admin')->first();

        if ($admin) {
            $admin->givePermissionTo('permissions.index');
            $this->command->info('✓ Permiso asignado a admin');
        }

        if ($superAdmin) {
            $superAdmin->givePermissionTo('permissions.index');
            $this->command->info('✓ Permiso asignado a Super Admin');
        }

        $this->command->info('✅ Completado');
    }
}
