<?php

namespace App\Http\Controllers;

use App\Models\StockLimite;
use App\Models\Almacen;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ComprasController extends Controller
{
    public function index()
    {
        $empresa = auth()->user()->empresa;
        $almacenes = Almacen::where('empresa_id', $empresa->id)->get();

        // Encontrar almacén principal
        $almacenPrincipal = $almacenes->first(fn($a) =>
            stripos($a->nombre, 'principal') !== false
        );

        $productosParaComprar = collect();

        if ($almacenPrincipal) {
            // Obtener todos los límites de stock definidos para almacén principal
            $limites = StockLimite::where('almacen_id', $almacenPrincipal->id)
                ->with(['producto', 'producto.unidad', 'producto.marca', 'sector'])
                ->get()
                ->groupBy('producto_id');

            // Para cada producto con límites definidos, verificar si está por debajo del mínimo
            foreach ($limites as $productoId => $limitesProducto) {
                $producto = $limitesProducto->first()->producto;

                // Sumar cantidad disponible de TODOS los lotes en almacén principal
                $totalDisponible = DB::table('stock_productos')
                    ->where('producto_id', $productoId)
                    ->where('almacen_id', $almacenPrincipal->id)
                    ->sum('cantidad_disponible');

                // Obtener el límite mínimo más bajo para este producto
                $stockMinimoRequerido = $limitesProducto->min('stock_minimo');

                // Si el stock está por debajo del mínimo, incluir en compras
                if ($totalDisponible < $stockMinimoRequerido) {
                    $producto->stock_actual = $totalDisponible;
                    $producto->stock_minimo_requerido = $stockMinimoRequerido;

                    // Obtener stock máximo para referencia
                    $stockMaximoRequerido = $limitesProducto->max('stock_maximo');
                    $producto->stock_maximo_requerido = $stockMaximoRequerido;

                    // Cantidad sugerida: diferencia entre máximo y actual
                    $cantidad_sugerida = max(0, $stockMaximoRequerido - $totalDisponible);
                    $producto->cantidad_sugerida = $cantidad_sugerida;

                    // Obtener sector desde stock_limites
                    $sector = $limitesProducto->first()->sector;
                    $producto->sector = $sector;

                    $productosParaComprar->push($producto);
                }
            }
        }

        return Inertia::render('compras/index', [
            'productosParaComprar' => $productosParaComprar->values(),
            'almacenPrincipal' => $almacenPrincipal,
        ]);
    }
}
