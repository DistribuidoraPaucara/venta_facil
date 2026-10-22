@extends('impresion.layouts.base-a4')

@section('titulo', 'Reporte de Cuentas por Pagar')

@section('contenido')
@php
    $colorEstado = fn($estado) => match (strtoupper((string) $estado)) {
        'PAGADO'  => '#2e7d32',
        'PARCIAL' => '#ef6c00',
        'VENCIDO' => '#c62828',
        'ANULADO' => '#757575',
        default   => '#1565c0',
    };
@endphp

<div style="margin-bottom: 10px;">
    <h2 style="margin: 0 0 4px 0; font-size: 15px; color: #1565c0;">REPORTE DE CUENTAS POR PAGAR</h2>
    <p style="margin: 0; font-size: 9px; color: #555;">
        Generado: {{ now()->format('d/m/Y H:i') }} @if($usuario) · por {{ $usuario->name }} @endif
    </p>
    <p style="margin: 3px 0 0 0; font-size: 9px; color: #555;">
        <strong>Filtros:</strong>
        @forelse($filtros as $etiqueta => $valor)
            {{ $etiqueta }}: {{ $valor }}@if(!$loop->last) · @endif
        @empty
            Ninguno (todas las cuentas)
        @endforelse
    </p>
</div>

{{-- Resumen --}}
<table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9px;">
    <tr>
        <td style="border: 1px solid #ddd; padding: 5px; background: #f5f5f5;">Cuentas<br><strong style="font-size: 12px;">{{ $totales['cantidad'] }}</strong></td>
        <td style="border: 1px solid #ddd; padding: 5px; background: #f5f5f5;">Monto original<br><strong style="font-size: 12px;">Bs {{ number_format($totales['monto_original'], 2) }}</strong></td>
        <td style="border: 1px solid #ddd; padding: 5px; background: #f5f5f5;">Pagado<br><strong style="font-size: 12px; color: #2e7d32;">Bs {{ number_format($totales['monto_pagado'], 2) }}</strong></td>
        <td style="border: 1px solid #ddd; padding: 5px; background: #f5f5f5;">Saldo pendiente<br><strong style="font-size: 12px; color: #1565c0;">Bs {{ number_format($totales['saldo'], 2) }}</strong></td>
        <td style="border: 1px solid #ddd; padding: 5px; background: #fdecea;">Vencidas<br><strong style="font-size: 12px; color: #c62828;">{{ $totales['vencidas'] }} · Bs {{ number_format($totales['saldo_vencido'], 2) }}</strong></td>
    </tr>
</table>

{{-- Detalle --}}
<table style="width: 100%; border-collapse: collapse; font-size: 8.5px;">
    <thead>
        <tr style="background: #1565c0; color: #fff;">
            <th style="padding: 4px; text-align: left;">#</th>
            <th style="padding: 4px; text-align: left;">Proveedor</th>
            <th style="padding: 4px; text-align: left;">Compra / Factura</th>
            <th style="padding: 4px; text-align: center;">Fecha compra</th>
            <th style="padding: 4px; text-align: center;">Vence</th>
            <th style="padding: 4px; text-align: center;">Días venc.</th>
            <th style="padding: 4px; text-align: right;">Original</th>
            <th style="padding: 4px; text-align: right;">Pagado</th>
            <th style="padding: 4px; text-align: right;">Saldo</th>
            <th style="padding: 4px; text-align: center;">Estado</th>
        </tr>
    </thead>
    <tbody>
        @forelse($cuentas as $cuenta)
            @php
                $compra  = $cuenta->compra;
                $vencida = $cuenta->dias_vencido > 0 && (float) $cuenta->saldo_pendiente > 0 && strtoupper($cuenta->estado) !== 'PAGADO';
            @endphp
            <tr style="background: {{ $loop->even ? '#fafafa' : '#fff' }};">
                <td style="padding: 3px 4px; border-bottom: 1px solid #eee;">{{ $cuenta->id }}</td>
                <td style="padding: 3px 4px; border-bottom: 1px solid #eee;">{{ $compra?->proveedor?->nombre ?? 'Sin proveedor' }}</td>
                <td style="padding: 3px 4px; border-bottom: 1px solid #eee;">
                    @if($compra)
                        Compra #{{ $compra->id }} @if($compra->numero)<span style="color: #777;">({{ $compra->numero }})</span>@endif
                        @if($compra->numero_factura)<br><span style="color: #777;">Fact. {{ $compra->numero_factura }}</span>@endif
                    @else
                        {{ $cuenta->referencia_documento }}
                    @endif
                </td>
                <td style="padding: 3px 4px; border-bottom: 1px solid #eee; text-align: center;">{{ $compra?->fecha ? \Carbon\Carbon::parse($compra->fecha)->format('d/m/Y') : '—' }}</td>
                <td style="padding: 3px 4px; border-bottom: 1px solid #eee; text-align: center;">{{ $cuenta->fecha_vencimiento?->format('d/m/Y') ?? '—' }}</td>
                <td style="padding: 3px 4px; border-bottom: 1px solid #eee; text-align: center; {{ $vencida ? 'color: #c62828; font-weight: bold;' : '' }}">
                    {{ $vencida ? $cuenta->dias_vencido : '—' }}
                </td>
                <td style="padding: 3px 4px; border-bottom: 1px solid #eee; text-align: right;">{{ number_format($cuenta->monto_original, 2) }}</td>
                <td style="padding: 3px 4px; border-bottom: 1px solid #eee; text-align: right;">{{ number_format((float) $cuenta->monto_original - (float) $cuenta->saldo_pendiente, 2) }}</td>
                <td style="padding: 3px 4px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">{{ number_format($cuenta->saldo_pendiente, 2) }}</td>
                <td style="padding: 3px 4px; border-bottom: 1px solid #eee; text-align: center; color: {{ $colorEstado($cuenta->estado) }}; font-weight: bold;">
                    {{ strtoupper($cuenta->estado) }}
                </td>
            </tr>
        @empty
            <tr>
                <td colspan="10" style="padding: 12px; text-align: center; color: #777;">No hay cuentas con los filtros aplicados.</td>
            </tr>
        @endforelse
    </tbody>
    @if($cuentas->isNotEmpty())
        <tfoot>
            <tr style="background: #e3f2fd; font-weight: bold;">
                <td colspan="6" style="padding: 4px; text-align: right;">TOTALES ({{ $totales['cantidad'] }} cuentas)</td>
                <td style="padding: 4px; text-align: right;">{{ number_format($totales['monto_original'], 2) }}</td>
                <td style="padding: 4px; text-align: right;">{{ number_format($totales['monto_pagado'], 2) }}</td>
                <td style="padding: 4px; text-align: right;">{{ number_format($totales['saldo'], 2) }}</td>
                <td></td>
            </tr>
        </tfoot>
    @endif
</table>
@endsection
