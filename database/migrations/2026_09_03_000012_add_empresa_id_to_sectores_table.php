<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sectores', function (Blueprint $table) {
            // Agregar empresa_id después de almacen_id
            $table->unsignedBigInteger('empresa_id')
                ->nullable()
                ->after('almacen_id')
                ->comment('Empresa a la que pertenece este sector');

            // Agregar foreign key a empresas
            $table->foreign('empresa_id')
                ->references('id')
                ->on('empresas')
                ->cascadeOnDelete()
                ->cascadeOnUpdate();

            // Índice para búsquedas frecuentes
            $table->index('empresa_id');
        });
    }

    public function down(): void
    {
        Schema::table('sectores', function (Blueprint $table) {
            $table->dropForeignKeyIfExists('sectores_empresa_id_foreign');
            $table->dropIndexIfExists('sectores_empresa_id_index');
            $table->dropColumn('empresa_id');
        });
    }
};
