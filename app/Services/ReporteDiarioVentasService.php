<?php

namespace App\Services;

use App\Models\AperturaCaja;
use App\Models\Venta;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ReporteDiarioVentasService
{
    /**
     * Obtener reporte diario completo
     */
    public function generarReporteDiario(?string $fecha = null): array
    {
        $fecha = Carbon::parse($fecha ?? now())->startOfDay();
        $fechaFin = $fecha->copy()->endOfDay();

        // 1️⃣ RESUMEN GENERAL
        $resumenGeneral = $this->obtenerResumenGeneral($fecha, $fechaFin);

        // 2️⃣ DESGLOSE POR CAJA
        $ventasPorCaja = $this->obtenerVentasPorCaja($fecha, $fechaFin);

        // 3️⃣ DETALLES EXTENDIDOS
        $detallesPorCaja = $this->obtenerDetallesPorCaja($ventasPorCaja);

        return [
            'fecha' => $fecha->format('Y-m-d'),
            'fecha_formato' => $fecha->translatedFormat('l d \\d\\e F \\d\\e Y'),
            'resumen_general' => $resumenGeneral,
            'ventas_por_caja' => $detallesPorCaja,
        ];
    }

    /**
     * Resumen general del día
     */
    private function obtenerResumenGeneral(Carbon $inicio, Carbon $fin): array
    {
        $ventas = Venta::whereBetween('created_at', [$inicio, $fin])
            ->with('detalles.producto')
            ->get();

        return [
            'total_ventas' => round($ventas->sum('total'), 2),
            'cantidad_ventas' => $ventas->count(),
            'ticket_promedio' => round($ventas->count() > 0 ? $ventas->sum('total') / $ventas->count() : 0, 2),
            'cajas_activas' => $this->contarCajasActivas($inicio, $fin),
            'por_tipo_pago' => $this->desglosePorTipoPago($ventas),
            'por_estado' => $this->desglosePorEstado($ventas),
            'productos_top' => $this->obtenerProductosTop($ventas, 5),
        ];
    }

    /**
     * Ventas agrupadas por caja
     */
    private function obtenerVentasPorCaja(Carbon $inicio, Carbon $fin): Collection
    {
        return AperturaCaja::with(['caja', 'usuario'])
            ->whereBetween('fecha', [$inicio, $fin])
            ->orderBy('fecha', 'asc')
            ->get()
            ->map(function ($apertura) use ($inicio, $fin) {
                // Obtener ventas del usuario en ese rango de tiempo (no por apertura_caja_id)
                $ventas = Venta::where('usuario_id', $apertura->user_id)
                    ->whereBetween('created_at', [$inicio, $fin])
                    ->with(['cliente', 'tipoPago', 'estadoDocumento', 'usuario'])
                    ->get();

                return [
                    'apertura_id' => $apertura->id,
                    'caja_id' => $apertura->caja_id,
                    'caja_nombre' => $apertura->caja->nombre ?? 'Desconocida',
                    'caja_ubicacion' => $apertura->caja->ubicacion ?? '',
                    'usuario_id' => $apertura->user_id,
                    'usuario_nombre' => $apertura->usuario->name ?? 'Desconocido',
                    'fecha_apertura' => $apertura->fecha,
                    'monto_apertura' => $apertura->monto_apertura,
                    'cierre' => $apertura->cierre,
                    'ventas' => $ventas,
                ];
            });
    }

    /**
     * Detalles extendidos por caja
     */
    private function obtenerDetallesPorCaja($ventasPorCaja): array
    {
        // Obtener el total máximo para identificar la caja con más ventas
        $totalesPorCaja = $ventasPorCaja->map(fn($c) => $c['ventas']->sum('total'));
        $maxVentas = $totalesPorCaja->max();

        return $ventasPorCaja->map(function ($caja) use ($maxVentas) {
            $ventas = $caja['ventas'];
            $totalVentas = $ventas->sum('total');
            $cantidadVentas = $ventas->count();
            $esMaxima = $totalVentas == $maxVentas && $maxVentas > 0;

            return [
                'caja' => [
                    'id' => $caja['caja_id'],
                    'nombre' => $caja['caja_nombre'],
                    'ubicacion' => $caja['caja_ubicacion'],
                    'usuario' => $caja['usuario_nombre'],
                    'usuario_id' => $caja['usuario_id'],
                ],
                'es_maxima' => $esMaxima,
                'horario' => [
                    'apertura' => $caja['fecha_apertura']->format('H:i:s'),
                    'cierre' => $caja['cierre'] ? $caja['cierre']->fecha_cierre->format('H:i:s') : null,
                    'estado' => $caja['cierre'] ? 'CERRADA' : 'ABIERTA',
                    'duracion' => $caja['cierre']
                        ? $this->calcularDuracion($caja['fecha_apertura'], $caja['cierre']->fecha_cierre)
                        : null,
                ],
                'resumen' => [
                    'total_ventas' => round($totalVentas, 2),
                    'cantidad_ventas' => $cantidadVentas,
                    'ticket_promedio' => round($cantidadVentas > 0 ? $totalVentas / $cantidadVentas : 0, 2),
                    'monto_apertura' => $caja['monto_apertura'],
                ],
                'por_tipo_pago' => $this->desglosePorTipoPago($ventas),
                'por_estado' => $this->desglosePorEstado($ventas),
                'top_clientes' => $this->obtenerTopClientes($ventas, 5),
                'productos_top' => $this->obtenerProductosTopPorCaja($ventas, 5),
                'cantidad_detalles' => $cantidadVentas,
                'detalles_ventas' => $this->formatearVentas($ventas),
            ];
        })->all();
    }

    /**
     * Desglose por tipo de pago
     */
    private function desglosePorTipoPago($ventas): array
    {
        if ($ventas->isEmpty()) {
            return [];
        }

        $montoTotal = $ventas->sum('total');

        return $ventas->groupBy('tipo_pago_id')
            ->map(function ($grupo) use ($montoTotal) {
                $total = $grupo->sum('total');
                $porcentaje = $montoTotal > 0 ? ($total / $montoTotal) * 100 : 0;

                return [
                    'tipo_pago' => $grupo->first()->tipoPago->nombre ?? 'Desconocido',
                    'total' => round($total, 2),
                    'cantidad' => $grupo->count(),
                    'porcentaje' => round($porcentaje, 2),
                ];
            })
            ->sortByDesc('total')
            ->values()
            ->all();
    }

    /**
     * Desglose por estado
     */
    private function desglosePorEstado($ventas): array
    {
        if ($ventas->isEmpty()) {
            return [];
        }

        $montoTotal = $ventas->sum('total');

        return $ventas->groupBy('estado_documento_id')
            ->map(function ($grupo) use ($montoTotal) {
                $total = $grupo->sum('total');
                $porcentaje = $montoTotal > 0 ? ($total / $montoTotal) * 100 : 0;

                return [
                    'estado' => $grupo->first()->estadoDocumento->nombre ?? 'Desconocido',
                    'total' => round($total, 2),
                    'cantidad' => $grupo->count(),
                    'porcentaje' => round($porcentaje, 2),
                ];
            })
            ->sortByDesc('total')
            ->values()
            ->all();
    }

    /**
     * Top N clientes
     */
    private function obtenerTopClientes($ventas, $limite = 5): array
    {
        if ($ventas->isEmpty()) {
            return [];
        }

        return $ventas->groupBy('cliente_id')
            ->map(function ($grupo) {
                return [
                    'cliente' => $grupo->first()->cliente->nombre ?? 'Anónimo',
                    'total' => round($grupo->sum('total'), 2),
                    'cantidad' => $grupo->count(),
                ];
            })
            ->sortByDesc('total')
            ->take($limite)
            ->values()
            ->all();
    }

    /**
     * Contar cajas activas
     */
    private function contarCajasActivas(Carbon $inicio, Carbon $fin): int
    {
        return AperturaCaja::whereBetween('fecha', [$inicio, $fin])->count();
    }

    /**
     * Formatear ventas para listado
     */
    private function formatearVentas($ventas): array
    {
        return $ventas->map(function ($venta) {
            return [
                'id' => $venta->id,
                'numero' => $venta->numero,
                'cliente' => $venta->cliente->nombre ?? 'Anónimo',
                'total' => round($venta->total, 2),
                'tipo_pago' => $venta->tipoPago->nombre ?? 'Desconocido',
                'estado' => $venta->estadoDocumento->nombre ?? 'Desconocido',
                'hora' => $venta->created_at->format('H:i:s'),
                'registrado_por' => $venta->usuario->name ?? 'Desconocido',
            ];
        })
        ->sortByDesc('hora')
        ->values()
        ->all();
    }

    /**
     * Calcular duración entre dos fechas
     */
    private function calcularDuracion(Carbon $inicio, Carbon $fin): string
    {
        $diff = $inicio->diff($fin);

        $horas = $diff->h;
        $minutos = $diff->i;

        return "{$horas}h {$minutos}m";
    }

    /**
     * Obtener productos más vendidos del día
     */
    private function obtenerProductosTop($ventas, $limite = 5): array
    {
        if ($ventas->isEmpty()) {
            return [];
        }

        $productosVendidos = [];

        foreach ($ventas as $venta) {
            // Cargar detalles si no están cargados
            if (!$venta->relationLoaded('detalles')) {
                $venta->load('detalles.producto');
            }

            if ($venta->detalles && $venta->detalles->isNotEmpty()) {
                foreach ($venta->detalles as $detalle) {
                    // Asegurar que el producto está cargado
                    if (!$detalle->relationLoaded('producto') && $detalle->producto_id) {
                        $detalle->load('producto');
                    }

                    $productoNombre = $detalle->producto->nombre ?? 'Desconocido';

                    if (!isset($productosVendidos[$productoNombre])) {
                        $productosVendidos[$productoNombre] = [
                            'nombre' => $productoNombre,
                            'cantidad' => 0,
                            'monto' => 0,
                        ];
                    }

                    $cantidad = (int)($detalle->cantidad ?? 0);
                    $subtotal = (float)($detalle->subtotal ?? 0);

                    $productosVendidos[$productoNombre]['cantidad'] += $cantidad;
                    $productosVendidos[$productoNombre]['monto'] += $subtotal;
                }
            }
        }

        if (empty($productosVendidos)) {
            return [];
        }

        uasort($productosVendidos, fn($a, $b) => $b['monto'] <=> $a['monto']);

        $resultado = array_slice(
            array_map(fn($p) => [
                'nombre' => $p['nombre'],
                'cantidad' => (int)$p['cantidad'],
                'monto' => round($p['monto'], 2),
            ], $productosVendidos),
            0,
            $limite
        );

        // 🔴 CRÍTICO: Convertir a array indexado (no asociativo) para que Inertia lo serialice como array
        return array_values($resultado);
    }

    /**
     * Obtener productos más vendidos por caja
     */
    private function obtenerProductosTopPorCaja($ventas, $limite = 5): array
    {
        if ($ventas->isEmpty()) {
            return [];
        }

        $productosVendidos = [];

        foreach ($ventas as $venta) {
            // Cargar detalles si no están cargados
            if (!$venta->relationLoaded('detalles')) {
                $venta->load('detalles.producto');
            }

            if ($venta->detalles && $venta->detalles->isNotEmpty()) {
                foreach ($venta->detalles as $detalle) {
                    // Asegurar que el producto está cargado
                    if (!$detalle->relationLoaded('producto') && $detalle->producto_id) {
                        $detalle->load('producto');
                    }

                    $productoNombre = $detalle->producto->nombre ?? 'Desconocido';

                    if (!isset($productosVendidos[$productoNombre])) {
                        $productosVendidos[$productoNombre] = [
                            'nombre' => $productoNombre,
                            'cantidad' => 0,
                            'monto' => 0,
                        ];
                    }

                    $cantidad = (int)($detalle->cantidad ?? 0);
                    $subtotal = (float)($detalle->subtotal ?? 0);

                    $productosVendidos[$productoNombre]['cantidad'] += $cantidad;
                    $productosVendidos[$productoNombre]['monto'] += $subtotal;
                }
            }
        }

        if (empty($productosVendidos)) {
            return [];
        }

        uasort($productosVendidos, fn($a, $b) => $b['monto'] <=> $a['monto']);

        $resultado = array_slice(
            array_map(fn($p) => [
                'nombre' => $p['nombre'],
                'cantidad' => (int)$p['cantidad'],
                'monto' => round($p['monto'], 2),
            ], $productosVendidos),
            0,
            $limite
        );

        // 🔴 CRÍTICO: Convertir a array indexado (no asociativo) para que Inertia lo serialice como array
        return array_values($resultado);
    }
}
