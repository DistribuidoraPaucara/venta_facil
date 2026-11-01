import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Search } from 'lucide-react';
import { formatearUnidades } from '@/presentation/components/Inventario/MovimientosStats';
import type { ResumenProductoMovimientos } from '@/domain/entities/movimientos-inventario';

interface Props {
    filas?: ResumenProductoMovimientos[];
    cargando: boolean;
    filtrandoAlmacen: boolean;
    onVerKardex?: (productoId: number) => void;
    urlExportarKardex?: string; // Excel con el kardex de todos los productos del filtro
}

// Debe coincidir con InventarioController::exportarKardex ($limiteProductos)
const MAX_PRODUCTOS_KARDEX = 300;

type Columna = keyof Pick<
    ResumenProductoMovimientos,
    'producto_id' | 'nombre' | 'movimientos' | 'entradas' | 'salidas' | 'vendido' | 'ajustes' | 'transferencias' | 'neto' | 'stock_actual'
>;

const columnas: { clave: Columna; titulo: string; numero?: boolean; ayuda?: string }[] = [
    { clave: 'producto_id', titulo: 'ID' },
    { clave: 'nombre', titulo: 'Producto' },
    { clave: 'movimientos', titulo: 'Movs.', numero: true },
    { clave: 'entradas', titulo: 'Entradas', numero: true, ayuda: 'Compras, ajustes de entrada, fraccionamientos… (sin transferencias)' },
    { clave: 'salidas', titulo: 'Salidas', numero: true, ayuda: 'Ventas, ajustes de salida, mermas… (sin transferencias)' },
    { clave: 'vendido', titulo: 'Vendido', numero: true },
    { clave: 'ajustes', titulo: 'Ajustes', numero: true, ayuda: 'Neto de ajustes (entradas menos salidas)' },
    { clave: 'transferencias', titulo: 'Transf.', numero: true, ayuda: 'Neto de transferencias: 0 viendo todos los almacenes' },
    { clave: 'neto', titulo: 'Neto', numero: true, ayuda: 'Cuánto cambió el stock en el período' },
    { clave: 'stock_actual', titulo: 'Stock hoy', numero: true },
];

const conSigno = (n: number) => (n > 0 ? `+${formatearUnidades(n)}` : formatearUnidades(n));

export default function ResumenProductosMovimientos({ filas, cargando, filtrandoAlmacen, onVerKardex, urlExportarKardex }: Props) {
    const [busqueda, setBusqueda] = useState('');
    const [orden, setOrden] = useState<{ clave: Columna; desc: boolean }>({ clave: 'vendido', desc: true });

    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        const lista = (filas ?? []).filter(
            (f) => !texto || String(f.producto_id) === texto || f.nombre.toLowerCase().includes(texto) || (f.sku ?? '').toLowerCase().includes(texto),
        );
        return [...lista].sort((a, b) => {
            const va = a[orden.clave];
            const vb = b[orden.clave];
            const cmp = typeof va === 'string' ? va.localeCompare(String(vb)) : Number(va) - Number(vb);
            return orden.desc ? -cmp : cmp;
        });
    }, [filas, busqueda, orden]);

    const ordenarPor = (clave: Columna) =>
        setOrden((o) => (o.clave === clave ? { clave, desc: !o.desc } : { clave, desc: clave !== 'nombre' && clave !== 'producto_id' }));

    return (
        <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">
                    Resumen por producto
                    {filas && <span className="ml-2 text-sm font-normal text-muted-foreground">({visibles.length} de {filas.length})</span>}
                </CardTitle>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                    {urlExportarKardex && filas && filas.length > 0 && (
                        filas.length > MAX_PRODUCTOS_KARDEX ? (
                            <span
                                className="shrink-0 cursor-not-allowed rounded-md border px-3 py-2 text-sm text-muted-foreground opacity-60 dark:border-gray-600"
                                title={`Hay ${filas.length} productos; el Excel de kardex admite hasta ${MAX_PRODUCTOS_KARDEX}. Filtra por almacén, tipo o un período más corto.`}
                            >
                                📒 Kardex de todos (Excel)
                            </span>
                        ) : (
                            <a
                                href={urlExportarKardex}
                                className="shrink-0 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                                title={`Kardex de los ${filas.length} productos del filtro, uno debajo de otro`}
                            >
                                📒 Kardex de todos (Excel)
                            </a>
                        )
                    )}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Buscar por ID, nombre o SKU..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {cargando && !filas ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Calculando resumen…</p>
                ) : visibles.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Sin movimientos para estos filtros.</p>
                ) : (
                    <div className="max-h-[65vh] overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white dark:bg-gray-900">
                                <tr className="border-b text-xs text-muted-foreground">
                                    {columnas.map((c) => (
                                        <th
                                            key={c.clave}
                                            title={c.ayuda}
                                            onClick={() => ordenarPor(c.clave)}
                                            className={`cursor-pointer py-2 px-2 whitespace-nowrap select-none hover:text-foreground ${c.numero ? 'text-right' : 'text-left'}`}
                                        >
                                            {c.titulo}
                                            {orden.clave === c.clave && <span className="ml-1">{orden.desc ? '▼' : '▲'}</span>}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visibles.map((f) => (
                                    <tr key={f.producto_id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="py-1.5 px-2">
                                            <a
                                                href={`/productos/${f.producto_id}/edit`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                #{f.producto_id}
                                            </a>
                                        </td>
                                        <td className="py-1.5 px-2">
                                            {f.nombre}
                                            {f.sku && <span className="ml-1 text-xs text-muted-foreground">{f.sku}</span>}
                                            {onVerKardex && (
                                                <button
                                                    type="button"
                                                    onClick={() => onVerKardex(f.producto_id)}
                                                    className="ml-2 text-xs text-blue-600 hover:underline dark:text-blue-400"
                                                    title="Ver el kardex de este producto"
                                                >
                                                    📒 Kardex
                                                </button>
                                            )}
                                        </td>
                                        <td className="py-1.5 px-2 text-right">{f.movimientos}</td>
                                        <td className="py-1.5 px-2 text-right text-green-600">{f.entradas ? `+${formatearUnidades(f.entradas)}` : '—'}</td>
                                        <td className="py-1.5 px-2 text-right text-red-600">{f.salidas ? `-${formatearUnidades(f.salidas)}` : '—'}</td>
                                        <td className="py-1.5 px-2 text-right font-medium">{f.vendido ? formatearUnidades(f.vendido) : '—'}</td>
                                        <td className="py-1.5 px-2 text-right">{f.ajustes ? conSigno(f.ajustes) : '—'}</td>
                                        <td className="py-1.5 px-2 text-right">{f.transferencias ? conSigno(f.transferencias) : '—'}</td>
                                        <td className={`py-1.5 px-2 text-right font-medium ${f.neto < 0 ? 'text-red-600' : f.neto > 0 ? 'text-green-600' : ''}`}>
                                            {conSigno(f.neto)}
                                        </td>
                                        <td className="py-1.5 px-2 text-right">{formatearUnidades(f.stock_actual)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                    Entradas y salidas no incluyen transferencias ni reservas; no se cuentan anulados. "Stock hoy" es el stock actual
                    {filtrandoAlmacen ? ' en el almacén filtrado' : ' en todos los almacenes'}, no al cierre del período.
                </p>
            </CardContent>
        </Card>
    );
}
