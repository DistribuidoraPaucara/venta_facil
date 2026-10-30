<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * detalle_compras.precios_venta: precios de venta editados en la tabla de la compra (por tipo de precio),
 * guardados con la línea hasta que la compra se aprueba. Al aprobar se aplican a precios_producto
 * (DetectarCambiosPrecioService::aplicarPreciosVentaCompra), junto con el costo.
 *
 * Formato: [{tipo_precio_id, precio_id, precio?, porcentaje?, monto?}]. Solo uno de precio/porcentaje/monto
 * viene cargado: el que editó el usuario. El precio final se calcula sobre el precio unitario de la línea.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('detalle_compras', function (Blueprint $table) {
            $table->json('precios_venta')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('detalle_compras', function (Blueprint $table) {
            $table->dropColumn('precios_venta');
        });
    }
};
