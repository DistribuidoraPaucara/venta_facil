<?php

namespace App\Http\Controllers;

use App\Models\Reposicion;
use App\Models\ReposicionDetalle;
use App\Models\Almacen;
use App\Models\Producto;
use App\Models\StockLimite;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReposicionController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Reposicion::class);

        $reposiciones = Reposicion::with(['empresa', 'almacenOrigen', 'almacenDestino', 'usuario'])
            ->where('empresa_id', auth()->user()->empresa_id)
            ->latest()
            ->paginate(20);

        return Inertia::render('Reposiciones/Index', [
            'reposiciones' => $reposiciones,
        ]);
    }

    public function create()
    {
        $this->authorize('create', Reposicion::class);

        $empresa = auth()->user()->empresa;
        $almacenes = Almacen::where('empresa_id', $empresa->id)->get();

        // Encontrar almacén principal y sala de ventas por nombre
        $almacenPrincipal = $almacenes->first(fn($a) =>
            stripos($a->nombre, 'principal') !== false
        );
        $almacenDestino = $almacenes->first(fn($a) =>
            stripos($a->nombre, 'sala') !== false || stripos($a->nombre, 'venta') !== false
        );

        $almacenDefecto = $almacenDestino?->id;

        // Obtener productos cercanos al límite mínimo usando los nuevos límites por sector
        $productosStockBajo = collect();

        if ($almacenDefecto && $almacenPrincipal) {
            // Obtener todos los límites de stock definidos para este almacén
            $limites = StockLimite::where('almacen_id', $almacenDefecto)
                ->with(['producto', 'producto.unidad', 'producto.conversiones' => fn($q) => $q->where('activo', true)])
                ->get()
                ->groupBy('producto_id');

            // Para cada producto con límites definidos, verificar si está cerca del mínimo
            foreach ($limites as $productoId => $limitesProducto) {
                $producto = $limitesProducto->first()->producto;

                // Sumar cantidad disponible de TODOS los lotes en almacén destino
                $totalDisponible = DB::table('stock_productos')
                    ->where('producto_id', $productoId)
                    ->where('almacen_id', $almacenDefecto)
                    ->sum('cantidad_disponible');

                // Obtener el límite mínimo más bajo para este producto
                $stockMinimoRequerido = $limitesProducto->min('stock_minimo');

                // Calcular threshold de advertencia (20% por encima del mínimo)
                $umbralAdvertencia = $stockMinimoRequerido * 1.2;

                // Verificar stock disponible en almacén principal
                $stockPrincipal = DB::table('stock_productos')
                    ->where('producto_id', $productoId)
                    ->where('almacen_id', $almacenPrincipal->id)
                    ->sum('cantidad_disponible');

                // Si el stock está cerca del mínimo Y hay stock en principal, incluir en reposición
                if ($totalDisponible <= $umbralAdvertencia && $stockPrincipal > 0) {
                    $producto->stock_actual = $totalDisponible;
                    $producto->stock_minimo_requerido = $stockMinimoRequerido;
                    $producto->umbral_advertencia = $umbralAdvertencia;
                    $producto->stock_principal = $stockPrincipal;

                    // Obtener stock máximo para calcular cantidad sugerida
                    $stockMaximoRequerido = $limitesProducto->max('stock_maximo');
                    $producto->stock_maximo_requerido = $stockMaximoRequerido;

                    // Cantidad sugerida: llenar hasta el máximo
                    $cantidad_sugerida = max(0, $stockMaximoRequerido - $totalDisponible);
                    $producto->cantidad_sugerida = $cantidad_sugerida;

                    $productosStockBajo->push($producto);
                }
            }
        }

        return Inertia::render('Reposiciones/Create', [
            'almacenes' => $almacenes,
            'productosStockBajo' => $productosStockBajo->values(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Reposicion::class);

        $validated = $request->validate([
            'almacen_origen_id' => 'required|exists:almacenes,id',
            'almacen_destino_id' => 'required|exists:almacenes,id',
            'observaciones' => 'nullable|string',
            'detalles' => 'required|array|min:1',
            'detalles.*.producto_id' => 'required|exists:productos,id',
            'detalles.*.cantidad_solicitada' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            $reposicion = Reposicion::create([
                'numero' => 'REP-' . time(),
                'empresa_id' => auth()->user()->empresa_id,
                'almacen_origen_id' => $validated['almacen_origen_id'],
                'almacen_destino_id' => $validated['almacen_destino_id'],
                'estado' => 'BORRADOR',
                'observaciones' => $validated['observaciones'] ?? null,
                'usuario_id' => auth()->id(),
            ]);

            foreach ($validated['detalles'] as $detalle) {
                ReposicionDetalle::create([
                    'reposicion_id' => $reposicion->id,
                    'producto_id' => $detalle['producto_id'],
                    'cantidad_solicitada' => $detalle['cantidad_solicitada'],
                ]);
            }

            DB::commit();
            return redirect('/inventario/reposiciones')->with('success', 'Reposición creada correctamente');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creando reposición: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al crear la reposición']);
        }
    }

    public function show(Reposicion $reposicion)
    {
        $this->authorize('view', $reposicion);

        $reposicion->load(['empresa', 'almacenOrigen', 'almacenDestino', 'usuario', 'detalles.producto']);

        return Inertia::render('Reposiciones/Show', [
            'reposicion' => $reposicion,
        ]);
    }

    public function edit(Reposicion $reposicion)
    {
        $this->authorize('update', $reposicion);

        if ($reposicion->estado !== 'BORRADOR') {
            return back()->withErrors(['error' => 'Solo se pueden editar reposiciones en estado BORRADOR']);
        }

        $empresa = auth()->user()->empresa;
        $almacenes = Almacen::where('empresa_id', $empresa->id)->get();

        $reposicion->load('detalles.producto');

        return Inertia::render('Reposiciones/Edit', [
            'reposicion' => $reposicion,
            'almacenes' => $almacenes,
        ]);
    }

    public function update(Request $request, Reposicion $reposicion)
    {
        $this->authorize('update', $reposicion);

        if ($reposicion->estado !== 'BORRADOR') {
            return back()->withErrors(['error' => 'Solo se pueden editar reposiciones en estado BORRADOR']);
        }

        $validated = $request->validate([
            'almacen_origen_id' => 'required|exists:almacenes,id',
            'almacen_destino_id' => 'required|exists:almacenes,id',
            'observaciones' => 'nullable|string',
            'detalles' => 'required|array|min:1',
            'detalles.*.producto_id' => 'required|exists:productos,id',
            'detalles.*.cantidad_solicitada' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            $reposicion->update([
                'almacen_origen_id' => $validated['almacen_origen_id'],
                'almacen_destino_id' => $validated['almacen_destino_id'],
                'observaciones' => $validated['observaciones'] ?? null,
            ]);

            $reposicion->detalles()->delete();
            foreach ($validated['detalles'] as $detalle) {
                ReposicionDetalle::create([
                    'reposicion_id' => $reposicion->id,
                    'producto_id' => $detalle['producto_id'],
                    'cantidad_solicitada' => $detalle['cantidad_solicitada'],
                ]);
            }

            DB::commit();
            return redirect()->route('reposiciones.show', $reposicion)->with('success', 'Reposición actualizada correctamente');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error actualizando reposición: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al actualizar la reposición']);
        }
    }

    public function destroy(Reposicion $reposicion)
    {
        $this->authorize('delete', $reposicion);

        if ($reposicion->estado !== 'BORRADOR') {
            return back()->withErrors(['error' => 'Solo se pueden eliminar reposiciones en estado BORRADOR']);
        }

        $reposicion->delete();
        return redirect()->route('reposiciones.index')->with('success', 'Reposición eliminada correctamente');
    }

    public function enviar(Reposicion $reposicion)
    {
        $this->authorize('update', $reposicion);

        if ($reposicion->estado !== 'BORRADOR') {
            return back()->withErrors(['error' => 'Solo se pueden enviar reposiciones en estado BORRADOR']);
        }

        $reposicion->update([
            'estado' => 'ENVIADO',
            'fecha_envio' => now(),
        ]);

        return back()->with('success', 'Reposición enviada correctamente');
    }

    public function recibir(Reposicion $reposicion)
    {
        $this->authorize('update', $reposicion);

        if ($reposicion->estado !== 'ENVIADO') {
            return back()->withErrors(['error' => 'Solo se pueden recibir reposiciones en estado ENVIADO']);
        }

        DB::beginTransaction();
        try {
            foreach ($reposicion->detalles as $detalle) {
                // Actualizar stock en almacén destino
                $stock = $detalle->producto->stock()
                    ->where('almacen_id', $reposicion->almacen_destino_id)
                    ->first();

                if ($stock) {
                    $stock->increment('cantidad_disponible', $detalle->cantidad_solicitada);
                }
            }

            $reposicion->update([
                'estado' => 'RECIBIDO',
                'fecha_recepcion' => now(),
            ]);

            DB::commit();
            return back()->with('success', 'Reposición recibida correctamente');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error recibiendo reposición: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al recibir la reposición']);
        }
    }
}
