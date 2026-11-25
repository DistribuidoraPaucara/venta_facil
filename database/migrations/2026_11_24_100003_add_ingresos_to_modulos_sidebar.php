<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Agrega el módulo "Ingresos" al sidebar (módulo padre + submenús) y sus permisos.
 * Espejo del módulo "Egresos". Es idempotente: si las filas o permisos ya existen, no los duplica.
 */
return new class extends Migration
{
    private const RUTA_PADRE = '/ingresos';

    private const PERMISOS = [
        'ingresos.index' => 'Ver listado de ingresos',
        'ingresos.create' => 'Registrar nuevos ingresos',
    ];

    private const ROLES_CON_ACCESO = ['Super Admin', 'admin', 'cajero'];

    public function up(): void
    {
        $padreId = $this->insertarSiNoExiste(
            [
                'titulo' => 'Ingresos',
                'ruta' => self::RUTA_PADRE,
                'es_submenu' => false,
            ],
            [
                'icono' => 'TrendingUp',
                'descripcion' => 'Gestión de ingresos de caja',
                'orden' => 12,
                'activo' => true,
                'modulo_padre_id' => null,
                'categoria' => 'Finanzas',
                'visible_dashboard' => true,
                'permisos' => json_encode(['ingresos.index']),
            ]
        );

        $submenus = [
            ['titulo' => 'Ingresos', 'ruta' => '/ingresos', 'icono' => 'List', 'orden' => 1, 'permisos' => ['ingresos.index']],
            ['titulo' => 'Nuevo Ingreso', 'ruta' => '/ingresos/create', 'icono' => 'Plus', 'orden' => 2, 'permisos' => ['ingresos.create']],
        ];

        foreach ($submenus as $item) {
            $this->insertarSiNoExiste(
                [
                    'titulo' => $item['titulo'],
                    'ruta' => $item['ruta'],
                    'es_submenu' => true,
                    'modulo_padre_id' => $padreId,
                ],
                [
                    'icono' => $item['icono'],
                    'descripcion' => null,
                    'orden' => $item['orden'],
                    'activo' => true,
                    'categoria' => 'Finanzas',
                    'visible_dashboard' => false,
                    'permisos' => json_encode($item['permisos']),
                ]
            );
        }

        // Permisos y asignación a roles (mismo criterio que el seeder)
        foreach (self::PERMISOS as $nombre => $descripcion) {
            Permission::firstOrCreate(['name' => $nombre, 'guard_name' => 'web']);
        }

        foreach (self::ROLES_CON_ACCESO as $nombreRol) {
            $rol = Role::where('name', $nombreRol)->where('guard_name', 'web')->first();
            if ($rol) {
                $rol->givePermissionTo(array_keys(self::PERMISOS));
            }
        }
    }

    public function down(): void
    {
        $padreId = DB::table('modulos_sidebar')
            ->where('ruta', self::RUTA_PADRE)
            ->where('es_submenu', false)
            ->value('id');

        if ($padreId) {
            // Los submenús se eliminan en cascada por la FK modulo_padre_id
            DB::table('modulos_sidebar')->where('id', $padreId)->delete();
        }

        Permission::whereIn('name', array_keys(self::PERMISOS))->where('guard_name', 'web')->delete();
    }

    /**
     * Inserta la fila si no existe según $claves; devuelve su id.
     */
    private function insertarSiNoExiste(array $claves, array $valores): int
    {
        $existente = DB::table('modulos_sidebar')->where($claves)->first();

        if ($existente) {
            return (int) $existente->id;
        }

        return (int) DB::table('modulos_sidebar')->insertGetId(array_merge($claves, $valores, [
            'created_at' => now(),
            'updated_at' => now(),
        ]));
    }
};
