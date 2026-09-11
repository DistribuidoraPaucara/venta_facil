<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DetalleFraccionamiento extends Model
{
    use SoftDeletes;

    protected $table = 'detalle_fraccionamientos';

    protected $fillable = [
        'fraccionamiento_masivo_id',
        'producto_padre_id',
        'producto_hijo_id',
        'unidad_padre_id',
        'unidad_hijo_id',
        'cantidad_padre',
        'cantidad_hijo',
        'factor_conversion',
        'numero_linea',
    ];

    protected $casts = [
        'cantidad_padre' => 'decimal:4',
        'cantidad_hijo' => 'decimal:4',
        'factor_conversion' => 'decimal:4',
        'numero_linea' => 'integer',
    ];

    // ==================== Relaciones ====================

    public function fraccionamientoMasivo(): BelongsTo
    {
        return $this->belongsTo(FraccionamientoMasivo::class);
    }

    public function productoPadre(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_padre_id');
    }

    public function productoHijo(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_hijo_id');
    }

    public function unidadPadre(): BelongsTo
    {
        return $this->belongsTo(UnidadMedida::class, 'unidad_padre_id');
    }

    public function unidadHijo(): BelongsTo
    {
        return $this->belongsTo(UnidadMedida::class, 'unidad_hijo_id');
    }
}
