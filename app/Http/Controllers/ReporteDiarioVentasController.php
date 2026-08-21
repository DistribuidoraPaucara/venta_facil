<?php

namespace App\Http\Controllers;

use App\Services\ReporteDiarioVentasService;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
}
