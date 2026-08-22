<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 🏭 Actualizar ingredientes con unidad_medida_id = NULL a "UN" (id = 1)
        DB::table('receta_ingredientes')
            ->whereNull('unidad_medida_id')
            ->update(['unidad_medida_id' => 1]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 🏭 Revertir ingredientes a NULL
        DB::table('receta_ingredientes')
            ->where('unidad_medida_id', 1)
            ->update(['unidad_medida_id' => null]);
    }
};
