<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class ReposicionPermisosSeeder extends Seeder
{
    public function run(): void
    {
        $permisos = [
            'inventario.reposiciones.index',
            'inventario.reposiciones.create',
            'inventario.reposiciones.show',
            'inventario.reposiciones.edit',
            'inventario.reposiciones.delete',
            'inventario.reposiciones.enviar',
            'inventario.reposiciones.recibir',
        ];

        foreach ($permisos as $permiso) {
            Permission::firstOrCreate(['name' => $permiso]);
        }
    }
}
