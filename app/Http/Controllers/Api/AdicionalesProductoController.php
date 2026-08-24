<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdicionalesProducto;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdicionalesProductoController extends Controller
{
    /**
     * Obtener adicionales de un producto
     */
    public function obtenerPorProducto(Producto $producto): JsonResponse
    {
        $adicionales = $producto->adicionales()
            ->activos()
            ->ordenados()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $adicionales,
        ]);
    }

    /**
     * Crear un nuevo adicional
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio_adicional' => 'required|numeric|min:0',
            'orden' => 'integer|min:0',
        ]);

        // Verificar que el producto es de comida
        $producto = Producto::findOrFail($validated['producto_id']);
        if (!$producto->es_producto_comida) {
            return response()->json([
                'success' => false,
                'message' => 'Este producto no es de comida/helado',
            ], 422);
        }

        $adicional = AdicionalesProducto::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Adicional creado correctamente',
            'data' => $adicional,
        ], 201);
    }

    /**
     * Actualizar un adicional
     */
    public function update(Request $request, AdicionalesProducto $adicional): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'string|max:255',
            'descripcion' => 'nullable|string',
            'precio_adicional' => 'numeric|min:0',
            'orden' => 'integer|min:0',
            'activo' => 'boolean',
        ]);

        $adicional->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Adicional actualizado correctamente',
            'data' => $adicional,
        ]);
    }

    /**
     * Eliminar un adicional
     */
    public function destroy(AdicionalesProducto $adicional): JsonResponse
    {
        $adicional->delete();

        return response()->json([
            'success' => true,
            'message' => 'Adicional eliminado correctamente',
        ]);
    }

    /**
     * Obtener unidades de medida activas
     */
    public function unidadesMedida(): JsonResponse
    {
        $unidades = \App\Models\UnidadMedida::activas()
            ->get(['id', 'nombre', 'codigo']); // ✅ Usar 'codigo' como abreviatura

        return response()->json([
            'success' => true,
            'data' => $unidades,
        ]);
    }

    /**
     * Obtener productos de comida con precios correctos
     */
    public function productosComida(): JsonResponse
    {
        // ✅ ACTUALIZADO (2026-08-23): Devolver TODOS los productos con campos de adicionales
        $productos = Producto::where('activo', true)
            ->whereHas('precios', function($q) {
                // Solo productos que tienen un precio activo de tipo VENTA
                $q->where('activo', true)
                    ->whereHas('tipoPrecio', function($subQ) {
                        $subQ->where('codigo', 'VENTA');
                    });
            })
            ->with([
                'adicionales' => function($q) {
                    $q->activos()->ordenados();
                },
                'precios' => function($q) {
                    // Cargar precios activos con su tipo de precio
                    $q->where('activo', true)
                        ->with('tipoPrecio');
                },
                'imagenes' => function($q) {
                    // Cargar imagen principal (es_principal = true) o la primera si no existe
                    $q->orderBy('es_principal', 'desc')->orderBy('orden');
                },
                'stock' => function($q) {
                    // Cargar stock disponible (cantidad_disponible = cantidad para venta, sin las reservadas)
                    $q->select('id', 'producto_id', 'cantidad_disponible');
                },
                // ✅ NUEVO (2026-08-23): Cargar ingredientes predefinidos como adicionales
                'ingredientes' => function($q) {
                    $q->with(['ingrediente:id,nombre', 'unidadMedida:id,nombre,codigo']);
                }
            ])
            ->orderBy('nombre', 'asc') // ✅ ACTUALIZADO (2026-08-23): Orden alfabético en lugar de por ID
            ->get(['id', 'nombre', 'sku', 'descripcion', 'precio_venta', 'permite_venta_sin_stock', 'es_producto_comida', 'puede_tener_producto_adicional', 'es_producto_adicional'])
            ->filter(function($producto) {
                // ✅ ACTUALIZADO (2026-08-23): Mostrar todos productos (remover filtro de stock innecesario)
                // El whereHas ya valida que tienen precios activos
                return true;
            });

        // Mapear productos para incluir el precio de VENTA correcto y disponibilidad
        $productosFormatted = $productos->map(function($producto) {
            // Buscar el precio de tipo VENTA (el que NO es precio base)
            $precioVenta = $producto->precios
                ->filter(function($p) {
                    return $p->tipoPrecio && !$p->tipoPrecio->es_precio_base; // Es precio de venta (no base/costo)
                })
                ->first();

            // Usar campo 'precio' de precios_producto, o fallback al precio_venta del modelo
            $montoVenta = 0;
            if ($precioVenta && $precioVenta->precio !== null) {
                $montoVenta = (float) $precioVenta->precio; // ✅ Campo correcto: 'precio' no 'monto'
            } else {
                // ⚠️ FALLBACK: Si no hay precio en precios_producto, usar precio_venta del modelo
                $montoVenta = (float) ($producto->precio_venta ?? 0);
            }

            // Obtener imagen principal o primera disponible
            $imagenPrincipal = $producto->imagenes->isNotEmpty() ? $producto->imagenes[0]->url : null;

            // Calcular disponibilidad sumando todos los stock_productos (cantidad_disponible = sin reservadas)
            $disponibilidad = $producto->stock->sum('cantidad_disponible') ?? 0;

            // ✅ NUEVO (2026-08-23): Mapear ingredientes a formato de adicionales predefinidos
            $ingredientesMapeados = $producto->ingredientes?->map(function($ing) {
                return [
                    'id' => $ing->producto_id,
                    'nombre' => $ing->ingrediente?->nombre ?? '',
                    'cantidad_requerida' => $ing->cantidad_requerida,
                    'unidad_medida_id' => $ing->unidad_medida_id,
                    'unidad_nombre' => $ing->unidadMedida?->nombre ?? 'Unidad',
                ];
            })->toArray() ?? [];

            return [
                'id' => $producto->id,
                'nombre' => $producto->nombre,
                'sku' => $producto->sku,
                'descripcion' => $producto->descripcion,
                'precio_venta' => $montoVenta,
                'es_producto_comida' => $producto->es_producto_comida,
                'permite_venta_sin_stock' => (bool) $producto->permite_venta_sin_stock,
                'disponibilidad' => (int) $disponibilidad,
                'imagen_url' => $imagenPrincipal,
                // ✅ NUEVO (2026-08-23): Campos de adicionales
                'puede_tener_producto_adicional' => (bool) $producto->puede_tener_producto_adicional,
                'es_producto_adicional' => (bool) $producto->es_producto_adicional,
                'adicionales' => $producto->adicionales,
                // ✅ NUEVO (2026-08-23): Ingredientes como adicionales predefinidos
                'ingredientes' => $ingredientesMapeados,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $productosFormatted->values()->toArray(), // ✅ Convertir a array y reindexar
        ]);
    }
}
