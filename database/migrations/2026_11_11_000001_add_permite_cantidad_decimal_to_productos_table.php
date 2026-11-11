<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Productos que se venden en cantidades decimales sin conversión de unidad (ej. Bs 10 de una libra a Bs 110).
     * venta_por_lotes pasa a 4 decimales, como stock_productos: con 2, al anular se devolvía menos de lo vendido.
     */
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->boolean('permite_cantidad_decimal')
                ->default(false)
                ->comment('Permite vender cantidades decimales sin conversión de unidad');
        });

        DB::statement('ALTER TABLE venta_por_lotes ALTER COLUMN cantidad_consumida TYPE numeric(12,4)');
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn('permite_cantidad_decimal');
        });

        DB::statement('ALTER TABLE venta_por_lotes ALTER COLUMN cantidad_consumida TYPE numeric(8,2)');
    }
};
