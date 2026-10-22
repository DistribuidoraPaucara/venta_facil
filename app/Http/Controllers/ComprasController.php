<?php

namespace App\Http\Controllers;

use App\Models\StockLimite;
use App\Models\Almacen;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\EstadoDocumento;
use App\Models\Moneda;
use App\Models\Producto;
use App\Models\Proveedor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
                ->with([
                    'producto',
                    'producto.unidad',
                    'producto.marca',
                    // Códigos de barra activos, el principal primero
                    'producto.codigosBarra' => fn($q) => $q->where('activo', true)
                        ->orderByDesc('es_principal')
                        ->select('id', 'producto_id', 'codigo', 'es_principal'),
                    'sector',
                ])
                ->get()
                ->groupBy('producto_id');

            // Disponible de TODOS los lotes vigentes en almacén principal, en UNA consulta (antes era una
            // por producto). Sin los lotes dados de baja: su stock ya no existe y ocultaba productos a comprar.
            $disponiblePorProducto = DB::table('stock_productos')
                ->where('almacen_id', $almacenPrincipal->id)
                ->whereIn('producto_id', $limites->keys())
                ->whereNull('deleted_at')
                ->groupBy('producto_id')
                ->selectRaw('producto_id, SUM(cantidad_disponible) AS disponible')
                ->pluck('disponible', 'producto_id');

            // Para cada producto con límites definidos, verificar si está por debajo del mínimo
            foreach ($limites as $productoId => $limitesProducto) {
                $producto = $limitesProducto->first()->producto;
                if (! $producto) {
                    continue; // límite de un producto eliminado
                }

                $totalDisponible = (float) ($disponiblePorProducto[$productoId] ?? 0);

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

        return Inertia::render('inventario/productos-compra/index', [
            'productosParaComprar' => $productosParaComprar->values(),
            'almacenPrincipal' => $almacenPrincipal,
            'proveedores' => Proveedor::where('empresa_id', $empresa->id)->where('activo', true)
                ->orderBy('nombre')->get(['id', 'nombre', 'razon_social']),
            'puedeCrearCompra' => auth()->user()->can('compras.store'),
        ]);
    }

    /**
     * POST productos-compra/orden: crea una compra en BORRADOR (orden de compra) para el almacén principal.
     * En BORRADOR no entra stock ni se registra caja/cuenta por pagar: eso ocurre al aprobarla desde
     * compras/{id}/edit, una vez revisados precios y lotes.
     *
     * Precio unitario sugerido: el de la última compra del producto, si no su precio_compra, si no 0.
     */
    public function crearBorrador(Request $request): JsonResponse
    {
        $data = $request->validate([
            'proveedor_id'        => 'nullable|integer', // opcional en borrador: se elige antes de aprobar

            'items'               => 'required|array|min:1',
            'items.*.producto_id' => 'required|integer|distinct',
            'items.*.cantidad'    => 'required|integer|min:1|max:999999',
        ]);

        $empresa   = auth()->user()->empresa;
        $proveedor = null;
        if (! empty($data['proveedor_id'])) {
            $proveedor = Proveedor::where('empresa_id', $empresa->id)->where('activo', true)->find($data['proveedor_id']);
            if (! $proveedor) {
                return response()->json(['message' => 'Proveedor no válido o inactivo'], 422);
            }
        }

        $almacenPrincipal = Almacen::where('empresa_id', $empresa->id)->get()
            ->first(fn($a) => stripos($a->nombre, 'principal') !== false);
        if (! $almacenPrincipal) {
            return response()->json(['message' => 'No se encontró el almacén principal de la empresa'], 422);
        }

        $ids       = collect($data['items'])->pluck('producto_id');
        $productos = Producto::where('empresa_id', $empresa->id)->where('activo', true)->whereIn('id', $ids)->get()->keyBy('id');
        $faltantes = $ids->reject(fn($id) => $productos->has($id));
        if ($faltantes->isNotEmpty()) {
            return response()->json(['message' => 'Productos no válidos o inactivos: #' . $faltantes->implode(', #')], 422);
        }

        $estadoBorrador = EstadoDocumento::where('codigo', 'BORRADOR')->value('id');
        $monedaBase     = Moneda::where('es_moneda_base', true)->where('activo', true)->value('id')
            ?? Moneda::where('activo', true)->orderBy('id')->value('id');
        if (! $estadoBorrador || ! $monedaBase) {
            return response()->json(['message' => 'Falta el estado BORRADOR o una moneda activa'], 422);
        }

        // Último precio de compra de cada producto
        $ultimoPrecio = DetalleCompra::whereIn('producto_id', $ids)->where('precio_unitario', '>', 0)
            ->orderByDesc('id')->get(['producto_id', 'precio_unitario'])
            ->unique('producto_id')->pluck('precio_unitario', 'producto_id');

        $compra = DB::transaction(function () use ($data, $productos, $ultimoPrecio, $proveedor, $almacenPrincipal, $estadoBorrador, $monedaBase) {
            $detalles = collect($data['items'])->map(function ($item) use ($productos, $ultimoPrecio) {
                $producto = $productos[$item['producto_id']];
                $precio   = (float) ($ultimoPrecio[$producto->id] ?? ($producto->precio_compra > 0 ? $producto->precio_compra : 0));

                return [
                    'producto_id'      => $producto->id,
                    'cantidad'         => (int) $item['cantidad'],
                    'precio_unitario'  => $precio,
                    'descuento'        => 0,
                    'subtotal'         => round($precio * (int) $item['cantidad'], 2),
                    'unidad_medida_id' => $producto->unidad_medida_id,
                ];
            });
            $subtotal = round($detalles->sum('subtotal'), 2);

            // Mismo formato de número que CompraController::store(): COMP{fecha}-{id}
            $compra = Compra::create([
                'numero'              => 'TMP-' . uniqid(),
                'fecha'               => now(),
                'subtotal'            => $subtotal,
                'descuento'           => 0,
                'impuesto'            => 0,
                'total'               => $subtotal,
                'observaciones'       => 'Orden de compra generada desde Productos para Comprar',
                'proveedor_id'        => $proveedor?->id,
                'usuario_id'          => auth()->id(),
                'estado_documento_id' => $estadoBorrador,
                'moneda_id'           => $monedaBase,
                'almacen_id'          => $almacenPrincipal->id,
            ]);
            $compra->update(['numero' => 'COMP' . $compra->created_at->format('Ymd') . '-' . $compra->id]);
            $compra->detalles()->createMany($detalles->all());

            return $compra;
        });

        Log::info('📝 [ComprasController] Orden de compra (BORRADOR) creada', [
            'compra_id'    => $compra->id,
            'numero'       => $compra->numero,
            'proveedor_id' => $proveedor?->id,
            'productos'    => $ids->count(),
            'sin_precio'   => $compra->detalles()->where('precio_unitario', 0)->count(),
            'user_id'      => auth()->id(),
        ]);

        return response()->json([
            'success'    => true,
            'id'         => $compra->id,
            'numero'     => $compra->numero,
            'sin_precio' => $compra->detalles()->where('precio_unitario', 0)->count(),
            'sin_proveedor' => $proveedor === null,
            'url'        => route('compras.edit', $compra->id),
        ]);
    }
}
