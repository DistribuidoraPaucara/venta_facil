<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Forma de pago y monto de una compra al contado (desglose Efectivo / Transferencia-QR).
 */
class DetallePagoCompra extends Model
{
    protected $table = 'detalle_pago_compras';

    protected $fillable = [
        'compra_id',
        'tipo_pago_id',
        'monto',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
    ];

    public function compra()
    {
        return $this->belongsTo(Compra::class, 'compra_id');
    }

    public function tipoPago()
    {
        return $this->belongsTo(TipoPago::class, 'tipo_pago_id');
    }
}
