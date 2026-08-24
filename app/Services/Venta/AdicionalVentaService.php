<?php

namespace App\Services\Venta;

use App\Models\DetalleVenta;
use App\Models\VentaDetalleAdicional;
use App\Services\Stock\MovimientoStockService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdicionalVentaService
{
    public function __construct(
        private MovimientoStockService $movimientoStockService
    ) {}

    /**
     * Procesar y guardar adicionales para un detalle de venta
     *
     * @param DetalleVenta $detalle
     * @param array $adicionales Array de adicionales: [['producto_id' => 5, 'cantidad' => 1, 'precio_unitario' => 50], ...]
     * @param int $almacenId ID del almacén para descontar stock
     * @param string|null $numeroDocumento Número de venta para auditoría (ej: VEN20260823-0001)
     * @return void
     * @throws \Exception
     */
    public function procesarAdicionalesDetalle(DetalleVenta $detalle, array $adicionales, int $almacenId, ?string $numeroDocumento = null): void
    {
        if (empty($adicionales)) {
            return;
        }

        // ✅ ACTUALIZADO (2026-08-23): Remover transacción anidada, usar la del controller
        foreach ($adicionales as $adicionalData) {
            // Validar datos
            if (empty($adicionalData['producto_id']) || empty($adicionalData['cantidad'])) {
                continue;
            }

            $productoId = (int) $adicionalData['producto_id'];
            $cantidad = (float) $adicionalData['cantidad'];
            $precioUnitario = (float) ($adicionalData['precio_unitario'] ?? 0);

            // Crear registro de adicional
            $adicional = VentaDetalleAdicional::create([
                'detalle_venta_id' => $detalle->id,
                'producto_id' => $productoId,
                'cantidad' => $cantidad,
                'precio_unitario' => $precioUnitario,
                'subtotal' => $cantidad * $precioUnitario,
            ]);

            Log::info('✨ Adicional creado para detalle de venta', [
                'detalle_venta_id' => $detalle->id,
                'adicional_id' => $adicional->id,
                'producto_id' => $productoId,
                'cantidad' => $cantidad,
                'precio_unitario' => $precioUnitario,
            ]);

            // ✅ ACTUALIZADO (2026-08-23): Descontar stock con conversión de unidades
            try {
                // Obtener stock_producto_id del almacén para este producto
                $stockProducto = \App\Models\StockProducto::where('producto_id', $productoId)
                    ->where('almacen_id', $almacenId)
                    ->first();

                if (!$stockProducto) {
                    throw new \Exception("No hay stock registrado para el producto {$productoId} en almacén {$almacenId}");
                }

                // ✅ NUEVO (2026-08-23): Convertir cantidad si es necesario
                $cantidadADescontar = $this->convertirCantidad($productoId, $cantidad);

                // Usar tipo SALIDA_VENTA (para ventas normales con descuento de stock)
                $this->movimientoStockService->registrarMovimientoYActualizar(
                    stockProductoId: $stockProducto->id,
                    cantidad: -$cantidadADescontar,  // Negativo para salida, convertido
                    tipo: \App\Models\MovimientoInventario::TIPO_SALIDA_VENTA, // Tipo de venta estándar
                    referencia_tipo: 'venta',
                    referencia_id: $detalle->venta_id,
                    metadataAdicional: [
                        'es_adicional' => true,
                        'detalle_venta_id' => $detalle->id,
                    ],
                    numeroDocumento: $numeroDocumento  // ✅ NUEVO (2026-08-23): Pasar número de venta para auditoría
                );

                Log::info('✨ Stock descargado para producto adicional', [
                    'producto_id' => $productoId,
                    'cantidad' => $cantidad,
                    'almacen_id' => $almacenId,
                ]);
            } catch (\Exception $e) {
                Log::error('❌ Error al descontar stock de producto adicional', [
                    'producto_id' => $productoId,
                    'cantidad' => $cantidad,
                    'almacen_id' => $almacenId,
                    'error' => $e->getMessage(),
                ]);

                throw new \Exception("Error al procesar stock del adicional: {$e->getMessage()}");
            }
        }
    }

    /**
     * Procesar adicionales para todos los detalles de una venta
     *
     * @param \App\Models\Venta $venta
     * @param array $detallesConAdicionales Array de detalles con sus adicionales
     * @return void
     */
    /**
     * ✅ NUEVO (2026-08-23): Convertir cantidad de adicional a unidad de stock del producto
     * Ejemplo: 50g de Jamón → convertir a kg si el stock está en kg
     */
    private function convertirCantidad(int $productoId, float $cantidad): float
    {
        // Obtener el producto para saber su unidad de medida
        $producto = \App\Models\Producto::find($productoId);
        if (!$producto) {
            return $cantidad;
        }

        // ✅ ACTUALIZADO (2026-08-23): Mejorada lógica de detección
        // Si la unidad es kilogramo (id=2) y la cantidad está entre 1-999,
        // asumir que viene en gramos y convertir: g → kg
        if ($producto->unidad_medida_id == 2 && $cantidad >= 1 && $cantidad <= 999) {
            // Conversión: 50g → 0.05 kg (dividir entre 1000)
            return $cantidad / 1000;
        }

        // Si la unidad es gramo (id=3) y la cantidad es > 1000,
        // asumir que viene en miligramos: mg → g
        if ($producto->unidad_medida_id == 3 && $cantidad > 1000) {
            // Conversión: 5000mg → 5g (dividir entre 1000)
            return $cantidad / 1000;
        }

        // Sin conversión necesaria
        return $cantidad;
    }

    public function procesarAdicionales($venta, array $detallesConAdicionales): void
    {
        if (empty($detallesConAdicionales)) {
            return;
        }

        foreach ($detallesConAdicionales as $detalleData) {
            if (empty($detalleData['adicionales'])) {
                continue;
            }

            // Buscar el detalle de venta creado
            $detalle = $venta->detalles()
                ->where('producto_id', $detalleData['producto_id'])
                ->first();

            if ($detalle) {
                $this->procesarAdicionalesDetalle(
                    $detalle,
                    $detalleData['adicionales'],
                    $venta->almacen_id
                );
            }
        }
    }
}
