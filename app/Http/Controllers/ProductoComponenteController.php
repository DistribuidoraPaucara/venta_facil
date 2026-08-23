<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\ProductoComponente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductoComponenteController extends Controller
{
    /**
     * Obtener componentes de un producto
     */
    public function index($productoId)
    {
        $producto = Producto::findOrFail($productoId);

        $componentes = $producto->componentes()
            ->with('componente:id,nombre,precio_venta,unidad_medida_id')
            ->get()
            ->map(function ($comp) {
                return [
                    'id' => $comp->id,
                    'componente_id' => $comp->componente_id,
                    'componente_nombre' => $comp->componente->nombre,
                    'cantidad_requerida' => (float)$comp->cantidad_requerida,
                    'es_opcional' => (bool)$comp->es_opcional,
                    'precio_unitario' => (float)$comp->componente->precio_venta,
                    'orden' => $comp->orden,
                ];
            });

        return response()->json([
            'data' => $componentes,
        ]);
    }

    /**
     * Crear componente para un producto
     */
    public function store(Request $request, $productoId)
    {
        $producto = Producto::findOrFail($productoId);

        $validated = $request->validate([
            'componente_id' => 'required|exists:productos,id|different:' . $productoId,
            'cantidad_requerida' => 'required|numeric|min:0.001',
            'es_opcional' => 'boolean',
            'orden' => 'nullable|integer|min:0',
        ]);

        // Evitar componentes circulares (un producto no puede depender de sí mismo)
        if ($validated['componente_id'] == $productoId) {
            return response()->json([
                'message' => 'Un producto no puede ser componente de sí mismo',
            ], 422);
        }

        // Verificar que no exista ya
        $existe = ProductoComponente::where('producto_id', $productoId)
            ->where('componente_id', $validated['componente_id'])
            ->exists();

        if ($existe) {
            return response()->json([
                'message' => 'Este componente ya está asignado al producto',
            ], 422);
        }

        $componente = ProductoComponente::create([
            'producto_id' => $productoId,
            'componente_id' => $validated['componente_id'],
            'cantidad_requerida' => $validated['cantidad_requerida'],
            'es_opcional' => $validated['es_opcional'] ?? false,
            'orden' => $validated['orden'] ?? 0,
        ]);

        return response()->json([
            'message' => 'Componente agregado exitosamente',
            'data' => $componente,
        ], 201);
    }

    /**
     * Actualizar componente
     */
    public function update(Request $request, $productoId, $componenteId)
    {
        $componente = ProductoComponente::where('producto_id', $productoId)
            ->where('id', $componenteId)
            ->firstOrFail();

        $validated = $request->validate([
            'cantidad_requerida' => 'required|numeric|min:0.001',
            'es_opcional' => 'boolean',
            'orden' => 'nullable|integer|min:0',
        ]);

        $componente->update([
            'cantidad_requerida' => $validated['cantidad_requerida'],
            'es_opcional' => $validated['es_opcional'] ?? $componente->es_opcional,
            'orden' => $validated['orden'] ?? $componente->orden,
        ]);

        return response()->json([
            'message' => 'Componente actualizado exitosamente',
            'data' => $componente,
        ]);
    }

    /**
     * Eliminar componente
     */
    public function destroy($productoId, $componenteId)
    {
        $componente = ProductoComponente::where('producto_id', $productoId)
            ->where('id', $componenteId)
            ->firstOrFail();

        $componente->delete();

        return response()->json([
            'message' => 'Componente eliminado exitosamente',
        ]);
    }

    /**
     * Obtener todos los productos disponibles como componentes
     * (Excluye el producto actual para evitar referencias circulares)
     */
    public function productosDisponibles($productoId)
    {
        $productos = Producto::where('id', '!=', $productoId)
            ->where('activo', true)
            ->select('id', 'nombre', 'precio_venta', 'unidad_medida_id')
            ->orderBy('nombre')
            ->get()
            ->map(function ($prod) {
                return [
                    'id' => $prod->id,
                    'nombre' => $prod->nombre,
                    'precio_venta' => (float)$prod->precio_venta,
                ];
            });

        return response()->json([
            'data' => $productos,
        ]);
    }
}
