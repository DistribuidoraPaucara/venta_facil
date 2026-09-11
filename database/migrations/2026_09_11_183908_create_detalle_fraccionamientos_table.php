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
        Schema::create('detalle_fraccionamientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fraccionamiento_masivo_id')->constrained('fraccionamiento_masivos')->onDelete('cascade');
            $table->foreignId('producto_padre_id')->constrained('productos')->onDelete('restrict');
            $table->foreignId('producto_hijo_id')->constrained('productos')->onDelete('restrict');
            $table->foreignId('unidad_padre_id')->constrained('unidades_medida')->onDelete('restrict');
            $table->foreignId('unidad_hijo_id')->constrained('unidades_medida')->onDelete('restrict');
            $table->decimal('cantidad_padre', 15, 4);
            $table->decimal('cantidad_hijo', 15, 4);
            $table->decimal('factor_conversion', 15, 4)->comment('cantidad_hijo / cantidad_padre');
            $table->integer('numero_linea')->default(0);
            $table->softDeletes();
            $table->timestamps();

            // Índices
            $table->index('fraccionamiento_masivo_id');
            $table->index(['producto_padre_id', 'producto_hijo_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detalle_fraccionamientos');
    }
};
