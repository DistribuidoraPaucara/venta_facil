@extends('impresion.layouts.base-ticket')

@section('titulo', 'Reporte de Compras - Ticket 80mm')

@section('contenido')

{{-- Reporte de varias compras ($compras) o una sola (impresión individual: ImpresionService pasa $documento) --}}
@forelse(($compras ?? collect([$documento])) as $documento)

<div class="separador"></div>

{{-- ==================== INFO DEL DOCUMENTO ==================== --}}
<div class="documento-titulo">COMPRA</div>
{{-- data_get: en el reporte las compras llegan como arreglos (sesión); en la impresión individual, como modelo --}}
<div class="documento-numero"># {{ data_get($documento, 'id', '-') }} | {{ data_get($documento, 'numero', '-') }}</div>
<div class="center" style="margin-top: 3px;">
    @php
        $fecha = null;
        if (is_object($documento) && isset($documento->fecha)) {
            $fecha = $documento->fecha;
        } elseif (is_array($documento) && isset($documento['fecha'])) {
            $fecha = $documento['fecha'];
        }
        if ($fecha) {
            echo is_string($fecha) ? date('d/m/Y H:i', strtotime($fecha)) : $fecha->format('d/m/Y H:i');
        }
    @endphp
</div>

<div class="separador"></div>

{{-- ==================== INFO DEL PROVEEDOR ==================== --}}
<div class="documento-info">
    <p>
        <strong>Proveedor:</strong>
        @php
            $proveedorNombre = '-';
            if (is_object($documento) && isset($documento->proveedor)) {
                $proveedorNombre = $documento->proveedor->nombre ?? '-';
            } elseif (is_array($documento) && isset($documento['proveedor'])) {
                $prov = $documento['proveedor'];
                $proveedorNombre = is_array($prov) ? ($prov['nombre'] ?? '-') : (is_object($prov) ? ($prov->nombre ?? '-') : '-');
            }
            echo $proveedorNombre;
        @endphp
    </p>
    @php
        $nit = null;
        if (is_object($documento) && isset($documento->proveedor)) {
            $nit = $documento->proveedor->nit ?? null;
        } elseif (is_array($documento) && isset($documento['proveedor'])) {
            $prov = $documento['proveedor'];
            $nit = is_array($prov) ? ($prov['nit'] ?? null) : (is_object($prov) ? ($prov->nit ?? null) : null);
        }
    @endphp
    @if($nit)
    <p><strong>NIT:</strong> {{ $nit }}</p>
    @endif
    @php
        $usuario = null;
        if (is_object($documento) && isset($documento->usuario)) {
            $usuario = $documento->usuario;
        } elseif (is_array($documento) && isset($documento['usuario'])) {
            $usuario = $documento['usuario'];
        }
    @endphp
    @if($usuario)
    <p><strong>Recibido:</strong>
        @php
            echo is_object($usuario) ? ($usuario->name ?? '-') : (is_array($usuario) ? ($usuario['name'] ?? '-') : '-');
        @endphp
    </p>
    @endif
</div>

<div class="separador"></div>

{{-- ==================== ITEMS (tabla compacta) ==================== --}}
<table class="items" style="width: 100%;">
    <thead>
        <tr>
            <th style="width: 40%; text-align: left;">Producto</th>
            <th style="width: 15%; text-align: right;">Cant.</th>
            <th style="width: 45%; text-align: right;">Subtotal</th>
        </tr>
    </thead>
    <tbody>
        @php
            $detalles = [];
            if (is_object($documento) && isset($documento->detalles)) {
                $detalles = is_array($documento->detalles) ? $documento->detalles : $documento->detalles->toArray();
            } elseif (is_array($documento) && isset($documento['detalles'])) {
                $detalles = $documento['detalles'];
            }
        @endphp
        @forelse($detalles as $detalle)
        <tr>
            <td>
                @php
                    $producto = is_array($detalle) ? ($detalle['producto'] ?? null) : (is_object($detalle) ? ($detalle->producto ?? null) : null);
                    $nombre = '-';
                    $sku = '';
                    $productoId = is_array($detalle) ? ($detalle['producto_id'] ?? null) : ($detalle->producto_id ?? null);
                    if ($producto) {
                        if (is_object($producto)) {
                            $nombre = $producto->nombre ?? '-';
                            $sku = $producto->sku ?? '';
                        } else {
                            $nombre = $producto['nombre'] ?? '-';
                            $sku = $producto['sku'] ?? '';
                        }
                    }
                @endphp
                <strong>{{ $nombre }}</strong>
                <br><span>@if($productoId)#{{ $productoId }}@endif{{ $productoId && $sku ? ' · ' : '' }}@if($sku)SKU: {{ $sku }}@endif</span>
            </td>
            <td style="text-align: right;">
                @php
                    $cantidad = is_array($detalle) ? ($detalle['cantidad'] ?? 0) : (is_object($detalle) ? ($detalle->cantidad ?? 0) : 0);
                    echo number_format($cantidad, 0);
                @endphp
            </td>
            <td style="text-align: right;">
                @php
                    // Subtotal guardado: ya trae restado el descuento de la línea (cantidad × precio − descuento)
                    $precioUnit = (float) data_get($detalle, 'precio_unitario', 0);
                    $descuentoLinea = (float) data_get($detalle, 'descuento', 0);
                    $subtotal = (float) (data_get($detalle, 'subtotal') ?? ($cantidad * $precioUnit - $descuentoLinea));
                @endphp
                {{ number_format($subtotal, 2) }}
                @if($descuentoLinea > 0)
                    <br><span style="font-size: 90%;">desc. -{{ number_format($descuentoLinea, 2) }}</span>
                @endif
            </td>
        </tr>
        @empty
        <tr>
            <td colspan="3" style="text-align: center;">Sin productos</td>
        </tr>
        @endforelse
    </tbody>
</table>

<div class="separador-doble"></div>

{{-- ==================== MONTO DESTACADO ==================== --}}
<div style="text-align: center; margin: 8px 0; padding: 8px 0; border: 2px solid #282B29;">
    @php
        $total = 0;
        if (is_object($documento)) {
            $total = $documento->total ?? 0;
        } elseif (is_array($documento)) {
            $total = $documento['total'] ?? 0;
        }
        $simbolo = 'Bs';
        if (is_object($documento) && isset($documento->moneda)) {
            $simbolo = $documento->moneda->simbolo ?? 'Bs';
        } elseif (is_array($documento) && isset($documento['moneda'])) {
            $moneda = $documento['moneda'];
            $simbolo = is_array($moneda) ? ($moneda['simbolo'] ?? 'Bs') : (is_object($moneda) ? ($moneda->simbolo ?? 'Bs') : 'Bs');
        }
    @endphp
    <div style= color: #080808; font-weight: bold;">
        TOTAL: {{ $simbolo }} {{ number_format($total, 2) }}
    </div>
</div>

{{-- ==================== INFORMACIÓN DE PAGO ==================== --}}
<div>
    @php
        $tipoPago = '-';
        if (is_object($documento) && isset($documento->tipoPago)) {
            $tipoPago = $documento->tipoPago->nombre ?? '-';
        } elseif (is_array($documento) && isset($documento['tipoPago'])) {
            $tp = $documento['tipoPago'];
            $tipoPago = is_array($tp) ? ($tp['nombre'] ?? '-') : (is_object($tp) ? ($tp->nombre ?? '-') : '-');
        }
    @endphp
    <p><strong>Tipo Pago:</strong> {{ $tipoPago }}</p>
</div>

<div class="separador"></div>

@empty
<div style="text-align: center; padding: 20px;">
    No hay compras para mostrar
</div>
@endforelse

@endsection
