<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producciones_masivas', function (Blueprint $table) {
            $table->id();
            $table->date('fecha_produccion');
            $table->unsignedBigInteger('registrado_por')->nullable();
            $table->enum('estado', ['en_proceso', 'completada', 'cancelada'])->default('en_proceso');
            $table->text('observaciones_generales')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('registrado_por')->references('id')->on('users')->onDelete('set null');
            $table->index('fecha_produccion');
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producciones_masivas');
    }
};
