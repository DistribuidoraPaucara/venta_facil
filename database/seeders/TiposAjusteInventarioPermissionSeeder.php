<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class TiposAjusteInventarioPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🔐 Creando permiso inventario.tipos-ajuste.manage...');

        // Crear el permiso
        $permission = Permission::firstOrCreate(
            ['name' => 'inventario.tipos-ajuste.manage'],
            ['guard_name' => 'web']
        );

        $this->command->info('✓ Permiso inventario.tipos-ajuste.manage creado');

        // Asignar a admin y Super Admin
        $admin = Role::where('name', 'admin')->first();
        $superAdmin = Role::where('name', 'Super Admin')->first();

        if ($admin) {
            $admin->givePermissionTo('inventario.tipos-ajuste.manage');
            $this->command->info('✓ Permiso asignado a admin');
        }

        if ($superAdmin) {
            $superAdmin->givePermissionTo('inventario.tipos-ajuste.manage');
            $this->command->info('✓ Permiso asignado a Super Admin');
        }

        $this->command->info('✅ Completado');
    }
}
