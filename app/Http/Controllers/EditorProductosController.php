<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\Categoria;
use App\Models\CodigoBarra;
use App\Models\Marca;
use App\Models\MovimientoInventario;
use App\Models\PrecioProducto;
use App\Models\Producto;
use App\Models\Sector;
use App\Models\StockLimite;
use App\Models\StockProducto;
use App\Models\TipoPrecio;
use App\Models\UnidadMedida;
use App\Services\CodigosBarraCacheService;
use App\Services\Stock\MovimientoStockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Editor de productos tipo planilla: una fila por producto + almacén + sector
 * (las ubicaciones salen de stock_productos y stock_limites).
 *
 * Edita datos del producto (nombre, categoría, marca, unidad), precios por tipo,
 * límites mín/máx (stock_limites) y stock (stock_productos). Los cambios de stock se
 * registran como ajuste de inventario (MovimientoStockService), igual que
 * Actualizar Stock Masivo, así queda trazabilidad.
 */
class EditorProductosController extends Controller
{
    private const POR_PAGINA = 50;

    public function __construct(private MovimientoStockService $movimientoStockService) {}

    public function index(): Response
    {
        $empresaId = auth()->user()->empresa_id;
        $almacenes = Almacen::where('empresa_id', $empresaId)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('inventario/EditorProductos', [
            'opciones' => [
                'almacenes'   => $almacenes,
                'sectores'    => Sector::whereIn('almacen_id', $almacenes->pluck('id'))->orderBy('nombre')->get(['id', 'nombre', 'almacen_id']),
                'categorias'  => Categoria::query()->when(
                    \Illuminate\Support\Facades\Schema::hasColumn('categorias', 'empresa_id'),
                    fn($q) => $q->where('empresa_id', $empresaId)
                )->orderBy('nombre')->get(['id', 'nombre']),
                'marcas'      => Marca::where('empresa_id', $empresaId)->orderBy('nombre')->get(['id', 'nombre']),
                // Unidades de la empresa + las que usan sus productos aunque sean de otra empresa
                // (datos importados): así se ven y se pueden corregir, marcadas como "ajena"
                'unidades'    => UnidadMedida::where('empresa_id', $empresaId)
                    ->orWhereIn('id', Producto::where('empresa_id', $empresaId)->whereNotNull('unidad_medida_id')->distinct()->select('unidad_medida_id'))
                    ->orderBy('nombre')
                    ->get(['id', 'nombre', 'codigo', 'empresa_id'])
                    ->map(fn($u) => ['id' => $u->id, 'nombre' => $u->nombre, 'codigo' => $u->codigo, 'ajena' => (int) $u->empresa_id !== (int) $empresaId]),
                'tiposPrecio' => TipoPrecio::where('empresa_id', $empresaId)->where('activo', true)
                    ->orderBy('orden')->orderBy('id')->get(['id', 'codigo', 'nombre']),
            ],
        ]);
    }

    /**
     * GET datos: filas paginadas con filtros.
     * Filtros: q, almacen_id, sector_id, categoria_id, marca_id, unidad_id,
     * stock (sin_stock | con_stock | bajo_minimo | sobre_maximo), sin_precio (tipo_precio_id).
     */
    public function datos(Request $request): JsonResponse
    {
        $empresaId  = auth()->user()->empresa_id;
        $almacenIds = Almacen::where('empresa_id', $empresaId)->pluck('id')->all();

        // Ubicaciones de cada producto: donde tiene stock (lotes vigentes) o un límite definido
        $ubicaciones = DB::table('stock_productos')
            ->select('producto_id', 'almacen_id', 'sector_id')
            ->whereNull('deleted_at')
            ->whereIn('almacen_id', $almacenIds)
            ->union(
                DB::table('stock_limites')->select('producto_id', 'almacen_id', 'sector_id')->whereIn('almacen_id', $almacenIds)
            );

        $stock = DB::table('stock_productos')
            ->selectRaw('producto_id, almacen_id, sector_id, SUM(cantidad) AS cantidad, SUM(cantidad_disponible) AS disponible, COUNT(*) AS lotes')
            ->whereNull('deleted_at')
            ->groupBy('producto_id', 'almacen_id', 'sector_id');

        $query = DB::table('productos as p')
            ->leftJoinSub($ubicaciones, 'u', 'u.producto_id', '=', 'p.id')
            ->leftJoinSub($stock, 's', fn($j) => $j->on('s.producto_id', '=', 'p.id')
                ->on('s.almacen_id', '=', 'u.almacen_id')
                ->whereRaw('s.sector_id IS NOT DISTINCT FROM u.sector_id'))
            ->leftJoin('stock_limites as l', fn($j) => $j->on('l.producto_id', '=', 'p.id')
                ->on('l.almacen_id', '=', 'u.almacen_id')
                ->on('l.sector_id', '=', 'u.sector_id'))
            ->leftJoin('almacenes as a', 'a.id', '=', 'u.almacen_id')
            ->leftJoin('sectores as sec', 'sec.id', '=', 'u.sector_id')
            ->where('p.empresa_id', $empresaId)
            ->where('p.activo', true)
            ->select([
                'p.id as producto_id', 'p.nombre', 'p.sku', 'p.categoria_id', 'p.marca_id', 'p.unidad_medida_id', 'p.es_fraccionado',
                'u.almacen_id', 'a.nombre as almacen', 'u.sector_id', 'sec.nombre as sector',
                DB::raw('COALESCE(s.cantidad, 0) AS stock'), DB::raw('COALESCE(s.disponible, 0) AS disponible'), DB::raw('COALESCE(s.lotes, 0) AS lotes'),
                'l.stock_minimo', 'l.stock_maximo',
            ]);

        if ($q = trim((string) $request->input('q'))) {
            $query->where(function ($w) use ($q) {
                if (ctype_digit($q)) {
                    $w->where('p.id', (int) $q);
                }
                $w->orWhere('p.nombre', 'ILIKE', "%{$q}%")
                    ->orWhere('p.sku', 'ILIKE', "%{$q}%")
                    ->orWhereExists(fn($e) => $e->from('codigos_barra as cb')
                        ->whereColumn('cb.producto_id', 'p.id')
                        ->where('cb.codigo', 'ILIKE', "%{$q}%"));
            });
        }
        foreach (['almacen_id' => 'u.almacen_id', 'sector_id' => 'u.sector_id', 'categoria_id' => 'p.categoria_id', 'marca_id' => 'p.marca_id', 'unidad_id' => 'p.unidad_medida_id'] as $param => $columna) {
            if ($request->filled($param)) {
                $query->where($columna, (int) $request->input($param));
            }
        }
        match ($request->input('stock')) {
            'sin_stock'    => $query->whereRaw('COALESCE(s.cantidad, 0) <= 0'),
            'con_stock'    => $query->whereRaw('COALESCE(s.cantidad, 0) > 0'),
            'bajo_minimo'  => $query->whereNotNull('l.stock_minimo')->whereRaw('COALESCE(s.cantidad, 0) < l.stock_minimo'),
            'sobre_maximo' => $query->whereNotNull('l.stock_maximo')->where('l.stock_maximo', '<', 999999)->whereRaw('COALESCE(s.cantidad, 0) > l.stock_maximo'),
            default        => null,
        };
        if ($request->filled('sin_precio')) {
            $query->whereNotExists(fn($e) => $e->from('precios_producto as pp')
                ->whereColumn('pp.producto_id', 'p.id')
                ->where('pp.tipo_precio_id', (int) $request->input('sin_precio'))
                ->where('pp.activo', true)
                ->where('pp.precio', '>', 0));
        }

        $pagina = $query->orderBy('p.nombre')->orderBy('p.id')->orderBy('a.nombre')->orderBy('sec.nombre')
            ->paginate(self::POR_PAGINA);

        // Precios de los productos de la página: el de la unidad del producto (o sin unidad)
        $productoIds = collect($pagina->items())->pluck('producto_id')->unique();
        $precios     = PrecioProducto::whereIn('producto_id', $productoIds)
            ->where('activo', true)
            ->orderByRaw('unidad_medida_id IS NULL') // con unidad primero; se filtra abajo
            ->get(['id', 'producto_id', 'tipo_precio_id', 'unidad_medida_id', 'precio'])
            ->groupBy('producto_id');

        // Código de barras principal (activo) de cada producto de la página
        $codigos = CodigoBarra::whereIn('producto_id', $productoIds)
            ->where('activo', true)
            ->orderByDesc('es_principal')
            ->orderBy('id')
            ->get(['producto_id', 'codigo'])
            ->unique('producto_id')
            ->pluck('codigo', 'producto_id');

        $filas = collect($pagina->items())->map(function ($f) use ($precios, $codigos) {
            $porTipo = [];
            foreach ($precios[$f->producto_id] ?? [] as $p) {
                // Precio por la unidad del producto; si no hay, el que no tiene unidad
                if ($p->unidad_medida_id && $p->unidad_medida_id != $f->unidad_medida_id) {
                    continue;
                }
                $porTipo[$p->tipo_precio_id] ??= ['id' => $p->id, 'precio' => (float) $p->precio];
            }

            return [
                'producto_id'      => $f->producto_id,
                'nombre'           => $f->nombre,
                'sku'              => $f->sku,
                'codigo_barras'    => $codigos[$f->producto_id] ?? null,
                'categoria_id'     => $f->categoria_id,
                'marca_id'         => $f->marca_id,
                'unidad_medida_id' => $f->unidad_medida_id,
                'es_fraccionado'   => (bool) $f->es_fraccionado,
                'almacen_id'       => $f->almacen_id,
                'almacen'          => $f->almacen,
                'sector_id'        => $f->sector_id,
                'sector'           => $f->sector,
                'stock'            => (float) $f->stock,
                'disponible'       => (float) $f->disponible,
                'lotes'            => (int) $f->lotes,
                'stock_minimo'     => $f->stock_minimo !== null ? (int) $f->stock_minimo : null,
                'stock_maximo'     => $f->stock_maximo !== null ? (int) $f->stock_maximo : null,
                'precios'          => (object) $porTipo,
            ];
        });

        return response()->json([
            'filas'      => $filas,
            'pagina'     => $pagina->currentPage(),
            'paginas'    => $pagina->lastPage(),
            'total'      => $pagina->total(),
            'por_pagina' => self::POR_PAGINA,
        ]);
    }

    /**
     * POST guardar: aplica todos los cambios en UNA transacción (todo o nada).
     *
     * productos: { [id]: {nombre?, categoria_id?, marca_id?, unidad_medida_id?} }
     * precios:   [{producto_id, tipo_precio_id, precio}]
     * limites:   [{producto_id, almacen_id, sector_id, stock_minimo, stock_maximo}]
     * stocks:    [{producto_id, almacen_id, sector_id, cantidad_actual, cantidad_nueva}]
     */
    public function guardar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'productos'                    => 'array',
            'productos.*.nombre'           => 'sometimes|string|min:1|max:255',
            'productos.*.categoria_id'     => 'sometimes|nullable|integer|exists:categorias,id',
            'productos.*.marca_id'         => 'sometimes|nullable|integer|exists:marcas,id',
            'productos.*.unidad_medida_id' => 'sometimes|integer|exists:unidades_medida,id',
            'productos.*.codigo_barras'    => 'sometimes|nullable|string|max:255',
            'precios'                      => 'array',
            'precios.*.producto_id'        => 'required|integer',
            'precios.*.tipo_precio_id'     => 'required|integer',
            'precios.*.precio'             => 'required|numeric|min:0',
            'limites'                      => 'array',
            'limites.*.producto_id'        => 'required|integer',
            'limites.*.almacen_id'         => 'required|integer',
            'limites.*.sector_id'          => 'required|integer',
            'limites.*.stock_minimo'       => 'required|integer|min:0',
            'limites.*.stock_maximo'       => 'required|integer|min:0',
            'stocks'                       => 'array',
            'stocks.*.producto_id'         => 'required|integer',
            'stocks.*.almacen_id'          => 'required|integer',
            'stocks.*.sector_id'           => 'required|integer',
            'stocks.*.cantidad_actual'     => 'required|numeric',
            'stocks.*.cantidad_nueva'      => 'required|numeric|min:0',
        ]);

        $empresaId  = auth()->user()->empresa_id;
        $almacenIds = Almacen::where('empresa_id', $empresaId)->pluck('id')->all();
        $sectores   = Sector::whereIn('almacen_id', $almacenIds)->pluck('almacen_id', 'id');
        $tipos      = TipoPrecio::where('empresa_id', $empresaId)->pluck('codigo', 'id');

        // Global scope de empresa: solo productos propios
        $idsProductos = collect(array_keys($data['productos'] ?? []))
            ->merge(collect($data['precios'] ?? [])->pluck('producto_id'))
            ->merge(collect($data['limites'] ?? [])->pluck('producto_id'))
            ->merge(collect($data['stocks'] ?? [])->pluck('producto_id'))
            ->map(fn($id) => (int) $id)->unique();
        $productos = Producto::whereIn('id', $idsProductos)->withCount('conversiones')->get()->keyBy('id');

        // ── 1) Validar todo antes de escribir ──
        $errores    = [];
        $ubicacion  = function (array $c) use ($almacenIds, $sectores): bool {
            return in_array((int) $c['almacen_id'], $almacenIds, true)
                && (int) ($sectores[(int) $c['sector_id']] ?? 0) === (int) $c['almacen_id'];
        };
        $nombre = fn($id) => isset($productos[$id]) ? "#{$id} {$productos[$id]->nombre}" : "#{$id}";

        foreach ($idsProductos as $id) {
            if (! isset($productos[$id])) {
                $errores[] = "Producto #{$id} no encontrado en su empresa";
            }
        }
        foreach ($data['productos'] ?? [] as $id => $cambios) {
            $p = $productos[(int) $id] ?? null;
            if ($p && array_key_exists('unidad_medida_id', $cambios)
                && (int) $cambios['unidad_medida_id'] !== (int) $p->unidad_medida_id
                && $p->conversiones_count > 0) {
                $errores[] = "{$nombre($p->id)}: tiene conversiones de unidad; cambia su unidad desde el formulario del producto";
            }
        }
        // Códigos de barra: el índice único (codigo, activo) es global, entre todas las empresas
        $codigosNuevos = [];
        foreach ($data['productos'] ?? [] as $id => $cambios) {
            if (! array_key_exists('codigo_barras', $cambios) || trim((string) $cambios['codigo_barras']) === '') {
                continue;
            }
            $codigo = trim((string) $cambios['codigo_barras']);
            if (isset($codigosNuevos[mb_strtolower($codigo)])) {
                $errores[] = "{$nombre((int) $id)}: el código {$codigo} también se asignó a {$nombre($codigosNuevos[mb_strtolower($codigo)])}";
                continue;
            }
            $codigosNuevos[mb_strtolower($codigo)] = (int) $id;

            $duenio = CodigoBarra::withoutGlobalScopes()
                ->whereRaw('LOWER(codigo) = ?', [mb_strtolower($codigo)])
                ->where('activo', true)
                ->where('producto_id', '!=', (int) $id)
                ->value('producto_id');
            if ($duenio) {
                // Global scope de empresa: solo se nombra el producto si es de la misma empresa
                $propio    = Producto::find($duenio);
                $errores[] = "{$nombre((int) $id)}: el código {$codigo} ya pertenece a "
                    . ($propio ? "#{$propio->id} {$propio->nombre}" : 'un producto de otra empresa');
            }
        }
        foreach ($data['precios'] ?? [] as $c) {
            if (! isset($tipos[(int) $c['tipo_precio_id']])) {
                $errores[] = "{$nombre($c['producto_id'])}: tipo de precio no válido";
            }
        }
        foreach ($data['limites'] ?? [] as $c) {
            if (! $ubicacion($c)) {
                $errores[] = "{$nombre($c['producto_id'])}: almacén/sector no válido";
            } elseif ($c['stock_maximo'] > 0 && $c['stock_minimo'] > $c['stock_maximo']) {
                $errores[] = "{$nombre($c['producto_id'])}: el mínimo ({$c['stock_minimo']}) supera al máximo ({$c['stock_maximo']})";
            }
        }
        foreach ($data['stocks'] ?? [] as $c) {
            $p = $productos[(int) $c['producto_id']] ?? null;
            if (! $ubicacion($c)) {
                $errores[] = "{$nombre($c['producto_id'])}: almacén/sector no válido";
                continue;
            }
            if ($p && ! $p->es_fraccionado && floor((float) $c['cantidad_nueva']) != (float) $c['cantidad_nueva']) {
                $errores[] = "{$nombre($p->id)}: no es fraccionado, el stock debe ser entero";
            }
            // Otro usuario o una venta pudo moverlo desde que se cargó la tabla
            $actual = $this->stockUbicacion((int) $c['producto_id'], (int) $c['almacen_id'], (int) $c['sector_id']);
            if (abs($actual - (float) $c['cantidad_actual']) > 0.0001) {
                $errores[] = "{$nombre($c['producto_id'])}: el stock cambió mientras editabas ({$this->num($c['cantidad_actual'])} → {$this->num($actual)}). Recarga la tabla.";
            }
        }
        if ($errores) {
            return response()->json(['success' => false, 'message' => 'No se guardó nada: revisa los errores', 'errores' => array_values(array_unique($errores))], 422);
        }

        // ── 2) Aplicar (todo o nada) ──
        try {
            $resumen = DB::transaction(function () use ($data, $productos) {
                $r = ['productos' => 0, 'precios' => 0, 'limites' => 0, 'stocks' => 0, 'movimientos' => 0];

                foreach ($data['productos'] ?? [] as $id => $cambios) {
                    $producto = $productos[(int) $id];
                    $campos   = array_intersect_key($cambios, array_flip(['nombre', 'categoria_id', 'marca_id', 'unidad_medida_id']));
                    if ($campos) {
                        $producto->update($campos);
                    }
                    if (array_key_exists('codigo_barras', $cambios)) {
                        $this->guardarCodigoBarras($producto, $cambios['codigo_barras']);
                    }
                    $r['productos']++;
                }

                foreach ($data['precios'] ?? [] as $c) {
                    $this->guardarPrecio($productos[(int) $c['producto_id']], (int) $c['tipo_precio_id'], (float) $c['precio']);
                    $r['precios']++;
                }

                foreach ($data['limites'] ?? [] as $c) {
                    StockLimite::updateOrCreate(
                        ['producto_id' => $c['producto_id'], 'almacen_id' => $c['almacen_id'], 'sector_id' => $c['sector_id']],
                        ['stock_minimo' => $c['stock_minimo'], 'stock_maximo' => $c['stock_maximo'] ?: 999999]
                    );
                    $r['limites']++;
                }

                foreach ($data['stocks'] ?? [] as $c) {
                    $r['movimientos'] += $this->ajustarStock(
                        $productos[(int) $c['producto_id']],
                        (int) $c['almacen_id'],
                        (int) $c['sector_id'],
                        (float) $c['cantidad_nueva']
                    );
                    $r['stocks']++;
                }

                return $r;
            });
        } catch (\Throwable $e) {
            Log::error('❌ [EditorProductos] Error al guardar', ['error' => $e->getMessage()]);

            return response()->json(['success' => false, 'message' => 'No se guardó nada: ' . $e->getMessage(), 'errores' => [$e->getMessage()]], 422);
        }

        return response()->json(['success' => true, 'message' => 'Cambios guardados', 'resumen' => $resumen]);
    }

    /**
     * Reemplaza el código de barras principal del producto (vacío = lo elimina) en
     * codigos_barra, que es lo que leen ventas y búsquedas (productos.codigo_barras es una
     * columna antigua y no está en $fillable). El observer de CodigoBarra deja el historial;
     * la caché código → producto se invalida.
     */
    private function guardarCodigoBarras(Producto $producto, ?string $codigo): void
    {
        $codigo    = trim((string) $codigo);
        $principal = CodigoBarra::where('producto_id', $producto->id)
            ->where('activo', true)
            ->orderByDesc('es_principal')
            ->orderBy('id')
            ->first();
        $anterior = $principal?->codigo;
        if ($anterior === $codigo) {
            return;
        }

        if ($codigo === '') {
            $principal?->delete();
        } elseif ($principal) {
            $principal->update(['codigo' => $codigo, 'tipo' => $this->tipoCodigo($codigo), 'es_principal' => true]);
        } else {
            CodigoBarra::create([
                'producto_id'  => $producto->id,
                'codigo'       => $codigo,
                'tipo'         => $this->tipoCodigo($codigo),
                'es_principal' => true,
                'activo'       => true,
            ]);
        }

        $cache = new CodigosBarraCacheService();
        foreach (array_filter([$anterior, $codigo]) as $c) {
            $cache->invalidarCodigo($c);
        }
    }

    /** EAN si son 8 o 13 dígitos (como los códigos de producto comerciales); si no, BARCODE. */
    private function tipoCodigo(string $codigo): string
    {
        return preg_match('/^(\d{8}|\d{13})$/', $codigo) ? 'EAN' : 'BARCODE';
    }

    /** Edita el precio del tipo en la unidad del producto (o sin unidad); si no existe lo crea. */
    private function guardarPrecio(Producto $producto, int $tipoPrecioId, float $precio): void
    {
        $existente = PrecioProducto::where('producto_id', $producto->id)
            ->where('tipo_precio_id', $tipoPrecioId)
            ->where(fn($q) => $q->whereNull('unidad_medida_id')->orWhere('unidad_medida_id', $producto->unidad_medida_id))
            ->orderByDesc('activo')
            ->orderByRaw('unidad_medida_id IS NULL')
            ->first();

        if ($existente) {
            // El observer guarda el historial del cambio de precio
            $existente->update([
                'precio'                     => $precio,
                'activo'                     => true,
                'motivo_cambio'              => 'Editor de productos',
                'fecha_ultima_actualizacion' => now(),
            ]);

            return;
        }

        PrecioProducto::create([
            'producto_id'                => $producto->id,
            'tipo_precio_id'             => $tipoPrecioId,
            'nombre'                     => TipoPrecio::find($tipoPrecioId)?->nombre,
            'precio'                     => $precio,
            'unidad_medida_id'           => $producto->unidad_medida_id,
            'activo'                     => true,
            'es_precio_base'             => false,
            'fecha_inicio'               => now(),
            'motivo_cambio'              => 'Editor de productos',
            'fecha_ultima_actualizacion' => now(),
        ]);
    }

    /**
     * Lleva el stock de la ubicación a $nueva registrando ajustes de inventario.
     * Sube: en el registro sin lote ni vencimiento (o el primero; si no hay, lo crea).
     * Baja: descuenta de los lotes con disponible, primero los que vencen antes.
     *
     * @return int movimientos creados
     */
    private function ajustarStock(Producto $producto, int $almacenId, int $sectorId, float $nueva): int
    {
        $actual     = $this->stockUbicacion($producto->id, $almacenId, $sectorId);
        $diferencia = round($nueva - $actual, 4);
        if ($diferencia == 0) {
            return 0;
        }

        $lotes = StockProducto::where('producto_id', $producto->id)
            ->where('almacen_id', $almacenId)
            ->where('sector_id', $sectorId)
            ->orderByRaw('fecha_vencimiento IS NULL, fecha_vencimiento')
            ->orderBy('id')
            ->get();

        $metadata = fn(StockProducto $lote, float $cantidad) => [
            'producto_id'     => $producto->id,
            'producto_nombre' => $producto->nombre,
            'lote'            => $lote->lote ?? 'null',
            'stock_anterior'  => $actual,
            'stock_nuevo'     => $nueva,
            'tipo_ajuste'     => 'Editor de productos',
            'fecha_carga'     => now()->toDateTimeString(),
        ];
        $documento = 'AJUSTE-EDITOR-' . date('Ymd-His');

        if ($diferencia > 0) {
            $lote = $lotes->first(fn($l) => ! $l->lote && ! $l->fecha_vencimiento) ?? $lotes->first()
                ?? StockProducto::create([
                    'producto_id'         => $producto->id,
                    'almacen_id'          => $almacenId,
                    'sector_id'           => $sectorId,
                    'cantidad'            => 0,
                    'cantidad_reservada'  => 0,
                    'cantidad_disponible' => 0,
                    'fecha_actualizacion' => now(),
                ]);

            $this->movimientoStockService->registrarMovimientoYActualizar(
                stockProductoId: $lote->id,
                cantidad: $diferencia,
                tipo: MovimientoInventario::TIPO_AJUSTE_MASIVO,
                referencia_tipo: 'ajuste_editor_productos',
                referencia_id: $producto->id,
                metadataAdicional: $metadata($lote, $diferencia),
                numeroDocumento: $documento,
            );

            return 1;
        }

        $porDescontar = -$diferencia;
        $movimientos  = 0;
        foreach ($lotes as $lote) {
            $tomar = min($porDescontar, (float) $lote->cantidad_disponible);
            if ($tomar <= 0) {
                continue;
            }
            $this->movimientoStockService->registrarMovimientoYActualizar(
                stockProductoId: $lote->id,
                cantidad: -$tomar,
                tipo: MovimientoInventario::TIPO_SALIDA_AJUSTE,
                referencia_tipo: 'ajuste_editor_productos',
                referencia_id: $producto->id,
                metadataAdicional: $metadata($lote, -$tomar),
                numeroDocumento: $documento,
            );
            $movimientos++;
            $porDescontar = round($porDescontar - $tomar, 4);
            if ($porDescontar <= 0) {
                break;
            }
        }

        if ($porDescontar > 0) {
            throw new \RuntimeException(
                "#{$producto->id} {$producto->nombre}: no se puede bajar a {$this->num($nueva)}, hay "
                . $this->num($porDescontar) . ' reservado(s) en proformas'
            );
        }

        return $movimientos;
    }

    private function stockUbicacion(int $productoId, int $almacenId, int $sectorId): float
    {
        return (float) StockProducto::where('producto_id', $productoId)
            ->where('almacen_id', $almacenId)
            ->where('sector_id', $sectorId)
            ->sum('cantidad');
    }

    private function num(float|string $n): string
    {
        $n = (float) $n;

        return $n == floor($n) ? (string) (int) $n : rtrim(rtrim(number_format($n, 4, '.', ''), '0'), '.');
    }
}
