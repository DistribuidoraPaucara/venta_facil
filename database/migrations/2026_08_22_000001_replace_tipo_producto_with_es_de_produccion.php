<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            // Eliminar campos de tipo de producto
            $table->dropColumn(['tipo_producto', 'requiere_receta', 'unidad_medida']);

            // Agregar flag de producción
            $table->boolean('es_de_produccion')
                ->default(false)
                ->after('nombre');
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            // Eliminar es_de_produccion
            $table->dropColumn('es_de_produccion');

            // Restaurar campos anteriores
            $table->enum('tipo_producto', ['comprado', 'elaborado_cafeteria', 'materia_prima'])
                ->default('comprado')
                ->after('nombre');

            $table->boolean('requiere_receta')
                ->default(false)
                ->after('tipo_producto');

            $table->string('unidad_medida')
                ->default('unidad')
                ->after('requiere_receta');
        });
    }
};
