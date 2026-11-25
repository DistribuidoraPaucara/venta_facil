<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Desglose de pago de una compra al contado (Efectivo / Transferencia-QR), igual que detalle_pago_ventas en ventas.
 * Una compra puede tener una fila por forma de pago. Compras a crédito no usan esta tabla (su pago va por cuentas_por_pagar).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('detalle_pago_compras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compra_id')->constrained('compras')->cascadeOnDelete();
            $table->foreignId('tipo_pago_id')->constrained('tipos_pago');
            $table->decimal('monto', 15, 2);
            $table->timestamps();

            $table->index('compra_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detalle_pago_compras');
    }
};
