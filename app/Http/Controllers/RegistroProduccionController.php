<?php

namespace App\Http\Controllers;

use App\Models\ProduccionMasiva;
use App\Models\ProduccionMasivaDetalle;
use Illuminate\Http\Request;

class RegistroProduccionController extends Controller
{
    /**
     * Pantalla principal: lista de producciones masivas
     */
    public function index()
    {
        return inertia('produccion/registro-produccion');
    }

    /**
     * Obtener producciones masivas (cabeceras)
     */
    public function getProducciones(Request $request)
    {
        $query = ProduccionMasiva::with(['usuario', 'detalles.producto'])
            ->orderByDesc('created_at');

        // Filtro por fecha si se proporciona
        if ($request->filled('fecha')) {
            $query->whereDate('fecha_produccion', $request->input('fecha'));
        }

        // Filtro por estado
        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        $producciones = $query->paginate(20);

        return response()->json([
            'data' => $producciones->map(function ($produccion) {
                return [
                    'id' => $produccion->id,
                    'fecha_produccion' => $produccion->fecha_produccion->format('Y-m-d'),
                    'registrado_por' => $produccion->usuario?->name ?? 'Sistema',
                    'estado' => $produccion->estado,
                    'total_detalles' => $produccion->detalles->count(),
                    'total_cantidad' => $produccion->detalles->sum('cantidad_producida'),
                    'created_at' => $produccion->created_at->format('Y-m-d H:i:s'),
                    'detalles' => $produccion->detalles->map(function ($detalle) {
                        return [
                            'id' => $detalle->id,
                            'producto_id' => $detalle->producto_id,
                            'producto_nombre' => $detalle->producto->nombre,
                            'cantidad_producida' => (float)$detalle->cantidad_producida,
                            'observaciones' => $detalle->observaciones,
                        ];
                    })->toArray(),
                ];
            })->toArray(),
            'meta' => [
                'current_page' => $producciones->currentPage(),
                'last_page' => $producciones->lastPage(),
                'total' => $producciones->total(),
                'per_page' => $producciones->perPage(),
            ],
        ]);
    }

    /**
     * Obtener detalle de una producción masiva específica
     */
    public function show($id)
    {
        $produccion = ProduccionMasiva::with(['usuario', 'detalles.producto'])
            ->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $produccion->id,
                'fecha_produccion' => $produccion->fecha_produccion->format('Y-m-d'),
                'registrado_por' => $produccion->usuario?->name ?? 'Sistema',
                'registrado_por_id' => $produccion->registrado_por,
                'estado' => $produccion->estado,
                'observaciones_generales' => $produccion->observaciones_generales,
                'created_at' => $produccion->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $produccion->updated_at->format('Y-m-d H:i:s'),
                'total_detalles' => $produccion->detalles->count(),
                'total_cantidad' => $produccion->detalles->sum('cantidad_producida'),
                'detalles' => $produccion->detalles->map(function ($detalle) {
                    return [
                        'id' => $detalle->id,
                        'producto_id' => $detalle->producto_id,
                        'producto_nombre' => $detalle->producto->nombre,
                        'cantidad_producida' => (float)$detalle->cantidad_producida,
                        'observaciones' => $detalle->observaciones,
                        'created_at' => $detalle->created_at->format('Y-m-d H:i:s'),
                    ];
                })->toArray(),
            ]
        ]);
    }

    /**
     * Cambiar estado de una producción masiva
     */
    public function cambiarEstado(Request $request, $id)
    {
        $validated = $request->validate([
            'estado' => 'required|in:en_proceso,completada,cancelada',
        ]);

        $produccion = ProduccionMasiva::findOrFail($id);
        $produccion->update(['estado' => $validated['estado']]);

        return response()->json([
            'message' => 'Estado actualizado exitosamente',
            'data' => [
                'id' => $produccion->id,
                'estado' => $produccion->estado,
            ]
        ]);
    }

    /**
     * Eliminar una producción masiva (revierte todos los movimientos de stock)
     */
    public function destroy($id)
    {
        $produccion = ProduccionMasiva::with('detalles')->findOrFail($id);

        \Log::info("🗑️ Iniciando eliminación de producción masiva", [
            'produccion_masiva_id' => $id,
            'fecha' => $produccion->fecha_produccion,
            'total_detalles' => $produccion->detalles->count(),
        ]);

        try {
            \DB::beginTransaction();

            $movimientoService = app(\App\Services\Stock\MovimientoStockService::class);
            $totalMovimientosRevertidos = 0;

            // 1️⃣ Para CADA detalle, encontrar su producción individual y revertir movimientos
            foreach ($produccion->detalles as $detalle) {
                \Log::info("📦 Procesando detalle", [
                    'detalle_id' => $detalle->id,
                    'producto_id' => $detalle->producto_id,
                    'cantidad' => $detalle->cantidad_producida,
                ]);

                // Encontrar la producción individual de este detalle
                // Criterio: mismo producto, misma fecha, mismo usuario
                $produccionIndividual = \App\Models\Produccion::where('producto_id', $detalle->producto_id)
                    ->where('fecha_produccion', $produccion->fecha_produccion)
                    ->where('registrado_por', $produccion->registrado_por)
                    ->where('cantidad_producida', $detalle->cantidad_producida)
                    ->orderByDesc('id') // Si hay duplicados, tomar la más reciente
                    ->first();

                if (!$produccionIndividual) {
                    \Log::warning("⚠️ No se encontró producción individual para detalle", [
                        'detalle_id' => $detalle->id,
                        'producto_id' => $detalle->producto_id,
                    ]);
                    continue;
                }

                \Log::info("✅ Producción individual encontrada", [
                    'produccion_id' => $produccionIndividual->id,
                ]);

                // 2️⃣ Obtener movimientos de esta producción individual
                $movimientos = \App\Models\MovimientoInventario::where('referencia_tipo', 'produccion')
                    ->where('referencia_id', $produccionIndividual->id)
                    ->get();

                \Log::info("📊 Movimientos encontrados", [
                    'produccion_id' => $produccionIndividual->id,
                    'total_movimientos' => $movimientos->count(),
                ]);

                // 3️⃣ Revertir cada movimiento
                foreach ($movimientos as $movimiento) {
                    $tipoInverso = $this->obtenerTipoInverso($movimiento->tipo);

                    if ($tipoInverso) {
                        \Log::info("🔄 Revirtiendo movimiento", [
                            'movimiento_id' => $movimiento->id,
                            'tipo_original' => $movimiento->tipo,
                            'tipo_inverso' => $tipoInverso,
                            'cantidad' => abs($movimiento->cantidad),
                            'stock_id' => $movimiento->stock_producto_id,
                        ]);

                        $movimientoService->registrarMovimientoYActualizar(
                            $movimiento->stock_producto_id,
                            abs($movimiento->cantidad),
                            $tipoInverso,
                            'produccion_masiva_eliminada',
                            $produccion->id
                        );

                        $totalMovimientosRevertidos++;
                    }
                }
            }

            // 4️⃣ Eliminar la producción masiva
            $produccion->delete();

            \DB::commit();

            \Log::info("✅ Producción masiva eliminada exitosamente", [
                'produccion_masiva_id' => $id,
                'total_movimientos_revertidos' => $totalMovimientosRevertidos,
            ]);

            return response()->json([
                'message' => "Producción masiva eliminada y $totalMovimientosRevertidos movimientos revertidos"
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('❌ Error al eliminar producción masiva', [
                'produccion_masiva_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Error al eliminar producción masiva: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * ✅ NUEVO (2026-08-22): Obtener el tipo de movimiento inverso
     */
    private function obtenerTipoInverso(string $tipo): ?string
    {
        return match ($tipo) {
            \App\Models\MovimientoInventario::TIPO_SALIDA_PRODUCCION => \App\Models\MovimientoInventario::TIPO_ENTRADA_AJUSTE,
            \App\Models\MovimientoInventario::TIPO_ENTRADA_AJUSTE => \App\Models\MovimientoInventario::TIPO_SALIDA_AJUSTE,
            default => null,
        };
    }
}
