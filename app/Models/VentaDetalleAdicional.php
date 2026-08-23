<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VentaDetalleAdicional extends Model
{
    use HasFactory;

    protected $table = 'venta_detalle_adicionales';

    protected $fillable = [
        'detalle_venta_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'cantidad' => 'decimal:2',
            'precio_unitario' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Relación: Detalle de venta al que pertenece este adicional
     */
    public function ventaDetalle(): BelongsTo
    {
        return $this->belongsTo(VentaDetalle::class);
    }

    /**
     * Relación: Producto adicional
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    /**
     * Boot del modelo - Recalcular subtotal cuando se actualiza cantidad o precio
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            // Recalcular subtotal
            $model->subtotal = (float) $model->cantidad * (float) $model->precio_unitario;
        });
    }
}
