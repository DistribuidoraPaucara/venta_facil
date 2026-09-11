<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MovimientoFraccionamiento extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'movimientos_fraccionamiento';

    protected $fillable = [
        'producto_padre_id',
        'cantidad_padre',
        'unidad_padre_id',
        'producto_hijo_id',
        'cantidad_hijo',
        'unidad_hijo_id',
        'almacen_id',
        'sector_id',
        'usuario_id',
        'fecha_fraccionamiento',
        'razon',
        'notas',
        'empresa_id',
    ];

    protected function casts(): array
    {
        return [
            'cantidad_padre' => 'decimal:4',
            'cantidad_hijo' => 'decimal:4',
            'fecha_fraccionamiento' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Relación: Producto que fue fraccionado (PADRE)
     */
    public function productoPadre(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_padre_id');
    }

    /**
     * Relación: Producto resultado del fraccionamiento (HIJO)
     */
    public function productoHijo(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_hijo_id');
    }

    /**
     * Relación: Unidad del producto padre
     */
    public function unidadPadre(): BelongsTo
    {
        return $this->belongsTo(UnidadMedida::class, 'unidad_padre_id');
    }

    /**
     * Relación: Unidad del producto hijo
     */
    public function unidadHijo(): BelongsTo
    {
        return $this->belongsTo(UnidadMedida::class, 'unidad_hijo_id');
    }

    /**
     * Relación: Almacén donde se realizó el fraccionamiento
     */
    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class, 'almacen_id');
    }

    /**
     * Relación: Sector donde se realizó el fraccionamiento
     */
    public function sector(): BelongsTo
    {
        return $this->belongsTo(Sector::class, 'sector_id');
    }

    /**
     * Relación: Usuario que realizó el fraccionamiento
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'usuario_id');
    }

    /**
     * Relación: Empresa propietaria
     */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    /**
     * Scope: Fraccionamientos recientes
     */
    public function scopeRecientes($query, int $dias = 30)
    {
        return $query->where('fecha_fraccionamiento', '>=', now()->subDays($dias))
            ->orderByDesc('fecha_fraccionamiento');
    }

    /**
     * Scope: Por producto padre
     */
    public function scopeDelProductoPadre($query, int $productoId)
    {
        return $query->where('producto_padre_id', $productoId);
    }

    /**
     * Scope: Por producto hijo
     */
    public function scopeDelProductoHijo($query, int $productoId)
    {
        return $query->where('producto_hijo_id', $productoId);
    }

    /**
     * Scope: Por almacén
     */
    public function scopePorAlmacen($query, int $almacenId)
    {
        return $query->where('almacen_id', $almacenId);
    }

    /**
     * Scope: Por sector
     */
    public function scopePorSector($query, int $sectorId)
    {
        return $query->where('sector_id', $sectorId);
    }

    /**
     * Scope: Por usuario
     */
    public function scopePorUsuario($query, int $usuarioId)
    {
        return $query->where('usuario_id', $usuarioId);
    }

    /**
     * Scope: Por razón
     */
    public function scopePorRazon($query, string $razon)
    {
        return $query->where('razon', $razon);
    }

    /**
     * Scope: Con relaciones (evita N+1)
     */
    public function scopeConRelaciones($query)
    {
        return $query->with([
            'productoPadre:id,nombre,sku',
            'productoHijo:id,nombre,sku',
            'unidadPadre:id,nombre,codigo',
            'unidadHijo:id,nombre,codigo',
            'almacen:id,nombre',
            'sector:id,nombre',
            'usuario:id,name,email',
        ]);
    }

    /**
     * Validar que el fraccionamiento sea posible
     *
     * @return bool
     */
    public function esValido(): bool
    {
        // El producto padre debe ser fraccionable
        if (!$this->productoPadre->es_fraccionado && $this->razon === 'fraccionamiento_manual') {
            return false;
        }

        // La cantidad de padre debe ser positiva
        if ($this->cantidad_padre <= 0) {
            return false;
        }

        // La cantidad de hijo debe ser positiva
        if ($this->cantidad_hijo <= 0) {
            return false;
        }

        // Verificar que el padre y hijo tengan relación válida
        if ($this->productoPadre->id === $this->productoHijo->id) {
            return false; // No pueden ser el mismo producto
        }

        return true;
    }

    /**
     * Calcular el factor de conversión usado en este fraccionamiento
     *
     * @return float
     */
    public function getFactorConversion(): float
    {
        if ($this->cantidad_padre <= 0) {
            return 0;
        }

        return (float) ($this->cantidad_hijo / $this->cantidad_padre);
    }

    /**
     * Obtener descripción legible del movimiento
     */
    public function getDescripcion(): string
    {
        $factor = $this->getFactorConversion();
        return "{$this->cantidad_padre} {$this->unidadPadre->nombre} → {$this->cantidad_hijo} {$this->unidadHijo->nombre} (factor: {$factor})";
    }
}
