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
        Schema::create('stock_limites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->foreignId('almacen_id')->constrained('almacenes')->cascadeOnDelete();
            $table->foreignId('sector_id')->constrained('sectores')->cascadeOnDelete();

            $table->integer('stock_minimo')->default(0);
            $table->integer('stock_maximo')->default(999999);
            $table->integer('capacidad_advertencia')->default(80)->comment('Porcentaje para alertas');

            $table->timestamps();

            // Constraint único: cada producto en cada almacén/sector tiene un límite
            $table->unique(['producto_id', 'almacen_id', 'sector_id'], 'uq_stock_limite_producto_almacen_sector');

            // Índices para queries frecuentes
            $table->index(['almacen_id', 'sector_id']);
            $table->index('stock_minimo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_limites');
    }
};
