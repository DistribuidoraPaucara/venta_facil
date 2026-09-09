<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Migrar stock_minimo/maximo de sectores a stock_limites para cada producto existente
     */
    public function up(): void
    {
        // Para cada sector, crear un registro en stock_limites para cada producto que tenga stock en ese almacén
        DB::statement(<<<SQL
            INSERT INTO stock_limites (producto_id, almacen_id, sector_id, stock_minimo, stock_maximo, created_at, updated_at)
            SELECT DISTINCT
                sp.producto_id,
                sp.almacen_id,
                s.id as sector_id,
                s.stock_minimo,
                s.stock_maximo,
                NOW(),
                NOW()
            FROM stock_productos sp
            JOIN sectores s ON s.almacen_id = sp.almacen_id
            WHERE NOT EXISTS (
                SELECT 1 FROM stock_limites sl
                WHERE sl.producto_id = sp.producto_id
                AND sl.almacen_id = sp.almacen_id
                AND sl.sector_id = s.id
            )
            ON CONFLICT (producto_id, almacen_id, sector_id) DO UPDATE SET
                stock_minimo = EXCLUDED.stock_minimo,
                stock_maximo = EXCLUDED.stock_maximo,
                updated_at = NOW()
        SQL);
    }

    /**
     * Reverse the migration
     */
    public function down(): void
    {
        DB::table('stock_limites')->truncate();
    }
};
