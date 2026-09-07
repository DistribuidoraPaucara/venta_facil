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
        Schema::table('conversiones_unidad_producto', function (Blueprint $table) {
            // ✨ NUEVO (2026-09-06): Nombre personalizado cuando se vende en esta unidad
            // Ej: "Coca Cola 2Lts" en lugar de "Paquete de Coca Cola 6x1 2Lts"
            $table->string('nombre_cuando_se_vende_como')->nullable()->after('factor_conversion')
                ->comment('Nombre del producto cuando se vende en esta unidad destino. Si está vacío, se genera automáticamente.');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversiones_unidad_producto', function (Blueprint $table) {
            $table->dropColumn('nombre_cuando_se_vende_como');
        });
    }
};
