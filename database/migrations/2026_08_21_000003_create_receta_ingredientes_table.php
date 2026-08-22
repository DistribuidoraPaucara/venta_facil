<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receta_ingredientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('receta_id')
                ->constrained('recetas')
                ->onDelete('cascade');
            $table->foreignId('producto_id')
                ->constrained('productos')
                ->onDelete('cascade');
            $table->decimal('cantidad_requerida', 10, 3);
            $table->timestamps();

            $table->unique(['receta_id', 'producto_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receta_ingredientes');
    }
};
