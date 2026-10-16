<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Agrega "Editor de Productos" al menú Inventario, junto a "Actualizar Stock Masivo".
 */
return new class extends Migration
{
    private const RUTA = '/inventario/editor-productos';

    public function up(): void
    {
        $inventario = DB::table('modulos_sidebar')
            ->where('titulo', 'Inventario')
            ->where('es_submenu', false)
            ->first();

        if (! $inventario || DB::table('modulos_sidebar')->where('ruta', self::RUTA)->exists()) {
            return;
        }

        DB::table('modulos_sidebar')->insert([
            'titulo'            => 'Editor de Productos',
            'ruta'              => self::RUTA,
            'icono'             => 'Table',
            'descripcion'       => 'Editar datos, precios, límites y stock de los productos en una tabla',
            'orden'             => 8,
            'activo'            => true,
            'es_submenu'        => true,
            'modulo_padre_id'   => $inventario->id,
            'categoria'         => $inventario->categoria,
            'visible_dashboard' => false,
            'permisos'          => json_encode(['inventario.ajuste.form']),
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('modulos_sidebar')->where('ruta', self::RUTA)->delete();
    }
};
