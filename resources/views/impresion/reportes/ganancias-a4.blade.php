@extends('impresion.layouts.base-a4')

@section('titulo', 'Reporte de Ganancias')

@section('contenido')
<style>
    body, table { font-family: "DejaVu Sans", sans-serif; }
    .page { padding: 20px 22px; }
    .rp-titulo { text-align: center; font-size: 16px; font-weight: bold; margin: 0 0 2px 0; }
    .rp-subtitulo { text-align: center; font-size: 10px; color: #666; margin: 0 0 10px 0; }
    .rp-filtros { font-size: 9px; background: #eef4fb; border-left: 3px solid #4F81BD; padding: 6px 8px; margin-bottom: 8px; }
    .rp-aviso { font-size: 9px; background: #fff7e6; border-left: 3px solid #d97706; padding: 6px 8px; margin-bottom: 8px; color: #7c4a03; }
    .rp-resumen { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 8px; }
    .rp-resumen td { border: 1px solid #d0d7e2; padding: 4px; text-align: center; }
    .rp-resumen .num { font-size: 11px; font-weight: bold; display: block; }
    table.rp-tabla { width: 100%; border-collapse: collapse; font-size: 8px; }
    table.rp-tabla thead { display: table-header-group; }
    table.rp-tabla th { background: #4F81BD; color: #fff; padding: 4px 2px; text-align: left; }
    table.rp-tabla td { padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: top; }
    table.rp-tabla tr { page-break-inside: avoid; }
    table.rp-tabla tbody tr:nth-child(even) { background: #f7f7f7; }
    table.rp-tabla tfoot td { font-weight: bold; border-top: 2px solid #4F81BD; padding: 4px 2px; }
    .der { text-align: right; }
    .centro { text-align: center; }
    .pos { color: #15803d; }
    .neg { color: #b91c1c; }
    .gris { color: #777; }
    .sin-costo { color: #b45309; }
    .rp-pie { margin-top: 8px; font-size: 8px; color: #666; }
</style>

@php
    $bs = fn ($n) => number_format((float) $n, 2);
    $e = $estadisticas;
@endphp

<p class="rp-titulo">REPORTE DE GANANCIAS</p>
<p class="rp-subtitulo">Ventas aprobadas y facturadas, con el costo vigente a la fecha de cada venta</p>

<div class="rp-filtros"><strong>Filtros:</strong> {{ implode(' · ', $filtros_texto) }}</div>

@if ($e['ingresos_sin_costo'] > 0)
    <div class="rp-aviso">
        ⚠ Bs {{ $bs($e['ingresos_sin_costo']) }} vendidos
        ({{ $e['ingresos_totales'] > 0 ? number_format($e['ingresos_sin_costo'] / $e['ingresos_totales'] * 100, 1) : 0 }}% del total)
        corresponden a {{ $e['productos_sin_costo'] }} producto(s) sin precio de costo registrado y no se suman a la ganancia.
    </div>
@endif

<table class="rp-resumen">
    <tr>
        <td><span class="num">{{ $bs($e['ingresos_totales']) }}</span>Total vendido (Bs)</td>
        <td><span class="num">{{ $bs($e['ingresos_con_costo']) }}</span>Vendido con costo</td>
        <td><span class="num">{{ $bs($e['costos_totales']) }}</span>Costo de lo vendido</td>
        <td><span class="num {{ $e['ganancia_total'] < 0 ? 'neg' : 'pos' }}">{{ $bs($e['ganancia_total']) }}</span>Ganancia</td>
        <td><span class="num">{{ $e['margen'] === null ? '—' : number_format($e['margen'], 1) . '%' }}</span>Margen</td>
        <td><span class="num neg">{{ $e['productos_con_perdida'] }}</span>Con pérdida</td>
    </tr>
</table>

<table class="rp-tabla">
    <thead>
        <tr>
            <th style="width: 27%;">Producto</th>
            <th style="width: 10%;">Tipo</th>
            <th class="der" style="width: 7%;">Cant.</th>
            <th class="der" style="width: 9%;">Precio prom.</th>
            <th class="der" style="width: 9%;">Costo prom.</th>
            <th class="der" style="width: 10%;">Vendido</th>
            <th class="der" style="width: 10%;">Costo total</th>
            <th class="der" style="width: 10%;">Ganancia</th>
            <th class="der" style="width: 8%;">Margen</th>
        </tr>
    </thead>
    <tbody>
        @forelse ($filas as $g)
            @php $sin = $g['estado_costo'] === 'sin_costo'; @endphp
            <tr>
                <td>
                    {{ $g['producto']['nombre'] }}
                    <br><span class="gris">#{{ $g['producto']['id'] }}@if (!empty($g['producto']['sku'])) · {{ $g['producto']['sku'] }}@endif @if ($g['unidad_medida']) · {{ $g['unidad_medida'] }}@endif</span>
                </td>
                <td>{{ $g['tipo_precio']['nombre'] }}</td>
                <td class="der">{{ fmod((float) $g['cantidad_vendida'], 1) == 0 ? (int) $g['cantidad_vendida'] : number_format($g['cantidad_vendida'], 2) }}</td>
                <td class="der">{{ $bs($g['precio_promedio']) }}</td>
                <td class="der gris">{{ $g['costo_promedio'] === null ? '—' : $bs($g['costo_promedio']) }}</td>
                <td class="der">{{ $bs($g['ingresos_totales']) }}</td>
                @if ($sin)
                    <td colspan="3" class="centro sin-costo">⚠ Sin costo registrado</td>
                @else
                    <td class="der gris">{{ $bs($g['costos_totales']) }}</td>
                    <td class="der {{ $g['ganancia'] < 0 ? 'neg' : 'pos' }}">
                        <strong>{{ $bs($g['ganancia']) }}</strong>
                        @if ($g['estado_costo'] === 'parcial')
                            <br><span class="sin-costo">⚠ {{ $bs($g['ingresos_sin_costo']) }} sin costo</span>
                        @endif
                    </td>
                    <td class="der">{{ $g['margen'] === null ? '—' : number_format($g['margen'], 1) . '%' }}</td>
                @endif
            </tr>
        @empty
            <tr>
                <td colspan="9" class="centro gris" style="padding: 15px;">No hay ventas con los filtros seleccionados</td>
            </tr>
        @endforelse
    </tbody>
    @if (count($filas) > 0)
        <tfoot>
            <tr>
                <td colspan="5">TOTAL</td>
                <td class="der">{{ $bs($e['ingresos_totales']) }}</td>
                <td class="der">{{ $bs($e['costos_totales']) }}</td>
                <td class="der {{ $e['ganancia_total'] < 0 ? 'neg' : 'pos' }}">{{ $bs($e['ganancia_total']) }}</td>
                <td class="der">{{ $e['margen'] === null ? '—' : number_format($e['margen'], 1) . '%' }}</td>
            </tr>
        </tfoot>
    @endif
</table>

<div class="rp-pie">
    Montos en Bs. Margen = ganancia ÷ vendido con costo. Las filas sin costo no se suman a costo, ganancia ni margen.
    @if ($truncado)
        <br><strong>Se muestran las primeras {{ count($filas) }} filas de {{ $total_filas }}; los totales incluyen todas. Usa Exportar Excel para el detalle completo.</strong>
    @endif
    <br>Generado por {{ $usuario }} el {{ $fecha_impresion->format('d/m/Y H:i') }}
</div>
@endsection
