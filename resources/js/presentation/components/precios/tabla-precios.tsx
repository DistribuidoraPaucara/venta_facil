/**
 * Componente: TablaPreciosComponent
 * Tabla de productos con una columna editable por tipo de precio
 */

import React, { useMemo, useRef, useState } from 'react';
import { formatCurrency } from '@/lib/compras.utils';
import type { OrdenTablaPrecios, PrecioProductoDTO, ProductoConPreciosDTO, TipoPrecioEntity } from '@/domain/entities/precios';

interface TablaPreciosProps {
    productos: ProductoConPreciosDTO[];
    tiposPrecio: TipoPrecioEntity[];
    onGuardarPrecio: (producto: ProductoConPreciosDTO, precio: PrecioProductoDTO, precioNuevo: number) => Promise<void>;
    onEliminarPrecio: (producto: ProductoConPreciosDTO, precio: PrecioProductoDTO) => Promise<void>;
    onEditarPrecio: (precio: PrecioProductoDTO) => void;
    onVerHistorial: (producto: ProductoConPreciosDTO) => void;
    onBuscarCompras?: (productoId: number) => void;
    orden?: OrdenTablaPrecios;
    direccion?: 'asc' | 'desc';
    onOrdenar?: (columna: OrdenTablaPrecios) => void;
    loading?: boolean;
}

const getMargenColor = (porcentaje: number): string => {
    if (porcentaje > 20) return 'text-green-600 dark:text-green-400';
    if (porcentaje > 10) return 'text-blue-600 dark:text-blue-400';
    if (porcentaje < 10) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
};

interface CeldaPrecioProps {
    precio: PrecioProductoDTO;
    esBase: boolean;
    onGuardar: (precioNuevo: number) => Promise<void>;
    onEditarConMotivo: () => void;
    onEliminar: () => Promise<void>;
}

/**
 * Precio editable en línea: clic (o Enter con foco) para editar, Enter/salir para guardar, Esc para cancelar
 */
const CeldaPrecio: React.FC<CeldaPrecioProps> = ({ precio, esBase, onGuardar, onEditarConMotivo, onEliminar }) => {
    const [editando, setEditando] = useState(false);
    const [valor, setValor] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const cancelado = useRef(false);

    const empezar = () => {
        cancelado.current = false;
        setValor(String(precio.precio_actual));
        setError('');
        setEditando(true);
    };

    const terminar = async () => {
        if (cancelado.current) return;
        const nuevo = Number(valor.replace(',', '.'));
        if (valor.trim() === '' || isNaN(nuevo) || nuevo < 0) {
            setError('Precio inválido');
            return;
        }
        if (nuevo === Number(precio.precio_actual)) {
            setEditando(false);
            return;
        }
        setGuardando(true);
        try {
            await onGuardar(nuevo);
            setError('');
            setEditando(false);
        } catch (e: any) {
            setError(e?.message || 'No se pudo guardar');
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = async () => {
        if (!window.confirm(`¿Quitar el precio ${precio.tipo?.nombre ?? ''} de ${formatCurrency(precio.precio_actual)}? Quedará registrado en el historial.`)) return;
        setGuardando(true);
        setError('');
        try {
            await onEliminar();
        } catch (e: any) {
            setError(e?.message || 'No se pudo quitar');
            setGuardando(false);
        }
    };

    const borde = precio.requiere_revision
        ? 'ring-1 ring-amber-400 bg-amber-50 dark:bg-amber-950/20'
        : precio.actualizado_recientemente
            ? 'ring-1 ring-green-300 bg-green-50 dark:bg-green-950/10'
            : '';

    return (
        <div className={`rounded px-2 py-1 ${borde}`} title={precio.requiere_revision ? 'Requiere revisión: el costo cambió' : undefined}>
            {editando ? (
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    value={valor}
                    disabled={guardando}
                    onChange={(e) => setValor(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={terminar}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                        if (e.key === 'Escape') {
                            cancelado.current = true;
                            setError('');
                            setEditando(false);
                        }
                    }}
                    className="w-24 rounded border border-blue-400 bg-white px-2 py-1 text-right text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-50"
                />
            ) : (
                <div className="flex items-center justify-end gap-1">
                    <button
                        type="button"
                        onClick={empezar}
                        className="rounded px-1 text-sm font-semibold text-gray-900 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-50 dark:hover:bg-slate-700"
                        title="Clic para editar"
                    >
                        {formatCurrency(precio.precio_actual)}
                    </button>
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={onEditarConMotivo}
                        className="text-xs text-gray-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
                        title="Editar indicando el motivo"
                    >
                        ✎
                    </button>
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={eliminar}
                        disabled={guardando}
                        className="text-xs text-gray-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                        title="Quitar este precio"
                    >
                        🗑
                    </button>
                </div>
            )}
            {!esBase && (
                <div className={`text-right text-[11px] ${getMargenColor(precio.porcentaje_ganancia)}`}>
                    {formatCurrency(precio.margen_ganancia)} · {precio.porcentaje_ganancia.toFixed(1)}%
                </div>
            )}
            {guardando && <div className="text-right text-[11px] text-blue-600">Guardando...</div>}
            {error && <div className="text-right text-[11px] text-red-600 dark:text-red-400">{error}</div>}
        </div>
    );
};

export const TablaPreciosComponent: React.FC<TablaPreciosProps> = ({
    productos,
    tiposPrecio,
    onGuardarPrecio,
    onEliminarPrecio,
    onEditarPrecio,
    onVerHistorial,
    onBuscarCompras,
    orden,
    direccion = 'asc',
    onOrdenar,
    loading = false,
}) => {
    // Columnas: tipos activos de la empresa más cualquier tipo que traigan los productos y no esté en la lista
    const columnas = useMemo(() => {
        const mapa = new Map<number, { id: number; nombre: string; color: string; esBase: boolean; orden: number }>();
        tiposPrecio.forEach((t) =>
            mapa.set(Number(t.id), { id: Number(t.id), nombre: t.nombre, color: t.color, esBase: t.es_precio_base || t.codigo === 'COSTO', orden: t.orden ?? 0 })
        );
        productos.forEach((p) =>
            p.precios.forEach((pr) => {
                const id = Number(pr.tipo_precio_id);
                if (!mapa.has(id) && pr.tipo) {
                    mapa.set(id, { id, nombre: pr.tipo.nombre, color: pr.tipo.color, esBase: pr.tipo.codigo === 'COSTO', orden: 999 });
                }
            })
        );
        return [...mapa.values()].sort((a, b) => a.orden - b.orden || a.id - b.id);
    }, [tiposPrecio, productos]);

    // Encabezado clicable: ordena por la columna y alterna asc/desc
    const encabezado = (columna: OrdenTablaPrecios, texto: string) => {
        const activa = orden === columna;
        return (
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-slate-50">
                <button
                    type="button"
                    onClick={() => onOrdenar?.(columna)}
                    disabled={!onOrdenar}
                    className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 disabled:cursor-default"
                    title={`Ordenar por ${texto.toLowerCase()}`}
                >
                    {texto}
                    <span className={activa ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}>
                        {activa ? (direccion === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                </button>
            </th>
        );
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm dark:shadow-slate-900/50 p-8 text-center border border-gray-200 dark:border-slate-700">
                <div className="inline-block animate-spin">
                    <div className="h-8 w-8 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full" />
                </div>
                <p className="mt-4 text-gray-600 dark:text-slate-400">Cargando precios...</p>
            </div>
        );
    }

    if (productos.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm dark:shadow-slate-900/50 p-8 text-center border border-gray-200 dark:border-slate-700">
                <p className="text-gray-600 dark:text-slate-400">No se encontraron productos con precios</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm dark:shadow-slate-900/50 overflow-hidden border border-gray-200 dark:border-slate-700">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                        <tr>
                            {encabezado('id', 'ID')}
                            {encabezado('nombre', 'Producto')}
                            {/* {encabezado('categoria', 'Categoría')} */}
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-slate-50 whitespace-nowrap">Códigos de barra</th>
                            {columnas.map((c) => (
                                <th key={c.id} className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-slate-50 whitespace-nowrap">
                                    <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: c.color || '#999999' }} />
                                    {c.nombre}
                                </th>
                            ))}
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-slate-50">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {productos.map((producto) => (
                            <tr
                                key={producto.id}
                                className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
                                    producto.tiene_diferencia_costo_en_compra
                                        ? 'bg-red-50 dark:bg-red-950/10 border-l-4 border-red-500'
                                        : producto.costo_cambio_reciente
                                        ? 'bg-amber-50 dark:bg-amber-950/10 border-l-4 border-amber-500'
                                        : ''
                                }`}
                            >
                                <td className="px-4 py-3 text-sm align-top">
                                    <a
                                        href={`/productos/${producto.id}/edit`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                                        title="Editar producto en otra pestaña"
                                    >
                                        #{producto.id} ↗
                                    </a>
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-slate-50 align-top">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span>{producto.nombre}</span>
                                        {producto.tiene_diferencia_costo_en_compra && (
                                            <span
                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100"
                                                title="El precio de costo actual difiere de algún precio unitario en las compras"
                                            >
                                                ⛔ Diferencia de costo en compra
                                            </span>
                                        )}
                                        {producto.costo_cambio_reciente && !producto.tiene_diferencia_costo_en_compra && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                                                ⚠ Costo actualizado
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-slate-400">SKU: {producto.sku || 'N/A'}</div>
                                </td>
                                {/* <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400 align-top">
                                    {producto.categoria?.nombre || 'Sin categoría'}
                                </td> */}
                                <td className="px-4 py-3 text-xs font-mono text-gray-700 dark:text-slate-300 align-top">
                                    {producto.codigos_barra?.length ? (
                                        producto.codigos_barra.map((codigo) => <div key={codigo}>{codigo}</div>)
                                    ) : (
                                        <span className="text-gray-300 dark:text-slate-600">—</span>
                                    )}
                                </td>
                                {columnas.map((c) => {
                                    const precios = producto.precios
                                        .filter((p) => Number(p.tipo_precio_id) === c.id)
                                        .sort((a, b) => Number(a.id) - Number(b.id));
                                    return (
                                        <td key={c.id} className="px-2 py-2 text-right align-top">
                                            {precios.length === 0 ? (
                                                <span className="text-gray-300 dark:text-slate-600">—</span>
                                            ) : (
                                                <div className="space-y-1">
                                                    {precios.map((precio) => (
                                                        <CeldaPrecio
                                                            key={precio.id}
                                                            precio={precio}
                                                            esBase={c.esBase}
                                                            onGuardar={(nuevo) => onGuardarPrecio(producto, precio, nuevo)}
                                                            onEditarConMotivo={() => onEditarPrecio(precio)}
                                                            onEliminar={() => onEliminarPrecio(producto, precio)}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="px-4 py-3 align-top">
                                    <div className="flex items-center justify-center gap-2">
                                        {onBuscarCompras && (
                                            <button
                                                onClick={() => onBuscarCompras(Number(producto.id))}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                                title="Buscar compras con diferencia de costo"
                                            >
                                                💱 Actualizar Precios
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onVerHistorial(producto)}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                                            title="Ver historial de todos los precios del producto"
                                        >
                                            🕘 Historial
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
