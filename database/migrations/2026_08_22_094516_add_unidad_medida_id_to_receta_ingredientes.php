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
        Schema::table('receta_ingredientes', function (Blueprint $table) {
            // 🏭 Agregar campo de unidad de medida
            $table->foreignId('unidad_medida_id')
                ->nullable()
                ->constrained('unidades_medida')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receta_ingredientes', function (Blueprint $table) {
            $table->dropForeignKeyIfExists(['unidad_medida_id']);
            $table->dropColumn('unidad_medida_id');
        });
    }
};
