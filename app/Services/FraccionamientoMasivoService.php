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
        $sectorId = $fm->sector_id;
        $ppId = $d['producto_padre_id'];
        $cpPadre = $d['cantidad_padre'];
        $phId = $d['producto_hijo_id'];
        $cpHijo = $d['cantidad_hijo'];

        $pp = Producto::findOrFail($ppId);
        $ph = Producto::findOrFail($phId);

        $sp = StockProducto::where('producto_id', $ppId)
            ->where('almacen_id', $almacenId)
            ->where('sector_id', $sectorId)
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
            ->where('sector_id', $sectorId)
            ->lockForUpdate()
            ->firstOrCreate([
                'producto_id' => $phId,
                'almacen_id' => $almacenId,
                'sector_id' => $sectorId,
            ], [
                'cantidad' => 0,
                'cantidad_disponible' => 0,
                'cantidad_reservada' => 0,
            ]);

        StockProducto::where('id', $sp->id)->update([
            'cantidad' => DB::raw('cantidad - ' . $cpPadre),
            'cantidad_disponible' => DB::raw('cantidad_disponible - ' . $cpPadre),
        ]);

        StockProducto::where('id', $sh->id)->update([
            'cantidad' => DB::raw('cantidad + ' . $cpHijo),
            'cantidad_disponible' => DB::raw('cantidad_disponible + ' . $cpHijo),
        ]);

        $spA = StockProducto::find($sp->id);
        $shA = StockProducto::find($sh->id);

        MovimientoInventario::create([
            'stock_producto_id' => $sp->id,
            'cantidad' => -$cpPadre,
            'cantidad_anterior' => $sp->cantidad,
            'cantidad_posterior' => $spA->cantidad,
            'cantidad_disponible_anterior' => $sp->cantidad_disponible,
            'cantidad_disponible_posterior' => $spA->cantidad_disponible,
            'tipo' => 'SALIDA_FRACCIONAMIENTO',
            'observacion' => "Fraccionamiento masivo: $cpPadre → $cpHijo",
            'fecha' => now(),
            'user_id' => Auth::id(),
            'referencia_tipo' => 'fraccionamiento_masivo',
        ]);

        MovimientoInventario::create([
            'stock_producto_id' => $sh->id,
            'cantidad' => $cpHijo,
            'cantidad_anterior' => $sh->cantidad - $cpHijo,
            'cantidad_posterior' => $shA->cantidad,
            'cantidad_disponible_anterior' => $sh->cantidad_disponible - $cpHijo,
            'cantidad_disponible_posterior' => $shA->cantidad_disponible,
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
