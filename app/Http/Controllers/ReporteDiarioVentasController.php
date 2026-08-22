<?php

namespace App\Http\Controllers;

use App\Services\ReporteDiarioVentasService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ReporteDiarioVentasController extends Controller
{
    private ReporteDiarioVentasService $servicio;

    public function __construct(ReporteDiarioVentasService $servicio)
    {
        $this->servicio = $servicio;
    }

    /**
     * Mostrar reporte diario de ventas por cajas
     */
    public function index(Request $request)
    {
        $fecha = $request->query('fecha', now()->format('Y-m-d'));

        $reporte = $this->servicio->generarReporteDiario($fecha);

        return Inertia::render('reportes/ventas-diario-cajas', [
            'reporte' => $reporte,
            'fecha_actual' => $fecha,
            'fecha_hoy' => now()->format('Y-m-d'),
        ]);
    }

    /**
     * Descargar reporte en Excel
     */
    public function descargarExcel(Request $request)
    {
        $fecha = $request->query('fecha', now()->format('Y-m-d'));
        $reporte = $this->servicio->generarReporteDiario($fecha);

        // Generar Excel dinámicamente
        return $this->generarExcel($reporte, $fecha);
    }

    /**
     * Generar archivo Excel con los datos del reporte
     */
    private function generarExcel(array $reporte, string $fecha)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Reporte Diario');

        // Configurar ancho de columnas
        $sheet->getColumnDimension('A')->setWidth(35);
        $sheet->getColumnDimension('B')->setWidth(18);
        $sheet->getColumnDimension('C')->setWidth(18);
        $sheet->getColumnDimension('D')->setWidth(18);

        $fila = 1;

        // TÍTULO
        $sheet->setCellValue("A{$fila}", "REPORTE DIARIO DE VENTAS POR CAJAS");
        $sheet->mergeCells("A{$fila}:D{$fila}");
        $sheet->getRowDimension($fila)->setRowHeight(25);
        $titleStyle = $sheet->getStyle("A{$fila}");
        $titleStyle->getFont()->setBold(true)->setSize(14)->getColor()->setARGB('FFFFFFFF');
        $titleStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF1F4E78');
        $titleStyle->getAlignment()->setHorizontal('center')->setVertical('center');
        $fila++;

        $sheet->setCellValue("A{$fila}", "Fecha: {$reporte['fecha_formato']}");
        $sheet->getStyle("A{$fila}")->getFont()->setBold(true)->setSize(11)->getColor()->setARGB('FF1F4E78');
        $fila += 2;

        // RESUMEN GENERAL
        $sheet->setCellValue("A{$fila}", "RESUMEN GENERAL");
        $sheet->getRowDimension($fila)->setRowHeight(20);
        $sectionStyle = $sheet->getStyle("A{$fila}");
        $sectionStyle->getFont()->setBold(true)->setSize(12)->getColor()->setARGB('FFFFFFFF');
        $sectionStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF2E75B6');
        $sectionStyle->getAlignment()->setHorizontal('left');
        $fila++;

        $headers = ["Total Ventas", "Cantidad Ventas", "Ticket Promedio", "Cajas Activas"];
        $cols = ['A', 'B', 'C', 'D'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue($cols[$col] . $fila, $header);
            $headerStyle = $sheet->getStyle($cols[$col] . $fila);
            $headerStyle->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
            $headerStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF4472C4');
            $headerStyle->getAlignment()->setHorizontal('center')->setVertical('center');
            $headerStyle->getBorders()->getAllBorders()->setBorderStyle('thin');
        }
        $sheet->getRowDimension($fila)->setRowHeight(18);
        $fila++;

        $sheet->setCellValue("A{$fila}", "Bs. " . $reporte['resumen_general']['total_ventas']);
        $sheet->setCellValue("B{$fila}", $reporte['resumen_general']['cantidad_ventas']);
        $sheet->setCellValue("C{$fila}", "Bs. " . $reporte['resumen_general']['ticket_promedio']);
        $sheet->setCellValue("D{$fila}", $reporte['resumen_general']['cajas_activas']);
        $cols = ['A', 'B', 'C', 'D'];
        foreach ($cols as $col) {
            $cellStyle = $sheet->getStyle($col . $fila);
            $cellStyle->getAlignment()->setHorizontal('center')->setVertical('center');
            $cellStyle->getBorders()->getAllBorders()->setBorderStyle('thin');
            $cellStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FFE7E6E6');
        }
        $sheet->getRowDimension($fila)->setRowHeight(18);
        $fila += 2;

        // PRODUCTOS MÁS VENDIDOS
        $sheet->setCellValue("A{$fila}", "PRODUCTOS MÁS VENDIDOS");
        $sheet->getRowDimension($fila)->setRowHeight(20);
        $sectionStyle = $sheet->getStyle("A{$fila}");
        $sectionStyle->getFont()->setBold(true)->setSize(12)->getColor()->setARGB('FFFFFFFF');
        $sectionStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF70AD47');
        $fila++;

        $headers = ["Producto", "Cantidad", "Monto"];
        $cols = ['A', 'B', 'C'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue($cols[$col] . $fila, $header);
            $headerStyle = $sheet->getStyle($cols[$col] . $fila);
            $headerStyle->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
            $headerStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF92D050');
            $headerStyle->getAlignment()->setHorizontal('center');
            $headerStyle->getBorders()->getAllBorders()->setBorderStyle('thin');
        }
        $sheet->getRowDimension($fila)->setRowHeight(18);
        $fila++;

        foreach ($reporte['resumen_general']['productos_top'] as $producto) {
            $sheet->setCellValue("A{$fila}", $producto['nombre']);
            $sheet->setCellValue("B{$fila}", $producto['cantidad']);
            $sheet->setCellValue("C{$fila}", "Bs. " . $producto['monto']);
            foreach ($cols as $col) {
                $cellStyle = $sheet->getStyle($col . $fila);
                $cellStyle->getAlignment()->setHorizontal('center');
                $cellStyle->getBorders()->getAllBorders()->setBorderStyle('thin');
            }
            $fila++;
        }
        $fila++;

        // TIPO DE PAGO
        $sheet->setCellValue("A{$fila}", "POR TIPO DE PAGO");
        $sheet->getRowDimension($fila)->setRowHeight(20);
        $sectionStyle = $sheet->getStyle("A{$fila}");
        $sectionStyle->getFont()->setBold(true)->setSize(12)->getColor()->setARGB('FFFFFFFF');
        $sectionStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FFF79646');
        $fila++;

        $headers = ["Tipo de Pago", "Total", "Cantidad", "Porcentaje"];
        $cols = ['A', 'B', 'C', 'D'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue($cols[$col] . $fila, $header);
            $headerStyle = $sheet->getStyle($cols[$col] . $fila);
            $headerStyle->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
            $headerStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FFFDB462');
            $headerStyle->getAlignment()->setHorizontal('center');
            $headerStyle->getBorders()->getAllBorders()->setBorderStyle('thin');
        }
        $sheet->getRowDimension($fila)->setRowHeight(18);
        $fila++;

        foreach ($reporte['resumen_general']['por_tipo_pago'] as $pago) {
            $sheet->setCellValue("A{$fila}", $pago['tipo_pago']);
            $sheet->setCellValue("B{$fila}", "Bs. " . $pago['total']);
            $sheet->setCellValue("C{$fila}", $pago['cantidad']);
            $sheet->setCellValue("D{$fila}", $pago['porcentaje'] . "%");
            foreach ($cols as $col) {
                $cellStyle = $sheet->getStyle($col . $fila);
                $cellStyle->getAlignment()->setHorizontal('center');
                $cellStyle->getBorders()->getAllBorders()->setBorderStyle('thin');
            }
            $fila++;
        }
        $fila++;

        // POR ESTADO
        $sheet->setCellValue("A{$fila}", "POR ESTADO");
        $sheet->getRowDimension($fila)->setRowHeight(20);
        $sectionStyle = $sheet->getStyle("A{$fila}");
        $sectionStyle->getFont()->setBold(true)->setSize(12)->getColor()->setARGB('FFFFFFFF');
        $sectionStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF4BACC6');
        $fila++;

        $headers = ["Estado", "Total", "Cantidad", "Porcentaje"];
        $cols = ['A', 'B', 'C', 'D'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue($cols[$col] . $fila, $header);
            $headerStyle = $sheet->getStyle($cols[$col] . $fila);
            $headerStyle->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
            $headerStyle->getFill()->setFillType('solid')->getStartColor()->setARGB('FF92D9DC');
            $headerStyle->getAlignment()->setHorizontal('center');
            $headerStyle->getBorders()->getAllBorders()->setBorderStyle('thin');
        }
        $sheet->getRowDimension($fila)->setRowHeight(18);
        $fila++;

        foreach ($reporte['resumen_general']['por_estado'] as $estado) {
            $sheet->setCellValue("A{$fila}", $estado['estado']);
            $sheet->setCellValue("B{$fila}", "Bs. " . $estado['total']);
            $sheet->setCellValue("C{$fila}", $estado['cantidad']);
            $sheet->setCellValue("D{$fila}", $estado['porcentaje'] . "%");
            foreach ($cols as $col) {
                $cellStyle = $sheet->getStyle($col . $fila);
                $cellStyle->getAlignment()->setHorizontal('center');
                $cellStyle->getBorders()->getAllBorders()->setBorderStyle('thin');
            }
            $fila++;
        }

        // Descargar archivo
        $nombreArchivo = "reporte-ventas-{$fecha}.xlsx";
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');

        return response()->stream(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$nombreArchivo}\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
