<?php

namespace App\Services\Producto;

use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Marca;
use App\Models\PrecioProducto;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\StockProducto;
use App\Models\TipoPrecio;
use App\Models\UnidadMedida;
use App\Services\Producto\Concerns\LeePlanilla;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Carga y descarga masiva de productos de UNA empresa mediante una planilla Excel.
 * Pensado también para migrar una empresa nueva: se elige la empresa destino con paraEmpresa().
 *
 * Flujo: descargar planilla → editar en Excel → validar → importar.
 * - La fila se identifica por SKU: si existe en la empresa se actualiza; si no existe (o está vacío) se crea.
 * - Celda vacía en un producto existente = no se modifica ese campo.
 * - La importación es todo o nada: si alguna fila tiene errores no se guarda nada.
 * - Categorías, marcas, unidades y tipos de precio (COSTO/VENTA) se buscan primero en la empresa y luego entre
 *   los compartidos (empresa_id NULL); solo si no existen en ninguno se crean en la empresa destino.
 * - Precios: tabla precios_producto (relación Producto::precios), tipo COSTO (es_precio_base) y VENTA,
 *   en la unidad base del producto (unidad_medida_id NULL).
 * - La columna "Stock actual" de la hoja Productos es solo informativa. El stock se carga (opcionalmente)
 *   desde la hoja "Stock" del mismo archivo: ver PlanillaStockService.
 */
class ProductoPlanillaService
{
    use LeePlanilla;

    public const MAX_FILAS = 5000;
    public const HOJA = 'Productos';

    /** clave interna => encabezado en la planilla */
    public const COLUMNAS = [
        'sku'          => 'SKU',
        'nombre'       => 'Nombre',
        'descripcion'  => 'Descripción',
        'categoria'    => 'Categoría',
        'marca'        => 'Marca',
        'proveedor'    => 'Proveedor',
        'unidad'       => 'Unidad',
        'precio_costo' => 'Precio costo',
        'precio_venta' => 'Precio venta',
        'stock_minimo' => 'Stock mínimo',
        'stock_maximo' => 'Stock máximo',
        'activo'       => 'Activo (SI/NO)',
        'stock_actual' => 'Stock actual (no se importa)',
    ];

    private ?Empresa $empresa = null;
    private ?TipoPrecio $tipoCosto = null;
    private ?TipoPrecio $tipoVenta = null;

    public function __construct(
        private PlanillaStockService $stock,
        private PlanillaCatalogosService $catalogos,
    ) {
    }

    /**
     * Fija la empresa sobre la que se descarga / carga.
     * También fija el tenant de la petición para que el scope global de Producto apunte a esa empresa.
     */
    public function paraEmpresa(Empresa $empresa): static
    {
        $this->empresa   = $empresa;
        $this->tipoCosto = null;
        $this->tipoVenta = null;
        $this->stock->paraEmpresa($empresa);
        $this->catalogos->paraEmpresa($empresa);
        app()->instance('tenant_id', $empresa->id);

        return $this;
    }

    private function empresaId(): int
    {
        if (! $this->empresa) {
            $empresa = Empresa::find(auth()->user()?->empresa_id);
            if (! $empresa) {
                throw new \RuntimeException('No se pudo determinar la empresa.');
            }
            $this->paraEmpresa($empresa);
        }

        return $this->empresa->id;
    }

    /** Productos de la empresa destino (sin depender del usuario autenticado). */
    private function productos()
    {
        return Producto::withoutGlobalScope('empresa')->where('empresa_id', $this->empresaId());
    }

    // ─────────────────────────────── Descarga ───────────────────────────────

    /**
     * Genera el .xlsx con los productos de la empresa.
     */
    public function descargar(bool $incluirInactivos = false): StreamedResponse
    {
        $filas = $this->filasExportacion($incluirInactivos);

        $libro = new Spreadsheet();
        $hoja  = $libro->getActiveSheet();
        $hoja->setTitle(self::HOJA);

        $hoja->fromArray(array_values(self::COLUMNAS), null, 'A1');
        $ultimaCol = $hoja->getHighestColumn();
        $hoja->getStyle("A1:{$ultimaCol}1")->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $hoja->getStyle("A1:{$ultimaCol}1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('4F46E5');

        foreach ($filas as $i => $fila) {
            $r = $i + 2;
            $hoja->fromArray($fila, null, "A{$r}", true);
            // SKU siempre como texto para no perder ceros a la izquierda
            $hoja->setCellValueExplicit("A{$r}", (string) ($fila[0] ?? ''), DataType::TYPE_STRING);
        }

        $ultimaFila = max(2, $filas->count() + 1);
        // Columna de stock (M): solo informativa, se ignora al importar
        $hoja->getStyle("M2:M{$ultimaFila}")->getFont()->getColor()->setRGB('888888');
        $hoja->getStyle("H2:I{$ultimaFila}")->getNumberFormat()->setFormatCode('#,##0.00');

        foreach ([ 'A' => 16, 'B' => 40, 'C' => 40, 'D' => 20, 'E' => 20, 'F' => 24, 'G' => 12,
                   'H' => 14, 'I' => 14, 'J' => 13, 'K' => 13, 'L' => 14, 'M' => 26 ] as $col => $ancho) {
            $hoja->getColumnDimension($col)->setWidth($ancho);
        }
        $hoja->freezePane('A2');
        $hoja->setAutoFilter("A1:{$ultimaCol}{$ultimaFila}");

        // Hojas "Stock" (un renglón por lote) y "Almacenes"
        $this->stock->agregarHojas($libro, $incluirInactivos);
        // Hojas de catálogos: Categorías, Marcas, Unidades, Proveedores
        $this->catalogos->agregarHojas($libro);
        $libro->setActiveSheetIndex(0);

        $slug  = \Illuminate\Support\Str::slug($this->empresa->nombre_comercial ?? ('empresa-' . $this->empresaId()));
        $nombre = "productos_{$slug}_" . now()->format('Y-m-d_His') . '.xlsx';
        $writer = new Xlsx($libro);

        return response()->stream(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $nombre . '"',
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
        ]);
    }

    /**
     * Filas de la planilla con los productos de la empresa.
     */
    public function filasExportacion(bool $incluirInactivos = false): Collection
    {
        $this->cargarTiposPrecio();

        $productos = $this->productos()
            ->with(['categoria:id,nombre', 'marca:id,nombre', 'proveedor:id,nombre', 'unidad:id,codigo,nombre'])
            ->when(! $incluirInactivos, fn($q) => $q->where('activo', true))
            ->orderBy('nombre')
            ->get();

        $ids = $productos->pluck('id');

        $stock = StockProducto::whereIn('producto_id', $ids)
            ->groupBy('producto_id')
            ->selectRaw('producto_id, SUM(cantidad_disponible) as total')
            ->pluck('total', 'producto_id');

        $precios = PrecioProducto::whereIn('producto_id', $ids)
            ->whereNull('unidad_medida_id')
            ->where('activo', true)
            ->whereIn('tipo_precio_id', array_filter([$this->tipoCosto?->id, $this->tipoVenta?->id]))
            ->get(['producto_id', 'tipo_precio_id', 'precio'])
            ->groupBy('producto_id');

        return $productos->values()->map(function (Producto $p) use ($stock, $precios) {
            $preciosProd = $precios->get($p->id, collect());
            $costo = $preciosProd->firstWhere('tipo_precio_id', $this->tipoCosto?->id)?->precio ?? $p->precio_compra;
            $venta = $preciosProd->firstWhere('tipo_precio_id', $this->tipoVenta?->id)?->precio ?? $p->precio_venta;

            return [
                $p->sku,
                $p->nombre,
                $p->descripcion,
                $p->categoria?->nombre,
                $p->marca?->nombre,
                $p->proveedor?->nombre,
                $p->unidad?->codigo ?? $p->unidad?->nombre,
                $costo !== null ? (float) $costo : null,
                $venta !== null ? (float) $venta : null,
                $p->stock_minimo,
                $p->stock_maximo,
                $p->activo ? 'SI' : 'NO',
                (float) ($stock[$p->id] ?? 0),
            ];
        });
    }

    // ─────────────────────────────── Carga ───────────────────────────────

    /**
     * Lee y valida la planilla sin guardar nada.
     *
     * @param bool $incluirStock Validar también la hoja "Stock"
     * @return array{filas: array, errores: array, resumen: array, nuevos: array, stock: ?array}
     */
    public function validar(UploadedFile $archivo, bool $incluirStock = false): array
    {
        $empresaId = $this->empresaId();
        $this->cargarTiposPrecio();

        $errores = [];
        $filas   = [];

        $libro     = IOFactory::load($archivo->getRealPath());
        $hojaProds = $libro->getSheetByName(self::HOJA) ?? $libro->getSheet(0);
        $hojaStock = $libro->getSheetByName(PlanillaStockService::HOJA);

        [$encabezados, $datos] = $this->leerHoja($hojaProds);

        $mapa = $this->mapearEncabezados($encabezados, self::COLUMNAS, ['activo' => 'activo']);
        if (! isset($mapa['nombre']) && ! isset($mapa['sku'])) {
            return $this->resultado([], [[
                'hoja'    => self::HOJA,
                'fila'    => 1,
                'sku'     => null,
                'nombre'  => null,
                'mensaje' => 'No se encontraron las columnas "SKU" y "Nombre". Usa la planilla descargada desde el sistema.',
            ]]);
        }

        if (count($datos) > self::MAX_FILAS) {
            return $this->resultado([], [[
                'hoja'    => self::HOJA,
                'fila'    => 0,
                'sku'     => null,
                'nombre'  => null,
                'mensaje' => 'La planilla tiene ' . count($datos) . ' filas. El máximo es ' . self::MAX_FILAS . '.',
            ]]);
        }

        // Productos de la empresa destino indexados por SKU
        $existentes = $this->productos()->whereNotNull('sku')
            ->with('unidad:id,codigo,nombre')
            ->get(['id', 'sku', 'nombre', 'unidad_medida_id'])
            ->keyBy(fn($p) => strtoupper($p->sku));

        // SKUs usados por OTRAS empresas (la columna sku es única en todo el sistema)
        $skusArchivo = collect($datos)
            ->map(fn($f) => $this->texto($f[$mapa['sku'] ?? -1] ?? null))
            ->filter()
            ->map(fn($s) => strtoupper($s))
            ->unique()
            ->values();
        $skusAjenos = $skusArchivo->isEmpty() ? collect() : Producto::withoutGlobalScope('empresa')
            ->whereIn(DB::raw('UPPER(sku)'), $skusArchivo->all())
            ->where(fn($q) => $q->where('empresa_id', '!=', $empresaId)->orWhereNull('empresa_id'))
            ->pluck('sku')
            ->map(fn($s) => strtoupper($s))
            ->flip();

        // Hojas de catálogos (se aplican ANTES que los productos al importar)
        $catalogos = $this->catalogos->validar($libro);
        $errores   = array_merge($errores, $catalogos['errores']);

        // Nombres/códigos que existirán tras aplicar los catálogos (nuevos o renombrados):
        // así la vista previa no los reporta como "se crearán" desde la hoja Productos.
        $porCatalogo = ['categorias' => [], 'marcas' => [], 'unidades' => [], 'proveedores' => []];
        foreach ($catalogos['cambios'] as $c) {
            foreach (['nombre', 'codigo'] as $campo) {
                if (isset($c['datos'][$campo])) {
                    $porCatalogo[$c['tipo']][$this->normalizar($c['datos'][$campo])] = true;
                }
            }
        }

        $unidades    = $this->propiosOCompartidos(UnidadMedida::class)->get();
        $categorias  = $this->catalogo(Categoria::class)->keys()->flip()->union($porCatalogo['categorias']);
        $marcas      = $this->catalogo(Marca::class)->keys()->flip()->union($porCatalogo['marcas']);
        $proveedores = $this->catalogo(Proveedor::class)->keys()->flip()->union($porCatalogo['proveedores']);

        $nuevos     = ['categorias' => [], 'marcas' => [], 'unidades' => [], 'proveedores' => []];
        $skusVistos = [];

        foreach ($datos as $i => $celdas) {
            $numFila = $i + 2; // +1 encabezado, +1 base 1
            $fila    = [];
            foreach ($mapa as $clave => $col) {
                $fila[$clave] = $celdas[$col] ?? null;
            }

            // Ignorar filas completamente vacías
            if (collect($fila)->except('stock_actual')->filter(fn($v) => $this->texto($v) !== null)->isEmpty()) {
                continue;
            }

            $erroresFila = [];

            $sku    = $this->texto($fila['sku'] ?? null);
            $sku    = $sku !== null ? strtoupper($sku) : null;
            $nombre = $this->texto($fila['nombre'] ?? null);

            $producto = $sku !== null ? $existentes->get($sku) : null;
            $accion   = $producto ? 'actualizar' : 'crear';

            if ($sku !== null) {
                if (mb_strlen($sku) > 20) {
                    $erroresFila[] = 'El SKU no puede tener más de 20 caracteres.';
                }
                if (isset($skusVistos[$sku])) {
                    $erroresFila[] = "SKU {$sku} repetido (ya aparece en la fila {$skusVistos[$sku]}).";
                }
                if (! $producto && isset($skusAjenos[$sku])) {
                    $erroresFila[] = "El SKU {$sku} ya lo usa otra empresa. Déjalo vacío para que se genere uno nuevo.";
                }
                $skusVistos[$sku] = $numFila;
            }

            if ($accion === 'crear' && $nombre === null) {
                $erroresFila[] = 'El nombre es obligatorio para productos nuevos.';
            }
            if ($nombre !== null && mb_strlen($nombre) > 255) {
                $erroresFila[] = 'El nombre no puede tener más de 255 caracteres.';
            }

            $precioCosto = $this->numero($fila['precio_costo'] ?? null, 'Precio costo', $erroresFila);
            $precioVenta = $this->numero($fila['precio_venta'] ?? null, 'Precio venta', $erroresFila);
            $stockMin    = $this->numero($fila['stock_minimo'] ?? null, 'Stock mínimo', $erroresFila, true);
            $stockMax    = $this->numero($fila['stock_maximo'] ?? null, 'Stock máximo', $erroresFila, true);

            if ($stockMin !== null && $stockMax !== null && $stockMax > 0 && $stockMin > $stockMax) {
                $erroresFila[] = 'El stock mínimo no puede ser mayor que el máximo.';
            }

            $activo = $this->booleano($fila['activo'] ?? null, $erroresFila);

            // Unidad: si no existe en la empresa se creará al importar
            $unidadTexto = $this->texto($fila['unidad'] ?? null);
            if ($unidadTexto !== null) {
                $unidadActual = $producto?->unidad;
                $esLaMisma    = $unidadActual && in_array($this->normalizar($unidadTexto), [
                    $this->normalizar($unidadActual->codigo),
                    $this->normalizar($unidadActual->nombre),
                ], true);

                if ($esLaMisma) {
                    // Unidad actual del producto (aunque esté inactiva): no se modifica
                    $unidadTexto = null;
                } elseif (! $this->buscarUnidad($unidades, $unidadTexto) && ! isset($porCatalogo['unidades'][$this->normalizar($unidadTexto)])) {
                    if (mb_strlen($unidadTexto) > 50) {
                        $erroresFila[] = 'La unidad no puede tener más de 50 caracteres.';
                    } else {
                        $nuevos['unidades'][$this->normalizar($unidadTexto)] = $unidadTexto;
                    }
                }
            }

            $categoria = $this->texto($fila['categoria'] ?? null);
            if ($categoria !== null && ! isset($categorias[$this->normalizar($categoria)])) {
                $nuevos['categorias'][$this->normalizar($categoria)] = $categoria;
            }
            $marca = $this->texto($fila['marca'] ?? null);
            if ($marca !== null && ! isset($marcas[$this->normalizar($marca)])) {
                $nuevos['marcas'][$this->normalizar($marca)] = $marca;
            }
            $proveedor = $this->texto($fila['proveedor'] ?? null);
            if ($proveedor !== null && mb_strlen($proveedor) > 255) {
                $erroresFila[] = 'El proveedor no puede tener más de 255 caracteres.';
            } elseif ($proveedor !== null && ! isset($proveedores[$this->normalizar($proveedor)])) {
                $nuevos['proveedores'][$this->normalizar($proveedor)] = $proveedor;
            }

            if ($erroresFila) {
                foreach ($erroresFila as $msg) {
                    $errores[] = ['hoja' => self::HOJA, 'fila' => $numFila, 'sku' => $sku, 'nombre' => $nombre, 'mensaje' => $msg];
                }
                continue;
            }

            $filas[] = [
                'fila'         => $numFila,
                'accion'       => $accion,
                'producto_id'  => $producto?->id,
                'sku'          => $sku,
                'nombre'       => $nombre ?? $producto?->nombre,
                'descripcion'  => $this->texto($fila['descripcion'] ?? null),
                'categoria'    => $categoria,
                'marca'        => $marca,
                'proveedor'    => $proveedor,
                'unidad'       => $unidadTexto,
                'precio_costo' => $precioCosto,
                'precio_venta' => $precioVenta,
                'stock_minimo' => $stockMin,
                'stock_maximo' => $stockMax,
                'activo'       => $activo,
            ];
        }

        // Tipos de precio que faltan en la empresa (se crean al importar si hay precios)
        $nuevos['tipos_precio'] = [];
        if (! $this->tipoCosto && collect($filas)->whereNotNull('precio_costo')->isNotEmpty()) {
            $nuevos['tipos_precio'][] = 'COSTO';
        }
        if (! $this->tipoVenta && collect($filas)->whereNotNull('precio_venta')->isNotEmpty()) {
            $nuevos['tipos_precio'][] = 'VENTA';
        }

        $nuevos['categorias'] = array_values($nuevos['categorias']);
        $nuevos['marcas']     = array_values($nuevos['marcas']);
        $nuevos['unidades']   = array_values($nuevos['unidades']);
        $nuevos['proveedores'] = array_values($nuevos['proveedores']);

        // Hoja Stock: puede referirse a productos existentes o a los que esta misma carga crea (por SKU)
        $stock = null;
        if ($incluirStock) {
            $skusACrear = collect($filas)->where('accion', 'crear')->pluck('sku')->filter()->values()->all();
            $stock      = $this->stock->validar($hojaStock, $existentes, $skusACrear);
            $errores    = array_merge($errores, $stock['errores']);
        }

        return $this->resultado($filas, $errores, $nuevos, $stock) + [
            'catalogos' => [
                'cambios' => $catalogos['cambios'],
                'resumen' => $catalogos['resumen'],
                'nuevos'  => $catalogos['nuevos'],
            ],
        ];
    }

    /**
     * Valida y, si no hay errores, guarda productos (y stock si se pide) en una sola transacción.
     */
    public function importar(UploadedFile $archivo, bool $incluirStock = false): array
    {
        $validacion = $this->validar($archivo, $incluirStock);
        if ($validacion['errores']) {
            return $validacion + ['importado' => false];
        }

        $empresaId = $this->empresaId();
        $documento = 'PLANILLA-' . now()->format('YmdHis');

        DB::transaction(function () use ($validacion, $empresaId, $incluirStock, $documento, $archivo) {
            // 1) Catálogos primero, para que los productos encuentren lo creado / renombrado
            $this->catalogos->aplicar($validacion['catalogos']['cambios']);

            $this->asegurarTiposPrecio($validacion['nuevos']['tipos_precio']);

            $categorias  = $this->catalogo(Categoria::class);
            $marcas      = $this->catalogo(Marca::class);
            $proveedores = $this->catalogo(Proveedor::class);
            $unidades    = $this->propiosOCompartidos(UnidadMedida::class)->get();

            foreach ($validacion['filas'] as $f) {
                $datos = array_filter([
                    'nombre'       => $f['nombre'],
                    'descripcion'  => $f['descripcion'],
                    'stock_minimo' => $f['stock_minimo'],
                    'stock_maximo' => $f['stock_maximo'],
                    'activo'       => $f['activo'],
                ], fn($v) => $v !== null);

                if ($f['categoria'] !== null) {
                    $datos['categoria_id'] = $this->buscarOCrear($categorias, Categoria::class, $f['categoria']);
                }
                if ($f['marca'] !== null) {
                    $datos['marca_id'] = $this->buscarOCrear($marcas, Marca::class, $f['marca']);
                }
                if ($f['proveedor'] !== null) {
                    $datos['proveedor_id'] = $this->buscarOCrear($proveedores, Proveedor::class, $f['proveedor']);
                }
                if ($f['unidad'] !== null) {
                    $unidad = $this->buscarUnidad($unidades, $f['unidad']) ?? $this->crearUnidad($unidades, $f['unidad']);
                    $datos['unidad_medida_id'] = $unidad->id;
                }

                if ($f['accion'] === 'actualizar') {
                    $producto = $this->productos()->findOrFail($f['producto_id']);
                    $producto->update($datos);
                } else {
                    // Si el SKU viene vacío, el modelo lo genera en el evento created
                    $producto = Producto::create($datos + [
                        'sku'        => $f['sku'],
                        'empresa_id' => $empresaId,
                        'activo'     => $f['activo'] ?? true,
                    ]);
                }

                if ($f['precio_costo'] !== null) {
                    $this->guardarPrecio($producto, $this->tipoCosto, $f['precio_costo']);
                }
                if ($f['precio_venta'] !== null) {
                    $this->guardarPrecio($producto, $this->tipoVenta, $f['precio_venta']);
                }
            }

            if ($incluirStock && $validacion['stock']['filas']) {
                // Recargar por SKU para incluir los productos recién creados
                $productosPorSku = $this->productos()->whereNotNull('sku')->get(['id', 'sku'])
                    ->keyBy(fn($p) => strtoupper($p->sku));

                $this->stock->aplicar($validacion['stock']['filas'], $productosPorSku, $documento, $archivo->getClientOriginalName());
            }
        });

        return $validacion + ['importado' => true, 'documento' => $documento];
    }

    // ─────────────────────────────── Catálogos ───────────────────────────────

    /**
     * Registros de la empresa o compartidos (empresa_id NULL), con los propios primero.
     * Hay bases donde tipos de precio y unidades son globales y otras donde son por empresa.
     */
    private function propiosOCompartidos(string $modelo)
    {
        return $modelo::where(fn($q) => $q->where('empresa_id', $this->empresaId())->orWhereNull('empresa_id'))
            ->orderByRaw('empresa_id IS NULL'); // false (propios) antes que true (compartidos)
    }

    private function cargarTiposPrecio(): void
    {
        $this->tipoCosto ??= $this->propiosOCompartidos(TipoPrecio::class)->precioBase()->first();
        $this->tipoVenta ??= $this->propiosOCompartidos(TipoPrecio::class)->where('codigo', 'VENTA')->first();
    }

    /**
     * Crea en la empresa destino los tipos de precio que falten, copiando la configuración
     * del mismo tipo de otra empresa cuando existe.
     */
    private function asegurarTiposPrecio(array $codigos): void
    {
        foreach ($codigos as $codigo) {
            $modelo = TipoPrecio::where('codigo', $codigo)->where('empresa_id', '!=', $this->empresaId())->first();

            if ($modelo) {
                $tipo = $modelo->replicate();
                $tipo->empresa_id = $this->empresaId();
                $tipo->save();
            } else {
                $tipo = TipoPrecio::create([
                    'codigo'         => $codigo,
                    'nombre'         => $codigo === 'COSTO' ? 'Precio de Costo' : 'Precio Venta',
                    'es_precio_base' => $codigo === 'COSTO',
                    'es_ganancia'    => $codigo !== 'COSTO',
                    'activo'         => true,
                    'orden'          => $codigo === 'COSTO' ? 1 : 2,
                    'empresa_id'     => $this->empresaId(),
                ]);
            }

            if ($codigo === 'COSTO') {
                $this->tipoCosto = $tipo;
            } else {
                $this->tipoVenta = $tipo;
            }
        }
    }

    /**
     * Categorías / marcas visibles para la empresa, indexadas por nombre normalizado.
     * Incluye las compartidas (empresa_id NULL); si hay dos con el mismo nombre gana la de la empresa.
     */
    private function catalogo(string $modelo): Collection
    {
        return $modelo::where(fn($q) => $q->where('empresa_id', $this->empresaId())->orWhereNull('empresa_id'))
            ->orderByRaw('empresa_id IS NULL DESC') // primero las compartidas, luego las propias las sobrescriben
            ->get()
            ->keyBy(fn($m) => $this->normalizar($m->nombre));
    }

    /**
     * @param Collection $cache Colección indexada por nombre normalizado (se actualiza al crear)
     */
    private function buscarOCrear(Collection $cache, string $modelo, string $nombre): int
    {
        $clave = $this->normalizar($nombre);
        if (! $cache->has($clave)) {
            $datos = [
                'nombre'     => $nombre,
                'activo'     => true,
                'empresa_id' => $this->empresaId(),
            ];
            if ($modelo === Proveedor::class) {
                $datos['fecha_registro'] = now();
            }
            $cache->put($clave, $modelo::create($datos));
        }

        return $cache->get($clave)->id;
    }

    private function buscarUnidad(Collection $unidades, string $texto): ?UnidadMedida
    {
        $buscado = $this->normalizar($texto);

        return $unidades->first(fn($u) => $this->normalizar($u->codigo) === $buscado
            || $this->normalizar($u->nombre) === $buscado);
    }

    /**
     * Crea la unidad en la empresa destino; si otra empresa ya tiene una con ese código copia su nombre.
     */
    private function crearUnidad(Collection $unidades, string $texto): UnidadMedida
    {
        $modelo = UnidadMedida::where('empresa_id', '!=', $this->empresaId())
            ->get()
            ->first(fn($u) => $this->normalizar($u->codigo) === $this->normalizar($texto)
                || $this->normalizar($u->nombre) === $this->normalizar($texto));

        $codigo = $modelo?->codigo ?? strtoupper(mb_substr(preg_replace('/\s+/', '', $texto), 0, 10));

        // El código es único por empresa: si ya existe (p. ej. por truncado) se reutiliza
        $existente = $unidades->first(fn($u) => strtoupper($u->codigo) === strtoupper($codigo));
        if ($existente) {
            return $existente;
        }

        $unidad = UnidadMedida::create([
            'codigo'     => $codigo,
            'nombre'     => $modelo?->nombre ?? $texto,
            'activo'     => true,
            'empresa_id' => $this->empresaId(),
        ]);
        $unidades->push($unidad);

        return $unidad;
    }

    private function guardarPrecio(Producto $producto, TipoPrecio $tipo, float $precio): void
    {
        $existente = PrecioProducto::where('producto_id', $producto->id)
            ->where('tipo_precio_id', $tipo->id)
            ->whereNull('unidad_medida_id')
            ->first();

        if ($existente) {
            if ((float) $existente->precio !== $precio) {
                $existente->update(['precio' => $precio, 'activo' => true]);
            }
            return;
        }

        PrecioProducto::create([
            'producto_id'    => $producto->id,
            'tipo_precio_id' => $tipo->id,
            'nombre'         => $tipo->nombre,
            'precio'         => $precio,
            'es_precio_base' => (bool) $tipo->es_precio_base,
            'activo'         => true,
            'fecha_inicio'   => now()->toDateString(),
        ]);
    }

    // ─────────────────────────────── Resultado ───────────────────────────────

    private function resultado(array $filas, array $errores, array $nuevos = [], ?array $stock = null): array
    {
        $acciones      = collect($filas)->countBy('accion');
        $erroresProds  = collect($errores)->where('hoja', self::HOJA)->pluck('fila')->unique()->count();

        return [
            'filas'   => $filas,
            'errores' => $errores,
            'nuevos'  => $nuevos + ['categorias' => [], 'marcas' => [], 'unidades' => [], 'proveedores' => [], 'tipos_precio' => []],
            'resumen' => [
                'total'      => count($filas) + $erroresProds,
                'crear'      => $acciones->get('crear', 0),
                'actualizar' => $acciones->get('actualizar', 0),
                'errores'    => $erroresProds,
            ],
            'stock'   => $stock,
        ];
    }
}
