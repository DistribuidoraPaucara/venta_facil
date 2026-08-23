<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductoComponente extends Model
{
    use HasFactory;

    protected $table = 'producto_componentes';
    public $timestamps = true;

    protected $fillable = [
        'producto_id',
        'componente_id',
        'cantidad_requerida',
        'es_opcional',
        'orden',
    ];

    protected function casts(): array
    {
        return [
            'cantidad_requerida' => 'decimal:4',
            'es_opcional' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Relaciones
     */
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function componente()
    {
        return $this->belongsTo(Producto::class, 'componente_id');
    }

    /**
     * Scopes
     */
    public function scopeObligatorios($query)
    {
        return $query->where('es_opcional', false);
    }

    public function scopeOpcionales($query)
    {
        return $query->where('es_opcional', true);
    }
}
