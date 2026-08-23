<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\Produccion;
use App\Models\ProduccionMasiva;
use App\Models\ProduccionMasivaDetalle;
use App\Models\ProduccionIngrediente;
use App\Models\Receta;
use App\Models\StockProducto;
use App\Models\MovimientoInventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProduccionMasivaController extends Controller
{
    /**
     * Obtener el factor de conversión entre dos unidades de medida
     * Retorna cuántas unidades_destino equivalen a 1 unidad_origen
     */
    private function obtenerFactorConversion($unidad_origen_id, $unidad_destino_id)
    {
        if ($unidad_origen_id == $unidad_destino_id) {
            return 1; // Misma unidad, no hay conversión
        }

        // Obtener los códigos de las unidades
        $unidadOrigen = \App\Models\UnidadMedida::find($unidad_origen_id);
        $unidadDestino = \App\Models\UnidadMedida::find($unidad_destino_id);

        if (!$unidadOrigen || !$unidadDestino) {
            \Log::warning("Unidad no encontrada: origen=$unidad_origen_id, destino=$unidad_destino_id");
            return 1;
        }

        $codigoOrigen = strtolower($unidadOrigen->codigo);
        $codigoDestino = strtolower($unidadDestino->codigo);

        // Tabla de conversiones comunes
        $conversiones = [
            'kg|g' => 1000,     // 1 KG = 1000 g
            'kg|mg' => 1000000, // 1 KG = 1000000 mg
            'lt|ml' => 1000,    // 1 LT = 1000 ml
            'lt|l' => 1,        // 1 LT = 1 L (alias)
            't|kg' => 1000,     // 1 tonelada = 1000 kg
            'kg|kg' => 1,       // 1 kg = 1 kg
            'g|g' => 1,         // 1 g = 1 g
            'ml|ml' => 1,       // 1 ml = 1 ml
        ];

        // Buscar conversión directa
        $clave = "{$codigoOrigen}|{$codigoDestino}";
        if (isset($conversiones[$clave])) {
            return (float)$conversiones[$clave];
        }

        // Buscar conversión inversa
        $claveInversa = "{$codigoDestino}|{$codigoOrigen}";
        if (isset($conversiones[$claveInversa])) {
            return 1 / (float)$conversiones[$claveInversa];
        }

        // Si no hay conversión conocida, retornar 1
        \Log::warning("No hay conversión conocida entre {$codigoOrigen} y {$codigoDestino}", [
            'unidad_origen_id' => $unidad_origen_id,
            'unidad_destino_id' => $unidad_destino_id,
        ]);
        return 1;
    }

    public function index()
    {
        return inertia('produccion-masiva');
    }

    /**
     * Obtener productos disponibles para producción con sus recetas
     */
    public function productosDisponibles()
    {
        $productos = Producto::whereHas('receta', function ($query) {
            $query->where('activa', true);
        })
            ->with(['receta.ingredientes.ingrediente', 'receta.ingredientes.unidadMedida'])
            ->get()
            ->map(function ($producto) {
                \Log::info("Cargando producto para producción masiva: {$producto->nombre}", [
                    'producto_id' => $producto->id,
                    'tiene_receta' => (bool)$producto->receta,
                    'ingredientes' => $producto->receta?->ingredientes->count() ?? 0,
                ]);

                return [
                    'id' => $producto->id,
                    'nombre' => $producto->nombre,
                    'receta' => $producto->receta ? [
                        'id' => $producto->receta->id,
                        'ingredientes' => $producto->receta->ingredientes->map(function($ing) {
                            $unidad = $ing->unidadMedida ? $ing->unidadMedida->codigo : 'und';

                            \Log::info("Ingrediente de receta", [
                                'receta_ingrediente_id' => $ing->id,
                                'producto_id' => $ing->producto_id,
                                'nombre' => $ing->ingrediente->nombre,
                                'cantidad_requerida' => (float)$ing->cantidad_requerida,
                                'unidad_medida_id' => $ing->unidad_medida_id,
                                'unidad_nombre' => $unidad,
                            ]);

                            return [
                                'id' => $ing->id,
                                'producto_id' => $ing->producto_id,
                                'nombre' => $ing->ingrediente->nombre,
                                'cantidad_requerida' => (float)$ing->cantidad_requerida,
                                'unidad_medida_id' => $ing->unidad_medida_id,
                                'unidad_nombre' => $unidad,
                            ];
                        })
                    ] : null,
                ];
            });

        \Log::info("Productos disponibles para producción masiva cargados: " . $productos->count());
        return response()->json(['data' => $productos]);
    }

    /**
     * Calcular capacidad máxima de producción para un producto
     */
    public function calcularCapacidad(Request $request)
    {
        $productoId = $request->input('producto_id');
        $cantidadDeseada = $request->input('cantidad_deseada', 1);

        $producto = Producto::with('receta.ingredientes.ingrediente')->find($productoId);

        if (!$producto || !$producto->receta) {
            return response()->json([
                'data' => [
                    'capacidad_maxima' => 0,
                    'ingredientes_limitantes' => [],
                    'mensaje' => 'No hay receta activa para este producto',
                ]
            ]);
        }

        $ingredientes_limitantes = [];
        $capacidad_minima = PHP_INT_MAX;

        foreach ($producto->receta->ingredientes as $ing) {
            $stock = StockProducto::where('producto_id', $ing->producto_id)
                ->where('cantidad', '>', 0)
                ->sum('cantidad_disponible');

            if ($stock === null) {
                $stock = 0;
            }

            $stock = (float) $stock;
            $cantidad_req = (float) $ing->cantidad_requerida;

            // Obtener unidades de medida
            $producto_ingrediente = $ing->ingrediente;
            $unidad_stock_id = $producto_ingrediente->unidad_medida_id;
            $unidad_receta_id = $ing->unidad_medida_id;

            // Convertir stock a la misma unidad de la receta si es necesario
            $factor_conversion = $this->obtenerFactorConversion($unidad_stock_id, $unidad_receta_id);
            $stock_convertido = $stock * $factor_conversion;

            \Log::info("Calculando capacidad para ingrediente: {$ing->ingrediente->nombre}", [
                'producto_id' => $ing->producto_id,
                'stock_original' => $stock,
                'unidad_stock' => $producto_ingrediente->unidadMedida->codigo ?? 'und',
                'unidad_stock_id' => $unidad_stock_id,
                'factor_conversion' => $factor_conversion,
                'stock_convertido' => $stock_convertido,
                'cantidad_requerida_receta' => $cantidad_req,
                'unidad_receta' => $ing->unidadMedida->codigo ?? 'und',
                'unidad_receta_id' => $unidad_receta_id,
            ]);

            // Calcular cuántos productos se pueden hacer con este ingrediente
            $capacidad_este_ing = $cantidad_req > 0 ? floor($stock_convertido / $cantidad_req * 100) / 100 : 0;

            \Log::info("Capacidad calculada", [
                'ingrediente' => $ing->ingrediente->nombre,
                'capacidad' => $capacidad_este_ing,
                'operacion' => "{$stock_convertido} / {$cantidad_req} = {$capacidad_este_ing}",
            ]);

            $ingredientes_limitantes[] = [
                'id' => $ing->id,
                'nombre' => $ing->ingrediente->nombre,
                'cantidad_requerida' => $cantidad_req,
                'unidad' => $ing->unidadMedida->codigo ?? 'und',
                'stock_disponible' => $stock_convertido,
                'capacidad_este_ingrediente' => $capacidad_este_ing,
                'es_limitante' => false,
            ];

            $capacidad_minima = min($capacidad_minima, $capacidad_este_ing);
        }

        // Marcar el ingrediente limitante
        foreach ($ingredientes_limitantes as &$ing) {
            if (abs((float)$ing['capacidad_este_ingrediente'] - $capacidad_minima) < 0.01) {
                $ing['es_limitante'] = true;
            }
        }

        $puede_producir = $capacidad_minima < PHP_INT_MAX ? max(0, $capacidad_minima) : 0;
        $advertencia = $puede_producir < $cantidadDeseada
            ? "Solo se puede producir {$puede_producir} unidades con el stock disponible"
            : null;

        return response()->json([
            'data' => [
                'capacidad_maxima' => (float) $puede_producir,
                'cantidad_deseada' => (float) $cantidadDeseada,
                'puede_producir' => (float) $puede_producir >= $cantidadDeseada,
                'advertencia' => $advertencia,
                'ingredientes' => $ingredientes_limitantes,
            ]
        ]);
    }

    /**
     * Guardar producción masiva (cabecera-detalles)
     */
    public function guardarProduccionMasiva(Request $request)
    {
        $validated = $request->validate([
            'fecha_produccion' => 'required|date',
            'detalles' => 'required|array|min:1',
            'detalles.*.producto_id' => 'required|exists:productos,id',
            'detalles.*.cantidad_producida' => 'required|numeric|min:0',
            'detalles.*.observaciones' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // 1️⃣ CREAR CABECERA (ProduccionMasiva)
            $produccionMasiva = ProduccionMasiva::create([
                'fecha_produccion' => $validated['fecha_produccion'],
                'registrado_por' => auth()->id(),
                'estado' => 'completada',
            ]);

            \Log::info("Cabecera de producción masiva creada", [
                'produccion_masiva_id' => $produccionMasiva->id,
                'fecha' => $validated['fecha_produccion'],
            ]);

            $detallesCreados = [];

            // 2️⃣ PROCESAR DETALLES
            foreach ($validated['detalles'] as $detalle) {
                // Saltar productos con cantidad 0
                if ((float)$detalle['cantidad_producida'] === 0.0) {
                    \Log::info("Saltando producto con cantidad 0", [
                        'producto_id' => $detalle['producto_id'],
                    ]);
                    continue;
                }

                $producto = Producto::with('receta.ingredientes')->find($detalle['producto_id']);

                if (!$producto || !$producto->receta) {
                    throw new \Exception("El producto {$producto->nombre} no tiene receta activa");
                }

                \Log::info("Registrando detalle de producción", [
                    'produccion_masiva_id' => $produccionMasiva->id,
                    'producto_id' => $producto->id,
                    'producto_nombre' => $producto->nombre,
                    'cantidad_producida' => $detalle['cantidad_producida'],
                ]);

                // 2️⃣A CREAR DETALLE (ProduccionMasivaDetalle)
                $detalle_produccion = ProduccionMasivaDetalle::create([
                    'produccion_masiva_id' => $produccionMasiva->id,
                    'producto_id' => $producto->id,
                    'cantidad_producida' => $detalle['cantidad_producida'],
                    'observaciones' => $detalle['observaciones'] ?? '',
                ]);

                // 2️⃣B TAMBIÉN CREAR REGISTRO EN Produccion (para compatibilidad y auditoría)
                $produccion = Produccion::create([
                    'producto_id' => $producto->id,
                    'fecha_produccion' => $validated['fecha_produccion'],
                    'cantidad_producida' => $detalle['cantidad_producida'],
                    'observaciones' => $detalle['observaciones'] ?? '',
                    'estado' => 'completada',
                    'registrado_por' => auth()->id(),
                ]);

                // 3️⃣ INCREMENTAR STOCK DEL PRODUCTO PRODUCIDO
                $stockProducto = StockProducto::where('producto_id', $producto->id)
                    ->first();

                if ($stockProducto) {
                    app(\App\Services\Stock\MovimientoStockService::class)
                        ->registrarMovimientoYActualizar(
                            $stockProducto->id,
                            (float)$detalle['cantidad_producida'],
                            MovimientoInventario::TIPO_ENTRADA_AJUSTE,
                            'produccion',
                            $produccion->id
                        );

                    \Log::info("Stock del producto incrementado", [
                        'producto_id' => $producto->id,
                        'producto_nombre' => $producto->nombre,
                        'cantidad_incrementada' => $detalle['cantidad_producida'],
                    ]);
                }

                // 4️⃣ REGISTRAR INGREDIENTES UTILIZADOS Y DESCONTAR STOCK
                foreach ($producto->receta->ingredientes as $ing) {
                    $cantidad_usada = (float)$ing->cantidad_requerida * (float)$detalle['cantidad_producida'];

                    ProduccionIngrediente::create([
                        'produccion_id' => $produccion->id,
                        'receta_ingrediente_id' => $ing->id,
                        'cantidad_usada' => $cantidad_usada,
                    ]);

                    // Obtener stock del ingrediente y descontar
                    $stockIngrediente = StockProducto::where('producto_id', $ing->producto_id)
                        ->where('cantidad', '>', 0)
                        ->first();

                    if ($stockIngrediente) {
                        // Convertir la cantidad a la unidad del stock
                        $unidad_receta_id = $ing->unidad_medida_id;
                        $unidad_stock_id = $stockIngrediente->producto->unidad_medida_id;
                        $factor_conversion = $this->obtenerFactorConversion($unidad_receta_id, $unidad_stock_id);
                        $cantidad_en_unidad_stock = $cantidad_usada * $factor_conversion;

                        \Log::info("Descontando del stock", [
                            'producto_id' => $ing->producto_id,
                            'cantidad_usada_original' => $cantidad_usada,
                            'unidad_receta_id' => $unidad_receta_id,
                            'unidad_stock_id' => $unidad_stock_id,
                            'factor_conversion' => $factor_conversion,
                            'cantidad_en_unidad_stock' => $cantidad_en_unidad_stock,
                        ]);

                        app(\App\Services\Stock\MovimientoStockService::class)
                            ->registrarMovimientoYActualizar(
                                $stockIngrediente->id,
                                $cantidad_en_unidad_stock,
                                MovimientoInventario::TIPO_SALIDA_PRODUCCION,
                                'produccion',
                                $produccion->id
                            );
                    }
                }

                $detallesCreados[] = [
                    'detalle_id' => $detalle_produccion->id,
                    'produccion_id' => $produccion->id,
                ];
            }

            DB::commit();

            if (empty($detallesCreados)) {
                // Eliminar cabecera si no hay detalles
                $produccionMasiva->delete();

                return response()->json([
                    'message' => 'No se registró ninguna producción (todos los productos tienen cantidad 0)',
                    'produccion_masiva_id' => null,
                    'detalles' => [],
                    'producciones_ids' => [], // Para compatibilidad con frontend anterior
                ], 200);
            }

            return response()->json([
                'message' => 'Producción masiva registrada exitosamente',
                'produccion_masiva_id' => $produccionMasiva->id,
                'detalles' => $detallesCreados,
                'producciones_ids' => array_map(fn($d) => $d['detalle_id'], $detallesCreados), // Para compatibilidad
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error al registrar producción masiva', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Error al registrar producción masiva: ' . $e->getMessage(),
            ], 422);
        }
    }
}
