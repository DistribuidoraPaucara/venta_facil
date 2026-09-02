<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            if (!Schema::hasColumn('productos', 'tipo_producto')) {
                $table->enum('tipo_producto', ['comprado', 'elaborado_cafeteria', 'materia_prima'])
                    ->default('comprado')
                    ->after('nombre');
            }

            if (!Schema::hasColumn('productos', 'requiere_receta')) {
                $table->boolean('requiere_receta')
                    ->default(false)
                    ->after('tipo_producto');
            }

            if (!Schema::hasColumn('productos', 'unidad_medida')) {
                $table->string('unidad_medida')
                    ->default('unidad')
                    ->after('requiere_receta');
            }
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn(['tipo_producto', 'requiere_receta', 'unidad_medida']);
        });
    }
};
