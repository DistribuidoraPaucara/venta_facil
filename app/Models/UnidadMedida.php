<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UnidadMedida extends Model
{
    use HasFactory;

    protected $table = 'unidades_medida';

    public $timestamps = false;

    protected $fillable = ['codigo', 'nombre', 'activo', 'empresa_id'];

    protected $casts = [
        'activo' => 'boolean',
    ];

    /**
     * ✅ Ahora CON empresa_id - Depende del rubro
     * Comida: gramos, kg, litros
     * Telas: metros, centímetros
     * Medicinas: ml, pastillas
     */
    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }

    public function scopePorEmpresa($query, $empresaId = null)
    {
        $empresaId = $empresaId ?? auth()->user()?->empresa_id;
        if ($empresaId) {
            $query->where('empresa_id', $empresaId);
        }
        return $query;
    }

    public function productos()
    {
        return $this->hasMany(Producto::class, 'unidad_medida_id');
    }
}
