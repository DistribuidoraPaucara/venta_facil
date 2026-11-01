@extends('impresion.layouts.base-a4')

@section('titulo', $titulo)

@section('contenido')
<style>
    body, table { font-family: "DejaVu Sans", sans-serif; }
    .page { padding: 20px 22px; }
    .rp-titulo { text-align: center; font-size: 16px; font-weight: bold; margin: 0 0 2px 0; }
    .rp-filtros { font-size: 9px; background: #eef4fb; border-left: 3px solid #4F81BD; padding: 6px 8px; margin: 8px 0; }
    table.rp-tabla { width: 100%; border-collapse: collapse; font-size: 8px; }
    table.rp-tabla thead { display: table-header-group; }
    table.rp-tabla th { background: #4F81BD; color: #fff; padding: 4px 3px; text-align: left; }
    table.rp-tabla td { padding: 3px; border-bottom: 1px solid #ddd; vertical-align: top; }
    table.rp-tabla tr { page-break-inside: avoid; }
    table.rp-tabla tbody tr:nth-child(even) { background: #f7f7f7; }
    table.rp-tabla tfoot td { font-weight: bold; border-top: 2px solid #4F81BD; padding: 4px 3px; }
    .der { text-align: right; }
    .centro { text-align: center; }
    .gris { color: #777; }
    .neg { color: #b91c1c; }
    .rp-pie { margin-top: 8px; font-size: 8px; color: #666; }
</style>

@php
    // Números con 2 decimales solo si los tienen (cantidades enteras se ven enteras)
    $num = fn ($v) => is_numeric($v) ? (fmod((float) $v, 1) == 0 ? number_format((float) $v, 0) : number_format((float) $v, 2)) : $v;
@endphp

<p class="rp-titulo">{{ mb_strtoupper($titulo) }}</p>
<div class="rp-filtros"><strong>Filtros:</strong> {{ implode(' · ', $filtros_texto) }}</div>

<table class="rp-tabla">
    <thead>
        <tr>
            @foreach ($columnas as $clave => $encabezado)
                <th class="{{ in_array($clave, $numericas, true) ? 'der' : '' }}">{{ $encabezado }}</th>
            @endforeach
        </tr>
    </thead>
    <tbody>
        @forelse ($filas as $fila)
            <tr>
                @foreach ($columnas as $clave => $encabezado)
                    @php $valor = $fila[$clave] ?? ''; @endphp
                    <td class="{{ in_array($clave, $numericas, true) ? 'der' : '' }} {{ is_numeric($valor) && $valor < 0 ? 'neg' : '' }}">
                        {{ in_array($clave, $numericas, true) ? $num($valor) : $valor }}
                    </td>
                @endforeach
            </tr>
        @empty
            <tr>
                <td colspan="{{ count($columnas) }}" class="centro gris" style="padding: 15px;">No hay datos con los filtros seleccionados</td>
            </tr>
        @endforelse
    </tbody>
    @if (count($filas) > 0 && ! empty($totales))
        <tfoot>
            <tr>
                @foreach ($columnas as $clave => $encabezado)
                    <td class="der">{{ $loop->first ? 'TOTAL' : (array_key_exists($clave, $totales) ? $num($totales[$clave]) : '') }}</td>
                @endforeach
            </tr>
        </tfoot>
    @endif
</table>

<div class="rp-pie">
    {{ count($filas) }} fila(s).
    @if ($truncado)
        <strong>Se muestran las primeras {{ count($filas) }} de {{ $total_filas }}; usa Excel para el detalle completo.</strong>
    @endif
    <br>Generado por {{ $usuario }} el {{ $fecha_impresion->format('d/m/Y H:i') }}
</div>
@endsection
