<?php

namespace App\Services;

use App\Models\MovimientoFraccionamiento;
use App\Models\Producto;
use App\Models\StockProducto;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FraccionamientoService
{
    /**
     * Realizar fraccionamiento de un producto
     *
     * @param int $productoPadreId - ID del producto a fraccionar
     * @param float $cantidadPadre - Cantidad a fraccionar
     * @param int $productoHijoId - ID del producto resultado
     * @param float $cantidadHijo - Cantidad generada del hijo
     * @param int $almacenId - Almacén donde ocurre
     * @param int $sectorId - Sector donde ocurre
     * @param string $razon - Razón del fraccionamiento
     * @param string|null $notas - Notas adicionales
     *
     * @return MovimientoFraccionamiento
     * @throws \Exception
     */
    public function fraccionar(
        int $productoPadreId,
        float $cantidadPadre,
        int $productoHijoId,
        float $cantidadHijo,
        int $almacenId,
        int $sectorId,
        string $razon = 'fraccionamiento_manual',
        ?string $notas = null
    ): MovimientoFraccionamiento {
        return DB::transaction(function () use (
            $productoPadreId,
            $cantidadPadre,
            $productoHijoId,
            $cantidadHijo,
            $almacenId,
            $sectorId,
            $razon,
            $notas
        ) {
            // 1️⃣ Validar productos
            $productoPadre = Producto::findOrFail($productoPadreId);
            $productoHijo = Producto::findOrFail($productoHijoId);

            if ($productoPadre->id === $productoHijo->id) {
                throw new \Exception('El producto padre y hijo no pueden ser el mismo');
            }

            if ($cantidadPadre <= 0 || $cantidadHijo <= 0) {
                throw new \Exception('Las cantidades deben ser mayores a 0');
            }

            // 2️⃣ Validar stock disponible del padre
            $stockPadre = StockProducto::where('producto_id', $productoPadreId)
                ->where('almacen_id', $almacenId)
                ->where('sector_id', $sectorId)
                ->lockForUpdate()
                ->first();

            if (!$stockPadre) {
                throw new \Exception(
                    "No hay stock del producto padre en el almacén/sector especificado"
                );
            }

            if ($stockPadre->cantidad < $cantidadPadre) {
                throw new \Exception(
                    "Stock insuficiente. Disponible: {$stockPadre->cantidad}, Solicitado: {$cantidadPadre}"
                );
            }

            // 3️⃣ Validar o crear stock del hijo
            $stockHijo = StockProducto::where('producto_id', $productoHijoId)
                ->where('almacen_id', $almacenId)
                ->where('sector_id', $sectorId)
                ->lockForUpdate()
                ->first();

            if (!$stockHijo) {
                // Crear registro de stock para el hijo
                $stockHijo = StockProducto::create([
                    'producto_id' => $productoHijoId,
                    'almacen_id' => $almacenId,
                    'sector_id' => $sectorId,
                    'cantidad' => 0,
                    'cantidad_disponible' => 0,
                    'cantidad_reservada' => 0,
                    'lote' => null,
                    'precio_costo' => 0,
                ]);
            }

            // 4️⃣ Actualizar stock del padre (restar ambas columnas en una sola query)
            StockProducto::where('id', $stockPadre->id)->update([
                'cantidad' => DB::raw('cantidad - ' . $cantidadPadre),
                'cantidad_disponible' => DB::raw('cantidad_disponible - ' . $cantidadPadre),
                'fecha_actualizacion' => now(),
            ]);

            // 5️⃣ Actualizar stock del hijo (sumar)
            $stockHijo->increment('cantidad', $cantidadHijo);
            $stockHijo->increment('cantidad_disponible', $cantidadHijo);
            $stockHijo->update(['fecha_actualizacion' => now()]);

            // 6️⃣ Crear registro de fraccionamiento
            $movimiento = MovimientoFraccionamiento::create([
                'producto_padre_id' => $productoPadreId,
                'cantidad_padre' => $cantidadPadre,
                'unidad_padre_id' => $productoPadre->unidad_medida_id,
                'producto_hijo_id' => $productoHijoId,
                'cantidad_hijo' => $cantidadHijo,
                'unidad_hijo_id' => $productoHijo->unidad_medida_id,
                'almacen_id' => $almacenId,
                'sector_id' => $sectorId,
                'usuario_id' => auth()->id(),
                'fecha_fraccionamiento' => now(),
                'razon' => $razon,
                'notas' => $notas,
                'empresa_id' => auth()->user()?->empresa_id,
            ]);

            // 7️⃣ Log
            Log::info('Fraccionamiento realizado exitosamente', [
                'movimiento_fraccionamiento_id' => $movimiento->id,
                'producto_padre_id' => $productoPadreId,
                'cantidad_padre' => $cantidadPadre,
                'producto_hijo_id' => $productoHijoId,
                'cantidad_hijo' => $cantidadHijo,
                'almacen_id' => $almacenId,
                'sector_id' => $sectorId,
                'usuario_id' => auth()->id(),
                'razon' => $razon,
            ]);

            return $movimiento;
        });
    }

    /**
     * Revertir un fraccionamiento (operación inversa)
     *
     * @param MovimientoFraccionamiento $movimiento
     * @return void
     * @throws \Exception
     */
    public function revertir(MovimientoFraccionamiento $movimiento): void
    {
        DB::transaction(function () use ($movimiento) {
            // 1️⃣ Validar que el movimiento no esté ya revertido
            if ($movimiento->deleted_at !== null) {
                throw new \Exception('Este fraccionamiento ya fue revertido');
            }

            // 2️⃣ Obtener stocks con lock
            $stockPadre = StockProducto::where('producto_id', $movimiento->producto_padre_id)
                ->where('almacen_id', $movimiento->almacen_id)
                ->where('sector_id', $movimiento->sector_id)
                ->lockForUpdate()
                ->first();

            $stockHijo = StockProducto::where('producto_id', $movimiento->producto_hijo_id)
                ->where('almacen_id', $movimiento->almacen_id)
                ->where('sector_id', $movimiento->sector_id)
                ->lockForUpdate()
                ->first();

            if (!$stockPadre || !$stockHijo) {
                throw new \Exception('No se encontraron los registros de stock para revertir');
            }

            // 3️⃣ Validar que hay stock suficiente del hijo
            if ($stockHijo->cantidad < $movimiento->cantidad_hijo) {
                throw new \Exception(
                    "No hay stock suficiente del producto hijo para revertir. " .
                    "Disponible: {$stockHijo->cantidad}, Necesario: {$movimiento->cantidad_hijo}"
                );
            }

            // 4️⃣ Revertir cambios (actualizar ambas columnas en una sola query)
            StockProducto::where('id', $stockPadre->id)->update([
                'cantidad' => DB::raw('cantidad + ' . $movimiento->cantidad_padre),
                'cantidad_disponible' => DB::raw('cantidad_disponible + ' . $movimiento->cantidad_padre),
                'fecha_actualizacion' => now(),
            ]);

            $stockHijo->decrement('cantidad', $movimiento->cantidad_hijo);
            $stockHijo->decrement('cantidad_disponible', $movimiento->cantidad_hijo);
            $stockHijo->update(['fecha_actualizacion' => now()]);

            // 5️⃣ Soft delete del movimiento
            $movimiento->delete();

            // 6️⃣ Log
            Log::info('Fraccionamiento revertido', [
                'movimiento_fraccionamiento_id' => $movimiento->id,
                'producto_padre_id' => $movimiento->producto_padre_id,
                'producto_hijo_id' => $movimiento->producto_hijo_id,
                'usuario_id' => auth()->id(),
            ]);
        });
    }

    /**
     * Obtener historial de fraccionamientos de un producto
     *
     * @param int $productoId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function obtenerHistorialProducto(int $productoId)
    {
        return MovimientoFraccionamiento::query()
            ->where(function ($query) use ($productoId) {
                $query->where('producto_padre_id', $productoId)
                    ->orWhere('producto_hijo_id', $productoId);
            })
            ->conRelaciones()
            ->orderByDesc('fecha_fraccionamiento')
            ->get();
    }

    /**
     * Obtener fraccionamientos totales de un producto padre
     *
     * @param int $productoPadreId
     * @return float
     */
    public function obtenerTotalFraccionado(int $productoPadreId): float
    {
        return MovimientoFraccionamiento::where('producto_padre_id', $productoPadreId)
            ->sum('cantidad_padre');
    }

    /**
     * Obtener estadísticas de fraccionamiento por período
     *
     * @param int $productoPadreId
     * @param int $dias
     * @return array
     */
    public function obtenerEstadisticas(int $productoPadreId, int $dias = 30): array
    {
        $movimientos = MovimientoFraccionamiento::where('producto_padre_id', $productoPadreId)
            ->where('fecha_fraccionamiento', '>=', now()->subDays($dias))
            ->get();

        return [
            'total_fraccionamientos' => $movimientos->count(),
            'cantidad_padre_total' => $movimientos->sum('cantidad_padre'),
            'cantidad_hijo_total' => $movimientos->sum('cantidad_hijo'),
            'factor_promedio' => $movimientos->count() > 0
                ? $movimientos->avg(function ($m) {
                    return $m->getFactorConversion();
                })
                : 0,
            'por_razon' => $movimientos->groupBy('razon')->map(function ($grupo) {
                return [
                    'cantidad' => $grupo->count(),
                    'cantidad_padre' => $grupo->sum('cantidad_padre'),
                    'cantidad_hijo' => $grupo->sum('cantidad_hijo'),
                ];
            }),
        ];
    }
}
