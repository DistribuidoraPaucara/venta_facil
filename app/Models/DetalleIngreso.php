<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetalleIngreso extends Model
{
    protected $fillable = [
        'ingreso_id',
        'concepto',
        'cantidad',
        'monto_unitario',
        'descuento',
        'subtotal',
        'tipo_operacion_caja_id',
        'monto_efectivo',
        'monto_transferencia',
    ];

    protected $casts = [
        'monto_unitario' => 'decimal:2',
        'descuento' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'monto_efectivo' => 'decimal:2',
        'monto_transferencia' => 'decimal:2',
    ];

    public function ingreso(): BelongsTo
    {
        return $this->belongsTo(Ingreso::class, 'ingreso_id');
    }

    public function tipoOperacion(): BelongsTo
    {
        return $this->belongsTo(TipoOperacionCaja::class, 'tipo_operacion_caja_id');
    }
}
