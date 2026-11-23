<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Asigna la empresa_id = 1 a los registros existentes que no tengan empresa.
 *
 * - Solo actualiza filas con empresa_id NULL (no toca datos que ya tengan empresa).
 * - compras no tenía empresa_id: se agrega la columna (nullable, FK a empresas) y se asigna.
 * - precios_producto no tiene empresa_id: sus filas cuelgan de productos (ya asignados).
 */
return new class extends Migration
{
    private const EMPRESA_ID = 1;

    private const TABLAS = [
        'productos',
        'clientes',
        'almacenes',
        'ventas',
        'categorias',
        'marcas',
        'unidades_medida',
    ];

    public function up(): void
    {
        if (! DB::table('empresas')->where('id', self::EMPRESA_ID)->exists()) {
            throw new RuntimeException('La empresa id=' . self::EMPRESA_ID . ' no existe; no se asigna nada.');
        }

        if (! Schema::hasColumn('compras', 'empresa_id')) {
            Schema::table('compras', function (Blueprint $table) {
                $table->foreignId('empresa_id')->nullable()->after('id')->constrained('empresas')->nullOnDelete();
            });
        }

        foreach (array_merge(self::TABLAS, ['compras']) as $tabla) {
            if (! Schema::hasTable($tabla) || ! Schema::hasColumn($tabla, 'empresa_id')) {
                continue;
            }

            DB::table($tabla)->whereNull('empresa_id')->update(['empresa_id' => self::EMPRESA_ID]);
        }
    }

    public function down(): void
    {
        // No se revierte: no se puede saber qué filas tenían empresa NULL antes de la migración.
    }
};
