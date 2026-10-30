<?php
namespace App\Services;

use App\Models\Compra;
use App\Models\HistorialPrecio;
use App\Models\PrecioProducto;
use App\Models\TipoPrecio;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DetectarCambiosPrecioService
{
    /**
     * Al aprobar una compra, el costo de cada producto pasa a ser el de esta compra (último costo).
     *
     * - Precio COSTO (precios_producto) en la unidad del detalle: si existe y cambió se actualiza con
     *   historial (actualizarPrecio); si no existe se crea. Antes se salteaban los productos sin COSTO,
     *   que eran todos, así que nunca se actualizaba nada.
     * - productos.precio_compra (campo que usan reportes y la orden de compra) cuando el detalle está en
     *   la unidad base del producto.
     * - Detalles con precio 0 no tocan el costo. Si un producto aparece varias veces en la misma unidad,
     *   manda la última línea.
     *
     * Se llama al pasar a APROBADO, tanto al crear la compra aprobada como al aprobar un borrador.
     *
     * @return array Productos cuyo costo cambió (o se creó)
     */
    public function procesarCompraAprobada(Compra $compra): array
    {
        $compra->loadMissing('detalles.producto');
        $motivo = "Actualización por compra #{$compra->numero}";

        // Una entrada por producto + unidad (la última línea de la compra)
        $porProductoUnidad = [];
        foreach ($compra->detalles as $detalle) {
            if (! $detalle->producto || (float) $detalle->precio_unitario <= 0) {
                continue;
            }
            $unidadId = $detalle->unidad_medida_id ?: $detalle->producto->unidad_medida_id;
            $porProductoUnidad["{$detalle->producto_id}-{$unidadId}"] = [$detalle, $unidadId];
        }

        $tiposCosto         = [];
        $productosConCambio = [];

        foreach ($porProductoUnidad as [$detalle, $unidadId]) {
            $producto     = $detalle->producto;
            $precioCompra = round((float) $detalle->precio_unitario, 6);

            $tipoCosto = $tiposCosto[$producto->empresa_id] ??= TipoPrecio::where('empresa_id', $producto->empresa_id)
                ->where('codigo', 'COSTO')
                ->first();
            if (! $tipoCosto) {
                Log::warning('Sin tipo de precio COSTO en la empresa: no se actualiza el costo', [
                    'producto_id' => $producto->id,
                    'empresa_id'  => $producto->empresa_id,
                ]);
                continue;
            }

            // COSTO en la unidad del detalle (o sin unidad); el activo primero
            $precioCosto = PrecioProducto::where('producto_id', $producto->id)
                ->where('tipo_precio_id', $tipoCosto->id)
                ->where(fn($q) => $q->where('unidad_medida_id', $unidadId)->orWhereNull('unidad_medida_id'))
                ->orderByDesc('activo')
                ->orderByRaw('unidad_medida_id IS NULL')
                ->first();
            $precioAnterior = $precioCosto ? (float) $precioCosto->precio : 0.0;

            if (! $precioCosto) {
                PrecioProducto::create([
                    'producto_id'                => $producto->id,
                    'tipo_precio_id'             => $tipoCosto->id,
                    'nombre'                     => $tipoCosto->nombre,
                    'precio'                     => $precioCompra,
                    'unidad_medida_id'           => $unidadId,
                    'activo'                     => true,
                    'es_precio_base'             => (bool) $tipoCosto->es_precio_base,
                    'fecha_inicio'               => now(),
                    'motivo_cambio'              => $motivo,
                    'fecha_ultima_actualizacion' => now(),
                ]);
            } elseif (abs($precioAnterior - $precioCompra) > 0.000001 || ! $precioCosto->activo) {
                // update() directo: PrecioProductoObserver deja UN registro de historial con este motivo.
                // (actualizarPrecio() crea otro además del observer y quedaba duplicado)
                $precioCosto->update([
                    'precio'                     => $precioCompra,
                    'activo'                     => true,
                    'motivo_cambio'              => $motivo,
                    'fecha_ultima_actualizacion' => now(),
                ]);
            } else {
                continue; // mismo costo: nada que hacer
            }

            // Campo heredado productos.precio_compra: solo si la compra es en la unidad base
            if ((int) $unidadId === (int) $producto->unidad_medida_id) {
                $producto->update(['precio_compra' => $precioCompra]);
            }

            $cambio = [
                'producto_id'       => $producto->id,
                'producto_nombre'   => $producto->nombre,
                'unidad_medida_id'  => $unidadId,
                'precio_anterior'   => $precioAnterior,
                'precio_nuevo'      => $precioCompra,
                'porcentaje_cambio' => $precioAnterior != 0 ? (($precioCompra - $precioAnterior) / $precioAnterior) * 100 : null,
                'creado'            => ! $precioCosto,
                'compra_numero'     => $compra->numero,
            ];
            Log::info('Precio de costo actualizado por compra', $cambio);
            $productosConCambio[] = $cambio;
        }

        return $productosConCambio;
    }

    /**
     * Al aprobar una compra, aplica los precios de venta editados en su tabla (detalle_compras.precios_venta).
     *
     * - Cada entrada trae el precio_id y UNO de: precio (directo), monto (ganancia en Bs) o porcentaje.
     *   El precio final se calcula sobre el precio unitario de la línea (el nuevo costo).
     * - Solo se tocan precios del mismo producto de la línea, y solo si cambian.
     * - Si el mismo precio aparece en varias líneas, manda la última (igual que el costo en procesarCompraAprobada).
     * - update() directo: PrecioProductoObserver deja el registro de historial con el motivo.
     *
     * Se llama al pasar a APROBADO, después de procesarCompraAprobada (el costo ya quedó actualizado).
     *
     * @return array Precios de venta que cambiaron
     */
    public function aplicarPreciosVentaCompra(Compra $compra): array
    {
        $compra->loadMissing('detalles');
        $motivo = "Precio de venta por compra #{$compra->numero}";

        // Una entrada por precio_id (la última línea de la compra)
        $porPrecioId = [];
        foreach ($compra->detalles as $detalle) {
            $costo = (float) $detalle->precio_unitario;
            if ($costo <= 0 || empty($detalle->precios_venta)) {
                continue;
            }
            foreach ($detalle->precios_venta as $editado) {
                if (empty($editado['precio_id'])) {
                    continue;
                }
                $porPrecioId[(int) $editado['precio_id']] = [$detalle, $costo, $editado];
            }
        }

        $cambios = [];
        foreach ($porPrecioId as $precioId => [$detalle, $costo, $editado]) {
            $precio = PrecioProducto::where('id', $precioId)
                ->where('producto_id', $detalle->producto_id)
                ->first();
            if (! $precio) {
                Log::warning('Precio de venta de la compra no encontrado para el producto: se omite', [
                    'compra_numero' => $compra->numero,
                    'precio_id'     => $precioId,
                    'producto_id'   => $detalle->producto_id,
                ]);
                continue;
            }

            // Ganancia según lo que se editó: precio directo, ganancia en Bs o %
            if (isset($editado['precio']) && $editado['precio'] !== null) {
                $ganancia = (float) $editado['precio'] - $costo;
            } elseif (isset($editado['monto']) && $editado['monto'] !== null) {
                $ganancia = (float) $editado['monto'];
            } else {
                $ganancia = $costo * ((float) ($editado['porcentaje'] ?? 0)) / 100;
            }
            $precioNuevo   = round($costo + $ganancia, 2);
            $precioAnterior = (float) $precio->precio;

            if (abs($precioAnterior - $precioNuevo) <= 0.000001) {
                continue; // mismo precio: nada que hacer
            }

            $precio->update([
                'precio'                     => $precioNuevo,
                'margen_ganancia'            => round($precioNuevo - $costo, 2),
                'porcentaje_ganancia'        => round((($precioNuevo - $costo) / $costo) * 100, 2),
                'motivo_cambio'              => $motivo,
                'fecha_ultima_actualizacion' => now(),
            ]);

            $cambio = [
                'precio_id'       => $precio->id,
                'producto_id'     => $detalle->producto_id,
                'tipo_precio_id'  => $precio->tipo_precio_id,
                'precio_anterior' => $precioAnterior,
                'precio_nuevo'    => $precioNuevo,
                'compra_numero'   => $compra->numero,
            ];
            Log::info('Precio de venta actualizado por compra', $cambio);
            $cambios[] = $cambio;
        }

        return $cambios;
    }

    /**
     * Obtener todos los precios que cambiaron en los últimos N días
     */
    public function obtenerCambiosRecientes(int $dias = 7): array
    {
        $cambios = HistorialPrecio::with([
            'precioProducto' => function ($q) {
                $q->with('producto');
            }
        ])
        ->whereNotNull('tipo_precio_id')
        ->where('fecha_cambio', '>=', now()->subDays($dias))
        ->latest('fecha_cambio')
        ->get();

        return $cambios->groupBy('precio_producto_id')->map(function ($grupo) {
            $ultimoCambio = $grupo->first();
            return [
                'producto_id' => $ultimoCambio->precioProducto?->producto_id,
                'producto_nombre' => $ultimoCambio->precioProducto?->producto?->nombre,
                'precio_id' => $ultimoCambio->precio_producto_id,
                'tipo_precio' => $ultimoCambio->tipoPrecio?->nombre,
                'valor_anterior' => $ultimoCambio->valor_anterior,
                'valor_nuevo' => $ultimoCambio->valor_nuevo,
                'porcentaje_cambio' => $ultimoCambio->porcentaje_cambio,
                'motivo' => $ultimoCambio->motivo,
                'usuario' => $ultimoCambio->usuario,
                'fecha_cambio' => $ultimoCambio->fecha_cambio,
                'total_cambios' => $grupo->count(),
            ];
        })->values()->toArray();
    }
}
