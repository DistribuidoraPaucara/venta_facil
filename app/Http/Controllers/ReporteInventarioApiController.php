<?php
namespace App\Http\Controllers;

use App\Exports\StockActualExport;
use App\Exports\MovimientosInventarioExport;
use App\Exports\ProductosBajoMinimoExport;
use App\Exports\StockValorizadoExport;
use App\Exports\ProductosSinMovimientoExport;
use App\Exports\VencimientosExport;
use App\Exports\KardexProductoExport;
use App\Exports\RotacionInventarioExport;
use App\Helpers\ApiResponse;
use App\Models\Almacen;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use App\Services\ReporteInventarioService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class ReporteInventarioApiController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:inventario.reportes')->only([
            'estadisticasGenerales',
            'stockBajo',
            'proximosVencer',
            'vencidos',
            'movimientosPorPeriodo',
            'productosMasMovidos',
            'valorizacionInventario',
        ]);
    }

    /**
     * Estadísticas generales de inventario
     */
    public function estadisticasGenerales(): JsonResponse
    {
        $estadisticas = [
            'total_productos'           => Producto::where('activo', true)->count(),
            'productos_stock_bajo'      => Producto::query()->stockBajo()->count(),
            'productos_proximos_vencer' => Producto::query()->proximosVencer(30)->count(),
            'productos_vencidos'        => Producto::query()->vencidos()->count(),
            'valor_total_inventario'    => StockProducto::join('productos', 'stock_productos.producto_id', '=', 'productos.id')
                ->selectRaw('SUM(stock_productos.cantidad * productos.precio_compra) as total')
                ->value('total') ?? 0,
            'stock_por_almacen'         => Almacen::withSum('stockProductos', 'cantidad')
                ->where('activo', true)
                ->get(['id', 'nombre'])
                ->map(function ($almacen) {
                    return [
                        'almacen_id'     => $almacen->id,
                        'almacen_nombre' => $almacen->nombre,
                        'stock_total'    => $almacen->stock_productos_sum_cantidad ?? 0,
                    ];
                }),
        ];

        return ApiResponse::success($estadisticas);
    }

    /**
     * Productos con stock bajo
     */
    public function stockBajo(Request $request): JsonResponse
    {
        $almacenId = $request->integer('almacen_id');
        $perPage   = $request->integer('per_page', 20);

        $productos = Producto::query()->stockBajo()
            ->with(['categoria:id,nombre', 'marca:id,nombre'])
            ->with(['stock' => function ($query) use ($almacenId) {
                if ($almacenId) {
                    $query->where('almacen_id', $almacenId);
                }
                $query->with('almacen:id,nombre');
            }])
            ->when($almacenId, function ($query) use ($almacenId) {
                $query->whereHas('stock', function ($q) use ($almacenId) {
                    $q->where('almacen_id', $almacenId);
                });
            })
            ->withCount(['stock as stock_total' => function ($query) {
                $query->select(DB::raw('COALESCE(SUM(cantidad), 0)'));
            }])
            ->paginate($perPage);

        return ApiResponse::success($productos);
    }

    /**
     * Productos próximos a vencer
     */
    public function proximosVencer(Request $request): JsonResponse
    {
        $dias      = $request->integer('dias', 30);
        $almacenId = $request->integer('almacen_id');
        $perPage   = $request->integer('per_page', 20);

        $productos = Producto::proximosVencer($dias)
            ->with(['categoria:id,nombre', 'marca:id,nombre'])
            ->with(['stock' => function ($query) use ($almacenId) {
                if ($almacenId) {
                    $query->where('almacen_id', $almacenId);
                }
                $query->whereNotNull('fecha_vencimiento')
                    ->orderBy('fecha_vencimiento')
                    ->with('almacen:id,nombre');
            }])
            ->when($almacenId, function ($query) use ($almacenId) {
                $query->whereHas('stock', function ($q) use ($almacenId) {
                    $q->where('almacen_id', $almacenId);
                });
            })
            ->paginate($perPage);

        return ApiResponse::success($productos);
    }

    /**
     * Productos vencidos
     */
    public function vencidos(Request $request): JsonResponse
    {
        $almacenId = $request->integer('almacen_id');
        $perPage   = $request->integer('per_page', 20);

        $productos = Producto::query()->vencidos()
            ->with(['categoria:id,nombre', 'marca:id,nombre'])
            ->with(['stock' => function ($query) use ($almacenId) {
                if ($almacenId) {
                    $query->where('almacen_id', $almacenId);
                }
                $query->whereNotNull('fecha_vencimiento')
                    ->where('fecha_vencimiento', '<', now())
                    ->orderBy('fecha_vencimiento')
                    ->with('almacen:id,nombre');
            }])
            ->when($almacenId, function ($query) use ($almacenId) {
                $query->whereHas('stock', function ($q) use ($almacenId) {
                    $q->where('almacen_id', $almacenId);
                });
            })
            ->paginate($perPage);

        return ApiResponse::success($productos);
    }

    /**
     * Movimientos por período
     */
    public function movimientosPorPeriodo(Request $request): JsonResponse
    {
        $fechaInicio = $request->date('fecha_inicio', now()->subMonth());
        $fechaFin    = $request->date('fecha_fin', now());
        $almacenId   = $request->integer('almacen_id');
        $tipo        = $request->string('tipo');

        $movimientos = MovimientoInventario::with([
            'stockProducto.producto:id,nombre,codigo',
            'stockProducto.almacen:id,nombre',
            'user:id,name',
        ])
            ->whereBetween('fecha', [$fechaInicio, $fechaFin])
            ->when($almacenId, function ($q) use ($almacenId) {
                $q->whereHas('stockProducto', fn($sq) => $sq->where('almacen_id', $almacenId));
            })
            ->when($tipo, fn($q) => $q->where('tipo', $tipo))
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->get();

        // Agrupar por tipo
        $resumenPorTipo = $movimientos->groupBy('tipo')->map(function ($items, $tipo) {
            return [
                'tipo'                 => $tipo,
                'cantidad_movimientos' => $items->count(),
                'cantidad_total'       => $items->sum('cantidad'),
                'valor_total'          => $items->sum(function ($mov) {
                    return abs($mov->cantidad) * ($mov->stockProducto->producto->precio_compra ?? 0);
                }),
            ];
        })->values();

        return ApiResponse::success([
            'movimientos'       => $movimientos,
            'resumen_por_tipo'  => $resumenPorTipo,
            'total_movimientos' => $movimientos->count(),
            'periodo'           => [
                'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                'fecha_fin'    => $fechaFin->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Productos más movidos en un período
     */
    public function productosMasMovidos(Request $request): JsonResponse
    {
        $fechaInicio = $request->date('fecha_inicio', now()->subMonth());
        $fechaFin    = $request->date('fecha_fin', now());
        $limite      = $request->integer('limite', 20);
        $almacenId   = $request->integer('almacen_id');

        $productos = DB::table('movimientos_inventario')
            ->select([
                'productos.id',
                'productos.nombre',
                'productos.codigo',
                DB::raw('COUNT(*) as total_movimientos'),
                DB::raw('SUM(ABS(movimientos_inventario.cantidad)) as cantidad_total'),
                DB::raw('AVG(ABS(movimientos_inventario.cantidad)) as promedio_movimiento'),
            ])
            ->join('stock_productos', 'movimientos_inventario.stock_producto_id', '=', 'stock_productos.id')
            ->join('productos', 'stock_productos.producto_id', '=', 'productos.id')
            ->whereBetween('movimientos_inventario.fecha', [$fechaInicio, $fechaFin])
            ->when($almacenId, fn($q) => $q->where('stock_productos.almacen_id', $almacenId))
            ->groupBy('productos.id', 'productos.nombre', 'productos.codigo')
            ->orderByDesc('total_movimientos')
            ->limit($limite)
            ->get();

        return ApiResponse::success([
            'productos' => $productos,
            'periodo'   => [
                'fecha_inicio' => $fechaInicio->format('Y-m-d'),
                'fecha_fin'    => $fechaFin->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Valorización de inventario por almacén
     */
    public function valorizacionInventario(Request $request): JsonResponse
    {
        $almacenId = $request->integer('almacen_id');

        $query = StockProducto::with(['producto:id,nombre,codigo,precio_compra,precio_venta', 'almacen:id,nombre'])
            ->where('cantidad', '>', 0);

        if ($almacenId) {
            $query->where('almacen_id', $almacenId);
        }

        $stocks = $query->get();

        $valorizacion = $stocks->groupBy('almacen.nombre')->map(function ($items, $almacenNombre) {
            $valorCompra = $items->sum(function ($stock) {
                return $stock->cantidad * ($stock->producto->precio_compra ?? 0);
            });

            $valorVenta = $items->sum(function ($stock) {
                return $stock->cantidad * ($stock->producto->precio_venta ?? 0);
            });

            return [
                'almacen'         => $almacenNombre,
                'total_productos' => $items->count(),
                'cantidad_total'  => $items->sum('cantidad'),
                'valor_compra'    => $valorCompra,
                'valor_venta'     => $valorVenta,
                'margen_bruto'    => $valorVenta - $valorCompra,
                'productos'       => $items->map(function ($stock) {
                    return [
                        'producto_id'        => $stock->producto->id,
                        'producto_nombre'    => $stock->producto->nombre,
                        'producto_codigo'    => $stock->producto->codigo,
                        'cantidad'           => $stock->cantidad,
                        'precio_compra'      => $stock->producto->precio_compra,
                        'precio_venta'       => $stock->producto->precio_venta,
                        'valor_total_compra' => $stock->cantidad * ($stock->producto->precio_compra ?? 0),
                        'valor_total_venta'  => $stock->cantidad * ($stock->producto->precio_venta ?? 0),
                    ];
                }),
            ];
        });

        return ApiResponse::success($valorizacion);
    }

    /**
     * Generar reporte de inventario en formato especificado
     * GET /api/inventario/reportes/generar
     */
    public function generar(Request $request)
    {
        try {
            // Limpiar parámetros vacíos
            $data = $request->all();
            $data = array_filter($data, function ($value) {
                return $value !== '' && $value !== null;
            });

            // Permitir 'pdf' como alias para '80mm'
            if (isset($data['formato']) && $data['formato'] === 'pdf') {
                $data['formato'] = '80mm';
            }

            // Convertir strings booleanos a booleanos reales
            if (isset($data['incluir_sin_movimientos'])) {
                $data['incluir_sin_movimientos'] = filter_var($data['incluir_sin_movimientos'], FILTER_VALIDATE_BOOLEAN);
            }
            if (isset($data['solo_con_stock'])) {
                $data['solo_con_stock'] = filter_var($data['solo_con_stock'], FILTER_VALIDATE_BOOLEAN);
            }

            // Validar parámetros: almacén, categoría y producto deben ser de la empresa del usuario
            $empresaId = auth()->user()?->empresa_id;
            $validated = \Illuminate\Support\Facades\Validator::make($data, [
                'tipo_reporte' => 'required|in:stock_actual,movimientos,stock_valorizado,productos_bajo_minimo,productos_sin_movimiento,vencimientos,kardex,rotacion_inventario',
                'formato' => 'required|in:excel,csv,80mm,58mm,a4',
                'almacen_id' => ['nullable', 'integer', \Illuminate\Validation\Rule::exists('almacenes', 'id')->where('empresa_id', $empresaId)],
                'categoria_id' => ['nullable', 'integer', \Illuminate\Validation\Rule::exists('categorias', 'id')->where('empresa_id', $empresaId)],
                'fecha_desde' => 'nullable|date',
                'fecha_hasta' => 'nullable|date',
                'incluir_sin_movimientos' => 'nullable|boolean',
                'solo_con_stock' => 'nullable|boolean',
                'producto_id' => ['nullable', 'integer', \Illuminate\Validation\Rule::exists('productos', 'id')->where('empresa_id', $empresaId)],
            ], [
                'producto_id.exists' => 'El producto no existe en tu empresa.',
            ])->validate();

            if ($validated['tipo_reporte'] === 'kardex' && empty($validated['producto_id'])) {
                return response()->json(['success' => false, 'message' => 'Indica el producto para el kardex.'], 422);
            }

            // Inyectar servicio
            $servicio = new ReporteInventarioService();

            // Obtener datos según tipo de reporte
            $datos = match ($validated['tipo_reporte']) {
                'stock_actual' => $servicio->obtenerStockActual($validated),
                'movimientos' => $servicio->obtenerMovimientos($validated),
                'stock_valorizado' => $servicio->obtenerStockValorizado($validated),
                'productos_bajo_minimo' => $servicio->obtenerProductosBajoMinimo($validated),
                'productos_sin_movimiento' => $servicio->obtenerProductosSinMovimiento($validated),
                'vencimientos' => $servicio->obtenerVencimientos($validated),
                'kardex' => $servicio->obtenerKardex($validated),
                'rotacion_inventario' => $servicio->obtenerRotacion($validated),
            };

            // Generar archivo según formato
            return match ($validated['formato']) {
                'excel' => $this->generarExcel($validated['tipo_reporte'], $datos, $validated),
                'csv' => $this->generarCsv($validated['tipo_reporte'], $datos),
                '80mm' => $this->generarImpresion($validated['tipo_reporte'], $datos, '80'),
                '58mm' => $this->generarImpresion($validated['tipo_reporte'], $datos, '58'),
                'a4' => $this->generarA4($validated['tipo_reporte'], $datos, $validated),
            };
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error generando reporte', [
                'tipo_reporte' => $request->input('tipo_reporte'),
                'formato' => $request->input('formato'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al generar el reporte',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // Columnas numéricas (alineadas a la derecha y con formato numérico en Excel/A4)
    private const COLUMNAS_NUMERICAS = [
        'cantidad', 'cantidad_disponible', 'cantidad_reservada', 'precio_compra', 'precio_venta', 'valor_compra', 'valor_venta',
        'stock_minimo', 'total_productos', 'productos_sin_costo', 'cantidad_total', 'valor_compra_total', 'valor_venta_total', 'margen_bruto',
        'margen_porcentaje', 'stock_actual', 'falta', 'cantidad_stock', 'valor_inmobilizado', 'dias_sin_movimiento',
        'dias_para_vencer', 'valor_total', 'saldo_lote', 'total_movimientos', 'cantidad_vendida', 'cantidad_total_movida',
        'promedio_por_movimiento',
    ];

    // Conteos: sin decimales en el Excel
    private const COLUMNAS_ENTERAS = ['total_productos', 'productos_sin_costo', 'dias_sin_movimiento', 'dias_para_vencer', 'total_movimientos'];

    // Columnas que se suman en la fila TOTAL del Excel y el A4
    private const COLUMNAS_TOTAL = [
        'valor_compra', 'valor_venta', 'total_productos', 'productos_sin_costo', 'cantidad_total', 'valor_compra_total', 'valor_venta_total',
        'margen_bruto', 'falta', 'valor_inmobilizado', 'valor_total', 'cantidad_vendida',
    ];

    /** Filas listas para exportar: solo las columnas del reporte, en su orden */
    private function filasExportables(string $tipoReporte, $datos): array
    {
        $columnas = ReporteInventarioService::COLUMNAS[$tipoReporte];

        return collect($datos)->map(fn ($fila) => array_map(fn ($clave) => $fila[$clave] ?? '', array_keys($columnas)))->all();
    }

    private function totales(string $tipoReporte, $datos): array
    {
        $totales = [];
        foreach (array_keys(ReporteInventarioService::COLUMNAS[$tipoReporte]) as $clave) {
            if (in_array($clave, self::COLUMNAS_TOTAL, true)) {
                $totales[$clave] = collect($datos)->sum($clave);
            }
        }

        return $totales;
    }

    /** Texto de los filtros aplicados (encabezado del Excel y el A4) */
    private function filtrosTexto(array $filtros): array
    {
        $texto = [];
        $texto[] = ! empty($filtros['almacen_id']) ? 'Almacén: ' . (\App\Models\Almacen::porEmpresa()->find($filtros['almacen_id'])?->nombre ?? $filtros['almacen_id']) : 'Todos los almacenes';
        if (! empty($filtros['categoria_id'])) {
            $texto[] = 'Categoría: ' . (\App\Models\Categoria::porEmpresa()->find($filtros['categoria_id'])?->nombre ?? $filtros['categoria_id']);
        }
        if (! empty($filtros['producto_id'])) {
            $texto[] = 'Producto: #' . $filtros['producto_id'] . ' ' . (\App\Models\Producto::find($filtros['producto_id'])?->nombre ?? '');
        }
        if (! empty($filtros['fecha_desde']) || ! empty($filtros['fecha_hasta'])) {
            $texto[] = 'Período: ' . (! empty($filtros['fecha_desde']) ? \Carbon\Carbon::parse($filtros['fecha_desde'])->format('d/m/Y') : '…')
                . ' al ' . (! empty($filtros['fecha_hasta']) ? \Carbon\Carbon::parse($filtros['fecha_hasta'])->format('d/m/Y') : 'hoy');
        }

        return $texto;
    }

    /**
     * Excel (.xlsx) con encabezado, filtros, autofiltro y fila de totales
     */
    private function generarExcel(string $tipoReporte, $datos, array $filtros)
    {
        $columnas = ReporteInventarioService::COLUMNAS[$tipoReporte];
        $ultima   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($columnas));

        $libro = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $hoja  = $libro->getActiveSheet();
        $hoja->setTitle(mb_substr(ReporteInventarioService::TITULOS[$tipoReporte], 0, 31));
        $hoja->setCellValue('A1', ReporteInventarioService::TITULOS[$tipoReporte]);
        $hoja->getStyle('A1')->getFont()->setBold(true)->setSize(13);
        $hoja->setCellValue('A2', implode(' · ', $this->filtrosTexto($filtros)));
        $hoja->fromArray(array_values($columnas), null, 'A4');
        $hoja->getStyle("A4:{$ultima}4")->getFont()->setBold(true);

        $filas = $this->filasExportables($tipoReporte, $datos);
        if ($filas) {
            $hoja->fromArray($filas, null, 'A5', true);
        }
        $fin = 4 + count($filas);

        if ($filas && ($totales = $this->totales($tipoReporte, $datos))) {
            $fin++;
            $hoja->setCellValue("A{$fin}", 'TOTAL');
            foreach (array_keys($columnas) as $i => $clave) {
                if (array_key_exists($clave, $totales)) {
                    $hoja->setCellValue(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1) . $fin, $totales[$clave]);
                }
            }
            $hoja->getStyle("A{$fin}:{$ultima}{$fin}")->getFont()->setBold(true);
        }

        foreach (array_keys($columnas) as $i => $clave) {
            $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
            if (in_array($clave, self::COLUMNAS_NUMERICAS, true)) {
                $hoja->getStyle("{$col}5:{$col}" . max(5, $fin))->getNumberFormat()->setFormatCode(in_array($clave, self::COLUMNAS_ENTERAS, true) ? '#,##0' : '#,##0.00');
            }
            $hoja->getColumnDimension($col)->setAutoSize(count($filas) <= 2000); // Con muchas filas el autoajuste es muy lento
        }
        $hoja->freezePane('A5');
        $hoja->setAutoFilter("A4:{$ultima}" . max(4, 4 + count($filas)));

        $nombre = 'reporte_' . $tipoReporte . '_' . now()->format('Y-m-d_His') . '.xlsx';

        return response()->streamDownload(function () use ($libro) {
            (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($libro))->save('php://output');
        }, $nombre, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    /**
     * CSV con BOM UTF-8 (para que Excel muestre bien tildes y ñ)
     */
    private function generarCsv(string $tipoReporte, $datos)
    {
        $lineas = [array_values(ReporteInventarioService::COLUMNAS[$tipoReporte]), ...$this->filasExportables($tipoReporte, $datos)];
        $csv = "\xEF\xBB\xBF" . implode("\n", array_map(
            fn ($fila) => implode(',', array_map(fn ($v) => '"' . str_replace('"', '""', (string) $v) . '"', $fila)),
            $lineas
        )) . "\n";

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=utf-8')
            ->header('Content-Disposition', 'attachment; filename=reporte_' . $tipoReporte . '_' . now()->format('Y-m-d_H-i-s') . '.csv');
    }

    /**
     * PDF A4 con la tabla del reporte (horizontal si tiene muchas columnas)
     */
    private function generarA4(string $tipoReporte, $datos, array $filtros)
    {
        $limite  = 1000; // DomPDF tarda ~20 ms por fila: más que esto conviene el Excel
        $datos   = collect($datos);
        $empresa = \App\Models\Empresa::find(auth()->user()?->empresa_id) ?? new \App\Models\Empresa();
        $columnas = ReporteInventarioService::COLUMNAS[$tipoReporte];

        $pdf = Pdf::loadView('impresion.reportes.inventario-a4', [
            'empresa'               => $empresa,
            'logo_principal_base64' => $this->logoBase64($empresa->logo_principal ?? null),
            'titulo'                => ReporteInventarioService::TITULOS[$tipoReporte],
            'columnas'              => $columnas,
            'numericas'             => self::COLUMNAS_NUMERICAS,
            'filas'                 => $datos->take($limite)->all(),
            'totales'               => $this->totales($tipoReporte, $datos),
            'filtros_texto'         => $this->filtrosTexto($filtros),
            'truncado'              => $datos->count() > $limite,
            'total_filas'           => $datos->count(),
            'usuario'               => auth()->user()?->name ?? 'Sistema',
            'fecha_impresion'       => now(),
        ])->setPaper('a4', count($columnas) > 8 ? 'landscape' : 'portrait');

        return $pdf->download('reporte_' . $tipoReporte . '_A4_' . now()->format('Y-m-d_His') . '.pdf');
    }

    private function logoBase64(?string $logoUrl): ?string
    {
        if (! $logoUrl) {
            return null;
        }
        if (str_starts_with($logoUrl, 'data:')) {
            return $logoUrl;
        }
        $ruta = public_path($logoUrl);
        if (! is_file($ruta)) {
            return null;
        }

        return 'data:' . (mime_content_type($ruta) ?: 'image/png') . ';base64,' . base64_encode(file_get_contents($ruta));
    }

    /**
     * Generar Impresión en formatos 80mm y 58mm
     */
    private function generarImpresion(string $tipoReporte, $datos, string $formato)
    {
        $sufijo = $formato === '80' ? '80' : '58';
        $tipoReporteFormato = $tipoReporte === 'rotacion_inventario' ? 'rotacion' : str_replace('_', '-', $tipoReporte); // Las vistas de rotación se llaman rotacion-80/58
        $vista = "impresion.reportes.{$tipoReporteFormato}-{$sufijo}";

        try {
            // Validar que la vista exista
            if (!\Illuminate\Support\Facades\View::exists($vista)) {
                \Log::error('Vista no encontrada', [
                    'vista' => $vista,
                    'tipo_reporte' => $tipoReporte,
                    'formato' => $sufijo,
                ]);

                throw new \Exception("La vista '{$vista}' no existe. Reportes disponibles: stock_actual, movimientos, stock_valorizado, productos_bajo_minimo, productos_sin_movimiento, vencimientos, kardex, rotacion");
            }

            // Empresa del usuario (antes Empresa::first(): el ticket podía salir con el nombre de otra empresa)
            $empresa = \App\Models\Empresa::find(auth()->user()?->empresa_id) ?? new \App\Models\Empresa();
            $usuario = auth()->user();

            $pdf = Pdf::loadView($vista, [
                'datos' => $datos,
                'empresa' => $empresa,
                'fecha_impresion' => now(),
                'usuario' => $usuario,
            ]);

            // Configurar formato de papel según tamaño
            if ($formato === '80') {
                $pdf->setPaper([0, 0, 226.77, 841.89], 'portrait'); // 80mm x 297mm
            } else {
                $pdf->setPaper([0, 0, 164.41, 841.89], 'portrait'); // 58mm x 297mm
            }

            $pdf->setOption('enable-local-file-access', true);

            $nombreArchivo = "reporte_{$tipoReporte}_{$sufijo}mm_" . now()->format('Y-m-d_H-i-s') . '.pdf';
            return $pdf->download($nombreArchivo);
        } catch (\Exception $e) {
            \Log::error('Error generando impresión', [
                'tipo_reporte' => $tipoReporte,
                'formato' => $sufijo,
                'vista' => $vista,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al generar impresión',
                'error' => $e->getMessage(),
                'vista' => $vista,
            ], 500);
        }
    }
}
