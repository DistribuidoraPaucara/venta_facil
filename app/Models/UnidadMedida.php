<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UnidadMedida extends Model
{
    use HasFactory;

    protected $table = 'unidades_medida';

    public $timestamps = false;

    protected $fillable = ['codigo', 'nombre', 'activo'];

    protected $casts = [
        'activo' => 'boolean',
    ];

    /**
     * ✅ Datos maestros GLOBALES - Sin empresa_id
     * Las unidades de medida son estándares internacionales (kg, L, m, etc)
     * Compartidas por todas las empresas del sistema
     */
    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }

    public function productos()
    {
        return $this->hasMany(Producto::class, 'unidad_medida_id');
    }
}
