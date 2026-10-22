<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Lista cuántos límites (stock_limites) tiene cada producto por almacén y depura los
 * sobrantes cuando hay demasiados en un mismo almacén.
 *
 * Criterio para decidir qué límite conservar (por producto + almacén):
 *  1. Se conservan los de sectores donde el producto TIENE stock (stock_productos vigente > 0).
 *  2. Si en ningún sector tiene stock, se conserva el actualizado más recientemente
 *     (el que con más probabilidad se configuró a mano).
 *  3. Los demás se eliminan. Solo se borran filas de stock_limites; el stock no se toca.
 *
 * Sin --ejecutar solo muestra lo que haría.
 */
class DepurarStockLimites extends Command
{
    protected $signature = 'stock-limites:depurar
                            {--ejecutar : Eliminar los límites sobrantes (sin esto solo muestra lo que haría)}
                            {--minimo=3 : Revisar productos con esta cantidad de límites o más en un almacén}
                            {--empresa= : Limitar a una empresa}
                            {--almacen= : Limitar a un almacén}
                            {--resumen : Solo mostrar cuántos productos hay por cantidad de límites, sin detalle}';

    protected $description = 'Muestra cuántos stock_limites tiene cada producto por almacén y elimina los sobrantes';

    public function handle(): int
    {
        $minimo = max(2, (int) $this->option('minimo'));

        $conteos = DB::table('stock_limites as l')
            ->join('almacenes as a', 'a.id', '=', 'l.almacen_id')
            ->join('productos as p', 'p.id', '=', 'l.producto_id')
            ->when($this->option('empresa'), fn($q) => $q->where('a.empresa_id', (int) $this->option('empresa')))
            ->when($this->option('almacen'), fn($q) => $q->where('l.almacen_id', (int) $this->option('almacen')))
            ->selectRaw('l.producto_id, p.nombre, l.almacen_id, a.nombre AS almacen, COUNT(*) AS n')
            ->groupBy('l.producto_id', 'p.nombre', 'l.almacen_id', 'a.nombre')
            ->get();

        // Resumen: cuántas combinaciones producto + almacén tienen 1, 2, 3… límites
        $this->info('Límites por producto y almacén:');
        $this->table(
            ['Almacén', 'Límites por producto', 'Productos'],
            $conteos->groupBy(fn($c) => "{$c->almacen}|{$c->n}")
                ->map(fn($g) => [$g->first()->almacen, $g->first()->n, $g->count()])
                ->sortBy(fn($r) => $r[0] . str_pad((string) $r[1], 3, '0', STR_PAD_LEFT))
                ->values()
        );
        if ($this->option('resumen')) {
            return self::SUCCESS;
        }

        $revisar = $conteos->where('n', '>=', $minimo)->sortBy('nombre')->values();
        if ($revisar->isEmpty()) {
            $this->info("Ningún producto tiene {$minimo} o más límites en un mismo almacén.");

            return self::SUCCESS;
        }

        $filas      = [];
        $aEliminar  = [];
        foreach ($revisar as $c) {
            $limites = DB::table('stock_limites as l')
                ->leftJoin('sectores as s', 's.id', '=', 'l.sector_id')
                ->where('l.producto_id', $c->producto_id)
                ->where('l.almacen_id', $c->almacen_id)
                ->orderByDesc('l.updated_at')
                ->orderByDesc('l.id')
                ->get(['l.id', 'l.sector_id', 's.nombre AS sector', 'l.stock_minimo', 'l.stock_maximo', 'l.updated_at']);

            $stockPorSector = DB::table('stock_productos')
                ->whereNull('deleted_at')
                ->where('producto_id', $c->producto_id)
                ->where('almacen_id', $c->almacen_id)
                ->groupBy('sector_id')
                ->selectRaw('sector_id, SUM(cantidad) AS total')
                ->pluck('total', 'sector_id');

            $conStock  = $limites->filter(fn($l) => (float) ($stockPorSector[$l->sector_id] ?? 0) > 0);
            $conservar = $conStock->isNotEmpty() ? $conStock : $limites->take(1); // el más reciente
            $eliminar  = $limites->whereNotIn('id', $conservar->pluck('id'));

            $describir = fn($l) => "{$l->sector} (mín {$l->stock_minimo} / máx " . ($l->stock_maximo >= 999999 ? '—' : $l->stock_maximo)
                . ', stock ' . $this->num($stockPorSector[$l->sector_id] ?? 0) . ')';

            $filas[] = [
                "#{$c->producto_id} " . mb_strimwidth($c->nombre, 0, 30, '…'),
                $c->almacen,
                $c->n,
                $conservar->map($describir)->implode("\n") . ($conStock->isEmpty() ? "\n(sin stock: el más reciente)" : ''),
                $eliminar->isEmpty() ? '—' : $eliminar->map($describir)->implode("\n"),
            ];
            array_push($aEliminar, ...$eliminar->pluck('id')->all());
        }

        $this->newLine();
        $this->info("Productos con {$minimo} o más límites en un almacén: " . $revisar->count());
        $this->table(['Producto', 'Almacén', 'Límites', 'Se conserva', 'Se elimina'], $filas);
        $this->line('Límites a eliminar: ' . count($aEliminar));

        if (! $this->option('ejecutar')) {
            $this->newLine();
            $this->info('Simulación: no se eliminó nada. Revisa la lista y vuelve a ejecutar con --ejecutar.');

            return self::SUCCESS;
        }

        $eliminados = DB::transaction(fn() => DB::table('stock_limites')->whereIn('id', $aEliminar)->delete());
        $this->info("✅ {$eliminados} límite(s) eliminados.");

        return self::SUCCESS;
    }

    private function num($n): string
    {
        $n = (float) $n;

        return $n == floor($n) ? (string) (int) $n : rtrim(rtrim(number_format($n, 4, '.', ''), '0'), '.');
    }
}
