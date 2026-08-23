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
        Schema::create('venta_detalle_adicionales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('detalle_venta_id')->constrained('detalle_ventas')->onDelete('cascade');
            $table->foreignId('producto_id')->constrained('productos')->onDelete('restrict');
            $table->decimal('cantidad', 10, 2)->default(1)->comment('Cantidad del adicional');
            $table->decimal('precio_unitario', 12, 2)->comment('Precio unitario del adicional (editable por usuario)');
            $table->decimal('subtotal', 12, 2)->comment('cantidad × precio_unitario');
            $table->timestamps();

            // Índices para búsquedas rápidas
            $table->index('detalle_venta_id');
            $table->index('producto_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venta_detalle_adicionales');
    }
};
