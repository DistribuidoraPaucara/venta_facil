<?php

namespace App\Observers;

use App\Models\HistorialPrecio;
use App\Models\PrecioProducto;
use Illuminate\Support\Facades\Auth;

class PrecioProductoObserver
{
    /**
     * Handle the PrecioProducto "updating" event.
     */
    public function updating(PrecioProducto $precioProducto): void
    {
        if ($precioProducto->isDirty('precio')) {
            $valorAnterior = (float) $precioProducto->getOriginal('precio');
            $valorNuevo = (float) $precioProducto->precio;

            // Calcular porcentaje de cambio
            $porcentajeCambio = 0;
            if ($valorAnterior != 0) {
                $porcentajeCambio = (($valorNuevo - $valorAnterior) / $valorAnterior) * 100;
            } elseif ($valorNuevo != 0) {
                // Si era 0 y ahora tiene valor, es un cambio del 100%
                $porcentajeCambio = 100;
            }

            HistorialPrecio::create([
                'precio_producto_id' => $precioProducto->id,
                'valor_anterior' => $valorAnterior,
                'valor_nuevo' => $valorNuevo,
                'porcentaje_cambio' => $porcentajeCambio,
                'fecha_cambio' => now(),
                'motivo' => $precioProducto->motivo_cambio ?? 'Actualización de precio',
                'usuario' => Auth::user()?->name ?? 'sistema',
                'tipo_precio_id' => $precioProducto->tipo_precio_id,
            ]);
        }
    }
}
