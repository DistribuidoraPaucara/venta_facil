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
        Schema::create('ingresos', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique(); // INGR20261124-0001
            $table->foreignId('tipo_operacion_caja_id')->constrained('tipo_operacion_caja');
            $table->foreignId('estado_documento_id')->constrained('estados_documento');
            $table->foreignId('usuario_id')->constrained('users');
            $table->date('fecha');
            $table->text('descripcion')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('descuento', 12, 2)->default(0);
            $table->decimal('impuesto', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->enum('estado_pago', ['PAGADA', 'PENDIENTE'])->default('PAGADA');
            $table->decimal('monto_pagado', 12, 2)->default(0);
            $table->decimal('monto_pendiente', 12, 2)->default(0);
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });

        Schema::create('detalle_ingresos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingreso_id')->constrained('ingresos')->onDelete('cascade');
            $table->string('concepto');
            $table->integer('cantidad')->default(1);
            $table->decimal('monto_unitario', 12, 2);
            $table->decimal('descuento', 12, 2)->default(0);
            $table->decimal('subtotal', 12, 2);
            $table->foreignId('tipo_operacion_caja_id')->nullable()->constrained('tipo_operacion_caja');
            $table->decimal('monto_efectivo', 12, 2)->default(0);
            $table->decimal('monto_transferencia', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detalle_ingresos');
        Schema::dropIfExists('ingresos');
    }
};
