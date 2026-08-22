<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cambiar columnas de stock_productos de integer a decimal
     * para soportar conversiones con decimales
     */
    public function up(): void
    {
        Schema::table('stock_productos', function (Blueprint $table) {
            // Cambiar de integer a decimal(12,4) para soportar decimales
            $table->decimal('cantidad', 12, 4)->default(0)->change();
            $table->decimal('cantidad_reservada', 12, 4)->default(0)->change();
            $table->decimal('cantidad_disponible', 12, 4)->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('stock_productos', function (Blueprint $table) {
            // Revertir a integer
            $table->integer('cantidad')->default(0)->change();
            $table->integer('cantidad_reservada')->default(0)->change();
            $table->integer('cantidad_disponible')->default(0)->change();
        });
    }
};
