<?php

namespace App\Http\Controllers;

use App\Models\Reposicion;
use App\Models\ReposicionDetalle;
use App\Models\Almacen;
use App\Models\Producto;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReposicionController extends Controller
{
    public function index()
    {
        $this->authorize('view', Reposicion::class);

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

        // Obtener productos con stock bajo
        $productosStockBajo = Producto::whereHas('stock', function ($query) use ($empresa) {
            $query->where('almacen_id', auth()->user()->almacen_id ?? $empresa->almacenes()->first()->id)
                  ->whereColumn('cantidad_disponible', '<', 'productos.stock_minimo');
        })
        ->with(['unidad', 'stock' => function ($query) {
            $query->where('almacen_id', auth()->user()->almacen_id ?? auth()->user()->empresa->almacenes()->first()->id);
        }])
        ->where('empresa_id', $empresa->id)
        ->get();

        return Inertia::render('Reposiciones/Create', [
            'almacenes' => $almacenes,
            'productosStockBajo' => $productosStockBajo,
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
            return redirect()->route('reposiciones.show', $reposicion)->with('success', 'Reposición creada correctamente');
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
