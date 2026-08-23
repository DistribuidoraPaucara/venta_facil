<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producciones_masivas_detalles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('produccion_masiva_id');
            $table->unsignedBigInteger('producto_id');
            $table->decimal('cantidad_producida', 12, 4);
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->foreign('produccion_masiva_id')->references('id')->on('producciones_masivas')->onDelete('cascade');
            $table->foreign('producto_id')->references('id')->on('productos')->onDelete('restrict');
            $table->index(['produccion_masiva_id', 'producto_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producciones_masivas_detalles');
    }
};
