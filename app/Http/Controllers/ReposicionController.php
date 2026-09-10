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

        return Inertia::render('reposiciones/Index', [
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
                ->with(['producto', 'producto.unidad', 'producto.conversiones' => fn($q) => $q->where('activo', true), 'sector'])
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

                    // Obtener sector desde stock_limites
                    $sector = $limitesProducto->first()->sector;
                    $producto->sector = $sector;

                    // Obtener stock máximo para calcular cantidad sugerida
                    $stockMaximoRequerido = $limitesProducto->max('stock_maximo');
                    $producto->stock_maximo_requerido = $stockMaximoRequerido;

                    // Cantidad sugerida: mínimo entre (lo que falta para llegar al máximo, lo disponible en principal)
                    $faltaParaLlenar = max(0, $stockMaximoRequerido - $totalDisponible);
                    $cantidad_sugerida = min($faltaParaLlenar, $stockPrincipal);
                    $producto->cantidad_sugerida = $cantidad_sugerida;

                    $productosStockBajo->push($producto);
                }
            }
        }

        return Inertia::render('reposiciones/Create', [
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
                'numero' => 'temp',
                'empresa_id' => auth()->user()->empresa_id,
                'almacen_origen_id' => $validated['almacen_origen_id'],
                'almacen_destino_id' => $validated['almacen_destino_id'],
                'estado' => 'RECIBIDO',
                'observaciones' => $validated['observaciones'] ?? null,
                'usuario_id' => auth()->id(),
                'fecha_envio' => now(),
                'fecha_recepcion' => now(),
            ]);

            // Actualizar número con el ID
            $reposicion->update(['numero' => 'REP-' . $reposicion->id]);

            foreach ($validated['detalles'] as $detalle) {
                ReposicionDetalle::create([
                    'reposicion_id' => $reposicion->id,
                    'producto_id' => $detalle['producto_id'],
                    'cantidad_solicitada' => $detalle['cantidad_solicitada'],
                ]);
            }

            // ✅ PROCESAR AUTOMÁTICAMENTE: Descontar origen, incrementar destino, registrar movimientos
            foreach ($reposicion->detalles as $detalle) {
                $cantidad = $detalle->cantidad_solicitada;
                $productoId = $detalle->producto_id;
                $almacenOrigenId = $reposicion->almacen_origen_id;
                $almacenDestinoId = $reposicion->almacen_destino_id;

                // === SALIDA DEL ALMACÉN ORIGEN ===
                $stockOrigen = DB::table('stock_productos')
                    ->where('producto_id', $productoId)
                    ->where('almacen_id', $almacenOrigenId)
                    ->first();

                if ($stockOrigen && $stockOrigen->cantidad_disponible >= $cantidad) {
                    $totalesAntesDeSalida = DB::table('stock_productos')
                        ->where('producto_id', $productoId)
                        ->where('almacen_id', $almacenOrigenId)
                        ->selectRaw('SUM(cantidad_disponible) as total_disponible, SUM(cantidad_reservada) as total_reservada')
                        ->first();

                    $cantidadAnteriorOrigen = [
                        'total' => $stockOrigen->cantidad,
                        'disponible' => $stockOrigen->cantidad_disponible,
                        'reservada' => $stockOrigen->cantidad_reservada,
                        'total_disponible' => $totalesAntesDeSalida->total_disponible ?? 0,
                        'total_reservada' => $totalesAntesDeSalida->total_reservada ?? 0,
                    ];

                    DB::table('stock_productos')
                        ->where('id', $stockOrigen->id)
                        ->update([
                            'cantidad_disponible' => DB::raw('cantidad_disponible - ' . $cantidad),
                            'cantidad' => DB::raw('cantidad - ' . $cantidad),
                        ]);

                    $stockOrigenDespues = DB::table('stock_productos')->where('id', $stockOrigen->id)->first();
                    $totalesDespuesDeSalida = DB::table('stock_productos')
                        ->where('producto_id', $productoId)
                        ->where('almacen_id', $almacenOrigenId)
                        ->selectRaw('SUM(cantidad_disponible) as total_disponible, SUM(cantidad_reservada) as total_reservada')
                        ->first();

                    DB::table('movimientos_inventario')->insert([
                        'stock_producto_id' => $stockOrigen->id,
                        'cantidad_total_anterior' => $cantidadAnteriorOrigen['total'],
                        'cantidad_total_posterior' => $stockOrigenDespues->cantidad,
                        'cantidad_disponible_anterior' => $cantidadAnteriorOrigen['disponible'],
                        'cantidad_disponible_posterior' => $stockOrigenDespues->cantidad_disponible,
                        'cantidad_reservada_anterior' => $cantidadAnteriorOrigen['reservada'],
                        'cantidad_reservada_posterior' => $stockOrigenDespues->cantidad_reservada,
                        'disponible_total_anterior' => $cantidadAnteriorOrigen['total_disponible'],
                        'disponible_total_posterior' => $totalesDespuesDeSalida->total_disponible ?? 0,
                        'reservada_total_anterior' => $cantidadAnteriorOrigen['total_reservada'],
                        'reservada_total_posterior' => $totalesDespuesDeSalida->total_reservada ?? 0,
                        'cantidad' => -$cantidad,
                        'tipo' => 'SALIDA_REPOSICION',
                        'observacion' => 'Reposición a ' . $reposicion->almacenDestino->nombre,
                        'numero_documento' => $reposicion->numero,
                        'referencia_tipo' => 'REPOSICION',
                        'referencia_id' => $reposicion->id,
                        'user_id' => auth()->id(),
                        'fecha' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // === ENTRADA AL ALMACÉN DESTINO ===
                    $stockDestino = DB::table('stock_productos')
                        ->where('producto_id', $productoId)
                        ->where('almacen_id', $almacenDestinoId)
                        ->first();

                    if ($stockDestino) {
                        $totalesAntesDeEntrada = DB::table('stock_productos')
                            ->where('producto_id', $productoId)
                            ->where('almacen_id', $almacenDestinoId)
                            ->selectRaw('SUM(cantidad_disponible) as total_disponible, SUM(cantidad_reservada) as total_reservada')
                            ->first();

                        $cantidadAnteriorDestino = [
                            'total' => $stockDestino->cantidad,
                            'disponible' => $stockDestino->cantidad_disponible,
                            'reservada' => $stockDestino->cantidad_reservada,
                            'total_disponible' => $totalesAntesDeEntrada->total_disponible ?? 0,
                            'total_reservada' => $totalesAntesDeEntrada->total_reservada ?? 0,
                        ];

                        DB::table('stock_productos')
                            ->where('id', $stockDestino->id)
                            ->update([
                                'cantidad_disponible' => DB::raw('cantidad_disponible + ' . $cantidad),
                                'cantidad' => DB::raw('cantidad + ' . $cantidad),
                            ]);

                        $stockDestinoDespues = DB::table('stock_productos')->where('id', $stockDestino->id)->first();
                        $totalesDespuesDeEntrada = DB::table('stock_productos')
                            ->where('producto_id', $productoId)
                            ->where('almacen_id', $almacenDestinoId)
                            ->selectRaw('SUM(cantidad_disponible) as total_disponible, SUM(cantidad_reservada) as total_reservada')
                            ->first();

                        DB::table('movimientos_inventario')->insert([
                            'stock_producto_id' => $stockDestino->id,
                            'cantidad_total_anterior' => $cantidadAnteriorDestino['total'],
                            'cantidad_total_posterior' => $stockDestinoDespues->cantidad,
                            'cantidad_disponible_anterior' => $cantidadAnteriorDestino['disponible'],
                            'cantidad_disponible_posterior' => $stockDestinoDespues->cantidad_disponible,
                            'cantidad_reservada_anterior' => $cantidadAnteriorDestino['reservada'],
                            'cantidad_reservada_posterior' => $stockDestinoDespues->cantidad_reservada,
                            'disponible_total_anterior' => $cantidadAnteriorDestino['total_disponible'],
                            'disponible_total_posterior' => $totalesDespuesDeEntrada->total_disponible ?? 0,
                            'reservada_total_anterior' => $cantidadAnteriorDestino['total_reservada'],
                            'reservada_total_posterior' => $totalesDespuesDeEntrada->total_reservada ?? 0,
                            'cantidad' => $cantidad,
                            'tipo' => 'ENTRADA_REPOSICION',
                            'observacion' => 'Reposición desde ' . $reposicion->almacenOrigen->nombre,
                            'numero_documento' => $reposicion->numero,
                            'referencia_tipo' => 'REPOSICION',
                            'referencia_id' => $reposicion->id,
                            'user_id' => auth()->id(),
                            'fecha' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                } else {
                    throw new \Exception("Stock insuficiente en almacén origen para producto ID {$productoId}");
                }
            }

            DB::commit();
            return redirect('/inventario/reposiciones')->with('success', 'Reposición procesada correctamente');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creando reposición: ' . $e->getMessage());
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function show(Reposicion $reposicion)
    {
        $this->authorize('view', $reposicion);

        $reposicion->load(['empresa', 'almacenOrigen', 'almacenDestino', 'usuario', 'detalles.producto']);

        return Inertia::render('reposiciones/Show', [
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

        return Inertia::render('reposiciones/Edit', [
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
                $cantidad = $detalle->cantidad_solicitada;
                $productoId = $detalle->producto_id;
                $almacenOrigenId = $reposicion->almacen_origen_id;
                $almacenDestinoId = $reposicion->almacen_destino_id;

                // === SALIDA DEL ALMACÉN ORIGEN ===
                $stockOrigen = DB::table('stock_productos')
                    ->where('producto_id', $productoId)
                    ->where('almacen_id', $almacenOrigenId)
                    ->first();

                if ($stockOrigen && $stockOrigen->cantidad_disponible >= $cantidad) {
                    // Obtener TOTALES de disponible y reservada de TODOS los lotes ANTES
                    $totalesAntesDESalida = DB::table('stock_productos')
                        ->where('producto_id', $productoId)
                        ->where('almacen_id', $almacenOrigenId)
                        ->selectRaw('SUM(cantidad_disponible) as total_disponible, SUM(cantidad_reservada) as total_reservada')
                        ->first();

                    $cantidadAnteriorOrigen = [
                        'total' => $stockOrigen->cantidad,
                        'disponible' => $stockOrigen->cantidad_disponible,
                        'reservada' => $stockOrigen->cantidad_reservada,
                        'total_disponible' => $totalesAntesDeSalida->total_disponible ?? 0,
                        'total_reservada' => $totalesAntesDeSalida->total_reservada ?? 0,
                    ];

                    // Disminuir stock en almacén origen
                    DB::table('stock_productos')
                        ->where('id', $stockOrigen->id)
                        ->update([
                            'cantidad_disponible' => DB::raw('cantidad_disponible - ' . $cantidad),
                            'cantidad' => DB::raw('cantidad - ' . $cantidad),
                        ]);

                    // Registrar movimiento de SALIDA
                    $stockOrigenDespues = DB::table('stock_productos')
                        ->where('id', $stockOrigen->id)
                        ->first();

                    // Obtener TOTALES DESPUÉS
                    $totalesDespuesDeSalida = DB::table('stock_productos')
                        ->where('producto_id', $productoId)
                        ->where('almacen_id', $almacenOrigenId)
                        ->selectRaw('SUM(cantidad_disponible) as total_disponible, SUM(cantidad_reservada) as total_reservada')
                        ->first();

                    DB::table('movimientos_inventario')->insert([
                        'stock_producto_id' => $stockOrigen->id,
                        'cantidad_total_anterior' => $cantidadAnteriorOrigen['total'],
                        'cantidad_total_posterior' => $stockOrigenDespues->cantidad,
                        'cantidad_disponible_anterior' => $cantidadAnteriorOrigen['disponible'],
                        'cantidad_disponible_posterior' => $stockOrigenDespues->cantidad_disponible,
                        'cantidad_reservada_anterior' => $cantidadAnteriorOrigen['reservada'],
                        'cantidad_reservada_posterior' => $stockOrigenDespues->cantidad_reservada,
                        'disponible_total_anterior' => $cantidadAnteriorOrigen['total_disponible'],
                        'disponible_total_posterior' => $totalesDespuesDeSalida->total_disponible ?? 0,
                        'reservada_total_anterior' => $cantidadAnteriorOrigen['total_reservada'],
                        'reservada_total_posterior' => $totalesDespuesDeSalida->total_reservada ?? 0,
                        'cantidad' => -$cantidad,
                        'tipo' => 'SALIDA_REPOSICION',
                        'observacion' => 'Reposición a ' . $reposicion->almacenDestino->nombre,
                        'numero_documento' => $reposicion->numero,
                        'referencia_tipo' => 'REPOSICION',
                        'referencia_id' => $reposicion->id,
                        'user_id' => auth()->id(),
                        'fecha' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // === ENTRADA AL ALMACÉN DESTINO ===
                    $stockDestino = DB::table('stock_productos')
                        ->where('producto_id', $productoId)
                        ->where('almacen_id', $almacenDestinoId)
                        ->first();

                    if ($stockDestino) {
                        // Obtener TOTALES de disponible y reservada de TODOS los lotes ANTES
                        $totalesAntesDeEntrada = DB::table('stock_productos')
                            ->where('producto_id', $productoId)
                            ->where('almacen_id', $almacenDestinoId)
                            ->selectRaw('SUM(cantidad_disponible) as total_disponible, SUM(cantidad_reservada) as total_reservada')
                            ->first();

                        $cantidadAnteriorDestino = [
                            'total' => $stockDestino->cantidad,
                            'disponible' => $stockDestino->cantidad_disponible,
                            'reservada' => $stockDestino->cantidad_reservada,
                            'total_disponible' => $totalesAntesDeEntrada->total_disponible ?? 0,
                            'total_reservada' => $totalesAntesDeEntrada->total_reservada ?? 0,
                        ];

                        // Incrementar stock en almacén destino
                        DB::table('stock_productos')
                            ->where('id', $stockDestino->id)
                            ->update([
                                'cantidad_disponible' => DB::raw('cantidad_disponible + ' . $cantidad),
                                'cantidad' => DB::raw('cantidad + ' . $cantidad),
                            ]);

                        // Registrar movimiento de ENTRADA
                        $stockDestinoDespues = DB::table('stock_productos')
                            ->where('id', $stockDestino->id)
                            ->first();

                        // Obtener TOTALES DESPUÉS
                        $totalesDespuesDeEntrada = DB::table('stock_productos')
                            ->where('producto_id', $productoId)
                            ->where('almacen_id', $almacenDestinoId)
                            ->selectRaw('SUM(cantidad_disponible) as total_disponible, SUM(cantidad_reservada) as total_reservada')
                            ->first();

                        DB::table('movimientos_inventario')->insert([
                            'stock_producto_id' => $stockDestino->id,
                            'cantidad_total_anterior' => $cantidadAnteriorDestino['total'],
                            'cantidad_total_posterior' => $stockDestinoDespues->cantidad,
                            'cantidad_disponible_anterior' => $cantidadAnteriorDestino['disponible'],
                            'cantidad_disponible_posterior' => $stockDestinoDespues->cantidad_disponible,
                            'cantidad_reservada_anterior' => $cantidadAnteriorDestino['reservada'],
                            'cantidad_reservada_posterior' => $stockDestinoDespues->cantidad_reservada,
                            'disponible_total_anterior' => $cantidadAnteriorDestino['total_disponible'],
                            'disponible_total_posterior' => $totalesDespuesDeEntrada->total_disponible ?? 0,
                            'reservada_total_anterior' => $cantidadAnteriorDestino['total_reservada'],
                            'reservada_total_posterior' => $totalesDespuesDeEntrada->total_reservada ?? 0,
                            'cantidad' => $cantidad,
                            'tipo' => 'ENTRADA_REPOSICION',
                            'observacion' => 'Reposición desde ' . $reposicion->almacenOrigen->nombre,
                            'numero_documento' => $reposicion->numero,
                            'referencia_tipo' => 'REPOSICION',
                            'referencia_id' => $reposicion->id,
                            'user_id' => auth()->id(),
                            'fecha' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                } else {
                    throw new \Exception("Stock insuficiente en almacén origen para producto ID {$productoId}");
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
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
