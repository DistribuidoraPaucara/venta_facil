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
     * Mes que se muestra por defecto: si se filtra por producto, el mes de su vencimiento
     * más cercano (hoy o después); si no hay, o no hay filtro, el mes actual.
     */
    public function mesInicial(int $empresaId, ?int $productoId, ?int $almacenId): Carbon
    {
        if (! $productoId) {
            return now()->startOfMonth();
        }

        $proximo = $this->consultaBase($empresaId, $productoId, $almacenId)
            ->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '>=', now()->toDateString())
            ->orderBy('fecha_vencimiento')
            ->value('fecha_vencimiento');

        return $proximo ? Carbon::parse($proximo)->startOfMonth() : now()->startOfMonth();
    }

    /**
     * Lotes que vencen desde hoy hasta dentro de N meses (lista de próximos vencimientos).
     * Devuelve el total real y los primeros $limite lotes ordenados por fecha.
     */
    public function proximosVencimientos(
        int $empresaId,
        int $meses,
        ?int $productoId = null,
        ?int $almacenId = null,
        ?string $q = null,
        int $limite = 100,
    ): array {
        $consulta = $this->consultaBase($empresaId, $productoId, $almacenId)
            ->with(['producto:id,nombre,sku', 'almacen:id,nombre'])
            ->whereBetween('fecha_vencimiento', [
                now()->toDateString(),
                now()->copy()->addMonthsNoOverflow($meses)->toDateString(),
            ])
            ->when($q, function ($query) use ($q) {
                $query->where(function ($w) use ($q) {
                    $w->where('lote', 'LIKE', "%{$q}%")
                      ->orWhereHas('producto', fn ($pq) => $pq->where('nombre', 'LIKE', "%{$q}%")
                          ->orWhere('sku', 'LIKE', "%{$q}%"));
                });
            });

        $total = (clone $consulta)->count();

        $items = $consulta->orderBy('fecha_vencimiento')
            ->limit($limite)
            ->get()
            ->map(fn ($stock) => [
                'id'                 => $stock->id,
                'producto_id'        => $stock->producto_id,
                'producto_nombre'    => $stock->producto?->nombre,
                'sku'                => $stock->producto?->sku,
                'lote'               => $stock->lote,
                'almacen'            => $stock->almacen?->nombre,
                'cantidad'           => $stock->cantidad,
                'fecha_vencimiento'  => $stock->fecha_vencimiento?->toDateString(),
                'dias_para_vencer'   => $stock->diasParaVencer(),
                'estado_vencimiento' => self::determinarEstadoVencimiento($stock),
            ])
            ->values();

        return ['total' => $total, 'items' => $items];
    }

    /**
     * Consulta base de lotes con lote asignado de la empresa, con filtros opcionales
     */
    private function consultaBase(int $empresaId, ?int $productoId, ?int $almacenId)
    {
        return StockProducto::query()
            ->whereNotNull('lote')
            ->whereHas('almacen', fn ($q) => $q->where('empresa_id', $empresaId))
            ->when($productoId, fn ($q) => $q->where('producto_id', $productoId))
            ->when($almacenId, fn ($q) => $q->where('almacen_id', $almacenId));
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
