<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Receta extends Model
{
    use HasFactory;

    protected $table = 'recetas';

    protected $fillable = [
        'producto_id',
        'descripcion',
        'instrucciones',
        'costo_estimado',
        'activa',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'activa' => 'boolean',
            'costo_estimado' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }

    public function ingredientes()
    {
        return $this->hasMany(RecetaIngrediente::class);
    }

    public function producciones()
    {
        return $this->hasManyThrough(
            Produccion::class,
            Producto::class,
            'id',
            'producto_id',
            'producto_id',
            'id'
        );
    }

    public function scopeActivas($query)
    {
        return $query->where('activa', true);
    }
}
