<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Marca extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $table = 'marcas';

    protected $fillable = [
        'nombre', 'descripcion', 'activo', 'fecha_creacion', 'empresa_id',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'fecha_creacion' => 'datetime',
        ];
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function productos()
    {
        return $this->hasMany(Producto::class, 'marca_id');
    }

    public function scopePorEmpresa($query, $empresaId = null)
    {
        $empresaId = $empresaId ?? auth()->user()?->empresa_id;
        if ($empresaId) {
            $query->where('empresa_id', $empresaId);
        }
        return $query;
    }

    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }
}
