<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Habilita la venta desde el Almacén Principal (empresa 1) para que las ventas
 * puedan descontar stock de ese almacén.
 *
 * - Solo afecta al almacén de la empresa 1 llamado "Almacen Principal".
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('almacenes') || ! Schema::hasColumn('almacenes', 'permite_venta')) {
            return;
        }

        DB::table('almacenes')
            ->where('empresa_id', 1)
            ->where('nombre', 'Almacen Principal')
            ->update(['permite_venta' => true]);
    }

    public function down(): void
    {
        DB::table('almacenes')
            ->where('empresa_id', 1)
            ->where('nombre', 'Almacen Principal')
            ->update(['permite_venta' => false]);
    }
};
