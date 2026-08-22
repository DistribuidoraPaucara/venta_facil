<?php

namespace App\Http\Controllers;

use App\Models\AdicionVenta;
use App\Models\DetalleVenta;
use App\Models\Producto;
use Illuminate\Http\Request;

class AdicionVentaController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Listar adiciones de una venta
     */
    public function index(Request $request)
    {
        $ventaDetalleId = $request->query('detalle_venta_id');

        if (!$ventaDetalleId) {
            return response()->json([
                'success' => false,
                'message' => 'Se requiere detalle_venta_id',
            ], 422);
        }

        $adiciones = AdicionVenta::where('detalle_venta_id', $ventaDetalleId)
            ->with(['producto', 'detalleVenta.venta'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $adiciones,
        ]);
    }

    /**
     * Agregar adición a un detalle de venta
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'detalle_venta_id' => 'required|exists:detalle_ventas,id',
            'producto_id' => 'required|exists:productos,id',
            'cantidad' => 'required|numeric|min:0.001',
            'precio_unitario' => 'required|numeric|min:0',
        ]);

        // Verificar que el detalle existe
        $detalleVenta = DetalleVenta::find($validated['detalle_venta_id']);
        if (!$detalleVenta) {
            return response()->json([
                'success' => false,
                'message' => 'Detalle de venta no encontrado',
            ], 422);
        }

        // Verificar que el producto a agregar sea de materia prima o comprado
        $producto = Producto::find($validated['producto_id']);
        if (!in_array($producto->tipo_producto, ['comprado', 'materia_prima'])) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden agregar productos comprados o materias primas como adiciones',
            ], 422);
        }

        // Crear la adición
        $adicion = AdicionVenta::create([
            'venta_id' => $detalleVenta->venta_id,
            'detalle_venta_id' => $validated['detalle_venta_id'],
            'producto_id' => $validated['producto_id'],
            'cantidad' => $validated['cantidad'],
            'precio_unitario' => $validated['precio_unitario'],
        ]);

        $adicion->load('producto');

        // Actualizar el subtotal del detalle (si es necesario en el flow)
        // Nota: Esto puede manejarse en el frontend o en el controlador de ventas

        return response()->json([
            'success' => true,
            'message' => 'Adición registrada exitosamente',
            'data' => $adicion,
            'subtotal' => $adicion->subtotal(),
        ], 201);
    }

    /**
     * Eliminar adición
     */
    public function destroy(AdicionVenta $adicion)
    {
        $subtotal = $adicion->subtotal();
        $adicion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Adición eliminada exitosamente',
            'subtotal_eliminado' => $subtotal,
        ]);
    }

    /**
     * Obtener productos disponibles para agregar como adición (comprados y materias primas)
     */
    public function productosDisponibles()
    {
        $productos = Producto::whereIn('tipo_producto', ['comprado', 'materia_prima'])
            ->where('activo', true)
            ->select(['id', 'nombre', 'precio_venta', 'tipo_producto'])
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $productos,
        ]);
    }
}
