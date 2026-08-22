<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produccion_ingredientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('produccion_id')
                ->constrained('producciones')
                ->onDelete('cascade');
            $table->foreignId('receta_ingrediente_id')
                ->constrained('receta_ingredientes')
                ->onDelete('cascade');
            $table->decimal('cantidad_usada', 10, 3);
            $table->decimal('costo_unitario', 10, 2)->nullable();
            $table->timestamps();

            $table->index('produccion_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produccion_ingredientes');
    }
};
