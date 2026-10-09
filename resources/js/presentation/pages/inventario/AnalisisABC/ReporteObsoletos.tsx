/**
 * Página: Reporte de Productos Obsoletos
 *
 * Productos sin ventas en los últimos N días (o nunca vendidos), con el valor
 * de inventario que tienen inmovilizado — para decidir qué liquidar o descontinuar.
 */

import { Head, usePage, Link, router } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { useAuth } from '@/application/hooks/use-auth';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/presentation/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { Pagination } from '@/domain/entities/shared';

interface AnalisisItem {
    id: number;
    producto_id: number;
    almacen_id: number | null;
    clasificacion_abc: string;
    clasificacion_xyz: string | null;
    stock_promedio: number;
    costo_promedio: number;
    ultima_venta: string | null;
    producto?: {
        id: number;
        nombre: string;
        codigo: string;
    };
    almacen?: {
        id: number;
        nombre: string;
    };
}

interface PageProps extends InertiaPageProps {
    productos_obsoletos: Pagination<AnalisisItem>;
    valor_total_obsoleto: number;
    dias_sin_venta: number;
    filtros: {
        almacen_id?: number;
        dias_sin_venta?: number;
    };
    almacenes: Array<{ id: number; nombre: string }>;
}

const RUTA_REPORTE = '/inventario/analisis-abc/reportes/obsoletos';

const breadcrumbs = [
    { title: 'Inventario', href: '/inventario' },
    { title: 'Análisis ABC', href: '/inventario/analisis-abc' },
    { title: 'Productos Obsoletos', href: RUTA_REPORTE },
];

const diasDesde = (fecha: string | null): number | null => {
    if (!fecha) return null;
    const diffMs = Date.now() - new Date(fecha).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export default function ReporteObsoletos() {
    const { props } = usePage<PageProps>();
    const { can } = useAuth();

    if (!can('inventario.analisis.manage')) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Acceso Denegado" />
                <div className="text-center py-12">
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        No tienes permisos para acceder a esta página
                    </h3>
                </div>
            </AppLayout>
        );
    }

    const { productos_obsoletos: productosObsoletos, valor_total_obsoleto, dias_sin_venta, filtros, almacenes } = props;

    const [almacenId, setAlmacenId] = useState<string>(filtros.almacen_id?.toString() || '');
    const [diasSinVenta, setDiasSinVenta] = useState<string>((filtros.dias_sin_venta ?? dias_sin_venta ?? 180).toString());

    const aplicarFiltros = () => {
        router.get(
            RUTA_REPORTE,
            {
                almacen_id: almacenId || undefined,
                dias_sin_venta: diasSinVenta || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const limpiarFiltros = () => {
        setAlmacenId('');
        setDiasSinVenta('180');
        router.get(RUTA_REPORTE, {}, { preserveState: true, replace: true });
    };

    const getClasificacionColor = (clasificacion: string) => {
        switch (clasificacion) {
            case 'A':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'B':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'C':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Productos Obsoletos" />

            <div className="p-6">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Productos Obsoletos</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Productos sin ventas hace tiempo (o nunca vendidos) — plata quieta en el depósito.
                        </p>
                    </div>
                    <Link
                        href="/inventario/analisis-abc"
                        className="whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        ← Volver al Análisis ABC
                    </Link>
                </div>

                {/* Resumen */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Productos obsoletos encontrados</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{productosObsoletos.total}</p>
                    </div>
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor total inmovilizado</p>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 cursor-help text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    Estimado como stock promedio × costo promedio de cada producto obsoleto — cuánta plata tenés
                                    parada en cosas que no se venden.
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-red-600">
                            $
                            {(Number(valor_total_obsoleto) || 0).toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Almacén</label>
                            <select
                                value={almacenId}
                                onChange={(e) => setAlmacenId(e.target.value)}
                                className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            >
                                <option value="">Todos</option>
                                {almacenes.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Días sin venta (mínimo)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={diasSinVenta}
                                onChange={(e) => setDiasSinVenta(e.target.value)}
                                className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                onClick={aplicarFiltros}
                                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                Filtrar
                            </button>
                            <button
                                onClick={limpiarFiltros}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-zinc-600 dark:text-gray-300 dark:hover:bg-zinc-700"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Producto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Almacén
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Clasificación
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Stock Promedio
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Valor Inmovilizado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Última Venta
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {productosObsoletos.data.map((item) => {
                                    const valorInmovilizado = (Number(item.stock_promedio) || 0) * (Number(item.costo_promedio) || 0);
                                    const dias = diasDesde(item.ultima_venta);

                                    return (
                                        <tr key={item.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {item.producto?.nombre}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.producto?.codigo}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                                    {item.almacen?.nombre || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getClasificacionColor(item.clasificacion_abc)}`}
                                                >
                                                    {item.clasificacion_abc}
                                                    {item.clasificacion_xyz || ''}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                                    {(Number(item.stock_promedio) || 0).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-red-600">
                                                    $
                                                    {valorInmovilizado.toLocaleString('es-ES', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                                    {item.ultima_venta ? (
                                                        <>
                                                            {new Date(item.ultima_venta).toLocaleDateString('es-ES')}
                                                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                                                (hace {dias} días)
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-500 dark:text-gray-400">Sin ventas registradas</span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={`/inventario/analisis-abc/${item.id}`}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    Ver detalles
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {productosObsoletos.data.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400">
                                No hay productos obsoletos con estos filtros — buena señal.
                            </p>
                        </div>
                    )}

                    {productosObsoletos.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Página <span className="font-medium">{productosObsoletos.current_page}</span> de{' '}
                                <span className="font-medium">{productosObsoletos.last_page}</span>
                            </p>
                            <div className="flex gap-2">
                                {productosObsoletos.current_page > 1 && (
                                    <Link
                                        href={`${RUTA_REPORTE}?page=${productosObsoletos.current_page - 1}`}
                                        preserveState
                                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-zinc-700"
                                    >
                                        Anterior
                                    </Link>
                                )}
                                {productosObsoletos.current_page < productosObsoletos.last_page && (
                                    <Link
                                        href={`${RUTA_REPORTE}?page=${productosObsoletos.current_page + 1}`}
                                        preserveState
                                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-zinc-700"
                                    >
                                        Siguiente
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
