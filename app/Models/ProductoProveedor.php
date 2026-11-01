<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Proveedor de un producto, con el último precio al que se le compró.
 * Las columnas ultimo_* las mantiene ProductoProveedorService a partir de las compras aprobadas.
 */
class ProductoProveedor extends Model
{
    protected $table = 'producto_proveedor';

    protected $fillable = [
        'empresa_id',
        'producto_id',
        'proveedor_id',
        'codigo_proveedor',
        'ultimo_precio',
        'unidad_medida_id',
        'fecha_ultima_compra',
        'ultima_compra_id',
        'es_principal',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'ultimo_precio'       => 'float',
            'fecha_ultima_compra' => 'date:Y-m-d',
            'es_principal'        => 'boolean',
            'activo'              => 'boolean',
        ];
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function unidadMedida()
    {
        return $this->belongsTo(UnidadMedida::class, 'unidad_medida_id');
    }

    public function ultimaCompra()
    {
        return $this->belongsTo(Compra::class, 'ultima_compra_id');
    }
}
