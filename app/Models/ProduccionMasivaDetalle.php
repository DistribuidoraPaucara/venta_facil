<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProduccionMasivaDetalle extends Model
{
    use HasFactory;

    protected $table = 'producciones_masivas_detalles';
    public $timestamps = true;

    protected $fillable = [
        'produccion_masiva_id',
        'producto_id',
        'cantidad_producida',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'cantidad_producida' => 'decimal:4',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Relaciones
     */
    public function produccionMasiva()
    {
        return $this->belongsTo(ProduccionMasiva::class, 'produccion_masiva_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
