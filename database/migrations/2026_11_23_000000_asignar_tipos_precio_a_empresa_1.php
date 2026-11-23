<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Asigna los tipos de precio sin empresa (COSTO, VENTA, etc.) a la empresa id=1.
 *
 * - Solo actualiza filas con empresa_id NULL; no toca las que ya tengan empresa.
 * - No modifica precios_producto ni almacen_id.
 */
return new class extends Migration
{
    private const EMPRESA_ID = 1;

    public function up(): void
    {
        if (! Schema::hasTable('tipos_precio') || ! Schema::hasColumn('tipos_precio', 'empresa_id')) {
            return;
        }

        if (! DB::table('empresas')->where('id', self::EMPRESA_ID)->exists()) {
            throw new RuntimeException('La empresa id=' . self::EMPRESA_ID . ' no existe; no se asigna nada.');
        }

        DB::table('tipos_precio')
            ->whereNull('empresa_id')
            ->update(['empresa_id' => self::EMPRESA_ID]);
    }

    public function down(): void
    {
        // No se revierte: no se puede saber qué filas tenían empresa NULL antes de la migración.
    }
};
