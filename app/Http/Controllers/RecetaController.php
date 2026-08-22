<?php

namespace App\Http\Controllers;

use App\Models\Receta;
use App\Models\RecetaIngrediente;
use App\Models\Producto;
use Illuminate\Http\Request;

class RecetaController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Lista todas las recetas con sus ingredientes
     */
    public function index(Request $request)
    {
        $query = Receta::with(['producto', 'ingredientes.ingrediente']);

        // Filtro opcional por estado
        if ($request->query('activas') === 'true') {
            $query->activas();
        }

        $recetas = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $recetas,
        ]);
    }

    /**
     * Mostrar una receta específica
     */
    public function show(Receta $receta)
    {
        $receta->load(['producto', 'ingredientes.ingrediente', 'producciones']);

        return response()->json([
            'success' => true,
            'data' => $receta,
        ]);
    }

    /**
     * Crear nueva receta
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:productos,id|unique:recetas,producto_id',
            'descripcion' => 'nullable|string|max:500',
            'instrucciones' => 'nullable|string',
            'activa' => 'boolean',
        ]);

        // Verificar que el producto sea de tipo elaborado
        $producto = Producto::find($validated['producto_id']);
        if ($producto->tipo_producto !== 'elaborado_cafeteria') {
            return response()->json([
                'success' => false,
                'message' => 'Solo productos elaborados en cafetería pueden tener receta',
            ], 422);
        }

        $receta = Receta::create($validated);
        $receta->load(['producto', 'ingredientes']);

        return response()->json([
            'success' => true,
            'message' => 'Receta creada exitosamente',
            'data' => $receta,
        ], 201);
    }

    /**
     * Actualizar receta
     */
    public function update(Request $request, Receta $receta)
    {
        $validated = $request->validate([
            'descripcion' => 'nullable|string|max:500',
            'instrucciones' => 'nullable|string',
            'activa' => 'boolean',
        ]);

        $receta->update($validated);
        $receta->load(['producto', 'ingredientes.ingrediente']);

        return response()->json([
            'success' => true,
            'message' => 'Receta actualizada exitosamente',
            'data' => $receta,
        ]);
    }

    /**
     * Eliminar receta
     */
    public function destroy(Receta $receta)
    {
        // Verificar si tiene producciones activas
        if ($receta->producciones()->where('estado', '!=', 'cancelada')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar receta con producciones activas',
            ], 422);
        }

        $receta->delete();

        return response()->json([
            'success' => true,
            'message' => 'Receta eliminada exitosamente',
        ]);
    }

    /**
     * Agregar ingrediente a receta
     */
    public function agregarIngrediente(Request $request, Receta $receta)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'cantidad_requerida' => 'required|numeric|min:0.001',
        ]);

        // Verificar que el producto sea materia prima
        $producto = Producto::find($validated['producto_id']);
        if ($producto->tipo_producto !== 'materia_prima') {
            return response()->json([
                'success' => false,
                'message' => 'Solo productos de materia prima pueden ser ingredientes',
            ], 422);
        }

        // Verificar que no exista ya
        $existe = $receta->ingredientes()
            ->where('producto_id', $validated['producto_id'])
            ->exists();

        if ($existe) {
            return response()->json([
                'success' => false,
                'message' => 'Este ingrediente ya está en la receta',
            ], 422);
        }

        // Prevenir que un producto sea ingrediente de sí mismo
        if ($validated['producto_id'] === $receta->producto_id) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede agregar el producto como ingrediente de sí mismo',
            ], 422);
        }

        $ingrediente = $receta->ingredientes()->create($validated);
        $ingrediente->load('ingrediente');

        return response()->json([
            'success' => true,
            'message' => 'Ingrediente agregado exitosamente',
            'data' => $ingrediente,
        ], 201);
    }

    /**
     * Eliminar ingrediente de receta
     */
    public function quitarIngrediente(Receta $receta, RecetaIngrediente $ingrediente)
    {
        if ($ingrediente->receta_id !== $receta->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ingrediente no pertenece a esta receta',
            ], 422);
        }

        $ingrediente->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ingrediente eliminado exitosamente',
        ]);
    }

    /**
     * Actualizar cantidad requerida de ingrediente
     */
    public function actualizarIngrediente(Request $request, Receta $receta, RecetaIngrediente $ingrediente)
    {
        if ($ingrediente->receta_id !== $receta->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ingrediente no pertenece a esta receta',
            ], 422);
        }

        $validated = $request->validate([
            'cantidad_requerida' => 'required|numeric|min:0.001',
        ]);

        $ingrediente->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cantidad actualizada exitosamente',
            'data' => $ingrediente,
        ]);
    }

    /**
     * Obtener productos disponibles para ingredientes (materia prima)
     */
    public function productosDisponibles()
    {
        $productos = Producto::materiaPrima()
            ->where('activo', true)
            ->select(['id', 'nombre', 'unidad_medida_id', 'precio_compra', 'tipo_producto'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $productos,
        ]);
    }
}
