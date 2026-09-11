<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FraccionamientoMasivo extends Model
{
    use SoftDeletes;

    protected $table = 'fraccionamiento_masivos';

    protected $fillable = [
        'almacen_id',
        'sector_id',
        'usuario_id',
        'fecha_fraccionamiento',
        'razon',
        'notas',
        'cantidad_detalles',
    ];

    protected $casts = [
        'fecha_fraccionamiento' => 'datetime',
        'cantidad_detalles' => 'integer',
    ];

    // ==================== Relaciones ====================

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class);
    }

    public function sector(): BelongsTo
    {
        return $this->belongsTo(Sector::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleFraccionamiento::class);
    }

    // ==================== Scopes ====================

    public function scopeConRelaciones($query)
    {
        return $query->with([
            'almacen:id,nombre',
            'sector:id,nombre',
            'usuario:id,name,email',
            'detalles.productoPadre:id,nombre,sku,unidad_medida_id',
            'detalles.productoHijo:id,nombre,sku,unidad_medida_id',
            'detalles.unidadPadre:id,nombre,codigo',
            'detalles.unidadHijo:id,nombre,codigo',
        ]);
    }
}
