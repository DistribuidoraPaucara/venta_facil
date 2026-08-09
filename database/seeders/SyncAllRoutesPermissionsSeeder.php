<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

class SyncAllRoutesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🔍 Sincronizando permisos de rutas...');

        // Desactivar logs temporalmente para mejor rendimiento
        DB::disableQueryLog();

        $permisosEncontrados = [];
        $contador = 0;

        // Obtener todas las rutas
        $routes = Route::getRoutes();
        $total = count($routes);

        foreach ($routes as $i => $route) {
            // Mostrar progreso cada 50 rutas
            if ($i % 50 === 0) {
                $this->command->line("  Procesando rutas... $i/$total");
            }

            $middleware = $route->middleware();

            // Buscar middleware 'permission:' en cada ruta
            foreach ($middleware as $m) {
                if (is_string($m) && strpos($m, 'permission:') === 0) {
                    $permiso = str_replace('permission:', '', $m);
                    $permisos = array_map('trim', explode(',', $permiso));

                    foreach ($permisos as $p) {
                        $permisosEncontrados[$p] = true;
                    }
                }
            }
        }

        $this->command->info("✓ Se encontraron " . count($permisosEncontrados) . " permisos únicos\n");

        // Crear permisos faltantes en batch para mejor rendimiento
        $permisosExistentes = Permission::pluck('name')->toArray();
        $permisosNuevos = array_diff(array_keys($permisosEncontrados), $permisosExistentes);

        if (!empty($permisosNuevos)) {
            foreach ($permisosNuevos as $permiso) {
                try {
                    Permission::create([
                        'name' => $permiso,
                        'guard_name' => 'web'
                    ]);
                    $this->command->line("  ✓ Creado: $permiso");
                    $contador++;
                } catch (\Spatie\Permission\Exceptions\PermissionAlreadyExists $e) {
                    // Ignorar si ya existe
                }
            }
        }

        // Asignar todos a admin
        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->syncPermissions(Permission::all());
            $this->command->info('✓ Todos los permisos asignados a admin');
        }

        DB::enableQueryLog();
        $this->command->info("✅ Se crearon $contador permisos nuevos");
    }
}
