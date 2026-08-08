<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class CreateMissingPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('📝 Creando permisos faltantes...');

        // Permisos que faltan
        $permisosFaltantes = [
            'cajas.gastos',
            'entregas.asignar',
            'entregas.tracking',
            'inventario.vencidos',
            'prestamos.alertas',
            'prestamos.prestables',
            'proformas.aprobar',
            'reportes.ganancias.index',
            'reportes.inventario.vencimientos',
        ];

        $creados = 0;
        foreach ($permisosFaltantes as $permiso) {
            if (!Permission::where('name', $permiso)->exists()) {
                Permission::create([
                    'name' => $permiso,
                    'guard_name' => 'web'
                ]);
                $this->command->line("  ✓ Creado: $permiso");
                $creados++;
            } else {
                $this->command->line("  ⊘ Ya existe: $permiso");
            }
        }

        $this->command->info("");
        $this->command->info("✅ Se crearon $creados permisos nuevos");
    }
}
