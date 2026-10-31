@extends('impresion.layouts.base-a4')

@section('titulo', 'Reporte de Actualizaciones de Precios')

@section('contenido')
<style>
    body, table { font-family: "DejaVu Sans", sans-serif; }
    .page { padding: 20px 22px; }
    .rp-titulo { text-align: center; font-size: 16px; font-weight: bold; margin: 0 0 2px 0; }
    .rp-subtitulo { text-align: center; font-size: 10px; color: #666; margin: 0 0 10px 0; }
    .rp-filtros { font-size: 10px; background: #eef4fb; border-left: 3px solid #4F81BD; padding: 6px 8px; margin-bottom: 8px; }
    .rp-resumen { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9px; }
    .rp-resumen td { border: 1px solid #d0d7e2; padding: 5px; text-align: center; }
    .rp-resumen .num { font-size: 13px; font-weight: bold; display: block; }
    table.rp-tabla { width: 100%; border-collapse: collapse; font-size: 8px; }
    table.rp-tabla thead { display: table-header-group; }
    table.rp-tabla th { background: #4F81BD; color: #fff; padding: 4px 2px; text-align: left; }
    table.rp-tabla td { padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: top; }
    table.rp-tabla tr { page-break-inside: avoid; }
    table.rp-tabla tbody tr:nth-child(even) { background: #f7f7f7; }
    .der { text-align: right; }
    .sube { color: #15803d; }
    .baja { color: #b91c1c; }
    .gris { color: #777; }
    .rp-pie { margin-top: 8px; font-size: 9px; color: #666; }
</style>

<p class="rp-titulo">REPORTE DE ACTUALIZACIONES DE PRECIOS</p>
<p class="rp-subtitulo">Cambios registrados en el historial de precios</p>

<div class="rp-filtros">
    <strong>Filtros:</strong>
    @if (empty($filtros_texto))
        Sin filtros (todos los cambios)
    @else
        {{ implode(' · ', $filtros_texto) }}
    @endif
</div>

<table class="rp-resumen">
    <tr>
        <td><span class="num">{{ $estadisticas['total_cambios'] }}</span>Cambios</td>
        <td><span class="num">{{ $estadisticas['productos_afectados'] }}</span>Productos afectados</td>
        <td><span class="num sube">▲ {{ $estadisticas['subidas'] }}</span>Subidas</td>
        <td><span class="num baja">▼ {{ $estadisticas['bajadas'] }}</span>Bajadas</td>
        <td>
            <span class="num">
                @if ($estadisticas['variacion_promedio'] === null)
                    —
                @else
                    {{ $estadisticas['variacion_promedio'] > 0 ? '+' : '' }}{{ number_format($estadisticas['variacion_promedio'], 1) }}%
                @endif
            </span>Variación promedio
        </td>
        <td style="text-align: left;">
            @forelse ($estadisticas['por_usuario'] as $u)
                {{ $u['usuario'] }}: <strong>{{ $u['cambios'] }}</strong><br>
            @empty
                —
            @endforelse
        </td>
    </tr>
</table>

<table class="rp-tabla">
    <thead>
        <tr>
            <th style="width: 9%;">Fecha</th>
            <th style="width: 28%;">Producto</th>
            <th style="width: 11%;">Tipo</th>
            <th class="der" style="width: 8%;">Anterior</th>
            <th class="der" style="width: 8%;">Nuevo</th>
            <th class="der" style="width: 10%;">Variación</th>
            <th style="width: 15%;">Motivo</th>
            <th style="width: 11%;">Usuario</th>
        </tr>
    </thead>
    <tbody>
        @forelse ($cambios as $c)
            @php
                $sube = $c['valor_nuevo'] > $c['valor_anterior'];
                $baja = $c['valor_nuevo'] < $c['valor_anterior'];
            @endphp
            <tr>
                <td>
                    @if ($c['fecha_cambio'])
                        @php $fecha = \Carbon\Carbon::parse($c['fecha_cambio']); @endphp
                        {{ $fecha->format('d/m/Y') }}<br><span class="gris">{{ $fecha->format('H:i') }}</span>
                    @else
                        —
                    @endif
                </td>
                <td>
                    {{ $c['producto']['nombre'] ?? '—' }}
                    <br><span class="gris">#{{ $c['producto']['id'] ?? '' }}@if (!empty($c['producto']['sku'])) · {{ $c['producto']['sku'] }}@endif</span>
                </td>
                <td>
                    {{ $c['tipo_precio']['nombre'] ?? '—' }}
                    @if ($c['unidad_medida'])<br><span class="gris">{{ $c['unidad_medida'] }}</span>@endif
                    @if (! $c['precio_activo'])<br><span class="gris">(inactivo)</span>@endif
                </td>
                <td class="der gris">{{ number_format($c['valor_anterior'], 2) }}</td>
                <td class="der"><strong>{{ number_format($c['valor_nuevo'], 2) }}</strong></td>
                <td class="der {{ $sube ? 'sube' : ($baja ? 'baja' : 'gris') }}">
                    {{ $sube ? '▲ +' : ($baja ? '▼ ' : '') }}{{ number_format($c['variacion'], 2) }}
                    @if ($c['porcentaje_cambio'] !== null)
                        <br>{{ $c['porcentaje_cambio'] > 0 ? '+' : '' }}{{ number_format($c['porcentaje_cambio'], 1) }}%
                    @endif
                </td>
                <td>{{ $c['motivo'] ?: '—' }}</td>
                <td>{{ $c['usuario'] ?: '—' }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="8" style="text-align: center; padding: 15px;" class="gris">No hay cambios de precio con los filtros seleccionados</td>
            </tr>
        @endforelse
    </tbody>
</table>

<div class="rp-pie">
    Montos en Bs.
    @if ($truncado)
        <strong>Se muestran los {{ count($cambios) }} cambios más recientes de {{ $estadisticas['total_cambios'] }}; acota los filtros o usa Exportar Excel para ver todos.</strong>
    @endif
    <br>Generado por {{ $usuario }} el {{ $fecha_impresion->format('d/m/Y H:i') }}
</div>
@endsection
