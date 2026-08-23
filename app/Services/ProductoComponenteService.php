<?php

namespace App\Services;

use App\Models\Producto;
use App\Models\ProductoComponente;
use App\Models\DetalleVenta;
use App\Services\Stock\MovimientoStockService;
use Illuminate\Support\Facades\Log;

/**
 * ✅ NUEVO (2026-08-22): Servicio para gestionar componentes/adicionales de productos
 * Maneja:
 * - Validación de componentes
 * - Cálculo de precios adicionales
 * - Descuento de stock de componentes
 */
class ProductoComponenteService
{
    public function __construct(
        private MovimientoStockService $movimientoService
    ) {}

    /**
     * Procesar componentes de un detalle de venta
     * Valida y prepara los componentes para guardarse en el detalle
     */
    public function procesarComponentes(array $componentesRaw, int $productoId, float $cantidadProducto): array
    {
        if (empty($componentesRaw)) {
            return [];
        }

        $producto = Producto::findOrFail($productoId);
        $componentesDisponibles = $producto->componentes()->pluck('componente_id')->toArray();

        $componentesProcesados = [];

        foreach ($componentesRaw as $comp) {
            $componenteId = $comp['componente_id'] ?? null;
            $cantidad = $comp['cantidad'] ?? 0;

            // Validar que sea un componente válido del producto
            if (!in_array($componenteId, $componentesDisponibles)) {
                Log::warning("⚠️ Componente no válido para producto", [
                    'producto_id' => $productoId,
                    'componente_id' => $componenteId,
                ]);
                continue;
            }

            // Obtener el componente
            $componenteProducto = Producto::find($componenteId);
            if (!$componenteProducto) {
                continue;
            }

            // Solo agregar si la cantidad es > 0 (usuario seleccionó este adicional)
            if ($cantidad > 0) {
                $componentesProcesados[] = [
                    'componente_id' => $componenteId,
                    'componente_nombre' => $componenteProducto->nombre,
                    'cantidad' => (float)$cantidad,
                    'cantidad_total_necesaria' => (float)$cantidad * $cantidadProducto, // Cantidad * cantidad_producto
                    'precio_unitario' => (float)$componenteProducto->precio_venta,
                    'subtotal_componente' => (float)($cantidad * $cantidadProducto * $componenteProducto->precio_venta),
                ];
            }
        }

        Log::info("✅ Componentes procesados para venta", [
            'producto_id' => $productoId,
            'cantidad_componentes' => count($componentesProcesados),
            'componentes' => $componentesProcesados,
        ]);

        return $componentesProcesados;
    }

    /**
     * Calcular costo adicional por componentes
     * Suma todos los precios de los componentes seleccionados
     */
    public function calcularCostoAdicional(array $componentesProcesados): float
    {
        return array_reduce($componentesProcesados, function($total, $comp) {
            return $total + ($comp['subtotal_componente'] ?? 0);
        }, 0);
    }

    /**
     * Descontar stock de componentes seleccionados
     * Se llama después de crear el detalle de venta
     */
    public function descontarStockComponentes(DetalleVenta $detalleVenta): void
    {
        $componentes = $detalleVenta->componentes_seleccionados ?? [];

        if (empty($componentes)) {
            Log::debug("⏭️ Sin componentes para descontar stock", [
                'detalle_venta_id' => $detalleVenta->id,
            ]);
            return;
        }

        Log::info("🔄 Iniciando descuento de stock de componentes", [
            'detalle_venta_id' => $detalleVenta->id,
            'cantidad_componentes' => count($componentes),
        ]);

        foreach ($componentes as $comp) {
            $componenteId = $comp['componente_id'] ?? null;
            $cantidadNecesaria = $comp['cantidad_total_necesaria'] ?? 0;

            if (!$componenteId || $cantidadNecesaria <= 0) {
                continue;
            }

            try {
                // Obtener stock del componente
                $stockComponente = \App\Models\StockProducto::where('producto_id', $componenteId)
                    ->where('cantidad', '>', 0)
                    ->first();

                if (!$stockComponente) {
                    Log::warning("⚠️ Stock no encontrado para componente", [
                        'componente_id' => $componenteId,
                        'detalle_venta_id' => $detalleVenta->id,
                    ]);
                    continue;
                }

                // Descontar stock usando el servicio centralizado
                $this->movimientoService->registrarMovimientoYActualizar(
                    $stockComponente->id,
                    $cantidadNecesaria,
                    \App\Models\MovimientoInventario::TIPO_SALIDA_VENTA,
                    'detalle_venta',
                    $detalleVenta->id
                );

                Log::info("✅ Stock descontado para componente", [
                    'componente_id' => $componenteId,
                    'cantidad_descontada' => $cantidadNecesaria,
                    'stock_id' => $stockComponente->id,
                ]);

            } catch (\Exception $e) {
                Log::error("❌ Error al descontar stock de componente", [
                    'componente_id' => $componenteId,
                    'error' => $e->getMessage(),
                    'detalle_venta_id' => $detalleVenta->id,
                ]);
                throw $e; // Re-lanzar para que la venta falle
            }
        }
    }

    /**
     * Obtener componentes obligatorios de un producto
     * Útil para validar que se incluyan todos los obligatorios
     */
    public function obtenerComponentesObligatorios(int $productoId): array
    {
        return Producto::find($productoId)
            ?->componentesObligatorios()
            ->with('componente:id,nombre,precio_venta')
            ->get()
            ->map(fn($c) => [
                'componente_id' => $c->componente_id,
                'componente_nombre' => $c->componente->nombre,
                'cantidad_requerida' => (float)$c->cantidad_requerida,
                'precio_unitario' => (float)$c->componente->precio_venta,
                'es_opcional' => (bool)$c->es_opcional,
            ])
            ->toArray() ?? [];
    }

    /**
     * Obtener componentes opcionales de un producto
     */
    public function obtenerComponentesOpcionales(int $productoId): array
    {
        return Producto::find($productoId)
            ?->componentesOpcionales()
            ->with('componente:id,nombre,precio_venta')
            ->get()
            ->map(fn($c) => [
                'componente_id' => $c->componente_id,
                'componente_nombre' => $c->componente->nombre,
                'cantidad_requerida' => (float)$c->cantidad_requerida,
                'precio_unitario' => (float)$c->componente->precio_venta,
                'es_opcional' => (bool)$c->es_opcional,
            ])
            ->toArray() ?? [];
    }
}
