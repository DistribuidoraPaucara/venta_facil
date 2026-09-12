<?php

namespace App\Services;

use App\Models\DetalleFraccionamiento;
use App\Models\FraccionamientoMasivo;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FraccionamientoMasivoService
{
    public function registrar(
        int $almacenId,
        int $sectorId,
        array $detalles,
        string $razon = 'fraccionamiento_manual',
        ?string $notas = null
    ): FraccionamientoMasivo {
        return DB::transaction(function () use (
            $almacenId,
            $sectorId,
            $detalles,
            $razon,
            $notas
        ) {
            if (empty($detalles)) {
                throw new \Exception('Debe haber al menos un detalle de fraccionamiento');
            }

            foreach ($detalles as $detalle) {
                $this->validarDetalle($detalle);
            }

            // Si no hay sector_id válido, obtenerlo del primer producto
            if (!$sectorId || $sectorId === 0) {
                $productoPadreId = $detalles[0]['producto_padre_id'];
                $sectorId = \App\Models\StockLimite::where('producto_id', $productoPadreId)
                    ->where('almacen_id', $almacenId)
                    ->value('sector_id');

                if (!$sectorId) {
                    throw new \Exception('No se puede determinar el sector del fraccionamiento');
                }
            }

            $fraccionamientoMasivo = FraccionamientoMasivo::create([
                'almacen_id' => $almacenId,
                'sector_id' => $sectorId,
                'usuario_id' => Auth::id(),
                'fecha_fraccionamiento' => now(),
                'razon' => $razon,
                'notas' => $notas,
                'cantidad_detalles' => count($detalles),
            ]);

            foreach ($detalles as $numero => $detalle) {
                $this->procesarDetalle($fraccionamientoMasivo, $detalle, $numero + 1);
            }

            Log::info('Fraccionamiento masivo registrado exitosamente', [
                'fraccionamiento_masivo_id' => $fraccionamientoMasivo->id,
                'cantidad_detalles' => count($detalles),
            ]);

            return $fraccionamientoMasivo->load('detalles');
        });
    }

    private function validarDetalle(array $detalle): void
    {
        $productoPadre = Producto::findOrFail($detalle['producto_padre_id']);
        $productoHijo = Producto::findOrFail($detalle['producto_hijo_id']);

        if ($productoPadre->id === $productoHijo->id) {
            throw new \Exception('El producto padre y hijo no pueden ser el mismo');
        }

        if ($detalle['cantidad_padre'] <= 0 || $detalle['cantidad_hijo'] <= 0) {
            throw new \Exception('Las cantidades deben ser mayores a 0');
        }
    }

    private function procesarDetalle(FraccionamientoMasivo $fm, array $d, int $num): void
    {
        $almacenId = $fm->almacen_id;
        $ppId = $d['producto_padre_id'];
        $cpPadre = $d['cantidad_padre'];
        $phId = $d['producto_hijo_id'];
        $cpHijo = $d['cantidad_hijo'];

        $pp = Producto::findOrFail($ppId);
        $ph = Producto::findOrFail($phId);

        // Obtener sector del padre desde stock_limites
        $sectorPadre = \App\Models\StockLimite::where('producto_id', $ppId)
            ->where('almacen_id', $almacenId)
            ->value('sector_id');

        if (!$sectorPadre) {
            throw new \Exception("Producto {$pp->nombre} no tiene sector asignado en almacén {$almacenId}");
        }

        // Obtener sector del hijo: primero buscar donde ya tiene stock, luego de stock_limites
        $sectorHijo = StockProducto::where('producto_id', $phId)
            ->where('almacen_id', $almacenId)
            ->value('sector_id');

        if (!$sectorHijo) {
            // Si no hay stock, obtener de stock_limites
            $sectorHijo = \App\Models\StockLimite::where('producto_id', $phId)
                ->where('almacen_id', $almacenId)
                ->value('sector_id');
        }

        if (!$sectorHijo) {
            throw new \Exception("Producto {$ph->nombre} no tiene sector asignado en almacén {$almacenId}");
        }

        $sp = StockProducto::where('producto_id', $ppId)
            ->where('almacen_id', $almacenId)
            ->where('sector_id', $sectorPadre)
            ->lockForUpdate()
            ->first();

        if (!$sp) {
            throw new \Exception("No hay stock de {$pp->nombre}");
        }

        if ($sp->cantidad < $cpPadre) {
            throw new \Exception("Stock insuficiente. Disponible: {$sp->cantidad}, Solicitado: {$cpPadre}");
        }

        $sh = StockProducto::where('producto_id', $phId)
            ->where('almacen_id', $almacenId)
            ->where('sector_id', $sectorHijo)
            ->lockForUpdate()
            ->firstOrCreate([
                'producto_id' => $phId,
                'almacen_id' => $almacenId,
                'sector_id' => $sectorHijo,
            ], [
                'cantidad' => 0,
                'cantidad_disponible' => 0,
                'cantidad_reservada' => 0,
            ]);

        // Guardar valores ANTES
        $spAntes = [
            'cantidad' => $sp->cantidad,
            'cantidad_disponible' => $sp->cantidad_disponible,
            'cantidad_reservada' => $sp->cantidad_reservada ?? 0,
        ];
        $shAntes = [
            'cantidad' => $sh->cantidad,
            'cantidad_disponible' => $sh->cantidad_disponible,
            'cantidad_reservada' => $sh->cantidad_reservada ?? 0,
        ];

        // Actualizar (sin DB::raw, de forma directa)
        $sp->cantidad -= $cpPadre;
        $sp->cantidad_disponible -= $cpPadre;
        $sp->save();

        $sh->cantidad += $cpHijo;
        $sh->cantidad_disponible += $cpHijo;
        $sh->save();

        // Valores DESPUÉS
        $spDespues = [
            'cantidad' => $sp->cantidad,
            'cantidad_disponible' => $sp->cantidad_disponible,
            'cantidad_reservada' => $sp->cantidad_reservada ?? 0,
        ];
        $shDespues = [
            'cantidad' => $sh->cantidad,
            'cantidad_disponible' => $sh->cantidad_disponible,
            'cantidad_reservada' => $sh->cantidad_reservada ?? 0,
        ];

        MovimientoInventario::create([
            'stock_producto_id' => $sp->id,
            'cantidad' => -$cpPadre,
            'cantidad_total_anterior' => $spAntes['cantidad'],
            'cantidad_total_posterior' => $spDespues['cantidad'],
            'cantidad_disponible_anterior' => $spAntes['cantidad_disponible'],
            'cantidad_disponible_posterior' => $spDespues['cantidad_disponible'],
            'cantidad_reservada_anterior' => $spAntes['cantidad_reservada'],
            'cantidad_reservada_posterior' => $spDespues['cantidad_reservada'],
            'tipo' => 'SALIDA_FRACCIONAMIENTO',
            'observacion' => "Fraccionamiento masivo: $cpPadre → $cpHijo",
            'fecha' => now(),
            'user_id' => Auth::id(),
            'referencia_tipo' => 'fraccionamiento_masivo',
        ]);

        MovimientoInventario::create([
            'stock_producto_id' => $sh->id,
            'cantidad' => $cpHijo,
            'cantidad_total_anterior' => $shAntes['cantidad'],
            'cantidad_total_posterior' => $shDespues['cantidad'],
            'cantidad_disponible_anterior' => $shAntes['cantidad_disponible'],
            'cantidad_disponible_posterior' => $shDespues['cantidad_disponible'],
            'cantidad_reservada_anterior' => $shAntes['cantidad_reservada'],
            'cantidad_reservada_posterior' => $shDespues['cantidad_reservada'],
            'tipo' => 'ENTRADA_FRACCIONAMIENTO',
            'observacion' => "Fraccionamiento masivo: $cpPadre → $cpHijo",
            'fecha' => now(),
            'user_id' => Auth::id(),
            'referencia_tipo' => 'fraccionamiento_masivo',
        ]);

        DetalleFraccionamiento::create([
            'fraccionamiento_masivo_id' => $fm->id,
            'producto_padre_id' => $ppId,
            'producto_hijo_id' => $phId,
            'unidad_padre_id' => $pp->unidad_medida_id,
            'unidad_hijo_id' => $ph->unidad_medida_id,
            'cantidad_padre' => $cpPadre,
            'cantidad_hijo' => $cpHijo,
            'factor_conversion' => $d['factor_conversion'] ?? ($cpHijo / $cpPadre),
            'numero_linea' => $num,
        ]);
    }
}
