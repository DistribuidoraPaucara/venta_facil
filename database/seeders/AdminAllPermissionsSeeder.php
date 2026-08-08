<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AdminAllPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🔐 Asignando todos los permisos al rol Admin...');

        // Obtener o crear el rol admin
        $admin = Role::firstOrCreate(
            ['name' => 'admin'],
            ['guard_name' => 'web']
        );

        // Obtener todos los permisos
        $allPermissions = Permission::all();

        // Asignar todos los permisos al admin
        $admin->syncPermissions($allPermissions);

        $this->command->info("✓ {$allPermissions->count()} permisos asignados al admin");
        $this->command->info('✅ Completado exitosamente');
    }
}
