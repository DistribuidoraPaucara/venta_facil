<?php

namespace App\Services\Stock;

use App\Models\StockProducto;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Calendario de vencimientos de lotes (usado en Lotes y Vencimientos y en el Dashboard admin)
 */
class CalendarioVencimientosService
{
    /**
     * Mes del calendario a partir de un string YYYY-MM (mes actual si es inválido)
     */
    public function resolverMes(?string $mes): Carbon
    {
        try {
            return Carbon::createFromFormat('Y-m', (string) ($mes ?: now()->format('Y-m')))->startOfMonth();
        } catch (\Throwable $e) {
            return now()->startOfMonth();
        }
    }

    /**
     * Lotes de la empresa que vencen en el mes indicado
     */
    public function obtener(int $empresaId, Carbon $mes, ?int $productoId = null, ?int $almacenId = null): Collection
    {
        return StockProducto::with([
                'producto:id,nombre,sku',
                'producto.codigoPrincipal:id,producto_id,codigo',
                'producto.imagenes:id,producto_id,url,es_principal,orden',
                'almacen:id,nombre',
            ])
            ->whereNotNull('lote')
            ->whereHas('almacen', function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId);
            })
            ->whereBetween('fecha_vencimiento', [$mes->toDateString(), $mes->copy()->endOfMonth()->toDateString()])
            ->when($productoId, fn ($q) => $q->where('producto_id', $productoId))
            ->when($almacenId, fn ($q) => $q->where('almacen_id', $almacenId))
            ->orderBy('fecha_vencimiento')
            ->get()
            ->map(function ($stock) {
                $imagenes = $stock->producto?->imagenes ?? collect();
                $imagen   = $imagenes->firstWhere('es_principal', true) ?? $imagenes->sortBy('orden')->first();

                return [
                    'id'                 => $stock->id,
                    'producto_id'        => $stock->producto_id,
                    'producto_nombre'    => $stock->producto?->nombre,
                    'sku'                => $stock->producto?->sku ?? $stock->producto?->codigoPrincipal?->codigo,
                    'imagen_url'         => $imagen?->url,
                    'lote'               => $stock->lote,
                    'almacen'            => $stock->almacen?->nombre,
                    'cantidad'           => $stock->cantidad,
                    'fecha_vencimiento'  => $stock->fecha_vencimiento?->toDateString(),
                    'estado_vencimiento' => self::determinarEstadoVencimiento($stock),
                ];
            })
            ->values();
    }

    /**
     * Determinar el estado de vencimiento de un lote
     */
    public static function determinarEstadoVencimiento(StockProducto $stock): string
    {
        if ($stock->estaVencido()) {
            return 'VENCIDO';
        }

        if ($stock->proximoVencer(7)) {
            return 'CRITICO';
        }

        if ($stock->proximoVencer(30)) {
            return 'PROXIMO_VENCER';
        }

        if ($stock->fecha_vencimiento) {
            return 'VIGENTE';
        }

        return 'SIN_VENCIMIENTO';
    }
}
