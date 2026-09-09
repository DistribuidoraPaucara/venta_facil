<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReposicionDetalle extends Model
{
    protected $table = 'reposicion_detalles';
    protected $fillable = [
        'reposicion_id',
        'producto_id',
        'cantidad_solicitada',
        'cantidad_recibida',
    ];

    public function reposicion(): BelongsTo
    {
        return $this->belongsTo(Reposicion::class);
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
