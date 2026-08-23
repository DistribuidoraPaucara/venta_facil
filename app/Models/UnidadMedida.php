<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UnidadMedida extends Model
{
    use HasFactory;

    protected $table = 'unidades_medida';

    protected $fillable = ['codigo', 'nombre', 'activo', 'abreviatura', 'tipo', 'orden'];

    protected $casts = [
        'activo' => 'boolean',
        'orden' => 'integer',
    ];

    // ✅ NUEVO (2026-08-23): Scope para filtrar unidades activas
    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }
}
