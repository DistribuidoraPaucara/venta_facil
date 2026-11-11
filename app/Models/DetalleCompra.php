<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleCompra extends Model
{
    protected $table = 'detalle_compras';

    protected $fillable = [
        'compra_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        'descuento',
        'subtotal',
        'lote',
        'fecha_vencimiento',
        'unidad_medida_id',
        'precios_venta', // Precios de venta editados en la compra; se aplican al aprobarla
    ];

    protected function casts(): array
    {
        return [
            'cantidad' => 'float',  // ✅ FIXED 2026-03-24: Cambié a float para evitar problemas con el cast decimal
            'precio_unitario' => 'float',
            'descuento' => 'float',
            'subtotal' => 'float',
            'fecha_vencimiento' => 'date',
            'precios_venta' => 'array',
        ];
    }

    // Relaciones
    public function compra()
    {
        return $this->belongsTo(Compra::class, 'compra_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function unidadMedida()
    {
        return $this->belongsTo(UnidadMedida::class, 'unidad_medida_id');
    }

    /**
     * Costo real por unidad: lo que se paga después del descuento de la línea (precio − descuento ÷ cantidad).
     * Lee los valores crudos porque los accessors de abajo recortan ceros y, con un número sin decimales
     * aún en memoria, también dígitos (20 → "2").
     */
    public function costoNeto(): float
    {
        $precio    = (float) ($this->attributes['precio_unitario'] ?? 0);
        $cantidad  = (float) ($this->attributes['cantidad'] ?? 0);
        $descuento = (float) ($this->attributes['descuento'] ?? 0);

        return $cantidad > 0 ? $precio - $descuento / $cantidad : $precio;
    }

    /**
     * ✅ NUEVO 2026-03-19: Accessores para remover ceros innecesarios
     * Guarda: 14.10 → Devuelve: "14.1"
     * Guarda: 15.202 → Devuelve: "15.202"
     */
    protected function cantidad(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn($value) => $value !== null ? rtrim(rtrim((string)$value, '0'), '.') : $value,
        );
    }

    protected function precioUnitario(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn($value) => $value !== null ? rtrim(rtrim((string)$value, '0'), '.') : $value,
        );
    }

    protected function descuento(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn($value) => $value !== null ? rtrim(rtrim((string)$value, '0'), '.') : $value,
        );
    }

    protected function subtotal(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn($value) => $value !== null ? rtrim(rtrim((string)$value, '0'), '.') : $value,
        );
    }
}
