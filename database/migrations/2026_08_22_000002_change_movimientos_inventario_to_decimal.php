<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cambiar columnas de movimientos_inventario de integer a decimal
     * para soportar conversiones con decimales
     */
    public function up(): void
    {
        Schema::table('movimientos_inventario', function (Blueprint $table) {
            // Cambiar de integer a decimal(12,4) para soportar decimales
            $table->decimal('cantidad', 12, 4)->change();
            $table->decimal('cantidad_anterior', 12, 4)->nullable()->change();
            $table->decimal('cantidad_posterior', 12, 4)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('movimientos_inventario', function (Blueprint $table) {
            // Revertir a integer
            $table->integer('cantidad')->change();
            $table->integer('cantidad_anterior')->nullable()->change();
            $table->integer('cantidad_posterior')->nullable()->change();
        });
    }
};
