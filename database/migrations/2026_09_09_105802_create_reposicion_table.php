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
        Schema::create('reposiciones', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('almacen_origen_id')->constrained('almacenes')->onDelete('cascade');
            $table->foreignId('almacen_destino_id')->constrained('almacenes')->onDelete('cascade');
            $table->enum('estado', ['BORRADOR', 'ENVIADO', 'RECIBIDO'])->default('BORRADOR');
            $table->dateTime('fecha_envio')->nullable();
            $table->dateTime('fecha_recepcion')->nullable();
            $table->text('observaciones')->nullable();
            $table->foreignId('usuario_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            $table->index(['empresa_id', 'estado']);
            $table->index('numero');
        });

        // Tabla de detalles de reposiciones
        Schema::create('reposicion_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reposicion_id')->constrained('reposiciones')->onDelete('cascade');
            $table->foreignId('producto_id')->constrained('productos')->onDelete('cascade');
            $table->integer('cantidad_solicitada');
            $table->integer('cantidad_recibida')->default(0);
            $table->timestamps();
            $table->unique(['reposicion_id', 'producto_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reposicion_detalles');
        Schema::dropIfExists('reposiciones');
    }
};
