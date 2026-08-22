<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('adiciones_venta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venta_id')
                ->constrained('ventas')
                ->onDelete('cascade');
            $table->foreignId('detalle_venta_id')
                ->constrained('detalle_ventas')
                ->onDelete('cascade');
            $table->foreignId('producto_id')
                ->constrained('productos')
                ->onDelete('restrict');
            $table->decimal('cantidad', 10, 3);
            $table->decimal('precio_unitario', 10, 2);
            $table->timestamps();

            $table->index('venta_id');
            $table->index('detalle_venta_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adiciones_venta');
    }
};
