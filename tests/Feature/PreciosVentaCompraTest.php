<?php

use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\HistorialPrecio;
use App\Models\PrecioProducto;
use App\Models\Producto;
use App\Models\User;
use App\Services\DetectarCambiosPrecioService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * DetectarCambiosPrecioService::aplicarPreciosVentaCompra: al aprobar una compra, los precios de venta
 * editados en su tabla (detalle_compras.precios_venta) se aplican sobre el precio unitario de la línea.
 */
beforeEach(function () {
    $this->actingAs(User::factory()->create());
    $this->producto = Producto::factory()->create();
    $this->precioVenta = PrecioProducto::factory()->forProducto($this->producto)->create(['precio' => 15]);
});

// Compra en memoria con una línea (el servicio solo lee los detalles)
function compraConLinea(int $productoId, float $precioUnitario, ?array $preciosVenta): Compra
{
    $compra = new Compra(['numero' => 'COMP-TEST-1']);
    $compra->setRelation('detalles', collect([
        new DetalleCompra([
            'producto_id'     => $productoId,
            'cantidad'        => 10,
            'precio_unitario' => $precioUnitario,
            'subtotal'        => $precioUnitario * 10,
            'precios_venta'   => $preciosVenta,
        ]),
    ]));

    return $compra;
}

test('aplica el precio editado por porcentaje sobre el precio de compra', function () {
    $compra = compraConLinea($this->producto->id, 20, [
        ['tipo_precio_id' => $this->precioVenta->tipo_precio_id, 'precio_id' => $this->precioVenta->id, 'porcentaje' => 10],
    ]);

    $cambios = (new DetectarCambiosPrecioService())->aplicarPreciosVentaCompra($compra);

    expect($cambios)->toHaveCount(1)
        ->and((float) $this->precioVenta->fresh()->precio)->toBe(22.0)
        ->and((float) $this->precioVenta->fresh()->porcentaje_ganancia)->toBe(10.0)
        ->and(HistorialPrecio::where('precio_producto_id', $this->precioVenta->id)->count())->toBe(1);
});

test('aplica el precio editado por ganancia en Bs y por precio directo', function () {
    $porMonto = (new DetectarCambiosPrecioService())->aplicarPreciosVentaCompra(compraConLinea($this->producto->id, 20, [
        ['tipo_precio_id' => $this->precioVenta->tipo_precio_id, 'precio_id' => $this->precioVenta->id, 'monto' => 3],
    ]));
    expect($porMonto)->toHaveCount(1)
        ->and((float) $this->precioVenta->fresh()->precio)->toBe(23.0);

    (new DetectarCambiosPrecioService())->aplicarPreciosVentaCompra(compraConLinea($this->producto->id, 20, [
        ['tipo_precio_id' => $this->precioVenta->tipo_precio_id, 'precio_id' => $this->precioVenta->id, 'precio' => 25],
    ]));
    expect((float) $this->precioVenta->fresh()->precio)->toBe(25.0)
        ->and((float) $this->precioVenta->fresh()->porcentaje_ganancia)->toBe(25.0);
});

test('no toca precios de otro producto ni los que no cambian', function () {
    $otroPrecio = PrecioProducto::factory()->create(['precio' => 50]);

    $cambios = (new DetectarCambiosPrecioService())->aplicarPreciosVentaCompra(compraConLinea($this->producto->id, 10, [
        // precio de otro producto: se ignora
        ['tipo_precio_id' => $otroPrecio->tipo_precio_id, 'precio_id' => $otroPrecio->id, 'porcentaje' => 100],
        // 10 × 1.5 = 15: igual al actual, no cambia
        ['tipo_precio_id' => $this->precioVenta->tipo_precio_id, 'precio_id' => $this->precioVenta->id, 'porcentaje' => 50],
    ]));

    expect($cambios)->toBeEmpty()
        ->and((float) $otroPrecio->fresh()->precio)->toBe(50.0)
        ->and((float) $this->precioVenta->fresh()->precio)->toBe(15.0);
});

test('líneas sin precios de venta editados no cambian nada', function () {
    $cambios = (new DetectarCambiosPrecioService())->aplicarPreciosVentaCompra(compraConLinea($this->producto->id, 20, null));

    expect($cambios)->toBeEmpty()
        ->and((float) $this->precioVenta->fresh()->precio)->toBe(15.0);
});
