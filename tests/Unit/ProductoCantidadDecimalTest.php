<?php

use App\Models\Producto;

test('un producto normal no admite cantidad decimal', function () {
    expect((new Producto())->admiteCantidadDecimal())->toBeFalse();
});

test('con la opción activada admite cantidad decimal sin ser fraccionado', function () {
    expect((new Producto(['permite_cantidad_decimal' => true]))->admiteCantidadDecimal())->toBeTrue();
});

test('un producto fraccionado siempre admite cantidad decimal', function () {
    expect((new Producto(['es_fraccionado' => true]))->admiteCantidadDecimal())->toBeTrue();
});
