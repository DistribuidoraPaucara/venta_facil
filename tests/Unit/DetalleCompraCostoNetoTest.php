<?php

use App\Models\DetalleCompra;

test('el costo neto reparte el descuento de la línea entre sus unidades', function () {
    $linea = new DetalleCompra(['cantidad' => 60, 'precio_unitario' => 121.32, 'descuento' => 336.42]);

    expect(round($linea->costoNeto(), 6))->toBe(115.713);
});

test('sin descuento el costo neto es el precio, aunque el número no tenga decimales', function () {
    $linea = new DetalleCompra(['cantidad' => 10, 'precio_unitario' => 20]);

    expect($linea->costoNeto())->toBe(20.0);
});

test('con cantidad 0 el costo neto es el precio', function () {
    $linea = new DetalleCompra(['cantidad' => 0, 'precio_unitario' => 20, 'descuento' => 5]);

    expect($linea->costoNeto())->toBe(20.0);
});
