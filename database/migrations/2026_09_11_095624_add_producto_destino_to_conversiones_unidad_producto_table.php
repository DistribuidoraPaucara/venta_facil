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
            $table->unsignedBigInteger('producto_destino_id')
                ->nullable()
                ->after('producto_id')
                ->comment('Producto destino para fraccionamientos (si es aplicable)');

            $table->foreign('producto_destino_id')
                ->references('id')
                ->on('productos')
                ->onDelete('set null');

            $table->index('producto_destino_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversiones_unidad_producto', function (Blueprint $table) {
            $table->dropForeign(['producto_destino_id']);
            $table->dropIndex(['producto_destino_id']);
            $table->dropColumn('producto_destino_id');
        });
    }
};
