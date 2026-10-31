/**
 * Componente: ModalHistorialPrecioComponent
 * Modal con el historial de cambios de TODOS los precios de un producto (historial_precios),
 * filtrable por tipo de precio. Incluye precios quitados o reemplazados.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/compras.utils';
import type { ProductoConPreciosDTO } from '@/domain/entities/precios';

interface RegistroHistorial {
    id: number;
    precio_producto_id: number;
    precio_activo: boolean;
    unidad_medida: string | null;
    tipo_precio_id: number;
    tipo_precio_nombre: string | null;
    valor_anterior: string | number;
    valor_nuevo: string | number;
    fecha_cambio: string | null;
    motivo: string | null;
    usuario: string | null;
    porcentaje_cambio: string | number | null;
}

interface ModalHistorialPrecioProps {
    producto: ProductoConPreciosDTO | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ModalHistorialPrecioComponent: React.FC<ModalHistorialPrecioProps> = ({ producto, isOpen, onClose }) => {
    const [historial, setHistorial] = useState<RegistroHistorial[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState<number | null>(null);

    useEffect(() => {
        if (!isOpen || !producto) return;
        setLoading(true);
        setError('');
        setTipoFiltro(null);
        fetch(`/api/productos/${producto.id}/historial-precios?incluir_inactivos=1`, { headers: { Accept: 'application/json' } })
            .then((res) => {
                if (!res.ok) throw new Error(`Error ${res.status} al obtener historial`);
                return res.json();
            })
            .then((json) => setHistorial(json.data ?? []))
            .catch((err) => setError(err.message || 'Error al obtener historial'))
            .finally(() => setLoading(false));
    }, [isOpen, producto?.id]);

    // Tipos para el filtro: los precios actuales del producto más los que solo aparecen en el historial
    const tipos = useMemo(() => {
        const mapa = new Map<number, { nombre: string; cantidad: number }>();
        producto?.precios.forEach((p) => mapa.set(Number(p.tipo_precio_id), { nombre: p.tipo.nombre, cantidad: 0 }));
        historial.forEach((h) => {
            const actual = mapa.get(h.tipo_precio_id) ?? { nombre: h.tipo_precio_nombre ?? `Tipo #${h.tipo_precio_id}`, cantidad: 0 };
            mapa.set(h.tipo_precio_id, { ...actual, cantidad: actual.cantidad + 1 });
        });
        return [...mapa.entries()].map(([id, t]) => ({ id, ...t }));
    }, [producto, historial]);

    const filtrado = tipoFiltro === null ? historial : historial.filter((h) => h.tipo_precio_id === tipoFiltro);

    if (!isOpen || !producto) return null;

    const formatFecha = (fecha: string | null) => {
        if (!fecha) return '—';
        const d = new Date(fecha.replace(' ', 'T'));
        return isNaN(d.getTime())
            ? fecha
            : d.toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const chipClase = (activo: boolean) =>
        `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            activo
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
        }`;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70"
            onClick={onClose}
        >
            <div
                className="mx-4 flex max-h-[85vh] w-full max-w-4xl flex-col rounded-lg border border-gray-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-gray-200 bg-gray-100 px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Historial de precios</h2>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                            #{producto.id} · {producto.nombre}
                            {producto.sku && <> · {producto.sku}</>}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-gray-600 dark:text-slate-400">
                            {producto.precios.map((p) => (
                                <span key={p.id}>
                                    {p.tipo.nombre}: <span className="font-semibold text-gray-900 dark:text-slate-100">{formatCurrency(p.precio_actual)}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="text-xl leading-none text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                        ×
                    </button>
                </div>

                {/* Filtro por tipo de precio */}
                {tipos.length > 0 && (
                    <div className="flex flex-wrap gap-2 border-b border-gray-200 px-6 py-3 dark:border-slate-700">
                        <button type="button" className={chipClase(tipoFiltro === null)} onClick={() => setTipoFiltro(null)}>
                            Todos ({historial.length})
                        </button>
                        {tipos.map((t) => (
                            <button key={t.id} type="button" className={chipClase(tipoFiltro === t.id)} onClick={() => setTipoFiltro(t.id)}>
                                {t.nombre} ({t.cantidad})
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4">
                    {loading && <p className="py-8 text-center text-gray-500 dark:text-slate-400">Cargando historial...</p>}
                    {!loading && error && <p className="py-8 text-center text-red-600 dark:text-red-400">{error}</p>}
                    {!loading && !error && filtrado.length === 0 && (
                        <p className="py-8 text-center text-gray-500 dark:text-slate-400">No hay cambios registrados.</p>
                    )}
                    {!loading && !error && filtrado.length > 0 && (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-slate-700 dark:text-slate-400">
                                    <th className="py-2 pr-3">Fecha</th>
                                    <th className="py-2 pr-3">Tipo de precio</th>
                                    <th className="py-2 pr-3 text-right">Anterior</th>
                                    <th className="py-2 pr-3 text-right">Nuevo</th>
                                    <th className="py-2 pr-3 text-right">Cambio</th>
                                    <th className="py-2 pr-3">Motivo</th>
                                    <th className="py-2">Usuario</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrado.map((h) => {
                                    const anterior = Number(h.valor_anterior);
                                    const nuevo = Number(h.valor_nuevo);
                                    const sube = nuevo > anterior;
                                    const porcentaje = Number(h.porcentaje_cambio ?? 0);
                                    return (
                                        <tr key={h.id} className="border-b border-gray-100 dark:border-slate-800">
                                            <td className="whitespace-nowrap py-2 pr-3 text-gray-700 dark:text-slate-300">{formatFecha(h.fecha_cambio)}</td>
                                            <td className="py-2 pr-3 text-gray-900 dark:text-slate-100">
                                                {h.tipo_precio_nombre ?? `Tipo #${h.tipo_precio_id}`}
                                                {h.unidad_medida && <span className="block text-xs text-gray-500 dark:text-slate-400">{h.unidad_medida}</span>}
                                                {!h.precio_activo && (
                                                    <span className="block text-xs text-gray-400 dark:text-slate-500" title="Este precio ya no está activo en el producto">
                                                        (precio inactivo)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 pr-3 text-right text-gray-500 dark:text-slate-400">{formatCurrency(anterior)}</td>
                                            <td className="py-2 pr-3 text-right font-semibold text-gray-900 dark:text-slate-100">{formatCurrency(nuevo)}</td>
                                            <td
                                                className={`whitespace-nowrap py-2 pr-3 text-right font-medium ${
                                                    nuevo === anterior ? 'text-gray-500' : sube ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                }`}
                                            >
                                                {sube ? '▲ +' : nuevo < anterior ? '▼ ' : ''}
                                                {formatCurrency(nuevo - anterior)}
                                                {anterior !== 0 && <span className="block text-xs font-normal">{porcentaje.toFixed(1)}%</span>}
                                            </td>
                                            <td className="py-2 pr-3 text-gray-700 dark:text-slate-300">{h.motivo || '—'}</td>
                                            <td className="py-2 text-gray-700 dark:text-slate-300">{h.usuario || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex justify-end border-t border-gray-200 px-6 py-3 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
