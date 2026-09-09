<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockLimite extends Model
{
    protected $fillable = [
        'producto_id',
        'almacen_id',
        'sector_id',
        'stock_minimo',
        'stock_maximo',
        'capacidad_advertencia',
    ];

    protected $casts = [
        'stock_minimo' => 'integer',
        'stock_maximo' => 'integer',
        'capacidad_advertencia' => 'integer',
    ];

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class);
    }

    public function sector(): BelongsTo
    {
        return $this->belongsTo(Sector::class);
    }

    public function getStockActualAttribute(): int
    {
        return StockProducto::where('producto_id', $this->producto_id)
            ->where('almacen_id', $this->almacen_id)
            ->where('sector_id', $this->sector_id)
            ->sum('cantidad_disponible');
    }

    public function estaBajoMinimo(): bool
    {
        return $this->getStockActualAttribute() < $this->stock_minimo;
    }

    public function estaSobreMaximo(): bool
    {
        return $this->getStockActualAttribute() > $this->stock_maximo;
    }

    public function getPorcentajeCapacidad(): float
    {
        $stock = $this->getStockActualAttribute();
        $capacidad = $this->stock_maximo - $this->stock_minimo;
        return $capacidad > 0 ? ($stock / $this->stock_maximo) * 100 : 0;
    }
}
