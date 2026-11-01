import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import SearchSelect from '@/presentation/components/ui/search-select';
import { FileSpreadsheet } from 'lucide-react';
import { formatearUnidades } from '@/presentation/components/Inventario/MovimientosStats';
import type { KardexProducto as IKardexProducto } from '@/domain/entities/movimientos-inventario';

interface Props {
    kardex?: IKardexProducto | null;
    productoId: number | null;
    productos: Array<{ id: number; nombre: string }>;
    almacenNombre?: string;
    cargando: boolean;
    onElegirProducto: (id: number | null) => void;
    urlExportar?: string; // Excel del kardex del producto elegido (con el período y almacén de los filtros)
}

const conSigno = (n: number) => (n > 0 ? `+${formatearUnidades(n)}` : formatearUnidades(n));
const fechaHora = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

export default function KardexProducto({ kardex, productoId, productos, almacenNombre, cargando, onElegirProducto, urlExportar }: Props) {
    const opciones = productos.map((p) => ({ value: String(p.id), label: `#${p.id} - ${p.nombre}` }));
    const diferenciaActual = kardex && kardex.stock_actual !== null ? kardex.stock_actual - kardex.stock_final : 0;

    return (
        <Card>
            <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">
                        Kardex
                        {kardex && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                {kardex.desde.split('-').reverse().join('/')} – {kardex.hasta.split('-').reverse().join('/')} ·{' '}
                                {almacenNombre ?? 'todos los almacenes'}
                            </span>
                        )}
                    </CardTitle>
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        {kardex && urlExportar && (
                            <a
                                href={urlExportar}
                                className="inline-flex shrink-0 items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                            >
                                <FileSpreadsheet className="h-4 w-4" /> Excel
                            </a>
                        )}
                        <div className="w-full sm:w-96">
                        <SearchSelect
                            placeholder="Elegir producto..."
                            value={productoId ? String(productoId) : ''}
                            options={opciones}
                            onChange={(v) => onElegirProducto(v ? Number(v) : null)}
                            allowClear={true}
                            emptyText="No se encontraron productos"
                        />
                        </div>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Usa el período y el almacén de los filtros de arriba. También puedes abrirlo desde la pestaña "Por producto".
                </p>
            </CardHeader>
            <CardContent>
                {!productoId ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Elige un producto para ver su kardex.</p>
                ) : cargando || kardex === undefined ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Calculando kardex…</p>
                ) : kardex === null ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Producto no encontrado.</p>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                            {[
                                { titulo: 'Stock inicial', valor: formatearUnidades(kardex.stock_inicial), color: '' },
                                { titulo: 'Entradas', valor: `+${formatearUnidades(kardex.entradas)}`, color: 'text-green-600' },
                                { titulo: 'Salidas', valor: `-${formatearUnidades(kardex.salidas)}`, color: 'text-red-600' },
                                {
                                    titulo: 'Sin movimiento registrado',
                                    valor: kardex.num_saltos ? conSigno(kardex.saltos) : '0',
                                    color: kardex.num_saltos ? 'text-amber-600' : '',
                                },
                                { titulo: 'Stock final', valor: formatearUnidades(kardex.stock_final), color: 'font-bold' },
                            ].map((t) => (
                                <div key={t.titulo} className="rounded-lg border p-3 dark:border-gray-700">
                                    <p className="text-xs text-muted-foreground">{t.titulo}</p>
                                    <p className={`text-xl font-semibold ${t.color}`}>{t.valor}</p>
                                </div>
                            ))}
                        </div>

                        {kardex.num_saltos > 0 && (
                            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                ⚠ Hubo {kardex.num_saltos} cambio(s) de stock sin movimiento registrado ({conSigno(kardex.saltos)}). Aparecen en amarillo:
                                el stock cambió entre dos movimientos sin que quedara constancia de quién o por qué.
                            </div>
                        )}
                        {kardex.stock_actual !== null && Math.abs(diferenciaActual) > 0.0001 && (
                            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                ⚠ El stock de hoy es {formatearUnidades(kardex.stock_actual)}, pero según los movimientos debería ser{' '}
                                {formatearUnidades(kardex.stock_final)} (diferencia {conSigno(diferenciaActual)}): hubo cambios después del último movimiento.
                            </div>
                        )}
                        {kardex.truncado && (
                            <p className="text-sm text-amber-700">Se muestran los primeros 5000 movimientos; acorta el período para ver el resto.</p>
                        )}

                        <div className="max-h-[60vh] overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-white dark:bg-gray-900">
                                    <tr className="border-b text-left text-xs text-muted-foreground">
                                        <th className="py-2 px-2">Fecha</th>
                                        <th className="py-2 px-2">Movimiento</th>
                                        <th className="py-2 px-2">Documento</th>
                                        <th className="py-2 px-2">Almacén</th>
                                        <th className="py-2 px-2 text-right">Cantidad</th>
                                        <th className="py-2 px-2 text-right">Saldo</th>
                                        <th className="py-2 px-2">Usuario</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b bg-gray-50 font-medium dark:bg-gray-800/50">
                                        <td className="py-1.5 px-2" colSpan={5}>
                                            Stock inicial
                                        </td>
                                        <td className="py-1.5 px-2 text-right">{formatearUnidades(kardex.stock_inicial)}</td>
                                        <td />
                                    </tr>
                                    {kardex.filas.map((f, i) => (
                                        <tr
                                            key={f.id ?? `salto-${i}`}
                                            className={`border-b ${f.tipo_fila === 'salto' ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300' : ''} ${f.anulado ? 'line-through opacity-60' : ''}`}
                                        >
                                            <td className="py-1.5 px-2 whitespace-nowrap">{fechaHora(f.fecha)}</td>
                                            <td className="py-1.5 px-2">
                                                {f.tipo_fila === 'salto' ? `⚠ ${f.descripcion}` : f.descripcion}
                                                {f.lote && <span className="ml-1 text-xs text-muted-foreground">lote {f.lote}</span>}
                                            </td>
                                            <td className="py-1.5 px-2">
                                                {f.documento_url ? (
                                                    <a href={f.documento_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                                                        {f.documento}
                                                    </a>
                                                ) : (
                                                    f.documento
                                                )}
                                            </td>
                                            <td className="py-1.5 px-2">{f.almacen}</td>
                                            <td className={`py-1.5 px-2 text-right ${f.cantidad < 0 ? 'text-red-600' : 'text-green-600'}`}>{conSigno(f.cantidad)}</td>
                                            <td className="py-1.5 px-2 text-right font-medium">{formatearUnidades(f.saldo)}</td>
                                            <td className="py-1.5 px-2 text-xs">{f.usuario}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-semibold dark:bg-gray-800/50">
                                        <td className="py-1.5 px-2" colSpan={5}>
                                            Stock final del período
                                        </td>
                                        <td className="py-1.5 px-2 text-right">{formatearUnidades(kardex.stock_final)}</td>
                                        <td />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
