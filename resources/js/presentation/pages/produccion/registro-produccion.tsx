import React, { useState } from 'react';
import { Plus, Calendar, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import FormProduccion from '@/presentation/components/produccion/form-produccion';
import { Button } from '@/presentation/components/ui/button';

interface Produccion {
    id: number;
    producto_id: number;
    fecha_produccion: string;
    cantidad_producida: number;
    observaciones: string;
    estado: string;
    registrado_por: number;
    producto: {
        id: number;
        nombre: string;
    };
    registradoPor: {
        id: number;
        name: string;
    };
}

interface Resumen {
    total_producciones: number;
    costo_total_ingredientes: number;
    costo_promedio_por_produccion: number;
}

export default function RegistroProduccion() {
    const [showForm, setShowForm] = useState(false);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
    const queryClient = useQueryClient();

    // Fetch producciones del día
    const { data: produccionesData, isLoading } = useQuery({
        queryKey: ['producciones-dia', fechaSeleccionada],
        queryFn: async () => {
            const response = await axios.get(`/api/producciones/dia/${fechaSeleccionada}`);
            return response.data.data;
        },
    });

    // Fetch reporte del día
    const { data: reporteData } = useQuery({
        queryKey: ['reporte-produccion-dia', fechaSeleccionada],
        queryFn: async () => {
            const response = await axios.get(`/api/producciones/reporte/dia/${fechaSeleccionada}`);
            return response.data.data;
        },
    });

    // Delete produccion mutation
    const deleteProduccion = useMutation({
        mutationFn: async (produccionId: number) => {
            await axios.delete(`/api/producciones/${produccionId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['producciones-dia'] });
            queryClient.invalidateQueries({ queryKey: ['reporte-produccion-dia'] });
        },
    });

    const handleCloseForm = () => setShowForm(false);

    const handleProduccionCreated = () => {
        queryClient.invalidateQueries({ queryKey: ['producciones-dia'] });
        queryClient.invalidateQueries({ queryKey: ['reporte-produccion-dia'] });
        handleCloseForm();
    };

    const producciones: Produccion[] = produccionesData || [];
    const resumen: Resumen = reporteData?.resumen || {
        total_producciones: 0,
        costo_total_ingredientes: 0,
        costo_promedio_por_produccion: 0,
    };

    return (
        <AppLayout>
            <Head title="Registro de Producción" />
            <div className="space-y-6 p-6 bg-white dark:bg-gray-900 min-h-screen">
                {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Registro de Producción</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Registra la elaboración de productos en la cafetería</p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Producción
                </Button>
            </div>

            {/* Selector de Fecha */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <input
                    type="date"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
            </div>

            {/* Resumen del Día */}
            {resumen.total_producciones > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Producciones del Día</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{resumen.total_producciones}</p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Costo Total de Ingredientes</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                            Bs. {resumen.costo_total_ingredientes?.toFixed(2) || '0.00'}
                        </p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Costo Promedio</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                            Bs. {resumen.costo_promedio_por_produccion?.toFixed(2) || '0.00'}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabla de Producciones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando producciones...</div>
                ) : producciones.length === 0 ? (
                    <div className="p-8 text-center">
                        <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-300 font-medium">No hay producciones para esta fecha</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Registra la primera haciendo clic en "Nueva Producción"</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-bold text-sm text-gray-900 dark:text-white">Producto</th>
                                        <th className="px-6 py-3 text-left font-bold text-sm text-gray-900 dark:text-white">Cantidad</th>
                                        <th className="px-6 py-3 text-left font-bold text-sm text-gray-900 dark:text-white">Estado</th>
                                        <th className="px-6 py-3 text-left font-bold text-sm text-gray-900 dark:text-white">Registrado por</th>
                                        <th className="px-6 py-3 text-left font-bold text-sm text-gray-900 dark:text-white">Costo Total</th>
                                        <th className="px-6 py-3 text-left font-bold text-sm text-gray-900 dark:text-white">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {producciones.map((produccion, index) => (
                                        <tr
                                            key={produccion.id}
                                            className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'} border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition`}
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-medium">{produccion.producto.nombre}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium">{produccion.cantidad_producida}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        produccion.estado === 'completada'
                                                            ? 'bg-green-100 text-green-800'
                                                            : produccion.estado === 'en_proceso'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {produccion.estado === 'completada'
                                                        ? '✓ Completada'
                                                        : produccion.estado === 'en_proceso'
                                                        ? '⏳ En Proceso'
                                                        : '✕ Cancelada'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600">{produccion.registradoPor?.name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium">Bs. 0.00</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => {
                                                        if (confirm('¿Eliminar esta producción?')) {
                                                            deleteProduccion.mutate(produccion.id);
                                                        }
                                                    }}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

                {/* Form Modal */}
                {showForm && (
                    <FormProduccion
                        fechaSeleccionada={fechaSeleccionada}
                        onClose={handleCloseForm}
                        onSuccess={handleProduccionCreated}
                    />
                )}
            </div>
        </AppLayout>
    );
}
