<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProduccionMasiva extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'producciones_masivas';
    public $timestamps = true;

    protected $fillable = [
        'fecha_produccion',
        'registrado_por',
        'estado',
        'observaciones_generales',
    ];

    protected function casts(): array
    {
        return [
            'fecha_produccion' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Relaciones
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public function detalles()
    {
        return $this->hasMany(ProduccionMasivaDetalle::class, 'produccion_masiva_id');
    }

    /**
     * Scopes
     */
    public function scopePorFecha($query, $fecha)
    {
        return $query->whereDate('fecha_produccion', $fecha);
    }

    public function scopeCompletadas($query)
    {
        return $query->where('estado', 'completada');
    }

    /**
     * Atributos calculados
     */
    public function getTotalProductosAttribute()
    {
        return $this->detalles()->count();
    }

    public function getTotalCantidadAttribute()
    {
        return $this->detalles()->sum('cantidad_producida');
    }
}
