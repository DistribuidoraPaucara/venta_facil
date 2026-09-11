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
        Schema::create('fraccionamiento_masivos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('almacen_id')->constrained('almacenes')->onDelete('restrict');
            $table->foreignId('sector_id')->constrained('sectores')->onDelete('restrict');
            $table->foreignId('usuario_id')->constrained('users')->onDelete('restrict');
            $table->dateTime('fecha_fraccionamiento')->default(now());
            $table->enum('razon', [
                'fraccionamiento_manual',
                'fraccionamiento_compra',
                'reagrupamiento',
                'ajuste_inventario'
            ])->default('fraccionamiento_manual');
            $table->text('notas')->nullable();
            $table->integer('cantidad_detalles')->default(0); // Para auditoría
            $table->softDeletes();
            $table->timestamps();

            // Índices
            $table->index('almacen_id');
            $table->index('usuario_id');
            $table->index('fecha_fraccionamiento');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fraccionamiento_masivos');
    }
};
