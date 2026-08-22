<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProduccionIngrediente extends Model
{
    use HasFactory;

    protected $table = 'produccion_ingredientes';

    protected $fillable = [
        'produccion_id',
        'receta_ingrediente_id',
        'cantidad_usada',
        'costo_unitario',
    ];

    protected function casts(): array
    {
        return [
            'cantidad_usada' => 'decimal:3',
            'costo_unitario' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function produccion()
    {
        return $this->belongsTo(Produccion::class);
    }

    public function recetaIngrediente()
    {
        return $this->belongsTo(RecetaIngrediente::class);
    }

    public function ingrediente()
    {
        return $this->recetaIngrediente->ingrediente();
    }

    public function costoTotal(): float
    {
        return (float) $this->cantidad_usada * (float) ($this->costo_unitario ?? 0);
    }
}
