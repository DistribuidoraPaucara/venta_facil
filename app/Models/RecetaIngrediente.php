<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecetaIngrediente extends Model
{
    use HasFactory;

    protected $table = 'receta_ingredientes';

    protected $fillable = [
        'receta_id',
        'producto_id',
        'cantidad_requerida',
    ];

    protected function casts(): array
    {
        return [
            'cantidad_requerida' => 'decimal:3',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function receta()
    {
        return $this->belongsTo(Receta::class);
    }

    public function ingrediente()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function produccionesUsadas()
    {
        return $this->hasMany(ProduccionIngrediente::class);
    }
}
