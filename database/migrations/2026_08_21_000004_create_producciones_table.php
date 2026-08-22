<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')
                ->constrained('productos')
                ->onDelete('cascade');
            $table->date('fecha_produccion');
            $table->decimal('cantidad_producida', 10, 3);
            $table->text('observaciones')->nullable();
            $table->foreignId('registrado_por')
                ->constrained('users')
                ->onDelete('restrict');
            $table->enum('estado', ['en_proceso', 'completada', 'cancelada'])
                ->default('en_proceso');
            $table->timestamps();

            $table->index('fecha_produccion');
            $table->index('producto_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producciones');
    }
};
