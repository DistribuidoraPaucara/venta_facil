<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            // Eliminar constraint único antiguo (global)
            $table->dropUnique(['codigo_cliente']);

            // Agregar constraint único compuesto (por empresa)
            $table->unique(['codigo_cliente', 'empresa_id']);
        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            // Revertir al constraint original
            $table->dropUnique(['codigo_cliente', 'empresa_id']);
            $table->unique(['codigo_cliente']);
        });
    }
};
