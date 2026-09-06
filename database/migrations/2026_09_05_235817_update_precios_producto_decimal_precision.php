<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('precios_producto', function (Blueprint $table) {
            // ✅ Aumentar precisión de precio de 2 a 6 decimales para productos fraccionados
            $table->decimal('precio', 18, 6)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('precios_producto', function (Blueprint $table) {
            // Revertir a 2 decimales
            $table->decimal('precio', 18, 2)->change();
        });
    }
};
