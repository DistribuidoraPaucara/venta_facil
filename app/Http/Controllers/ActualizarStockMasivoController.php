<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\StockProducto;
use App\Models\MovimientoInventario;
use App\Models\Sector;
use App\Services\Stock\MovimientoStockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use League\Csv\Reader;
use League\Csv\Writer;
use SplFileObject;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx as XlsxReader;

/**
 * Controller: ActualizarStockMasivoController
 *
 * Responsabilidades:
 * ✅ Mostrar página de actualización masiva de stock
 * ✅ Descargar plantilla CSV con productos actuales
 * ✅ Procesar CSV y actualizar stock
 * ✅ Crear movimientos en movimientos_inventario
 */
class ActualizarStockMasivoController extends Controller
{
    protected $movimientoStockService;

    public function __construct(MovimientoStockService $movimientoStockService)
    {
        $this->movimientoStockService = $movimientoStockService;
    }

    /**
     * Mostrar página de actualización masiva
     */
    public function index()
    {
        return Inertia::render('inventario/ActualizarStockMasivo', [
            'message' => 'Cargue un CSV para actualizar el stock masivamente',
        ]);
    }

    /**
     * Descargar plantilla en el formato especificado (CSV o Excel)
     *
     * GET /api/actualizar-stock-masivo/descargar-plantilla?formato=csv|excel
     */
    public function descargarPlantilla(Request $request)
    {
        $formato = $request->query('formato', 'csv');

        if ($formato === 'excel') {
            return $this->descargarPlantillaExcel();
        }

        return $this->descargarPlantillaCSV();
    }

    /**
     * Descargar plantilla CSV con productos actuales
     *
     * Estructura: id,sku,nombre,cantidad_existente,cantidad_incrementar,lote_fifo
     * - cantidad_existente: suma de todos los lotes del producto (solo lectura)
     * - cantidad_incrementar: valores para aumentar (+) o disminuir (-) el stock
     * - lote_fifo: lote más antiguo (FIFO) para actualización
     */
    private function descargarPlantillaCSV()
    {
        Log::info('📥 [ActualizarStockMasivo] Descargando plantilla CSV');

        try {
            $almacenId = auth()->user()->empresa->almacen_id ?? 1;

            // Obtener todos los productos con su stock en el almacén del usuario
            $productos = Producto::with(['stock' => function ($query) use ($almacenId) {
                $query->where('almacen_id', $almacenId)
                    ->orderBy('fecha_vencimiento', 'asc')
                    ->orderBy('fecha_actualizacion', 'asc');
            }])->orderBy('nombre', 'asc')->get();

            // Crear CSV en memoria
            $csv = Writer::createFromString('');
            $csv->setDelimiter(',');

            // Escribir encabezados
            $csv->insertOne(['id', 'sku', 'nombre', 'cantidad_existente', 'cantidad_incrementar', 'lote_fifo']);

            // Escribir datos de productos
            $productos->each(function ($producto) use ($csv) {
                // Sumar cantidad total de todos los lotes del producto
                $cantidadTotal = $producto->stock->sum('cantidad') ?? 0;

                // Obtener lote FIFO (primero de la lista ordenada)
                $loteFifo = $producto->stock->first()?->lote ?? null;

                $csv->insertOne([
                    $producto->id,
                    $producto->sku,
                    $producto->nombre,
                    $cantidadTotal, // Cantidad Existente (no editar)
                    0, // Cantidad_Incrementar (editar - incremento/decremento)
                    $loteFifo ?? '', // Vacío si no hay lote
                ]);
            });

            // Agregar BOM UTF-8 para que Excel interprete correctamente los caracteres especiales
            $csvContent = "\xEF\xBB\xBF" . $csv->toString();

            // Descargar archivo
            return response($csvContent)
                ->header('Content-Type', 'text/csv; charset=utf-8')
                ->header('Content-Disposition', 'attachment; filename="plantilla-actualizar-stock-' . date('Y-m-d-His') . '.csv"');

        } catch (\Exception $e) {
            Log::error('❌ Error descargando plantilla CSV', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Error al descargar plantilla: ' . $e->getMessage()]);
        }
    }

    /**
     * Descargar plantilla en formato Excel
     */
    private function descargarPlantillaExcel()
    {
        Log::info('📥 [ActualizarStockMasivo] Descargando plantilla Excel');

        try {
            $almacenId = auth()->user()->empresa->almacen_id ?? 1;

            // Obtener todos los productos con su stock en el almacén del usuario
            $productos = Producto::with(['stock' => function ($query) use ($almacenId) {
                $query->where('almacen_id', $almacenId)
                    ->orderBy('fecha_vencimiento', 'asc')
                    ->orderBy('fecha_actualizacion', 'asc');
            }])->orderBy('nombre', 'asc')->get();

            // Crear nuevo Spreadsheet
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Actualizar Stock');

            // Configurar encabezados
            $headers = ['ID', 'SKU', 'Nombre', 'Cantidad Existente', 'Cantidad_Incrementar', 'Lote FIFO'];
            $sheet->fromArray([$headers], null, 'A1');

            // Estilos para encabezados
            $headerStyle = [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '4472C4']],
                'alignment' => ['horizontal' => 'center', 'vertical' => 'center'],
            ];
            $sheet->getStyle('A1:F1')->applyFromArray($headerStyle);

            // Agregar datos de productos
            $row = 2;
            $productos->each(function ($producto) use ($sheet, &$row) {
                $cantidadTotal = $producto->stock->sum('cantidad') ?? 0;
                $loteFifo = $producto->stock->first()?->lote ?? '';

                $sheet->setCellValue("A$row", $producto->id);
                $sheet->setCellValue("B$row", $producto->sku);
                $sheet->setCellValue("C$row", $producto->nombre);
                $sheet->setCellValue("D$row", $cantidadTotal); // Cantidad Existente (no editar)
                $sheet->setCellValue("E$row", 0); // Cantidad_Incrementar (editar - incremento/decremento)
                $sheet->setCellValue("F$row", $loteFifo);

                // Colorear columna D (Cantidad Existente) - gris claro indicando que no es editable
                $greyStyle = [
                    'fill' => [
                        'fillType' => 'solid',
                        'startColor' => ['rgb' => 'D3D3D3'],
                    ],
                ];
                $sheet->getStyle("D$row")->applyFromArray($greyStyle);

                $row++;
            });

            // Ajustar ancho de columnas
            $sheet->getColumnDimension('A')->setWidth(10);
            $sheet->getColumnDimension('B')->setWidth(15);
            $sheet->getColumnDimension('C')->setWidth(30);
            $sheet->getColumnDimension('D')->setWidth(18); // Cantidad Existente
            $sheet->getColumnDimension('E')->setWidth(20); // Cantidad_Incrementar (editar)
            $sheet->getColumnDimension('F')->setWidth(15); // Lote FIFO

            // Crear writer y generar archivo
            $writer = new Xlsx($spreadsheet);
            $fileName = 'plantilla-actualizar-stock-' . date('Y-m-d-His') . '.xlsx';

            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . $fileName . '"');
            header('Cache-Control: max-age=0');

            $writer->save('php://output');
            exit;

        } catch (\Exception $e) {
            Log::error('❌ Error descargando plantilla Excel', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['error' => 'Error al descargar plantilla: ' . $e->getMessage()]);
        }
    }

    /**
     * Procesar CSV o Excel cargado y actualizar stock
     *
     * POST /api/actualizar-stock-masivo/procesar-archivo
     *
     * Formato esperado: id,sku,nombre,cantidad_existente,cantidad_incrementar,lote_fifo
     * Lógica:
     * - Si lote está vacío y no hay stock: crear con lote=null
     * - Si lote está especificado: actualizar ese lote específicamente
     * - Registra movimiento con lote_id para trazabilidad
     */
    public function procesarArchivo(Request $request)
    {
        Log::info('📥 [ActualizarStockMasivo] Procesando archivo cargado');

        $request->validate([
            'archivo' => 'required|file|mimes:csv,txt,xlsx|max:10240', // 10MB max
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $file = $request->file('archivo');
                $fileName = $file->getClientOriginalName();
                $isExcel = in_array($file->getMimeType(), [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel'
                ]) || str_ends_with($fileName, '.xlsx');

                // Procesar según formato
                if ($isExcel) {
                    $filas = $this->leerExcel($file->getRealPath());
                } else {
                    $filas = $this->leerCSV($file->getRealPath());
                }

                $almacenId = auth()->user()->empresa->almacen_id ?? 1;
                $registrosActualizados = 0;
                $errores = [];
                $movimientos = [];

                // Procesar cada fila
                foreach ($filas as $index => $fila) {
                    try {
                        // Normalizar claves a minúsculas
                        $filaNormalizada = array_change_key_case($fila, CASE_LOWER);

                        $productoId = (int) ($filaNormalizada['id'] ?? 0);

                        // Usar "cantidad_incrementar" como incremento/decremento
                        $incremento = (int) ($filaNormalizada['cantidad_incrementar'] ?? 0);

                        // Obtener stock actual en tiempo real (no usar valor desactualizado de la plantilla)
                        $stockActualEnTiempo = StockProducto::where('producto_id', $productoId)
                            ->where('almacen_id', $almacenId)
                            ->sum('cantidad') ?? 0;

                        $cantidadExistente = $stockActualEnTiempo;
                        $cantidadNueva = $cantidadExistente + $incremento;

                        $loteFifo = trim($filaNormalizada['lote_fifo'] ?? '');

                        Log::info('📦 [ActualizarStockMasivo] Fila procesada', [
                            'fila' => $index + 2,
                            'id_raw' => $filaNormalizada['id'] ?? 'N/A',
                            'id_int' => $productoId,
                            'existente' => $cantidadExistente,
                            'incremento' => $incremento,
                            'nueva' => $cantidadNueva,
                        ]);

                        if (!$productoId) {
                            $errores[] = "Fila " . ($index + 2) . ": ID de producto inválido (valor: '{$filaNormalizada['id']}')";
                            continue;
                        }

                        // No procesar si el incremento es 0
                        if ($incremento === 0) {
                            Log::info('⏭️ [ActualizarStockMasivo] Fila omitida (sin cambios)', [
                                'fila' => $index + 2,
                                'producto_id' => $productoId,
                            ]);
                            continue;
                        }

                        // Obtener producto
                        $producto = Producto::find($productoId);
                        if (!$producto) {
                            $errores[] = "Fila " . ($index + 2) . ": Producto ID $productoId no encontrado";
                            continue;
                        }

                        // Obtener stock actual (suma de todos los lotes)
                        $stockActual = StockProducto::where('producto_id', $productoId)
                            ->where('almacen_id', $almacenId)
                            ->sum('cantidad') ?? 0;

                        // Para archivo cargado, diferencia es el incremento especificado
                        $diferencia = $incremento ?? ($cantidadNueva - $stockActual);

                        if ($diferencia !== 0 || $stockActual === 0) {
                            // Manejar múltiples lotes correctamente
                            $stocks = StockProducto::where('producto_id', $productoId)
                                ->where('almacen_id', $almacenId)
                                ->orderBy('fecha_vencimiento', 'asc')
                                ->orderBy('fecha_actualizacion', 'asc')
                                ->get();

                            if ($stocks->isEmpty()) {
                                // Si no hay stock, crear uno
                                $stockProducto = $this->obtenerOCrearStockProducto(
                                    $productoId,
                                    $almacenId,
                                    $loteFifo,
                                    $cantidadNueva,
                                    $stockActual
                                );

                                if (!$stockProducto) {
                                    $errores[] = "Fila " . ($index + 2) . ": No se pudo obtener/crear stock para el producto";
                                    continue;
                                }

                                try {
                                    $movimiento = $this->crearMovimiento(
                                        $productoId,
                                        $stockProducto->id,
                                        $diferencia,
                                        $stockActual,
                                        $cantidadNueva,
                                        $producto,
                                        $stockProducto->lote
                                    );

                                    if ($movimiento) {
                                        $movimientos[] = $movimiento;
                                    }
                                } catch (\Exception $e) {
                                    Log::error('❌ Error creando movimiento', [
                                        'fila' => $index + 2,
                                        'producto_id' => $productoId,
                                        'tipo_movimiento' => 'AJUSTE_MASIVO',
                                        'error' => $e->getMessage(),
                                    ]);
                                    $errores[] = "Fila " . ($index + 2) . ": " . $e->getMessage();
                                }
                            } else {
                                // Si hay múltiples lotes, distribuir el cambio entre ellos FIFO
                                $diferenciaRestante = $diferencia;

                                foreach ($stocks as $stock) {
                                    if ($diferenciaRestante === 0) break;

                                    $cambioEnEsteStock = 0;

                                    if ($diferenciaRestante > 0) {
                                        // Incremento: agregar a este stock
                                        $cambioEnEsteStock = $diferenciaRestante;
                                        $diferenciaRestante = 0;
                                    } else {
                                        // Decremento: restar de este stock FIFO
                                        $cantidadDisponible = $stock->cantidad;
                                        if ($cantidadDisponible + $diferenciaRestante >= 0) {
                                            $cambioEnEsteStock = $diferenciaRestante;
                                            $diferenciaRestante = 0;
                                        } else {
                                            $cambioEnEsteStock = -$cantidadDisponible;
                                            $diferenciaRestante += $cantidadDisponible;
                                        }
                                    }

                                    if ($cambioEnEsteStock !== 0) {
                                        try {
                                            // Determinar el tipo según si es incremento o decremento
                                            $tipoMovimiento = $cambioEnEsteStock > 0
                                                ? MovimientoInventario::TIPO_AJUSTE_MASIVO
                                                : MovimientoInventario::TIPO_SALIDA_AJUSTE;

                                            // Pasar con su signo para registrar en movimientos_inventario correctamente
                                            // El servicio usa abs() internamente
                                            $movimiento = $this->crearMovimientoConTipo(
                                                $productoId,
                                                $stock->id,
                                                $cambioEnEsteStock, // Con signo: +20 o -30
                                                $tipoMovimiento,
                                                $stock->cantidad,
                                                $stock->cantidad + $cambioEnEsteStock,
                                                $producto,
                                                $stock->lote
                                            );

                                            if ($movimiento) {
                                                $movimientos[] = $movimiento;
                                            }
                                        } catch (\Exception $e) {
                                            Log::error('❌ Error creando movimiento en lote', [
                                                'fila' => $index + 2,
                                                'producto_id' => $productoId,
                                                'stock_id' => $stock->id,
                                                'error' => $e->getMessage(),
                                            ]);
                                            $errores[] = "Fila " . ($index + 2) . ": " . $e->getMessage();
                                        }
                                    }
                                }

                                if ($diferenciaRestante !== 0) {
                                    $errores[] = "Fila " . ($index + 2) . ": No hay suficiente stock para disminuir $diferenciaRestante unidades";
                                }
                            }
                        }

                        $registrosActualizados++;

                        Log::info('✅ [ActualizarStockMasivo] Producto actualizado', [
                            'producto_id' => $productoId,
                            'nombre' => $producto->nombre,
                            'lote' => $loteFifo ?: 'null',
                            'stock_anterior' => $stockActual,
                            'stock_nuevo' => $cantidadNueva,
                            'diferencia' => $diferencia,
                        ]);

                    } catch (\Exception $e) {
                        $errores[] = "Fila " . ($index + 2) . ": " . $e->getMessage();
                        Log::error('Error procesando fila', [
                            'fila' => $index + 2,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                Log::info('✅ [ActualizarStockMasivo] CSV procesado', [
                    'registros_actualizados' => $registrosActualizados,
                    'errores_count' => count($errores),
                    'movimientos_creados' => count($movimientos),
                ]);

                return response()->json([
                    'success' => true,
                    'mensaje' => "$registrosActualizados productos actualizados",
                    'registros_actualizados' => $registrosActualizados,
                    'errores' => $errores,
                    'movimientos_creados' => count($movimientos),
                ]);

            });

        } catch (\Exception $e) {
            Log::error('❌ Error procesando CSV', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Error al procesar CSV: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener o crear stock_producto
     *
     * Lógica:
     * - Si lote está vacío y no hay stock: crear con lote=null
     * - Si lote está especificado: buscar ese lote
     * - Si lote existe: retornar ese stock
     * - Si no existe: crear nuevo con ese lote
     */
    private function obtenerOCrearStockProducto(
        int $productoId,
        int $almacenId,
        string $loteFifo,
        int $cantidadNueva,
        int $stockActual
    ): ?StockProducto {
        $stocks = StockProducto::where('producto_id', $productoId)
            ->where('almacen_id', $almacenId)
            ->get();

        // Obtener un sector válido del almacén
        $sector = Sector::where('almacen_id', $almacenId)->first();
        if (!$sector) {
            Log::error('❌ No hay sectores disponibles para el almacén', [
                'almacen_id' => $almacenId,
            ]);
            return null;
        }

        // Si lote está vacío y no hay stock: crear con lote=null
        if (empty($loteFifo) && $stocks->isEmpty()) {
            $stockProducto = StockProducto::create([
                'producto_id' => $productoId,
                'almacen_id' => $almacenId,
                'sector_id' => $sector->id,
                'lote' => null,
                'cantidad' => $cantidadNueva,
                'cantidad_disponible' => $cantidadNueva,
                'cantidad_reservada' => 0,
                'fecha_vencimiento' => null,
                'fecha_actualizacion' => now(),
            ]);

            Log::info('📦 [ActualizarStockMasivo] Stock creado (lote=null)', [
                'producto_id' => $productoId,
                'cantidad' => $cantidadNueva,
                'sector_id' => $sector->id,
            ]);

            return $stockProducto;
        }

        // Si lote está vacío pero hay stock: usar el lote FIFO (más antiguo)
        if (empty($loteFifo) && !$stocks->isEmpty()) {
            return $stocks->first();
        }

        // Si lote está especificado: buscar ese lote
        if (!empty($loteFifo)) {
            $stock = StockProducto::where('producto_id', $productoId)
                ->where('almacen_id', $almacenId)
                ->where('lote', $loteFifo)
                ->first();

            if ($stock) {
                return $stock;
            }

            // Si lote no existe: crear nuevo con ese lote
            $stockProducto = StockProducto::create([
                'producto_id' => $productoId,
                'almacen_id' => $almacenId,
                'sector_id' => $sector->id,
                'lote' => $loteFifo,
                'cantidad' => $cantidadNueva,
                'cantidad_disponible' => $cantidadNueva,
                'cantidad_reservada' => 0,
                'fecha_vencimiento' => null,
                'fecha_actualizacion' => now(),
            ]);

            Log::info('📦 [ActualizarStockMasivo] Stock creado (lote especificado)', [
                'producto_id' => $productoId,
                'lote' => $loteFifo,
                'cantidad' => $cantidadNueva,
                'sector_id' => $sector->id,
            ]);

            return $stockProducto;
        }

        return null;
    }

    /**
     * Procesar CSV cargado (compatibilidad hacia atrás)
     *
     * POST /api/actualizar-stock-masivo/procesar-csv
     */
    public function procesarCSV(Request $request)
    {
        // Renombrar 'csv' a 'archivo' para compatibilidad
        $request->merge(['archivo' => $request->file('csv')]);
        return $this->procesarArchivo($request);
    }

    /**
     * Actualizar stock desde tabla editable
     *
     * Recibe un array de cambios: [{producto_id, cantidad_nueva}, ...]
     */
    public function actualizarStockTabla(Request $request)
    {
        Log::info('📋 [ActualizarStockMasivo] Procesando cambios desde tabla');

        $request->validate([
            'cambios' => 'required|array',
            'cambios.*.producto_id' => 'required|integer|exists:productos,id',
            'cambios.*.cantidad_nueva' => 'required|integer|min:0',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $almacenId = auth()->user()->empresa->almacen_id ?? 1;
                $registrosActualizados = 0;
                $errores = [];
                $movimientos = [];

                // Procesar cada cambio
                foreach ($request->input('cambios') as $cambio) {
                    try {
                        $productoId = (int) $cambio['producto_id'];
                        $cantidadNueva = (int) $cambio['cantidad_nueva'];

                        // Obtener producto
                        $producto = Producto::find($productoId);
                        if (!$producto) {
                            $errores[] = "Producto ID $productoId no encontrado";
                            continue;
                        }

                        // Obtener stock actual (suma de todos los lotes)
                        $stockActual = StockProducto::where('producto_id', $productoId)
                            ->where('almacen_id', $almacenId)
                            ->sum('cantidad') ?? 0;

                        // Para archivo cargado, diferencia es el incremento especificado
                        $diferencia = $incremento ?? ($cantidadNueva - $stockActual);

                        if ($diferencia !== 0 || $stockActual === 0) {
                            // Obtener o crear stock_producto
                            $stockProducto = $this->obtenerOCrearStockProducto(
                                $productoId,
                                $almacenId,
                                '', // Sin lote especificado
                                $cantidadNueva,
                                $stockActual
                            );

                            if (!$stockProducto) {
                                $errores[] = "No se pudo obtener/crear stock para {$producto->nombre}";
                                continue;
                            }

                            // Crear movimiento en movimientos_inventario
                            try {
                                $movimiento = $this->crearMovimiento(
                                    $productoId,
                                    $stockProducto->id,
                                    $diferencia,
                                    $stockActual,
                                    $cantidadNueva,
                                    $producto,
                                    $stockProducto->lote
                                );

                                if ($movimiento) {
                                    $movimientos[] = $movimiento;
                                }
                            } catch (\Exception $e) {
                                Log::error('❌ Error creando movimiento', [
                                    'producto_id' => $productoId,
                                    'error' => $e->getMessage(),
                                ]);
                                $errores[] = "Error en {$producto->nombre}: " . $e->getMessage();
                            }
                        }

                        $registrosActualizados++;

                        Log::info('✅ [ActualizarStockMasivo] Producto actualizado desde tabla', [
                            'producto_id' => $productoId,
                            'nombre' => $producto->nombre,
                            'stock_anterior' => $stockActual,
                            'stock_nuevo' => $cantidadNueva,
                            'diferencia' => $diferencia,
                        ]);

                    } catch (\Exception $e) {
                        Log::error('Error procesando cambio', [
                            'error' => $e->getMessage(),
                        ]);
                        $errores[] = $e->getMessage();
                    }
                }

                Log::info('✅ [ActualizarStockMasivo] Cambios procesados desde tabla', [
                    'registros_actualizados' => $registrosActualizados,
                    'errores_count' => count($errores),
                    'movimientos_creados' => count($movimientos),
                ]);

                return response()->json([
                    'success' => true,
                    'mensaje' => "$registrosActualizados productos actualizados",
                    'registros_actualizados' => $registrosActualizados,
                    'errores' => $errores,
                    'movimientos_creados' => count($movimientos),
                ]);

            });

        } catch (\Exception $e) {
            Log::error('❌ Error procesando cambios desde tabla', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Error al procesar cambios: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crear movimiento con tipo específico
     */
    private function crearMovimientoConTipo(
        int $productoId,
        int $stockProductoId,
        int $cantidad,
        string $tipo,
        int $stockAnterior,
        int $stockNuevo,
        Producto $producto,
        ?string $lote = null
    )
    {
        return $this->movimientoStockService->registrarMovimientoYActualizar(
            stockProductoId: $stockProductoId,
            cantidad: $cantidad,
            tipo: $tipo,
            referencia_tipo: 'ajuste_masivo',
            referencia_id: $productoId,
            metadataAdicional: [
                'producto_id' => $productoId,
                'producto_nombre' => $producto->nombre,
                'lote' => $lote ?? 'null',
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $stockNuevo,
                'tipo_ajuste' => 'Carga masiva de stock',
                'fecha_carga' => now()->toDateTimeString(),
            ],
            numeroDocumento: 'AJUSTE-MASIVO-' . date('Ymd-His'),
        );
    }

    /**
     * Crear movimiento en movimientos_inventario
     *
     * Tipo: AJUSTE_MASIVO con trazabilidad de lote
     */
    private function crearMovimiento(
        int $productoId,
        int $stockProductoId,
        int $diferencia,
        int $stockAnterior,
        int $stockNuevo,
        Producto $producto,
        ?string $lote = null
    )
    {
        return $this->movimientoStockService->registrarMovimientoYActualizar(
            stockProductoId: $stockProductoId,
            cantidad: $diferencia,
            tipo: MovimientoInventario::TIPO_AJUSTE_MASIVO,
            referencia_tipo: 'ajuste_masivo',
            referencia_id: $productoId,
            metadataAdicional: [
                'producto_id' => $productoId,
                'producto_nombre' => $producto->nombre,
                'lote' => $lote ?? 'null',
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $stockNuevo,
                'tipo_ajuste' => 'Carga masiva de stock',
                'fecha_carga' => now()->toDateTimeString(),
            ],
            numeroDocumento: 'AJUSTE-MASIVO-' . date('Ymd-His'),
        );
    }

    /**
     * Leer datos del archivo CSV
     */
    private function leerCSV(string $filePath): array
    {
        $filas = [];
        $csv = Reader::createFromPath($filePath, 'r');
        $csv->setDelimiter(',');
        $csv->setHeaderOffset(0);

        foreach ($csv as $row) {
            // Normalizar valores: trim y convertir a lowercase en encabezados
            $filaNormalizada = [];
            foreach ($row as $key => $value) {
                $filaNormalizada[strtolower($key)] = trim($value ?? '');
            }
            $filas[] = $filaNormalizada;
        }

        return $filas;
    }

    /**
     * Leer datos del archivo Excel
     */
    private function leerExcel(string $filePath): array
    {
        $filas = [];
        $reader = new XlsxReader();
        $spreadsheet = $reader->load($filePath);
        $sheet = $spreadsheet->getActiveSheet();

        $headers = null;
        $rowIndex = 0;

        foreach ($sheet->getRowIterator() as $row) {
            $rowIndex++;
            $rowData = [];

            // Obtener todas las celdas de la fila
            $cellIterator = $row->getCellIterator();
            $cellIterator->setIterateOnlyExistingCells(false);

            foreach ($cellIterator as $cell) {
                $value = $cell->getValue();

                // Convertir valores correctamente
                if ($value === null || $value === '') {
                    $rowData[] = '';
                } else {
                    // Convertir a string y limpiar
                    $rowData[] = trim((string) $value);
                }
            }

            // Primera fila son encabezados
            if ($rowIndex === 1) {
                $headers = $rowData;
                continue;
            }

            // Crear array asociativo con los datos
            if (!empty($headers) && !empty(array_filter($rowData))) {
                $fila = [];
                foreach ($headers as $i => $header) {
                    $fila[trim($header)] = $rowData[$i] ?? '';
                }
                $filas[] = $fila;
            }
        }

        return $filas;
    }
}
