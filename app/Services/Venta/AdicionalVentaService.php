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
     * @return void
     * @throws \Exception
     */
    public function procesarAdicionalesDetalle(DetalleVenta $detalle, array $adicionales, int $almacenId): void
    {
        if (empty($adicionales)) {
            return;
        }

        DB::transaction(function () use ($detalle, $adicionales, $almacenId) {
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

                // ✅ ACTUALIZADO (2026-08-23): Descontar stock con tipo de venta correcto
                try {
                    // Obtener stock_producto_id del almacén para este producto
                    $stockProducto = \App\Models\StockProducto::where('producto_id', $productoId)
                        ->where('almacen_id', $almacenId)
                        ->first();

                    if (!$stockProducto) {
                        throw new \Exception("No hay stock registrado para el producto {$productoId} en almacén {$almacenId}");
                    }

                    // Usar tipo SALIDA_VENTA (para ventas normales con descuento de stock)
                    $this->movimientoStockService->registrarMovimientoYActualizar(
                        stockProductoId: $stockProducto->id,
                        cantidad: -$cantidad,  // Negativo para salida
                        tipo: \App\Models\MovimientoInventario::TIPO_SALIDA_VENTA, // Tipo de venta estándar
                        referencia_tipo: 'venta',
                        referencia_id: $detalle->venta_id,
                        metadataAdicional: [
                            'es_adicional' => true,
                            'detalle_venta_id' => $detalle->id,
                        ]
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
        });
    }

    /**
     * Procesar adicionales para todos los detalles de una venta
     *
     * @param \App\Models\Venta $venta
     * @param array $detallesConAdicionales Array de detalles con sus adicionales
     * @return void
     */
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
