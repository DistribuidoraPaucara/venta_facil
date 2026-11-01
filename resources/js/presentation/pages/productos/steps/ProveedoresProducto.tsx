import type { ProveedorProducto } from '@/domain/entities/productos';
import NotificationService from '@/infrastructure/services/notification.service';
import { formatCurrency } from '@/lib/cajas.utils';

interface Props {
    proveedores: ProveedorProducto[];
    onChange: (proveedores: ProveedorProducto[]) => void;
}

const formatFecha = (fecha: string) => {
    const [a, m, d] = fecha.split('-');
    return `${d}/${m}/${a}`;
};

/**
 * Proveedores del producto. El código del proveedor, el principal y activo se editan aquí;
 * el último precio y su fecha vienen de las compras aprobadas (solo lectura).
 */
export default function ProveedoresProducto({ proveedores, onChange }: Props) {
    // La explicación (cómo se agregan, último precio, principal) está en el tooltip del título, en Step1DatosProducto
    if (proveedores.length === 0) {
        return <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Sin proveedores</p>;
    }

    // Más barato entre los activos con precio (solo si hay con qué comparar)
    const conPrecio = proveedores.filter((p) => p.activo && p.ultimo_precio != null);
    const precioMinimo = conPrecio.length > 1 ? Math.min(...conPrecio.map((p) => Number(p.ultimo_precio))) : null;

    const actualizar = (proveedorId: number, cambios: Partial<ProveedorProducto>) =>
        onChange(proveedores.map((p) => (p.proveedor_id === proveedorId ? { ...p, ...cambios } : p)));

    const marcarPrincipal = (proveedorId: number) =>
        onChange(proveedores.map((p) => ({ ...p, es_principal: p.proveedor_id === proveedorId, ...(p.proveedor_id === proveedorId && { activo: true }) })));

    const quitar = async (p: ProveedorProducto) => {
        if (p.ultimo_precio != null) {
            const ok = await NotificationService.confirm(
                `"${p.nombre}" tiene compras registradas. Si lo quitas, se volverá a asociar al aprobar otra compra suya. ¿Quitar?`,
                { confirmText: 'Quitar', cancelText: 'Cancelar' },
            );
            if (!ok) return;
        }
        const resto = proveedores.filter((x) => x.proveedor_id !== p.proveedor_id);
        // Si se quitó el principal, pasa a serlo el primer activo
        if (p.es_principal && resto.length > 0 && !resto.some((x) => x.es_principal)) {
            const siguiente = resto.find((x) => x.activo) ?? resto[0];
            onChange(resto.map((x) => ({ ...x, es_principal: x.proveedor_id === siguiente.proveedor_id })));
        } else {
            onChange(resto);
        }
    };

    return (
        <div className="mt-2 space-y-2">
            {proveedores.map((p) => {
                const masBarato = precioMinimo != null && p.activo && Number(p.ultimo_precio) === precioMinimo;
                return (
                    <div
                        key={p.proveedor_id}
                        className={`space-y-2 rounded-lg border p-2 text-sm ${
                            p.es_principal ? 'border-blue-400 bg-blue-50/60 dark:border-blue-700 dark:bg-blue-950/30' : 'border-gray-200 dark:border-zinc-700'
                        } ${p.activo ? '' : 'opacity-60'}`}
                    >
                        {/* Principal + nombre, código y quitar */}
                        <div className="flex items-start gap-2">
                            <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2" title="Proveedor principal: el que se sugiere por defecto">
                                <input
                                    type="radio"
                                    name="proveedor_principal"
                                    checked={p.es_principal}
                                    onChange={() => marcarPrincipal(p.proveedor_id)}
                                    className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                                />
                                <span className="min-w-0">
                                    <span className="font-medium">{p.nombre}</span>
                                    {p.codigo && (
                                        <span className="ml-2 font-mono text-xs text-gray-500 dark:text-gray-400" title="Código del proveedor">
                                            {p.codigo}
                                        </span>
                                    )}
                                    {p.es_principal && (
                                        <span className="ml-2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">PRINCIPAL</span>
                                    )}
                                    {p.razon_social && <span className="block truncate text-xs text-gray-500">{p.razon_social}</span>}
                                </span>
                            </label>
                            <button
                                type="button"
                                onClick={() => quitar(p)}
                                className="shrink-0 rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                title="Quitar proveedor"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Último precio (de las compras) y activo */}
                        <div className="flex items-end justify-between gap-2 pl-6">
                            <div className="min-w-0">
                                {p.ultimo_precio != null ? (
                                    <>
                                        <div className="font-mono font-semibold">
                                            {formatCurrency(p.ultimo_precio)}
                                            {p.unidad && <span className="text-xs font-normal text-gray-500"> / {p.unidad}</span>}
                                            {masBarato && (
                                                <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                                    MÁS BARATO
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {p.fecha_ultima_compra && formatFecha(p.fecha_ultima_compra)}
                                            {p.ultima_compra_id && (
                                                <a
                                                    href={`/compras/${p.ultima_compra_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-1 text-blue-600 hover:underline dark:text-blue-400"
                                                    title="Ver la compra (nueva pestaña)"
                                                >
                                                    {p.ultima_compra_numero ?? `#${p.ultima_compra_id}`} ↗
                                                </a>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-xs text-gray-400">Sin compras aprobadas</span>
                                )}
                            </div>
                            <label className="flex shrink-0 items-center gap-1 text-xs" title="Inactivo: se conserva el historial pero no se sugiere">
                                <input
                                    type="checkbox"
                                    checked={p.activo}
                                    disabled={p.es_principal}
                                    onChange={(e) => actualizar(p.proveedor_id, { activo: e.target.checked })}
                                />
                                Activo
                            </label>
                        </div>

                        <input
                            type="text"
                            value={p.codigo_proveedor ?? ''}
                            onChange={(e) => actualizar(p.proveedor_id, { codigo_proveedor: e.target.value })}
                            placeholder="Cód. del producto en su catálogo (opcional)"
                            maxLength={100}
                            title="Código con el que este proveedor identifica el producto (aparece en sus facturas)"
                            className="ml-6 w-[calc(100%-1.5rem)] rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                        />
                    </div>
                );
            })}
        </div>
    );
}
