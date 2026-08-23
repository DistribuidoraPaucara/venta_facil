<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto_componentes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('producto_id');
            $table->unsignedBigInteger('componente_id');
            $table->decimal('cantidad_requerida', 12, 4);
            $table->boolean('es_opcional')->default(false);
            $table->unsignedTinyInteger('orden')->default(0);
            $table->timestamps();

            $table->foreign('producto_id')->references('id')->on('productos')->onDelete('cascade');
            $table->foreign('componente_id')->references('id')->on('productos')->onDelete('restrict');
            $table->unique(['producto_id', 'componente_id']);
            $table->index(['producto_id', 'es_opcional']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_componentes');
    }
};
