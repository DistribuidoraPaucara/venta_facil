<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\StockLimite;
use App\Models\StockProducto;
use App\Models\Almacen;
use App\Models\Sector;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ConfiguracionStockController extends Controller
{
    public function index(Request $request)
    {
        $empresa = auth()->user()->empresa;
        $almacenes = Almacen::where('empresa_id', $empresa->id)->get();
        $sectores = Sector::where('empresa_id', $empresa->id)->get();

        // Obtener almacén seleccionado
        $almacenId = $request->query('almacen_id');
        $almacenSeleccionado = $almacenId
            ? $almacenes->find($almacenId)
            : $almacenes->first(fn($a) => stripos($a->nombre, 'principal') !== false);

        // Obtener sector seleccionado
        $sectorId = $request->query('sector_id');

        // Obtener todos los productos con su información
        $productosQuery = Producto::where('activo', true)
            ->with(['unidad', 'marca'])
            ->orderBy('nombre');

        $todosProductos = $productosQuery->get()
            ->map(function ($producto) use ($almacenSeleccionado, $sectorId) {
                // Obtener límites de stock (ordenar por ID DESC para traer el más reciente)
                $limites = StockLimite::where('producto_id', $producto->id)
                    ->where('almacen_id', $almacenSeleccionado->id ?? null)
                    ->with('sector')
                    ->orderBy('id', 'desc')
                    ->first();

                // Obtener stock actual (ordenar por ID DESC para traer el más reciente)
                $stock = DB::table('stock_productos')
                    ->where('producto_id', $producto->id)
                    ->where('almacen_id', $almacenSeleccionado->id ?? null)
                    ->orderBy('id', 'desc')
                    ->first();

                return [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'sku' => $producto->sku,
                    'unidad' => $producto->unidad?->nombre,
                    'marca' => $producto->marca?->nombre,
                    'stock_actual' => $stock?->cantidad_disponible ?? 0,
                    'stock_minimo' => $limites?->stock_minimo ?? 0,
                    'stock_maximo' => $limites?->stock_maximo ?? 0,
                    'sector_id' => $limites?->sector_id,
                    'sector_nombre' => $limites?->sector?->nombre,
                    'stock_limite_id' => $limites?->id,
                    'stock_producto_id' => $stock?->id,
                ];
            })
            // Filtrar por sector si está seleccionado
            ->when($sectorId, function ($collection) use ($sectorId) {
                return $collection->filter(fn($p) => $p['sector_id'] == $sectorId);
            });

        // Paginar manualmente
        $perPage = 20;
        $page = max(1, (int) $request->query('page', 1));
        $total = $todosProductos->count();
        $paginatedProductos = $todosProductos->slice(($page - 1) * $perPage, $perPage)->values();

        return Inertia::render('configuracionStock/Index', [
            'productos' => $paginatedProductos,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => ceil($total / $perPage),
            ],
            'almacenSeleccionado' => $almacenSeleccionado,
            'sectorSeleccionado' => $sectorId ? Sector::find($sectorId) : null,
            'almacenes' => $almacenes,
            'sectores' => $sectores,
        ]);
    }

    public function actualizar(Request $request)
    {
        \Log::info('[ConfiguracionStock] 🎯 Método actualizar invocado');
        \Log::info('[ConfiguracionStock] Request data', $request->all());

        $validated = $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'almacen_id' => 'required|exists:almacenes,id',
            'stock_minimo' => 'required|numeric|min:0',
            'stock_maximo' => 'required|numeric|min:0',
            'stock_actual' => 'required|numeric|min:0',
            'sector_id' => 'nullable|exists:sectores,id',
        ]);

        \Log::info('[ConfiguracionStock] Validación exitosa', $validated);

        $almacen = Almacen::findOrFail($validated['almacen_id']);

        DB::beginTransaction();
        try {
            // Buscar stock_limite actual (obtener el primero por producto+almacen)
            $stockLimiteActual = StockLimite::where('producto_id', $validated['producto_id'])
                ->where('almacen_id', $almacen->id)
                ->first();

            // Si quiere cambiar a un sector que ya existe, eliminar el antiguo primero
            if ($stockLimiteActual && $validated['sector_id']) {
                $conflicto = StockLimite::where('producto_id', $validated['producto_id'])
                    ->where('almacen_id', $almacen->id)
                    ->where('sector_id', $validated['sector_id'])
                    ->where('id', '!=', $stockLimiteActual->id)
                    ->first();

                if ($conflicto) {
                    $conflicto->delete();
                    \Log::info('[ConfiguracionStock] Registro duplicado eliminado', ['id' => $conflicto->id]);
                }
            }

            if ($stockLimiteActual) {
                // Si existe, actualizar incluyendo sector_id
                $stockLimiteActual->update([
                    'stock_minimo' => $validated['stock_minimo'],
                    'stock_maximo' => $validated['stock_maximo'],
                    'sector_id' => $validated['sector_id'],
                ]);
                \Log::info('[ConfiguracionStock] StockLimite actualizado', ['id' => $stockLimiteActual->id]);
            } else {
                // Si no existe, crear uno nuevo
                $stockLimiteActual = StockLimite::create([
                    'producto_id' => $validated['producto_id'],
                    'almacen_id' => $almacen->id,
                    'stock_minimo' => $validated['stock_minimo'],
                    'stock_maximo' => $validated['stock_maximo'],
                    'sector_id' => $validated['sector_id'],
                ]);
                \Log::info('[ConfiguracionStock] StockLimite creado', ['id' => $stockLimiteActual->id]);
            }

            // Actualizar o crear stock actual
            $stockProducto = StockProducto::updateOrCreate(
                [
                    'producto_id' => $validated['producto_id'],
                    'almacen_id' => $almacen->id,
                    'lote' => null,
                ],
                [
                    'cantidad_disponible' => $validated['stock_actual'],
                    'cantidad' => $validated['stock_actual'],
                ]
            );

            \Log::info('[ConfiguracionStock] StockProducto actualizado', ['id' => $stockProducto->id]);

            DB::commit();
            \Log::info('[ConfiguracionStock] ✅ Transacción completada');

            return back()->with('success', 'Stock actualizado correctamente');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('[ConfiguracionStock] ❌ Error', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Error al actualizar: ' . $e->getMessage()]);
        }
    }
}
