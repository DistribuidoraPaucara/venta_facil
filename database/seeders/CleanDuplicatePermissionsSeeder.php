<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

class CleanDuplicatePermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🧹 Limpiando permisos duplicados...');

        // Obtener el máximo ID actual
        $maxId = DB::table('permissions')->max('id') ?? 0;

        // Truncar la tabla de permisos (limpiar todo)
        DB::statement('TRUNCATE TABLE permissions CASCADE');

        $this->command->info('✓ Tabla de permisos limpiada');

        // Resetear la secuencia de PostgreSQL
        DB::statement("SELECT setval('permissions_id_seq', 1)");

        $this->command->info('✓ Secuencia reseteada a 1');

        // Limpiar también la relación permissions_roles
        DB::statement('TRUNCATE TABLE role_has_permissions CASCADE');
        $this->command->info('✓ Tabla role_has_permissions limpiada');
    }
}
