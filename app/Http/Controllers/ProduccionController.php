<?php

namespace App\Http\Controllers;

use App\Models\Produccion;
use App\Models\ProduccionIngrediente;
use App\Models\RecetaIngrediente;
use App\Models\Producto;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProduccionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Listar todas las producciones con filtros
     */
    public function index(Request $request)
    {
        $query = Produccion::with(['producto', 'ingredientesUsados.recetaIngrediente.ingrediente', 'registradoPor']);

        // Filtro por fecha
        if ($request->query('fecha')) {
            $query->where('fecha_produccion', $request->query('fecha'));
        }

        // Filtro por estado
        if ($request->query('estado')) {
            $query->where('estado', $request->query('estado'));
        }

        // Filtro por producto
        if ($request->query('producto_id')) {
            $query->where('producto_id', $request->query('producto_id'));
        }

        $producciones = $query->latest('created_at')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $producciones,
        ]);
    }

    /**
     * Mostrar una producción específica
     */
    public function show(Produccion $produccion)
    {
        $produccion->load([
            'producto.receta.ingredientes',
            'ingredientesUsados.recetaIngrediente.ingrediente',
            'registradoPor',
            'detallesVenta',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'produccion' => $produccion,
                'costo_total' => $produccion->costoTotal(),
                'costo_unitario' => $produccion->costoPorUnidad(),
            ],
        ]);
    }

    /**
     * Crear nueva producción
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'fecha_produccion' => 'required|date',
            'cantidad_producida' => 'required|numeric|min:0.001',
            'ingredientes' => 'nullable|array',
            'ingredientes.*.receta_ingrediente_id' => 'required|exists:receta_ingredientes,id',
            'ingredientes.*.cantidad_usada' => 'required|numeric|min:0.001',
            'observaciones' => 'nullable|string',
        ]);

        // Verificar que el producto sea elaborado en cafetería
        $producto = Producto::find($validated['producto_id']);
        if ($producto->tipo_producto !== 'elaborado_cafeteria') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden producir productos elaborados en cafetería',
            ], 422);
        }

        // Verificar que tenga receta
        if (!$producto->receta) {
            return response()->json([
                'success' => false,
                'message' => 'Este producto no tiene receta definida',
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Crear producción
            $validated['registrado_por'] = auth()->id();
            $validated['estado'] = 'en_proceso';
            $produccion = Produccion::create($validated);

            // Registrar ingredientes usados
            if (isset($validated['ingredientes']) && !empty($validated['ingredientes'])) {
                foreach ($validated['ingredientes'] as $ingrediente) {
                    // Obtener el costo unitario del ingrediente
                    $recetaIngrediente = RecetaIngrediente::find($ingrediente['receta_ingrediente_id']);
                    $costo_unitario = $recetaIngrediente->ingrediente->precio_compra ?? 0;

                    ProduccionIngrediente::create([
                        'produccion_id' => $produccion->id,
                        'receta_ingrediente_id' => $ingrediente['receta_ingrediente_id'],
                        'cantidad_usada' => $ingrediente['cantidad_usada'],
                        'costo_unitario' => $costo_unitario,
                    ]);
                }
            } else {
                // Si no se envían ingredientes, cargar desde la receta
                foreach ($producto->receta->ingredientes as $recetaIngrediente) {
                    ProduccionIngrediente::create([
                        'produccion_id' => $produccion->id,
                        'receta_ingrediente_id' => $recetaIngrediente->id,
                        'cantidad_usada' => $recetaIngrediente->cantidad_requerida,
                        'costo_unitario' => $recetaIngrediente->ingrediente->precio_compra ?? 0,
                    ]);
                }
            }

            DB::commit();

            $produccion->load(['producto', 'ingredientesUsados.recetaIngrediente.ingrediente']);

            return response()->json([
                'success' => true,
                'message' => 'Producción registrada exitosamente',
                'data' => $produccion,
                'costo_total' => $produccion->costoTotal(),
                'costo_unitario' => $produccion->costoPorUnidad(),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al registrar producción: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Actualizar producción
     */
    public function update(Request $request, Produccion $produccion)
    {
        if ($produccion->estado === 'completada') {
            return response()->json([
                'success' => false,
                'message' => 'No se puede modificar una producción completada',
            ], 422);
        }

        $validated = $request->validate([
            'cantidad_producida' => 'numeric|min:0.001',
            'observaciones' => 'nullable|string',
            'estado' => 'in:en_proceso,completada,cancelada',
        ]);

        $produccion->update($validated);
        $produccion->load(['producto', 'ingredientesUsados.recetaIngrediente.ingrediente']);

        return response()->json([
            'success' => true,
            'message' => 'Producción actualizada exitosamente',
            'data' => $produccion,
        ]);
    }

    /**
     * Eliminar producción (solo si está en proceso)
     */
    public function destroy(Produccion $produccion)
    {
        if ($produccion->estado !== 'en_proceso') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden eliminar producciones en proceso',
            ], 422);
        }

        // Verificar que no tenga ventas asociadas
        if ($produccion->detallesVenta()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar producción con ventas asociadas',
            ], 422);
        }

        $produccion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Producción eliminada exitosamente',
        ]);
    }

    /**
     * Obtener producciones del día
     */
    public function delDia(Request $request, $fecha = null)
    {
        if ($fecha === null) {
            $fecha = now()->format('Y-m-d');
        }

        // Validar formato de fecha
        try {
            Carbon::parse($fecha);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Formato de fecha inválido',
            ], 422);
        }

        $producciones = Produccion::delDia($fecha)
            ->with(['producto', 'ingredientesUsados.recetaIngrediente.ingrediente', 'registradoPor'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $producciones,
            'fecha' => $fecha,
            'total_producciones' => $producciones->count(),
        ]);
    }

    /**
     * Reporte de producción del día
     */
    public function reporteDia(Request $request, $fecha = null)
    {
        if ($fecha === null) {
            $fecha = now()->format('Y-m-d');
        }

        try {
            Carbon::parse($fecha);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Formato de fecha inválido',
            ], 422);
        }

        $producciones = Produccion::delDia($fecha)
            ->with(['producto', 'ingredientesUsados.recetaIngrediente.ingrediente', 'registradoPor'])
            ->get();

        if ($producciones->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'fecha' => $fecha,
                    'total_producciones' => 0,
                    'costo_total_ingredientes' => 0,
                    'productos' => [],
                    'ingredientes_consumidos' => [],
                ],
            ]);
        }

        // Calcular datos del reporte
        $costoTotalIngredientes = $producciones->sum(fn($p) => $p->costoTotal());

        // Agrupar ingredientes consumidos
        $ingredientesConsumidos = [];
        foreach ($producciones as $produccion) {
            foreach ($produccion->ingredientesUsados as $ingrediente) {
                $nombre = $ingrediente->ingrediente->nombre;
                if (!isset($ingredientesConsumidos[$nombre])) {
                    $ingredientesConsumidos[$nombre] = [
                        'nombre' => $nombre,
                        'cantidad_total' => 0,
                        'costo_total' => 0,
                    ];
                }
                $ingredientesConsumidos[$nombre]['cantidad_total'] += (float) $ingrediente->cantidad_usada;
                $ingredientesConsumidos[$nombre]['costo_total'] += $ingrediente->costoTotal();
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'fecha' => $fecha,
                'resumen' => [
                    'total_producciones' => $producciones->count(),
                    'costo_total_ingredientes' => round($costoTotalIngredientes, 2),
                    'costo_promedio_por_produccion' => round($costoTotalIngredientes / $producciones->count(), 2),
                ],
                'producciones' => $producciones->map(fn($p) => [
                    'id' => $p->id,
                    'producto' => $p->producto->nombre,
                    'cantidad_producida' => $p->cantidad_producida,
                    'costo_total' => round($p->costoTotal(), 2),
                    'costo_unitario' => round($p->costoPorUnidad(), 2),
                    'registrado_por' => $p->registradoPor->name,
                    'estado' => $p->estado,
                ]),
                'ingredientes_consumidos' => array_values($ingredientesConsumidos),
            ],
        ]);
    }

    /**
     * Obtener productos disponibles para producir (elaborados)
     */
    public function productosDisponibles()
    {
        $productos = Producto::elaborados()
            ->with('receta.ingredientes.ingrediente')
            ->where('activo', true)
            ->select(['id', 'nombre', 'tipo_producto'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $productos,
        ]);
    }

    /**
     * Descargar reporte de producción en Excel
     */
    public function descargarReporteExcel(Request $request)
    {
        $fechaInicio = $request->query('fecha_inicio', now()->format('Y-m-d'));
        $fechaFin = $request->query('fecha_fin', now()->format('Y-m-d'));

        try {
            Carbon::parse($fechaInicio);
            Carbon::parse($fechaFin);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Formato de fecha inválido',
            ], 422);
        }

        // Generar rangos de fechas
        $fechas = [];
        $inicio = Carbon::parse($fechaInicio);
        $fin = Carbon::parse($fechaFin);

        for ($d = $inicio->copy(); $d->lte($fin); $d->addDay()) {
            $fechas[] = $d->format('Y-m-d');
        }

        // Obtener datos de todas las fechas
        $reportesPorFecha = [];
        $ingredientesConsolidados = [];
        $produccionesConsolidadas = [];

        foreach ($fechas as $fecha) {
            $producciones = Produccion::delDia($fecha)
                ->with(['producto', 'ingredientesUsados.recetaIngrediente.ingrediente', 'registradoPor'])
                ->get();

            if ($producciones->isNotEmpty()) {
                $reportesPorFecha[$fecha] = [
                    'producciones' => $producciones,
                    'total_producciones' => $producciones->count(),
                    'costo_total' => $producciones->sum(fn($p) => $p->costoTotal()),
                ];

                // Consolidar ingredientes
                foreach ($producciones as $produccion) {
                    $produccionesConsolidadas[] = [
                        'fecha' => $fecha,
                        'producto' => $produccion->producto->nombre,
                        'cantidad' => $produccion->cantidad_producida,
                        'costo_total' => $produccion->costoTotal(),
                        'costo_unitario' => $produccion->costoPorUnidad(),
                    ];

                    foreach ($produccion->ingredientesUsados as $ingrediente) {
                        $nombre = $ingrediente->ingrediente->nombre;
                        if (!isset($ingredientesConsolidados[$nombre])) {
                            $ingredientesConsolidados[$nombre] = [
                                'cantidad' => 0,
                                'costo' => 0,
                            ];
                        }
                        $ingredientesConsolidados[$nombre]['cantidad'] += (float) $ingrediente->cantidad_usada;
                        $ingredientesConsolidados[$nombre]['costo'] += $ingrediente->costoTotal();
                    }
                }
            }
        }

        // Crear archivo Excel
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Reporte Producción');

        // Configurar ancho de columnas
        $sheet->getColumnDimension('A')->setWidth(20);
        $sheet->getColumnDimension('B')->setWidth(15);
        $sheet->getColumnDimension('C')->setWidth(15);
        $sheet->getColumnDimension('D')->setWidth(15);
        $sheet->getColumnDimension('E')->setWidth(15);

        $fila = 1;

        // TÍTULO
        $sheet->setCellValue("A{$fila}", "REPORTE DE PRODUCCIÓN");
        $sheet->mergeCells("A{$fila}:E{$fila}");
        $titleStyle = $sheet->getStyle("A{$fila}");
        $titleStyle->getFont()->setBold(true)->setSize(14)->getColor()->setARGB('FFFFFFFF');
        $titleStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF1F4E78');
        $titleStyle->getAlignment()->setHorizontal('center')->setVertical('center');
        $sheet->getRowDimension($fila)->setRowHeight(25);
        $fila++;

        $sheet->setCellValue("A{$fila}", "Período: {$fechaInicio} al {$fechaFin}");
        $fila += 2;

        // RESUMEN GENERAL
        $sheet->setCellValue("A{$fila}", "RESUMEN GENERAL");
        $sheet->getRowDimension($fila)->setRowHeight(20);
        $sectionStyle = $sheet->getStyle("A{$fila}");
        $sectionStyle->getFont()->setBold(true)->setSize(12)->getColor()->setARGB('FFFFFFFF');
        $sectionStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF2E75B6');
        $fila++;

        $headers = ['Métrica', 'Valor'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue(['A', 'B'][$col] . $fila, $header);
            $headerStyle = $sheet->getStyle(['A', 'B'][$col] . $fila);
            $headerStyle->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
            $headerStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF4472C4');
            $headerStyle->getAlignment()->setHorizontal('center');
        }
        $fila++;

        $totalProducciones = array_sum(array_map(fn($r) => $r['total_producciones'], $reportesPorFecha));
        $costTotalIngredientes = array_sum(array_map(fn($r) => $r['costo_total'], $reportesPorFecha));

        $metricas = [
            'Total Producciones' => $totalProducciones,
            'Costo Total Ingredientes' => 'Bs. ' . number_format($costTotalIngredientes, 2),
            'Costo Promedio/Producción' => $totalProducciones > 0 ? 'Bs. ' . number_format($costTotalIngredientes / $totalProducciones, 2) : '0.00',
            'Días con Producción' => count($reportesPorFecha),
        ];

        foreach ($metricas as $metrica => $valor) {
            $sheet->setCellValue("A{$fila}", $metrica);
            $sheet->setCellValue("B{$fila}", $valor);
            $fila++;
        }

        $fila += 2;

        // DETALLE DE PRODUCCIONES
        $sheet->setCellValue("A{$fila}", "DETALLE DE PRODUCCIONES");
        $sheet->getRowDimension($fila)->setRowHeight(20);
        $sectionStyle = $sheet->getStyle("A{$fila}");
        $sectionStyle->getFont()->setBold(true)->setSize(12)->getColor()->setARGB('FFFFFFFF');
        $sectionStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF70AD47');
        $fila++;

        $headers = ['Fecha', 'Producto', 'Cantidad', 'Costo Total', 'Costo Unitario'];
        $cols = ['A', 'B', 'C', 'D', 'E'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue($cols[$col] . $fila, $header);
            $headerStyle = $sheet->getStyle($cols[$col] . $fila);
            $headerStyle->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
            $headerStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF92D050');
            $headerStyle->getAlignment()->setHorizontal('center');
        }
        $fila++;

        foreach ($produccionesConsolidadas as $prod) {
            $sheet->setCellValue("A{$fila}", $prod['fecha']);
            $sheet->setCellValue("B{$fila}", $prod['producto']);
            $sheet->setCellValue("C{$fila}", $prod['cantidad']);
            $sheet->setCellValue("D{$fila}", $prod['costo_total']);
            $sheet->setCellValue("E{$fila}", $prod['costo_unitario']);
            $fila++;
        }

        $fila += 2;

        // INGREDIENTES CONSUMIDOS
        $sheet->setCellValue("A{$fila}", "INGREDIENTES CONSUMIDOS");
        $sheet->getRowDimension($fila)->setRowHeight(20);
        $sectionStyle = $sheet->getStyle("A{$fila}");
        $sectionStyle->getFont()->setBold(true)->setSize(12)->getColor()->setARGB('FFFFFFFF');
        $sectionStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF4BACC6');
        $fila++;

        $headers = ['Ingrediente', 'Cantidad Total', 'Costo Total'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue($cols[$col] . $fila, $header);
            $headerStyle = $sheet->getStyle($cols[$col] . $fila);
            $headerStyle->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
            $headerStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF92D9DC');
            $headerStyle->getAlignment()->setHorizontal('center');
        }
        $fila++;

        foreach ($ingredientesConsolidados as $nombre => $datos) {
            $sheet->setCellValue("A{$fila}", $nombre);
            $sheet->setCellValue("B{$fila}", $datos['cantidad']);
            $sheet->setCellValue("C{$fila}", $datos['costo']);
            $fila++;
        }

        // Descargar
        $nombreArchivo = "reporte-produccion-{$fechaInicio}-{$fechaFin}.xlsx";
        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');

        return response()->stream(
            function () use ($writer) {
                $writer->save('php://output');
            },
            200,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => "attachment; filename=\"{$nombreArchivo}\"",
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ]
        );
    }
}
