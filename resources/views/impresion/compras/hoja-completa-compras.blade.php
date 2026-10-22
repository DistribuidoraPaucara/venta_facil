@extends('impresion.layouts.base-a4')

@section('titulo', 'Listado de Compras')

@section('contenido')
{{-- Información del documento --}}
<div class="documento-info">
    <div class="documento-info-grid">
        <div class="documento-info-seccion">
            <h2 style="color: #3498db;">LISTADO DE COMPRAS</h2>
            <p><strong>Fecha de generación:</strong> {{ now()->format('d/m/Y H:i') }}</p>
            @if($filtros && isset($filtros['proveedor_id']) && $filtros['proveedor_id'])
                <p><strong>Proveedor:</strong> {{ $filtros['proveedor_id'] }}</p>
            @endif
            @if($filtros && isset($filtros['estado_documento_id']) && $filtros['estado_documento_id'])
                <p><strong>Estado:</strong> {{ $filtros['estado_documento_id'] }}</p>
            @endif
        </div>
        <div class="documento-info-seccion" style="text-align: right;">
            <p><strong>Total de registros:</strong> {{ count($compras) }}</p>
            <p><strong>Monto total:</strong> Bs{{ number_format($compras->sum('total'), 2) }}</p>
        </div>
    </div>
</div>

{{-- Tabla de compras --}}
<table class="tabla-productos">
    <thead>
        <tr>
            <th style="width: 4%;">#</th>
            <th style="width: 16%;">Compra</th>
            <th style="width: 11%;">Fecha</th>
            <th style="width: 31%;">Proveedor</th>
            <th style="width: 10%; text-align: center;">Productos</th>
            <th style="width: 15%; text-align: right;">Total</th>
            <th style="width: 13%;">Estado</th>
        </tr>
    </thead>
    <tbody>
        @forelse($compras as $item)
        <tr>
            <td>{{ $loop->iteration }}</td>
            <td>
                {{-- ID y número de la compra ($item puede llegar como arreglo, desde la sesión, o como modelo) --}}
                <strong>#{{ data_get($item, 'id', '-') }}</strong>
                @if(data_get($item, 'numero'))
                    <br><small style="color: #666;">{{ data_get($item, 'numero') }}</small>
                @endif
            </td>
            <td>
                @php
                    $fecha = null;
                    if (is_array($item) && isset($item['fecha'])) {
                        $fecha = $item['fecha'];
                    } elseif (is_object($item) && isset($item->fecha)) {
                        $fecha = $item->fecha;
                    }
                    if ($fecha) {
                        if (is_string($fecha)) {
                            echo date('d/m/Y', strtotime($fecha));
                        } else {
                            echo $fecha->format('d/m/Y');
                        }
                    } else {
                        echo '-';
                    }
                @endphp
            </td>
            <td>
                @php
                    $proveedor = '-';
                    if (is_array($item)) {
                        if (isset($item['proveedor'])) {
                            $prov = $item['proveedor'];
                            $proveedor = is_array($prov) ? ($prov['nombre'] ?? '-') : (is_object($prov) ? ($prov->nombre ?? '-') : '-');
                        }
                    } elseif (is_object($item)) {
                        if (isset($item->proveedor)) {
                            $proveedor = $item->proveedor->nombre ?? '-';
                        }
                    }
                @endphp
                <strong>{{ $proveedor }}</strong>
            </td>
            {{-- Cantidad de productos (líneas) de la compra: sumar cantidades mezclaría unidades distintas --}}
            <td style="text-align: center;">
                {{ count(data_get($item, 'detalles') ?? []) }}
            </td>
            {{-- Total de la compra (ya con descuento e impuesto): es lo que suma el MONTO TOTAL de abajo --}}
            <td style="text-align: right;">
                <strong>{{ data_get($item, 'moneda.simbolo', 'Bs') }} {{ number_format((float) data_get($item, 'total', 0), 2) }}</strong>
            </td>
            <td>
                @php
                    $estado = '-';
                    if (is_array($item) && isset($item['estado_documento'])) {
                        $est = $item['estado_documento'];
                        $estado = is_array($est) ? ($est['nombre'] ?? '-') : (is_object($est) ? ($est->nombre ?? '-') : '-');
                    } elseif (is_object($item) && isset($item->estadoDocumento)) {
                        $estado = $item->estadoDocumento->nombre ?? '-';
                    }
                @endphp
                {{ $estado }}
            </td>
        </tr>
        @empty
        <tr>
            <td colspan="8" style="text-align: center; padding: 20px;">
                No hay compras para mostrar
            </td>
        </tr>
        @endforelse
    </tbody>
</table>

{{-- Resumen --}}
<div class="totales">
    <table>
        <tr class="total-final">
            <td><strong>TOTAL DE REGISTROS:</strong></td>
            <td>
                <strong>{{ count($compras) }}</strong>
            </td>
        </tr>
        <tr class="subtotal-row">
            <td><strong>MONTO TOTAL:</strong></td>
            <td>
                <strong>Bs{{ number_format($compras->sum('total'), 2) }}</strong>
            </td>
        </tr>
    </table>
</div>

{{-- Nota de documentación --}}
<div class="observaciones" style="margin-top: 10px; border-left-color: #3498db; background: #ecf0f1;">
    <strong>Nota Informativa:</strong>
    <p style="margin-top: 5px;">
        Este es un listado de referencia de compras de la empresa.
        Generado el {{ now()->format('d/m/Y \a \l\a\s H:i') }}.
    </p>
</div>
@endsection
