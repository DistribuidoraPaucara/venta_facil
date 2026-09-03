<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ✨ NUEVO: Constraint único compuesto para Marca
        Schema::table('marcas', function (Blueprint $table) {
            $table->unique(['nombre', 'empresa_id'], 'ux_marca_nombre_empresa');
        });

        // ✨ NUEVO: Constraint único compuesto para Categoría
        Schema::table('categorias', function (Blueprint $table) {
            $table->unique(['nombre', 'empresa_id'], 'ux_categoria_nombre_empresa');
        });
    }

    public function down(): void
    {
        Schema::table('marcas', function (Blueprint $table) {
            $table->dropUnique('ux_marca_nombre_empresa');
        });

        Schema::table('categorias', function (Blueprint $table) {
            $table->dropUnique('ux_categoria_nombre_empresa');
        });
    }
};
