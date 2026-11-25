<?php

namespace App\Http\Controllers;

use App\Models\Ingreso;
use App\Models\TipoOperacionCaja;
use App\Models\TipoPago;
use App\Models\User;
use App\Services\ImpresionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class IngresosController extends Controller
{
    /**
     * Listado de ingresos con filtros
     */
    public function index(Request $request)
    {
        $query = Ingreso::with(['tipoOperacion', 'estadoDocumento', 'usuario']);

        if ($request->filled('numero')) {
            $numero = $request->input('numero');
            $query->where(function ($q) use ($numero) {
                $q->where('numero', 'ilike', "%{$numero}%")
                    ->orWhere('id', (int) $numero);
            });
        }

        if ($request->filled('tipo_operacion_id')) {
            $query->where('tipo_operacion_caja_id', $request->input('tipo_operacion_id'));
        }

        if ($request->filled('usuario_id')) {
            $query->where('usuario_id', $request->input('usuario_id'));
        }

        $ingresos = $query->orderBy('fecha', 'desc')->orderBy('id', 'desc')->paginate(15);

        return Inertia::render('Ingresos/Index', [
            'ingresos' => $ingresos,
            'tipos_operacion' => TipoOperacionCaja::where('activo', true)->where('direccion', 'ENTRADA')->get(),
            'usuarios' => User::where('activo', true)->get(),
        ]);
    }

    /**
     * Formulario para crear un ingreso
     */
    public function create()
    {
        return Inertia::render('Ingresos/Create', [
            'tipos_operacion' => TipoOperacionCaja::where('activo', true)->where('direccion', 'ENTRADA')->get(),
            'tipos_pago' => TipoPago::where('activo', true)->get(),
        ]);
    }

    /**
     * Detalle de un ingreso
     */
    public function show(Ingreso $ingreso)
    {
        $ingreso->load([
            'tipoOperacion',
            'estadoDocumento',
            'usuario',
            'detalles.tipoOperacion',
        ]);

        return Inertia::render('Ingresos/Show', [
            'ingreso' => $ingreso,
        ]);
    }

    /**
     * Imprimir ingreso en PDF
     */
    public function imprimir(Ingreso $ingreso, Request $request)
    {
        $formato = $request->input('formato', 'A4');      // A4, TICKET_80, TICKET_58
        $accion = $request->input('accion', 'download'); // download | stream

        try {
            $pdf = app(ImpresionService::class)->imprimirIngreso($ingreso, $formato);

            $nombreArchivo = "ingreso_{$ingreso->numero}_{$formato}.pdf";

            return $accion === 'stream'
                ? $pdf->stream($nombreArchivo)
                : $pdf->download($nombreArchivo);
        } catch (\Exception $e) {
            Log::error('Error generando PDF de ingreso', [
                'ingreso_id' => $ingreso->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al generar PDF: ' . $e->getMessage(),
            ], 500);
        }
    }
}
