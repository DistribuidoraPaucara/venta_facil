<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('detalle_ventas', function (Blueprint $table) {
            // ✅ NUEVO (2026-08-22): JSON con componentes/adicionales seleccionados
            // Estructura: [{"componente_id": 78, "cantidad": 0.1, "precio": 25.50}, ...]
            $table->json('componentes_seleccionados')->nullable()->after('combo_items_seleccionados');
        });
    }

    public function down(): void
    {
        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->dropColumn('componentes_seleccionados');
        });
    }
};
