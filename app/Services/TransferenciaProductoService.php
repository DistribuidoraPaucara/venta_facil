<?php

namespace App\Services;

use App\Models\Almacen;
use App\Models\ConversionUnidadProducto;
use App\Models\DetalleTransferenciaInventario;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\Sector;
use App\Models\StockLimite;
use App\Models\StockProducto;
use App\Models\TransferenciaInventario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Transferencia inmediata de UN producto entre almacenes (usada desde Actualizar Stock Masivo).
 *
 * A diferencia de TransferenciaInventario::enviar()/recibir(), sale de un registro de stock
 * concreto (lote/sector elegido) y en destino reutiliza el registro con el mismo lote,
 * creándolo con sector si no existe. Queda registrada como transferencia RECIBIDA.
 */
class TransferenciaProductoService
{
    public function transferir(
        int $stockOrigenId,
        int $almacenDestinoId,
        float $cantidad,
        ?string $observaciones = null
    ): TransferenciaInventario {
        return DB::transaction(function () use ($stockOrigenId, $almacenDestinoId, $cantidad, $observaciones) {
            $empresaId = Auth::user()?->empresa_id;

            $stockOrigen = StockProducto::lockForUpdate()->findOrFail($stockOrigenId);
            $producto    = Producto::findOrFail($stockOrigen->producto_id);

            $almacenes = Almacen::whereIn('id', [$stockOrigen->almacen_id, $almacenDestinoId])
                ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
                ->get()
                ->keyBy('id');
            $almacenOrigen  = $almacenes->get($stockOrigen->almacen_id);
            $almacenDestino = $almacenes->get($almacenDestinoId);

            if (! $almacenOrigen || ! $almacenDestino) {
                throw new \Exception('Almacén de origen o destino no válido para su empresa');
            }
            if ($almacenOrigen->id === $almacenDestino->id) {
                throw new \Exception('El almacén de destino debe ser distinto al de origen');
            }
            if ($cantidad <= 0) {
                throw new \Exception('La cantidad debe ser mayor a 0');
            }
            if (! $producto->es_fraccionado && floor($cantidad) != $cantidad) {
                throw new \Exception("El producto '{$producto->nombre}' no admite cantidades con decimales");
            }
            if ((float) $stockOrigen->cantidad_disponible < $cantidad) {
                throw new \Exception("Stock disponible insuficiente. Disponible: {$stockOrigen->cantidad_disponible}, solicitado: {$cantidad}");
            }

            $stockDestino = $this->obtenerOCrearStockDestino($stockOrigen, $almacenDestinoId);

            // Número correlativo (mismo formato que InventarioController::crearTransferencia)
            $ultimoNumero = TransferenciaInventario::max('numero') ?? 'TRF-000000';
            $numero       = 'TRF-' . str_pad(((int) substr($ultimoNumero, 4)) + 1, 6, '0', STR_PAD_LEFT);

            $transferencia = TransferenciaInventario::create([
                'numero'             => $numero,
                'fecha'              => now(),
                'almacen_origen_id'  => $almacenOrigen->id,
                'almacen_destino_id' => $almacenDestino->id,
                'usuario_id'         => Auth::id(),
                'estado'             => TransferenciaInventario::ESTADO_RECIBIDO,
                'fecha_envio'        => now(),
                'fecha_recepcion'    => now(),
                'observaciones'      => $observaciones ?: 'Transferencia desde Actualizar Stock Masivo',
                'total_productos'    => 1,
                'total_cantidad'     => $cantidad,
            ]);

            DetalleTransferenciaInventario::create([
                'transferencia_id'  => $transferencia->id,
                'producto_id'       => $producto->id,
                'cantidad'          => $cantidad,
                'cantidad_recibida' => $cantidad,
                'lote'              => $stockOrigen->lote,
                'fecha_vencimiento' => $stockOrigen->fecha_vencimiento,
            ]);

            MovimientoInventario::registrar(
                $stockOrigen,
                -$cantidad,
                'SALIDA_TRANSFERENCIA',
                "Transferencia {$numero} - Envío a {$almacenDestino->nombre}",
                $numero,
                Auth::id(),
                referenciaTipo: 'transferencia',
                referenciaId: $transferencia->id
            );

            MovimientoInventario::registrar(
                $stockDestino,
                $cantidad,
                'ENTRADA_TRANSFERENCIA',
                "Transferencia {$numero} - Recepción desde {$almacenOrigen->nombre}",
                $numero,
                Auth::id(),
                referenciaTipo: 'transferencia',
                referenciaId: $transferencia->id
            );

            Log::info('✅ Transferencia de producto realizada', [
                'transferencia_id'  => $transferencia->id,
                'producto_id'       => $producto->id,
                'stock_origen_id'   => $stockOrigen->id,
                'stock_destino_id'  => $stockDestino->id,
                'cantidad'          => $cantidad,
            ]);

            return $transferencia;
        });
    }

    /**
     * Transferir unidades del producto HIJO de un paquete (ej. 3 Coca Cola de un paquete de 6).
     *
     * En el almacén de origen usa primero las unidades sueltas del hijo (si $usarSueltas) y solo abre
     * los paquetes necesarios para completar; luego transfiere las unidades al destino. Todo es atómico.
     *
     * @return array{transferencia: TransferenciaInventario, fraccionamiento: ?\App\Models\MovimientoFraccionamiento, paquetes_abiertos: float, sueltas_usadas: float}
     */
    public function transferirUnidadesHijo(
        int $stockPadreId,
        int $conversionId,
        int $almacenDestinoId,
        float $cantidadHijo,
        bool $usarSueltas = true
    ): array {
        return DB::transaction(function () use ($stockPadreId, $conversionId, $almacenDestinoId, $cantidadHijo, $usarSueltas) {
            $fraccionamientoService = app(FraccionamientoService::class);

            $stockPadre = StockProducto::lockForUpdate()->findOrFail($stockPadreId);
            $conversion = ConversionUnidadProducto::where('id', $conversionId)
                ->where('producto_id', $stockPadre->producto_id)
                ->where('activo', true)
                ->whereNotNull('producto_destino_id')
                ->first();

            if (! $conversion) {
                throw new \Exception('La conversión no corresponde a un producto hijo de este paquete');
            }
            $factor = (float) $conversion->factor_conversion;
            if ($factor <= 0) {
                throw new \Exception('El factor de conversión del paquete no es válido');
            }
            if ($cantidadHijo <= 0) {
                throw new \Exception('La cantidad debe ser mayor a 0');
            }

            $almacenOrigenId = (int) $stockPadre->almacen_id;
            $hijoId          = (int) $conversion->producto_destino_id;

            // Unidades sueltas del hijo en el almacén de origen (mismo registro que usa el fraccionamiento)
            $stockHijo = $fraccionamientoService->buscarStockHijo($hijoId, $almacenOrigenId, (int) $stockPadre->sector_id);
            $sueltas   = $usarSueltas && $stockHijo ? max(0.0, (float) $stockHijo->cantidad_disponible) : 0.0;

            // Paquetes a abrir solo por lo que falte (round evita errores de coma flotante, ej. 2.9999999)
            $faltante = max(0.0, round($cantidadHijo - $sueltas, 4));
            $paquetes = $faltante > 0 ? ceil(round($faltante / $factor, 4)) : 0.0;

            $fraccionamiento = null;
            if ($paquetes > 0) {
                if ((float) $stockPadre->cantidad_disponible < $paquetes) {
                    throw new \Exception("Se necesitan {$paquetes} paquete(s) y solo hay {$stockPadre->cantidad_disponible} disponible(s)");
                }

                $fraccionamiento = $fraccionamientoService->fraccionar(
                    (int) $stockPadre->producto_id,
                    $paquetes,
                    $hijoId,
                    $paquetes * $factor,
                    $almacenOrigenId,
                    (int) $stockPadre->sector_id,
                    'fraccionamiento_manual',
                    "Para transferir {$cantidadHijo} unidad(es) al almacén {$almacenDestinoId}"
                );

                $stockHijo = $fraccionamientoService->buscarStockHijo($hijoId, $almacenOrigenId, (int) $stockPadre->sector_id);
            }

            if (! $stockHijo) {
                throw new \Exception('No hay unidades del producto hijo en el almacén de origen');
            }

            $transferencia = $this->transferir(
                $stockHijo->id,
                $almacenDestinoId,
                $cantidadHijo,
                $fraccionamiento
                    ? "Unidades sueltas de {$paquetes} paquete(s) abierto(s) (fraccionamiento #{$fraccionamiento->id})"
                    : 'Unidades sueltas existentes'
            );

            return [
                'transferencia'     => $transferencia,
                'fraccionamiento'   => $fraccionamiento,
                'paquetes_abiertos' => (float) $paquetes,
                'sueltas_usadas'    => min($sueltas, $cantidadHijo),
            ];
        });
    }

    /**
     * Registro de destino: mismo lote y vencimiento en el almacén destino (cualquier sector).
     * Si no existe se crea en el sector configurado para el producto (stock_limites) o en el primero del almacén.
     */
    public function obtenerOCrearStockDestino(StockProducto $origen, int $almacenDestinoId): StockProducto
    {
        $sectorLimite = StockLimite::where('producto_id', $origen->producto_id)
            ->where('almacen_id', $almacenDestinoId)
            ->whereNotNull('sector_id')
            ->value('sector_id');

        $existente = StockProducto::where('producto_id', $origen->producto_id)
            ->where('almacen_id', $almacenDestinoId)
            ->when(
                empty($origen->lote),
                fn($q) => $q->where(fn($w) => $w->whereNull('lote')->orWhere('lote', '')),
                fn($q) => $q->where('lote', $origen->lote)
            )
            ->when(
                $origen->fecha_vencimiento,
                fn($q) => $q->whereDate('fecha_vencimiento', $origen->fecha_vencimiento),
                fn($q) => $q->whereNull('fecha_vencimiento')
            )
            ->orderByRaw('CASE WHEN sector_id = ? THEN 0 ELSE 1 END', [$sectorLimite ?? 0])
            ->orderBy('id')
            ->lockForUpdate()
            ->first();

        if ($existente) {
            return $existente;
        }

        $sectorId = $sectorLimite ?? Sector::where('almacen_id', $almacenDestinoId)->orderBy('id')->value('id');
        if (! $sectorId) {
            throw new \Exception('El almacén de destino no tiene sectores configurados');
        }

        // El índice único (producto, almacén, sector, lote) también cuenta los lotes dados de baja:
        // si ese lote existe con deleted_at, se restaura en vez de crear otro (que chocaría con el índice).
        // Los lotes sin número no chocan (en PostgreSQL dos NULL no se consideran iguales).
        if (! empty($origen->lote)) {
            $dadoDeBaja = StockProducto::onlyTrashed()
                ->where('producto_id', $origen->producto_id)
                ->where('almacen_id', $almacenDestinoId)
                ->where('sector_id', $sectorId)
                ->where('lote', $origen->lote)
                ->lockForUpdate()
                ->first();

            if ($dadoDeBaja) {
                // Restaurarlo con stock "fantasma" (dado de baja sin llevarlo a 0) haría aparecer
                // unidades sin movimiento que las explique: se frena y se pide regularizarlo.
                if ((float) $dadoDeBaja->cantidad != 0 || (float) $dadoDeBaja->cantidad_reservada != 0) {
                    throw new \Exception(
                        "El lote {$origen->lote} está dado de baja en el almacén de destino pero aún registra "
                        . (float) $dadoDeBaja->cantidad . ' unidad(es) (registro #' . $dadoDeBaja->id . '). '
                        . 'Regularice ese lote antes de volver a ingresarlo.'
                    );
                }

                $dadoDeBaja->restore();
                $dadoDeBaja->update([
                    'fecha_vencimiento'   => $origen->fecha_vencimiento,
                    'fecha_actualizacion' => now(),
                ]);

                Log::info('♻️ [TransferenciaProductoService] Lote dado de baja restaurado en destino', [
                    'stock_producto_id' => $dadoDeBaja->id,
                    'producto_id'       => $origen->producto_id,
                    'almacen_id'        => $almacenDestinoId,
                    'lote'              => $origen->lote,
                ]);

                return $dadoDeBaja;
            }
        }

        return StockProducto::create([
            'producto_id'         => $origen->producto_id,
            'almacen_id'          => $almacenDestinoId,
            'sector_id'           => $sectorId,
            'lote'                => $origen->lote ?: null,
            'fecha_vencimiento'   => $origen->fecha_vencimiento,
            'cantidad'            => 0,
            'cantidad_disponible' => 0,
            'cantidad_reservada'  => 0,
            'fecha_actualizacion' => now(),
        ]);
    }
}
