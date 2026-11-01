<?php

namespace App\Services;

use App\Models\Almacen;
use App\Models\MovimientoInventario;
use App\Models\PrecioProducto;
use App\Models\Producto;
use App\Models\StockLimite;
use App\Models\StockProducto;
use App\Models\TipoPrecio;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Datos de los reportes de inventario (pantalla Inventario → Reportes: Excel, CSV, A4 y tickets 80/58 mm).
 *
 * Todo se limita a la empresa del usuario: productos por el scope global de Producto y stock/movimientos
 * por los almacenes de la empresa. Las claves de cada fila las leen las vistas impresion/reportes/*-80/58.
 */
class ReporteInventarioService
{
    /** Columnas de cada reporte para Excel, CSV y A4: clave de la fila => encabezado */
    public const COLUMNAS = [
        'stock_actual' => [
            'almacen' => 'Almacén', 'codigo_producto' => 'Código', 'nombre_producto' => 'Producto', 'cantidad' => 'Cantidad',
            'cantidad_disponible' => 'Disponible', 'cantidad_reservada' => 'Reservado', 'precio_compra' => 'Costo',
            'precio_venta' => 'Precio venta', 'valor_compra' => 'Valor costo', 'valor_venta' => 'Valor venta', 'stock_minimo' => 'Stock mínimo',
        ],
        'movimientos' => [
            'fecha' => 'Fecha', 'almacen' => 'Almacén', 'codigo_producto' => 'Código', 'nombre_producto' => 'Producto',
            'tipo_movimiento' => 'Tipo', 'cantidad' => 'Cantidad', 'motivo' => 'Motivo', 'usuario' => 'Usuario', 'referencia' => 'Documento',
        ],
        'stock_valorizado' => [
            'almacen' => 'Almacén', 'total_productos' => 'Productos', 'productos_sin_costo' => 'Sin costo', 'cantidad_total' => 'Unidades',
            'valor_compra_total' => 'Valor costo', 'valor_venta_total' => 'Valor venta', 'margen_bruto' => 'Margen (con costo)',
            'margen_porcentaje' => 'Margen %',
        ],
        'productos_bajo_minimo' => [
            'codigo' => 'Código', 'nombre_producto' => 'Producto', 'almacen' => 'Almacén', 'stock_actual' => 'Stock',
            'stock_minimo' => 'Mínimo', 'falta' => 'Falta', 'precio_compra' => 'Costo', 'precio_venta' => 'Precio venta', 'categoria' => 'Categoría',
        ],
        'productos_sin_movimiento' => [
            'codigo' => 'Código', 'nombre_producto' => 'Producto', 'almacen' => 'Almacén', 'categoria' => 'Categoría',
            'cantidad_stock' => 'Stock', 'precio_compra' => 'Costo', 'valor_inmobilizado' => 'Valor inmovilizado',
            'dias_sin_movimiento' => 'Días sin movimiento', 'fecha_ultimo_movimiento' => 'Último movimiento',
        ],
        'vencimientos' => [
            'codigo' => 'Código', 'nombre_producto' => 'Producto', 'almacen' => 'Almacén', 'categoria' => 'Categoría', 'lote' => 'Lote',
            'cantidad' => 'Cantidad', 'fecha_vencimiento' => 'Vence', 'dias_para_vencer' => 'Días', 'estado' => 'Estado',
            'precio_compra' => 'Costo', 'valor_total' => 'Valor',
        ],
        'kardex' => [
            'fecha' => 'Fecha', 'almacen' => 'Almacén', 'tipo_movimiento' => 'Tipo', 'cantidad' => 'Cantidad', 'saldo_lote' => 'Saldo del lote',
            'motivo' => 'Motivo', 'usuario' => 'Usuario', 'referencia' => 'Documento',
        ],
        'rotacion_inventario' => [
            'codigo' => 'Código', 'nombre_producto' => 'Producto', 'categoria' => 'Categoría', 'total_movimientos' => 'Movimientos',
            'cantidad_vendida' => 'Vendido', 'cantidad_total_movida' => 'Unidades movidas', 'promedio_por_movimiento' => 'Promedio',
            'ultima_fecha_movimiento' => 'Último movimiento', 'rotacion_clasificacion' => 'Rotación',
        ],
    ];

    public const TITULOS = [
        'stock_actual'             => 'Stock actual',
        'movimientos'              => 'Movimientos de inventario',
        'stock_valorizado'         => 'Stock valorizado',
        'productos_bajo_minimo'    => 'Productos bajo mínimo',
        'productos_sin_movimiento' => 'Productos sin movimiento',
        'vencimientos'             => 'Vencimientos',
        'kardex'                   => 'Kardex de producto',
        'rotacion_inventario'      => 'Rotación de inventario',
    ];

    private ?array $almacenesEmpresa = null;

    /** Ids de los almacenes de la empresa del usuario */
    private function almacenesEmpresa(): array
    {
        return $this->almacenesEmpresa ??= Almacen::porEmpresa()->pluck('id')->all();
    }

    /** Almacenes a consultar: el filtrado (si es de la empresa) o todos los de la empresa */
    private function almacenesFiltro(array $filtros): array
    {
        $almacenes = $this->almacenesEmpresa();

        return ! empty($filtros['almacen_id']) ? array_values(array_intersect($almacenes, [(int) $filtros['almacen_id']])) : $almacenes;
    }

    /** Stock de la empresa: productos de la empresa (scope global) en sus almacenes */
    private function stockEmpresa(array $filtros)
    {
        return StockProducto::query()
            ->whereIn('almacen_id', $this->almacenesFiltro($filtros))
            ->whereHas('producto', fn ($q) => ! empty($filtros['categoria_id']) ? $q->where('categoria_id', $filtros['categoria_id']) : $q);
    }

    /**
     * Costo y precio de venta de cada producto: el tipo base (COSTO) y el de código VENTA de la empresa
     * (si no existe, el primer tipo no base). Prefiere el precio en la unidad del producto.
     *
     * @return array<int, array{costo: float, venta: float}>
     */
    private function preciosBase(Collection $productos): array
    {
        $idCosto = TipoPrecio::porEmpresa()->where('es_precio_base', true)->value('id');
        $idVenta = TipoPrecio::porEmpresa()->where('codigo', 'VENTA')->value('id')
            ?? TipoPrecio::porEmpresa()->where('es_precio_base', false)->ordenados()->value('id');
        $unidades = $productos->pluck('unidad_medida_id', 'id');

        $resultado = [];
        PrecioProducto::whereIn('producto_id', $unidades->keys())
            ->whereIn('tipo_precio_id', array_filter([$idCosto, $idVenta]))
            ->where('activo', true)
            ->get(['producto_id', 'tipo_precio_id', 'precio', 'unidad_medida_id'])
            ->groupBy(fn ($p) => "{$p->producto_id}|{$p->tipo_precio_id}")
            ->each(function ($precios, $clave) use (&$resultado, $unidades, $idCosto) {
                [$productoId, $tipoId] = array_map('intval', explode('|', $clave));
                $unidad = $unidades[$productoId] ?? null;
                $precio = $precios->first(fn ($p) => ! $p->unidad_medida_id || (int) $p->unidad_medida_id === (int) $unidad) ?? $precios->first();
                $resultado[$productoId][$tipoId === (int) $idCosto ? 'costo' : 'venta'] = (float) $precio->precio;
            });

        return $resultado;
    }

    /** Código a mostrar: código de barras principal, si no el primero, si no el SKU */
    private function codigo($producto): string
    {
        $codigos = $producto->codigosBarra ?? collect();

        return ($codigos->firstWhere('es_principal', true) ?? $codigos->first())?->codigo ?? ($producto->sku ?? '');
    }

    private function conProducto(): array
    {
        return [
            'producto:id,nombre,sku,categoria_id,unidad_medida_id,stock_minimo',
            'producto.codigosBarra' => fn ($q) => $q->where('activo', true)->select('id', 'producto_id', 'codigo', 'es_principal'),
            'producto.categoria:id,nombre',
            'almacen:id,nombre',
        ];
    }

    /**
     * Stock actual por lote y almacén
     */
    public function obtenerStockActual(array $filtros): Collection
    {
        $stocks = $this->stockEmpresa($filtros)
            ->with($this->conProducto())
            ->when($filtros['solo_con_stock'] ?? true, fn ($q) => $q->where('cantidad', '>', 0))
            ->get();
        $precios = $this->preciosBase($stocks->pluck('producto')->filter()->unique('id'));

        return $stocks->sortBy(fn ($s) => ($s->almacen?->nombre ?? '') . '|' . $s->producto->nombre)->values()
            ->map(function ($stock) use ($precios) {
                $p = $precios[$stock->producto_id] ?? [];

                return [
                    'producto_id'         => $stock->producto_id,
                    'almacen'             => $stock->almacen?->nombre ?? 'N/A',
                    'codigo_producto'     => $this->codigo($stock->producto),
                    'nombre_producto'     => $stock->producto->nombre,
                    'cantidad'            => (float) $stock->cantidad,
                    'cantidad_disponible' => (float) ($stock->cantidad_disponible ?? 0),
                    'cantidad_reservada'  => (float) ($stock->cantidad_reservada ?? 0),
                    'precio_compra'       => $p['costo'] ?? 0,
                    'precio_venta'        => $p['venta'] ?? 0,
                    'valor_compra'        => (float) $stock->cantidad * ($p['costo'] ?? 0),
                    'valor_venta'         => (float) $stock->cantidad * ($p['venta'] ?? 0),
                    'stock_minimo'        => (float) ($stock->producto->stock_minimo ?? 0),
                    'fecha_actualizacion' => now()->format('d/m/Y'),
                ];
            });
    }

    /**
     * Movimientos del período (por defecto el último mes)
     */
    public function obtenerMovimientos(array $filtros): Collection
    {
        $desde = $filtros['fecha_desde'] ?? now()->subMonth()->toDateString();
        $hasta = $filtros['fecha_hasta'] ?? now()->toDateString();
        $almacenes = $this->almacenesFiltro($filtros);

        return MovimientoInventario::with([
            'stockProductoHistorico.producto:id,nombre,sku',
            'stockProductoHistorico.producto.codigosBarra' => fn ($q) => $q->where('activo', true)->select('id', 'producto_id', 'codigo', 'es_principal'),
            'stockProductoHistorico.almacen:id,nombre',
            'user:id,name',
        ])
            ->whereHas('stockProductoHistorico', fn ($q) => $q->whereIn('almacen_id', $almacenes)
                ->whereHas('producto', fn ($p) => ! empty($filtros['categoria_id']) ? $p->where('categoria_id', $filtros['categoria_id']) : $p))
            ->whereDate('fecha', '>=', $desde)
            ->whereDate('fecha', '<=', $hasta)
            ->orderByDesc('id')
            ->limit(20000)
            ->get()
            ->map(fn ($mov) => [
                'fecha'           => $mov->fecha?->format('d/m/Y H:i'),
                'almacen'         => $mov->stockProductoHistorico->almacen?->nombre ?? 'N/A',
                'codigo_producto' => $this->codigo($mov->stockProductoHistorico->producto),
                'nombre_producto' => $mov->stockProductoHistorico->producto->nombre,
                'tipo_movimiento' => MovimientoInventario::nombreTipoLegible($mov->tipo),
                'cantidad'        => (float) $mov->cantidad,
                'motivo'          => MovimientoInventario::observacionLegible($mov->observacion, $mov->tipo) ?? '',
                'usuario'         => $mov->user?->name ?? 'Sistema',
                'referencia'      => $mov->numero_documento ?? '',
            ]);
    }

    /**
     * Stock valorizado: resumen por almacén (con el detalle de productos para las vistas de impresión)
     */
    public function obtenerStockValorizado(array $filtros): Collection
    {
        return $this->obtenerStockActual($filtros)->groupBy('almacen')->map(function ($items, $almacen) {
            // El margen solo con lo que tiene costo y precio de venta: si no, lo que no tiene uno de los dos
            // contaba como pura ganancia (o pura pérdida)
            $conCosto    = $items->where('precio_compra', '>', 0)->where('precio_venta', '>', 0);
            $valorCompra = $conCosto->sum('valor_compra');
            $margen      = $conCosto->sum('valor_venta') - $valorCompra;

            return [
                'almacen'             => $almacen,
                'total_productos'     => $items->unique('producto_id')->count(),
                'productos_sin_costo' => $items->where('precio_compra', '<=', 0)->unique('producto_id')->count(),
                'cantidad_total'      => $items->sum('cantidad'),
                'valor_compra_total'  => $valorCompra,
                'valor_venta_total'   => $items->sum('valor_venta'),
                'margen_bruto'        => $margen,
                'margen_porcentaje'   => $valorCompra > 0 ? round($margen / $valorCompra * 100, 2) : null,
                'productos'           => $items->values(),
            ];
        })->values();
    }

    /**
     * Productos bajo su stock mínimo, por almacén. El mínimo es el del almacén (stock_limites)
     * o, si no tiene, el mínimo general del producto. Productos sin mínimo no aparecen.
     */
    public function obtenerProductosBajoMinimo(array $filtros): Collection
    {
        $almacenes = $this->almacenesFiltro($filtros);
        $productos = Producto::where('activo', true)
            ->when(! empty($filtros['categoria_id']), fn ($q) => $q->where('categoria_id', $filtros['categoria_id']))
            ->with(['codigosBarra' => fn ($q) => $q->where('activo', true)->select('id', 'producto_id', 'codigo', 'es_principal'), 'categoria:id,nombre'])
            ->get(['id', 'nombre', 'sku', 'categoria_id', 'unidad_medida_id', 'stock_minimo'])
            ->keyBy('id');

        $stock = StockProducto::whereIn('producto_id', $productos->keys())->whereIn('almacen_id', $almacenes)
            ->groupBy('producto_id', 'almacen_id')
            ->selectRaw('producto_id, almacen_id, SUM(cantidad) as total')
            ->get()->keyBy(fn ($s) => "{$s->producto_id}|{$s->almacen_id}");
        $limites = StockLimite::whereIn('producto_id', $productos->keys())->whereIn('almacen_id', $almacenes)
            ->groupBy('producto_id', 'almacen_id')
            ->selectRaw('producto_id, almacen_id, SUM(stock_minimo) as minimo')
            ->get()->keyBy(fn ($l) => "{$l->producto_id}|{$l->almacen_id}");
        $nombresAlmacen = Almacen::whereIn('id', $almacenes)->pluck('nombre', 'id');

        // Pares producto|almacén a revisar: donde hay stock o un mínimo definido
        $pares = $stock->keys()->merge($limites->keys())->unique();
        $precios = $this->preciosBase($productos);

        return $pares->map(function ($par) use ($productos, $stock, $limites, $nombresAlmacen, $precios) {
            [$productoId, $almacenId] = array_map('intval', explode('|', $par));
            $producto = $productos[$productoId];
            $minimo = (float) ($limites[$par]->minimo ?? 0) ?: (float) ($producto->stock_minimo ?? 0);
            $actual = (float) ($stock[$par]->total ?? 0);
            if ($minimo <= 0 || $actual >= $minimo) {
                return null;
            }

            return [
                'producto_id'     => $productoId,
                'codigo'          => $this->codigo($producto),
                'nombre_producto' => $producto->nombre,
                'almacen'         => $nombresAlmacen[$almacenId] ?? 'N/A',
                'stock_actual'    => $actual,
                'stock_minimo'    => $minimo,
                'falta'           => $minimo - $actual,
                'precio_compra'   => $precios[$productoId]['costo'] ?? 0,
                'precio_venta'    => $precios[$productoId]['venta'] ?? 0,
                'categoria'       => $producto->categoria?->nombre ?? 'N/A',
            ];
        })->filter()->sortBy([['almacen', 'asc'], ['nombre_producto', 'asc']])->values();
    }

    /**
     * Stock sin movimientos desde fecha_desde (por defecto, los últimos 90 días). Con su último movimiento real.
     */
    public function obtenerProductosSinMovimiento(array $filtros): Collection
    {
        $desde = ! empty($filtros['fecha_desde']) ? \Carbon\Carbon::parse($filtros['fecha_desde'])->startOfDay() : now()->subDays(90)->startOfDay();

        $stocks = $this->stockEmpresa($filtros)
            ->with($this->conProducto())
            ->where('cantidad', '>', 0)
            ->addSelect(['ultimo_movimiento' => MovimientoInventario::selectRaw('MAX(fecha)')->whereColumn('stock_producto_id', 'stock_productos.id')])
            ->get()
            ->filter(fn ($s) => ! $s->ultimo_movimiento || \Carbon\Carbon::parse($s->ultimo_movimiento)->lt($desde));
        $precios = $this->preciosBase($stocks->pluck('producto')->filter()->unique('id'));

        return $stocks->map(function ($stock) use ($precios) {
            $costo  = $precios[$stock->producto_id]['costo'] ?? 0;
            $ultimo = $stock->ultimo_movimiento ? \Carbon\Carbon::parse($stock->ultimo_movimiento) : null;

            return [
                'producto_id'             => $stock->producto_id,
                'codigo'                  => $this->codigo($stock->producto),
                'nombre_producto'         => $stock->producto->nombre,
                'almacen'                 => $stock->almacen?->nombre ?? 'N/A',
                'categoria'               => $stock->producto->categoria?->nombre ?? 'N/A',
                'cantidad_stock'          => (float) $stock->cantidad,
                'precio_compra'           => $costo,
                'precio_venta'            => $precios[$stock->producto_id]['venta'] ?? 0,
                'valor_inmobilizado'      => (float) $stock->cantidad * $costo,
                'dias_sin_movimiento'     => $ultimo ? (int) $ultimo->diffInDays(now()) : 'Nunca',
                'fecha_ultimo_movimiento' => $ultimo?->format('d/m/Y') ?? 'Sin movimientos',
            ];
        })->sortByDesc(fn ($f) => is_int($f['dias_sin_movimiento']) ? $f['dias_sin_movimiento'] : PHP_INT_MAX)->values();
    }

    /**
     * Lotes vencidos o que vencen en los próximos 30 días (días negativos = ya vencido)
     */
    public function obtenerVencimientos(array $filtros): Collection
    {
        $hoy = now()->startOfDay();

        $stocks = $this->stockEmpresa($filtros)
            ->with($this->conProducto())
            ->whereNotNull('fecha_vencimiento')
            ->where('cantidad', '>', 0)
            ->whereDate('fecha_vencimiento', '<=', $hoy->copy()->addDays(30))
            ->orderBy('fecha_vencimiento')
            ->get();
        $precios = $this->preciosBase($stocks->pluck('producto')->filter()->unique('id'));

        return $stocks->map(function ($stock) use ($hoy, $precios) {
            $vence = $stock->fecha_vencimiento->copy()->startOfDay();
            $dias  = (int) $hoy->diffInDays($vence, false);
            $costo = $precios[$stock->producto_id]['costo'] ?? 0;

            return [
                'producto_id'       => $stock->producto_id,
                'codigo'            => $this->codigo($stock->producto),
                'nombre_producto'   => $stock->producto->nombre,
                'almacen'           => $stock->almacen?->nombre ?? 'N/A',
                'categoria'         => $stock->producto->categoria?->nombre ?? 'N/A',
                'lote'              => $stock->lote ?? '',
                'cantidad'          => (float) $stock->cantidad,
                'fecha_vencimiento' => $vence->format('d/m/Y'),
                'dias_para_vencer'  => $dias,
                'estado'            => $dias < 0 ? 'VENCIDO' : ($dias === 0 ? 'VENCE HOY' : 'PRÓXIMO A VENCER'),
                'precio_compra'     => $costo,
                'valor_total'       => (float) $stock->cantidad * $costo,
            ];
        });
    }

    /**
     * Movimientos de un producto en el período (por defecto, el último año), con el saldo del lote tras cada uno
     */
    public function obtenerKardex(array $filtros): Collection
    {
        if (empty($filtros['producto_id']) || ! Producto::find($filtros['producto_id'], ['id'])) {
            return collect(); // Sin producto o de otra empresa
        }

        $desde = $filtros['fecha_desde'] ?? now()->subYear()->toDateString();
        $hasta = $filtros['fecha_hasta'] ?? now()->toDateString();

        return MovimientoInventario::with(['stockProductoHistorico.almacen:id,nombre', 'user:id,name'])
            ->whereHas('stockProductoHistorico', fn ($q) => $q->where('producto_id', $filtros['producto_id'])
                ->whereIn('almacen_id', $this->almacenesFiltro($filtros)))
            ->whereDate('fecha', '>=', $desde)
            ->whereDate('fecha', '<=', $hasta)
            ->orderBy('id') // Orden de registro: la fecha de una transferencia es la del documento
            ->get()
            ->map(fn ($mov) => [
                'fecha'           => $mov->fecha?->format('d/m/Y H:i'),
                'almacen'         => $mov->stockProductoHistorico->almacen?->nombre ?? 'N/A',
                'tipo_movimiento' => MovimientoInventario::nombreTipoLegible($mov->tipo),
                'cantidad'        => (float) $mov->cantidad,
                'saldo_lote'      => (float) $mov->cantidad_posterior,
                'motivo'          => MovimientoInventario::observacionLegible($mov->observacion, $mov->tipo) ?? '',
                'usuario'         => $mov->user?->name ?? 'Sistema',
                'referencia'      => $mov->numero_documento ?? '',
                'observaciones'   => '',
            ]);
    }

    /**
     * Rotación: productos con más movimientos en el período (por defecto el último mes)
     */
    public function obtenerRotacion(array $filtros): Collection
    {
        $desde = $filtros['fecha_desde'] ?? now()->subMonth()->toDateString();
        $hasta = $filtros['fecha_hasta'] ?? now()->toDateString();

        $filas = DB::table('movimientos_inventario as m')
            ->join('stock_productos as sp', 'm.stock_producto_id', '=', 'sp.id')
            ->join('productos as p', 'sp.producto_id', '=', 'p.id')
            ->leftJoin('categorias as c', 'p.categoria_id', '=', 'c.id')
            ->where('p.empresa_id', auth()->user()?->empresa_id)
            ->whereIn('sp.almacen_id', $this->almacenesFiltro($filtros))
            ->when(! empty($filtros['categoria_id']), fn ($q) => $q->where('p.categoria_id', $filtros['categoria_id']))
            ->whereNull('m.deleted_at')
            ->whereRaw('DATE(m.fecha) BETWEEN ? AND ?', [$desde, $hasta])
            ->groupBy('p.id', 'p.nombre', 'p.sku', 'c.nombre')
            ->selectRaw("p.id, p.nombre, p.sku, c.nombre as categoria,
                COUNT(*) as total_movimientos,
                SUM(ABS(m.cantidad)) as cantidad_total,
                COALESCE(-SUM(m.cantidad) FILTER (WHERE m.tipo IN ('SALIDA_VENTA', 'CONSUMO_RESERVA')), 0) as vendido,
                MAX(m.fecha) as ultima")
            ->orderByDesc('total_movimientos')
            ->limit(500)
            ->get();

        // Código principal en una sola consulta (un JOIN a codigos_barra duplicaba filas y conteos)
        $codigos = DB::table('codigos_barra')->whereIn('producto_id', $filas->pluck('id'))->where('activo', true)
            ->orderByDesc('es_principal')->get(['producto_id', 'codigo'])->unique('producto_id')->pluck('codigo', 'producto_id');

        return $filas->map(fn ($f) => [
            'producto_id'             => $f->id,
            'codigo'                  => $codigos[$f->id] ?? ($f->sku ?? ''),
            'nombre_producto'         => $f->nombre,
            'categoria'               => $f->categoria ?? 'N/A',
            'total_movimientos'       => (int) $f->total_movimientos,
            'cantidad_vendida'        => (float) $f->vendido,
            'cantidad_total_movida'   => (float) $f->cantidad_total,
            'promedio_por_movimiento' => $f->total_movimientos ? round($f->cantidad_total / $f->total_movimientos, 2) : 0,
            'ultima_fecha_movimiento' => \Carbon\Carbon::parse($f->ultima)->format('d/m/Y'),
            'rotacion_clasificacion'  => $this->clasificarRotacion((int) $f->total_movimientos),
        ]);
    }

    /**
     * Clasificar el nivel de rotación según la cantidad de movimientos
     */
    private function clasificarRotacion(int $totalMovimientos): string
    {
        if ($totalMovimientos >= 20) {
            return 'A - Alta Rotación';
        } elseif ($totalMovimientos >= 10) {
            return 'B - Rotación Media';
        } elseif ($totalMovimientos >= 5) {
            return 'C - Rotación Baja';
        } else {
            return 'D - Mínima Rotación';
        }
    }
}
