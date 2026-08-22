<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdicionVenta extends Model
{
    use HasFactory;

    protected $table = 'adiciones_venta';

    protected $fillable = [
        'venta_id',
        'detalle_venta_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
    ];

    protected function casts(): array
    {
        return [
            'cantidad' => 'decimal:3',
            'precio_unitario' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function venta()
    {
        return $this->belongsTo(Venta::class);
    }

    public function detalleVenta()
    {
        return $this->belongsTo(DetalleVenta::class, 'detalle_venta_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }

    public function subtotal(): float
    {
        return (float) $this->cantidad * (float) $this->precio_unitario;
    }
}
