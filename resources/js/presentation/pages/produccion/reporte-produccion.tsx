import React, { useState } from 'react';
import { Calendar, TrendingUp, DollarSign, Package, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

interface ReporteData {
    fecha: string;
    resumen: {
        total_producciones: number;
        costo_total_ingredientes: number;
        costo_promedio_por_produccion: number;
    };
    producciones: {
        id: number;
        producto: string;
        cantidad_producida: number;
        costo_total: number;
        costo_unitario: number;
        registrado_por: string;
        estado: string;
    }[];
    ingredientes_consumidos: {
        nombre: string;
        cantidad_total: number;
        costo_total: number;
    }[];
}

export default function ReporteProduccion() {
    const [fechaInicio, setFechaInicio] = useState(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
    const [filtroProducto, setFiltroProducto] = useState('');

    // Fetch reportes
    const { data: reportesData, isLoading } = useQuery({
        queryKey: ['reportes-produccion', fechaInicio, fechaFin, filtroProducto],
        queryFn: async () => {
            // Generar un array de fechas entre fechaInicio y fechaFin
            const fechas = [];
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);

            for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
                fechas.push(d.toISOString().split('T')[0]);
            }

            // Obtener reportes para cada fecha
            const promises = fechas.map((fecha) =>
                axios.get(`/api/producciones/reporte/dia/${fecha}`)
            );

            const responses = await Promise.all(promises);
            return responses.map((r) => r.data.data);
        },
    });

    // Calcular resumen consolidado
    const calcularResumenConsolidado = () => {
        if (!reportesData) return null;

        const totalProduccionesDias = reportesData.reduce(
            (sum, r) => sum + (r.resumen?.total_producciones || 0),
            0
        );
        const costoTotalIngredientes = reportesData.reduce(
            (sum, r) => sum + (r.resumen?.costo_total_ingredientes || 0),
            0
        );
        const producciones = reportesData.flatMap((r) => r.producciones || []);

        return {
            total_dias: reportesData.length,
            total_producciones: totalProduccionesDias,
            costo_total: costoTotalIngredientes,
            costo_promedio_diario: costoTotalIngredientes / reportesData.length,
            costo_promedio_produccion:
                totalProduccionesDias > 0 ? costoTotalIngredientes / totalProduccionesDias : 0,
            producciones,
        };
    };

    const resumen = calcularResumenConsolidado();

    // Agrupar ingredientes consumidos
    const ingredientesConsolidados = reportesData?.reduce(
        (acc, r) => {
            const ings = r.ingredientes_consumidos || [];
            ings.forEach((ing: any) => {
                const existing = acc.find((a: any) => a.nombre === ing.nombre);
                if (existing) {
                    existing.cantidad_total += ing.cantidad_total;
                    existing.costo_total += ing.costo_total;
                } else {
                    acc.push({ ...ing });
                }
            });
            return acc;
        },
        [] as any[]
    );

    const handleDescargarExcel = async () => {
        try {
            const response = await axios.get('/api/produccion/reporte/excel', {
                params: {
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin,
                },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reporte-produccion-${fechaInicio}-${fechaFin}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentElement?.removeChild(link);
        } catch (error) {
            alert('Error al descargar reporte');
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Cargando reportes...</div>;
    }

    return (
        <AppLayout>
            <Head title="Reporte de Producción" />
            <div className="space-y-6 p-6 bg-white dark:bg-gray-900 min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reporte de Producción</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Análisis de producción, costos e ingredientes</p>
                </div>
                <button
                    onClick={handleDescargarExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                    <Download className="w-5 h-5" />
                    Descargar Excel
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4">
                <div>
                    <label className="block font-bold mb-2 text-sm text-gray-900 dark:text-white">Fecha Inicio</label>
                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block font-bold mb-2 text-sm text-gray-900 dark:text-white">Fecha Fin</label>
                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block font-bold mb-2 text-sm text-gray-900 dark:text-white">Producto (Opcional)</label>
                    <input
                        type="text"
                        value={filtroProducto}
                        onChange={(e) => setFiltroProducto(e.target.value)}
                        placeholder="Buscar producto..."
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                </div>
            </div>

            {/* KPIs Consolidados */}
            {resumen && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 dark:from-blue-900/30 to-blue-100 dark:to-blue-800/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Producciones</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{resumen.total_producciones}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{resumen.total_dias} días</p>
                            </div>
                            <Package className="w-10 h-10 text-blue-300 dark:text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 dark:from-green-900/30 to-green-100 dark:to-green-800/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Costo Total</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                                    Bs. {resumen.costo_total?.toFixed(2)}
                                </p>
                            </div>
                            <DollarSign className="w-10 h-10 text-green-300 dark:text-green-600" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 dark:from-purple-900/30 to-purple-100 dark:to-purple-800/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Promedio/Día</p>
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                                    Bs. {resumen.costo_promedio_diario?.toFixed(2)}
                                </p>
                            </div>
                            <TrendingUp className="w-10 h-10 text-purple-300 dark:text-purple-600" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 dark:from-orange-900/30 to-orange-100 dark:to-orange-800/30 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Costo/Producción</p>
                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                                    Bs. {resumen.costo_promedio_produccion?.toFixed(2)}
                                </p>
                            </div>
                            <Calendar className="w-10 h-10 text-orange-300 dark:text-orange-600" />
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla de Producciones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Detalle de Producciones</h3>
                </div>

                {resumen && resumen.producciones.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <p className="font-medium">No hay producciones en el período seleccionado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold">Producto</th>
                                    <th className="px-4 py-3 text-right font-bold">Cantidad</th>
                                    <th className="px-4 py-3 text-right font-bold">Costo Total</th>
                                    <th className="px-4 py-3 text-right font-bold">Costo Unitario</th>
                                    <th className="px-4 py-3 text-left font-bold">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resumen.producciones.map((prod, idx) => (
                                    <tr
                                        key={idx}
                                        className={`${
                                            idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                                        } border-b border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition`}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{prod.producto}</td>
                                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{prod.cantidad_producida}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                            Bs. {prod.costo_total?.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                            Bs. {prod.costo_unitario?.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                {prod.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Tabla de Ingredientes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Ingredientes Consumidos</h3>
                </div>

                {!ingredientesConsolidados || ingredientesConsolidados.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <p className="font-medium">No hay datos de ingredientes</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-gray-900 dark:text-white">Ingrediente</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">Cantidad Total</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">Costo Total</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">Costo Promedio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ingredientesConsolidados.map((ing, idx) => (
                                    <tr
                                        key={idx}
                                        className={`${
                                            idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                                        } border-b border-gray-200 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-gray-700/50 transition`}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{ing.nombre}</td>
                                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{ing.cantidad_total?.toFixed(3)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                            Bs. {ing.costo_total?.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                            Bs.{' '}
                                            {(ing.costo_total / ing.cantidad_total)?.toFixed(2) || '0.00'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Tabla de Rentabilidad */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Análisis de Rentabilidad por Producto</h3>
                </div>

                {resumen && resumen.producciones.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <p className="font-medium">No hay datos de rentabilidad</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-gray-900 dark:text-white">Producto</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">Producidas</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">Costo Unit.</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">Precio Venta*</th>
                                    <th className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">Margen Unitario</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resumen.producciones.map((prod, idx) => (
                                    <tr
                                        key={idx}
                                        className={`${
                                            idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                                        } border-b border-gray-200 dark:border-gray-600`}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{prod.producto}</td>
                                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{prod.cantidad_producida}</td>
                                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                            Bs. {prod.costo_unitario?.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                                            (Ver ventas)
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                                            (Vinculación pendiente)
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600">
                            *Nota: La columna "Precio Venta" y "Margen Unitario" requiere vinculación con datos de ventas en
                            la Fase 5 avanzada
                        </div>
                    </div>
                )}
            </div>
            </div>
        </AppLayout>
    );
}
