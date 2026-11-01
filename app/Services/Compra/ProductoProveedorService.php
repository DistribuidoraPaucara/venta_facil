<?php

namespace App\Services\Compra;

use App\Models\Compra;
use App\Models\Producto;
use App\Models\ProductoProveedor;
use Illuminate\Support\Facades\DB;

/**
 * Mantiene producto_proveedor a partir de las compras:
 * - Al aprobar una compra, cada producto queda asociado al proveedor de la compra (se crea la relación si no existía)
 *   con el último precio que ese proveedor le cobró.
 * - Al anular, eliminar o editar una compra se recalcula el último precio con las compras aprobadas/facturadas que
 *   queden. La relación se conserva: el proveedor sigue siendo proveedor del producto.
 * - El primer proveedor de un producto queda como principal y se copia a productos.proveedor_id.
 */
class ProductoProveedorService
{
    private const ESTADOS_VIGENTES = ['APROBADO', 'FACTURADO'];

    /**
     * Llamar al dejar la compra APROBADA/FACTURADA. No hace nada si la compra no está vigente o no tiene proveedor.
     */
    public function registrarCompra(Compra $compra): void
    {
        $compra->loadMissing('detalles.producto', 'estadoDocumento');

        if (! $compra->proveedor_id || ! in_array($compra->estadoDocumento?->codigo, self::ESTADOS_VIGENTES, true)) {
            return;
        }

        foreach ($compra->detalles->pluck('producto')->filter()->unique('id') as $producto) {
            $relacion = ProductoProveedor::firstOrCreate(
                ['producto_id' => $producto->id, 'proveedor_id' => $compra->proveedor_id],
                ['empresa_id' => $producto->empresa_id, 'activo' => true]
            );

            if ($relacion->wasRecentlyCreated && ! $this->tienePrincipal($producto->id, $relacion->id)) {
                $this->marcarPrincipal($relacion);
            }
        }

        $this->recalcularProductos($compra->proveedor_id, $compra->detalles->pluck('producto_id'));
    }

    /**
     * Después de editar una compra (cambio de estado, de proveedor o de líneas): registra la compra si quedó vigente
     * y recalcula también los productos/proveedor que tenía antes de la edición.
     */
    public function sincronizarCompra(Compra $compra, ?int $proveedorAnterior, iterable $productosAnteriores): void
    {
        $this->registrarCompra($compra);
        $this->recalcularProductos($proveedorAnterior, $productosAnteriores);
        $this->recalcularProductos($compra->proveedor_id, $compra->detalles()->pluck('producto_id'));
    }

    /**
     * Recalcula las relaciones existentes de esos productos con ese proveedor (anulación, eliminación, edición).
     */
    public function recalcularProductos(?int $proveedorId, iterable $productoIds): void
    {
        $productoIds = collect($productoIds)->filter()->unique()->values();
        if (! $proveedorId || $productoIds->isEmpty()) {
            return;
        }

        ProductoProveedor::where('proveedor_id', $proveedorId)
            ->whereIn('producto_id', $productoIds)
            ->get()
            ->each(fn (ProductoProveedor $relacion) => $this->recalcular($relacion));
    }

    /**
     * Último precio, unidad, fecha y compra de la relación según la compra vigente más reciente de ese proveedor.
     */
    public function recalcular(ProductoProveedor $relacion): void
    {
        $ultima = DB::table('detalle_compras as dc')
            ->join('compras as c', 'c.id', '=', 'dc.compra_id')
            ->join('estados_documento as e', 'e.id', '=', 'c.estado_documento_id')
            ->join('productos as p', 'p.id', '=', 'dc.producto_id')
            ->where('dc.producto_id', $relacion->producto_id)
            ->where('c.proveedor_id', $relacion->proveedor_id)
            ->whereIn('e.codigo', self::ESTADOS_VIGENTES)
            ->where('dc.precio_unitario', '>', 0)
            ->orderByDesc('c.fecha')
            ->orderByDesc('c.id')
            ->orderByDesc('dc.id')
            ->first([
                'dc.precio_unitario',
                DB::raw('COALESCE(dc.unidad_medida_id, p.unidad_medida_id) AS unidad_medida_id'),
                'c.fecha',
                'c.id AS compra_id',
            ]);

        $relacion->update([
            'ultimo_precio'       => $ultima?->precio_unitario,
            'unidad_medida_id'    => $ultima?->unidad_medida_id,
            'fecha_ultima_compra' => $ultima ? substr((string) $ultima->fecha, 0, 10) : null,
            'ultima_compra_id'    => $ultima?->compra_id,
        ]);
    }

    /**
     * Deja la relación como único proveedor principal del producto y la copia a productos.proveedor_id.
     */
    public function marcarPrincipal(ProductoProveedor $relacion): void
    {
        ProductoProveedor::where('producto_id', $relacion->producto_id)
            ->where('id', '!=', $relacion->id)
            ->where('es_principal', true)
            ->update(['es_principal' => false]);

        if (! $relacion->es_principal) {
            $relacion->update(['es_principal' => true]);
        }

        Producto::withoutGlobalScopes()
            ->whereKey($relacion->producto_id)
            ->update(['proveedor_id' => $relacion->proveedor_id]);
    }

    private function tienePrincipal(int $productoId, int $exceptoId): bool
    {
        return ProductoProveedor::where('producto_id', $productoId)
            ->where('id', '!=', $exceptoId)
            ->where('es_principal', true)
            ->exists();
    }
}
