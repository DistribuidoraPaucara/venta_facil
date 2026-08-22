<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Produccion extends Model
{
    use HasFactory;

    protected $table = 'producciones';

    protected $fillable = [
        'producto_id',
        'fecha_produccion',
        'cantidad_producida',
        'observaciones',
        'registrado_por',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_produccion' => 'date',
            'cantidad_producida' => 'decimal:3',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }

    public function ingredientesUsados()
    {
        return $this->hasMany(ProduccionIngrediente::class);
    }

    public function registradoPor()
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public function receta()
    {
        return $this->producto->receta();
    }

    public function detallesVenta()
    {
        return $this->hasMany(DetalleVenta::class);
    }

    /**
     * Calcular costo total de la producción (suma de ingredientes usados)
     */
    public function costoTotal(): float
    {
        return (float) $this->ingredientesUsados->sum(
            fn($i) => (float) $i->cantidad_usada * (float) ($i->costo_unitario ?? 0)
        );
    }

    /**
     * Calcular costo por unidad producida
     */
    public function costoPorUnidad(): float
    {
        if ((float) $this->cantidad_producida <= 0) {
            return 0;
        }
        return $this->costoTotal() / (float) $this->cantidad_producida;
    }

    public function scopeDelDia($query, $fecha = null)
    {
        $fecha = $fecha ?? now()->format('Y-m-d');
        return $query->where('fecha_produccion', $fecha);
    }

    public function scopeCompletadas($query)
    {
        return $query->where('estado', 'completada');
    }

    public function scopeEnProceso($query)
    {
        return $query->where('estado', 'en_proceso');
    }
}
