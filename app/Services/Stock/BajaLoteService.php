<?php

namespace App\Services\Stock;

use App\Models\MovimientoInventario;
use App\Models\StockProducto;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Baja de un lote (stock_productos) con trazabilidad.
 *
 * Si el lote aún tiene stock, primero registra una salida por ajuste que lo lleva a 0
 * (queda en movimientos_inventario) y recién después marca deleted_at (soft delete).
 * Así el stock nunca "desaparece" sin un movimiento que lo explique.
 * Única vía para dar de baja lotes: la usan Lotes y Vencimientos y el Editor de Productos.
 */
class BajaLoteService
{
    public function __construct(private MovimientoStockService $movimientoStockService) {}

    /**
     * @return MovimientoInventario|null movimiento de salida (null si el lote ya estaba en 0)
     *
     * @throws AuthorizationException si el lote no es de un almacén de la empresa
     * @throws \DomainException       si el lote tiene unidades reservadas
     */
    public function darDeBaja(StockProducto $stock, int $empresaId, string $motivo = 'Baja de lote'): ?MovimientoInventario
    {
        if ((int) $stock->almacen?->empresa_id !== $empresaId) {
            throw new AuthorizationException('No tiene permiso para dar de baja este lote.');
        }

        return DB::transaction(function () use ($stock, $motivo) {
            // Releer con lock: una venta o reserva pudo moverlo desde que se abrió la pantalla
            $stock = StockProducto::lockForUpdate()->findOrFail($stock->id);
            $etiqueta = $stock->lote ? "el lote {$stock->lote}" : 'el lote sin número';

            if ((float) $stock->cantidad_reservada > 0) {
                throw new \DomainException(
                    "No se puede dar de baja {$etiqueta}: tiene {$this->num($stock->cantidad_reservada)} unidad(es) reservada(s) en proformas."
                );
            }

            $cantidadBaja = (float) $stock->cantidad;
            $movimiento   = null;

            // Registrar la salida del stock restante (lleva el lote a 0)
            if ($cantidadBaja > 0) {
                $movimiento = $this->movimientoStockService->registrarMovimientoYActualizar(
                    $stock->id,
                    -$cantidadBaja,
                    MovimientoInventario::TIPO_SALIDA_AJUSTE,
                    'baja_lote',
                    $stock->id,
                    [
                        'motivo'            => $motivo,
                        'lote'              => $stock->lote,
                        'fecha_vencimiento' => $stock->fecha_vencimiento?->toDateString(),
                    ],
                    "BAJA-LOTE-{$stock->id}"
                );
            }

            // Soft delete: marca deleted_at para que el lote no se use más
            $stock->refresh()->delete();

            Log::info('🗑️ [BajaLoteService] Lote dado de baja', [
                'stock_producto_id' => $stock->id,
                'producto_id'       => $stock->producto_id,
                'almacen_id'        => $stock->almacen_id,
                'sector_id'         => $stock->sector_id,
                'lote'              => $stock->lote,
                'cantidad'          => $cantidadBaja,
                'movimiento_id'     => $movimiento?->id,
                'motivo'            => $motivo,
                'user_id'           => auth()->id(),
            ]);

            return $movimiento;
        });
    }

    private function num(float|string $n): string
    {
        $n = (float) $n;

        return $n == floor($n) ? (string) (int) $n : rtrim(rtrim(number_format($n, 4, '.', ''), '0'), '.');
    }
}
