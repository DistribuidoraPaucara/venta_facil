<?php
namespace App\Models;

use App\Models\Traits\HasActiveScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrecioProducto extends Model
{
    use HasFactory, HasActiveScope;

    protected $table = 'precios_producto';

    protected $fillable = [
        'producto_id',
        'nombre',
        'precio',
        'fecha_inicio',
        'fecha_fin',
        'activo',
        'tipo_cliente',
        'tipo_precio_id', // Cambiado de tipo_precio a tipo_precio_id
        'unidad_medida_id',
        'margen_ganancia',
        'porcentaje_ganancia',
        'es_precio_base',
        'motivo_cambio',
        'fecha_ultima_actualizacion',
    ];

    protected function casts(): array
    {
        return [
            'precio'              => 'decimal:6', // ✅ Aumentado a 6 decimales para productos fraccionados
            'fecha_inicio'        => 'date',
            'fecha_fin'           => 'date',
            'activo'              => 'boolean',
            'margen_ganancia'     => 'decimal:2',
            'porcentaje_ganancia' => 'decimal:2',
            'es_precio_base'      => 'boolean',
            'fecha_ultima_actualizacion' => 'datetime',
        ];
    }

    /**
     * Relaciones
     */
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function tipoPrecio()
    {
        return $this->belongsTo(TipoPrecio::class, 'tipo_precio_id');
    }

    public function unidadMedida()
    {
        return $this->belongsTo(UnidadMedida::class, 'unidad_medida_id');
    }

    public function configuracionGanancia()
    {
        return $this->hasOne(ConfiguracionGanancia::class, 'producto_id', 'producto_id')
            ->where('tipo_precio_id', $this->tipo_precio_id);
    }

    public function historialPrecios()
    {
        return $this->hasMany(HistorialPrecio::class);
    }

    /**
     * Scopes
     */
    public function scopePorTipo($query, TipoPrecio | int | string $tipo)
    {
        if ($tipo instanceof TipoPrecio) {
            return $query->where('tipo_precio_id', $tipo->id);
        }

        if (is_numeric($tipo)) {
            return $query->where('tipo_precio_id', $tipo);
        }

        // Si es string, buscar por código
        $tipoPrecio = TipoPrecio::porCodigo($tipo);
        if ($tipoPrecio) {
            return $query->where('tipo_precio_id', $tipoPrecio->id);
        }

        return $query->whereNull('tipo_precio_id'); // No encontrado
    }


    public function scopePrecioBase($query)
    {
        // Agrupado: sin el where() externo el orWhereHas escapaba del filtro por producto/activo
        return $query->where(function ($q) {
            $q->where('es_precio_base', true)
                ->orWhereHas('tipoPrecio', function ($q2) {
                    $q2->where('es_precio_base', true);
                });
        });
    }

    /**
     * Métodos de cálculo
     */
    public function calcularGanancia(): float
    {
        $precioBase = $this->producto->precios()
            ->activos()
            ->precioBase()
            ->first();

        if (! $precioBase || $precioBase->precio == 0) {
            return 0;
        }

        return $this->precio - $precioBase->precio;
    }

    public function calcularPorcentajeGanancia(): float
    {
        $precioBase = $this->producto->precios()
            ->activos()
            ->precioBase()
            ->first();

        if (! $precioBase || $precioBase->precio == 0) {
            return 0;
        }

        return (($this->precio - $precioBase->precio) / $precioBase->precio) * 100;
    }

    /**
     * Actualizar precio y registrar en historial
     */
    public function actualizarPrecio(float $nuevoPrecio, ?string $motivo = null, ?string $usuario = null): void
    {
        // El historial lo registra PrecioProductoObserver::updating (antes se creaba aquí también y quedaba duplicado).
        // Se asigna el precio nuevo antes de calcular para que la ganancia no use el valor anterior.
        $esBase = $this->es_precio_base || $this->tipoPrecio?->es_precio_base;

        $this->precio                     = $nuevoPrecio;
        $this->fecha_ultima_actualizacion = now();
        $this->motivo_cambio              = $motivo;
        // El precio base (costo) no tiene ganancia sobre sí mismo
        $this->margen_ganancia            = $esBase ? 0 : $this->calcularGanancia();
        $this->porcentaje_ganancia        = $esBase ? 0 : $this->calcularPorcentajeGanancia();
        $this->save();

        // Si cambió el precio base (costo), recalcular la ganancia de los demás precios activos del producto
        if ($esBase) {
            $this->producto->precios()->activos()->whereKeyNot($this->id)->get()
                ->each(function (PrecioProducto $otro) {
                    $otro->updateQuietly([
                        'margen_ganancia'     => $otro->calcularGanancia(),
                        'porcentaje_ganancia' => $otro->calcularPorcentajeGanancia(),
                    ]);
                });
        }
    }

    /**
     * Obtener el modelo del tipo de precio
     */
    public function getTipoPrecioModel(): ?TipoPrecio
    {
        return $this->tipoPrecio;
    }

    /**
     * Verificar si es un precio de ganancia
     */
    public function esGanancia(): bool
    {
        return $this->tipoPrecio ? $this->tipoPrecio->esGanancia() : true;
    }

    /**
     * Verificar si es precio base
     */
    public function esPrecioBase(): bool
    {
        return $this->es_precio_base || ($this->tipoPrecio && $this->tipoPrecio->esPrecioBase());
    }

    /**
     * Obtener información completa del tipo de precio
     */
    public function getTipoPrecioInfo(): array
    {
        if (! $this->tipoPrecio) {
            return [
                'id'          => null,
                'codigo'      => 'DESCONOCIDO',
                'nombre'      => 'Tipo Desconocido',
                'color'       => 'gray',
                'es_ganancia' => true,
                'icono'       => '❓',
            ];
        }

        return [
            'id'             => $this->tipoPrecio->id,
            'codigo'         => $this->tipoPrecio->codigo,
            'nombre'         => $this->tipoPrecio->nombre,
            'descripcion'    => $this->tipoPrecio->descripcion,
            'color'          => $this->tipoPrecio->color,
            'es_ganancia'    => $this->tipoPrecio->es_ganancia,
            'es_precio_base' => $this->tipoPrecio->es_precio_base,
            'icono'          => $this->tipoPrecio->getIcono(),
            'tooltip'        => $this->tipoPrecio->getTooltip(),
        ];
    }

    /**
     * Verificar si este precio fue actualizado recientemente (últimos 7 días)
     */
    public function fueActualizadoRecientemente(int $dias = 7): bool
    {
        return $this->historialPrecios()
            ->where('fecha_cambio', '>=', now()->subDays($dias))
            ->exists();
    }

    /**
     * Obtener último cambio registrado para este precio
     */
    public function obtenerUltimoCambio(): ?HistorialPrecio
    {
        return $this->historialPrecios()
            ->latest('fecha_cambio')
            ->first();
    }
}
