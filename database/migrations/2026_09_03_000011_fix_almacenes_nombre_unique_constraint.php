<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('almacenes', function (Blueprint $table) {
            // Eliminar constraint único antiguo (global)
            try {
                $table->dropUnique(['nombre']);
            } catch (\Exception $e) {
                // Si no existe, continuar
            }

            // Agregar constraint único compuesto (por empresa)
            $table->unique(['nombre', 'empresa_id']);
        });
    }

    public function down(): void
    {
        Schema::table('almacenes', function (Blueprint $table) {
            // Revertir al constraint original
            try {
                $table->dropUnique(['nombre', 'empresa_id']);
            } catch (\Exception $e) {
                // Si no existe, continuar
            }
            $table->unique(['nombre']);
        });
    }
};
