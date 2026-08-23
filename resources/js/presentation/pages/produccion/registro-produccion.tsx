import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Button } from '@/presentation/components/ui/button';

interface ProduccionMasivaDetalle {
    id: number;
    producto_id: number;
    producto_nombre: string;
    cantidad_producida: number;
    observaciones: string;
}

interface ProduccionMasiva {
    id: number;
    fecha_produccion: string;
    registrado_por: string;
    estado: 'en_proceso' | 'completada' | 'cancelada';
    total_detalles: number;
    total_cantidad: number;
    created_at: string;
    detalles: ProduccionMasivaDetalle[];
}

export default function RegistroProduccion() {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [fechaFiltro, setFechaFiltro] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const queryClient = useQueryClient();

    // Fetch producciones masivas
    const { data: produccionesData, isLoading } = useQuery({
        queryKey: ['producciones-masivas', fechaFiltro, estadoFiltro],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (fechaFiltro) params.append('fecha', fechaFiltro);
            if (estadoFiltro) params.append('estado', estadoFiltro);

            const response = await axios.get(`/api/producciones/masiva/registro?${params.toString()}`);
            return response.data.data;
        },
    });

    // Delete produccion masiva
    const deleteProduccionMasiva = useMutation({
        mutationFn: async (produccionId: number) => {
            await axios.delete(`/api/producciones/masiva/${produccionId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['producciones-masivas'] });
        },
    });

    // Cambiar estado
    const cambiarEstado = useMutation({
        mutationFn: async ({ produccionId, estado }: { produccionId: number; estado: string }) => {
            await axios.put(`/api/producciones/masiva/${produccionId}/estado`, { estado });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['producciones-masivas'] });
        },
    });

    const producciones: ProduccionMasiva[] = produccionesData || [];

    const getEstadoBadge = (estado: string) => {
        const estilos: Record<string, { bg: string; text: string; icon: string }> = {
            completada: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: '✓' },
            en_proceso: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', icon: '⏳' },
            cancelada: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: '✕' },
        };

        const estilo = estilos[estado] || estilos.en_proceso;

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${estilo.bg} ${estilo.text}`}>
                {estilo.icon} {estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ')}
            </span>
        );
    };

    return (
        <AppLayout>
            <Head title="Registro de Producciones Masivas" />
            <div className="space-y-6 p-6 bg-white dark:bg-gray-900 min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Registro de Producciones Masivas</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Visualiza y administra los lotes de producción registrados
                        </p>
                    </div>
                    <Button
                        onClick={() => window.location.href = '/produccion/produccion-masiva'}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Producción Masiva
                    </Button>
                </div>

                {/* Filtros */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <Calendar className="w-4 h-4 inline mr-2" />
                                Filtrar por Fecha
                            </label>
                            <input
                                type="date"
                                value={fechaFiltro}
                                onChange={(e) => setFechaFiltro(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Filtrar por Estado
                            </label>
                            <select
                                value={estadoFiltro}
                                onChange={(e) => setEstadoFiltro(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Todos los estados</option>
                                <option value="completada">Completada</option>
                                <option value="en_proceso">En Proceso</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <Button
                                onClick={() => {
                                    setFechaFiltro('');
                                    setEstadoFiltro('');
                                }}
                                className="w-full bg-gray-600 hover:bg-gray-700"
                            >
                                Limpiar Filtros
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Lista de Producciones Masivas */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                            Cargando producciones masivas...
                        </div>
                    ) : producciones.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                            <p className="text-gray-600 dark:text-gray-300 font-medium">
                                No hay producciones masivas registradas
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                Comienza creando una nueva producción masiva
                            </p>
                        </div>
                    ) : (
                        producciones.map((produccion) => (
                            <div
                                key={produccion.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                            >
                                {/* Cabecera */}
                                <div
                                    onClick={() => setExpandedId(expandedId === produccion.id ? null : produccion.id)}
                                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        {expandedId === produccion.id ? (
                                            <ChevronUp className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                        )}

                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                #{produccion.id} | Producción del {new Date(produccion.fecha_produccion).toLocaleDateString('es-ES', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Registrado por: <span className="font-medium">{produccion.registrado_por}</span>
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <div className="mb-2">{getEstadoBadge(produccion.estado)}</div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {produccion.total_detalles} producto{produccion.total_detalles !== 1 ? 's' : ''} •{' '}
                                                {produccion.total_cantidad.toFixed(2)} unidades
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Detalles (expandible) */}
                                {expandedId === produccion.id && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left font-semibold text-sm text-gray-900 dark:text-white">
                                                            Producto
                                                        </th>
                                                        <th className="px-6 py-3 text-right font-semibold text-sm text-gray-900 dark:text-white">
                                                            Cantidad
                                                        </th>
                                                        <th className="px-6 py-3 text-left font-semibold text-sm text-gray-900 dark:text-white">
                                                            Observaciones
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {produccion.detalles.map((detalle, idx) => (
                                                        <tr
                                                            key={detalle.id}
                                                            className={`${
                                                                idx % 2 === 0
                                                                    ? 'bg-white dark:bg-gray-800'
                                                                    : 'bg-gray-50 dark:bg-gray-700/30'
                                                            } border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition`}
                                                        >
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                                {detalle.producto_nombre}
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                                                                {detalle.cantidad_producida.toFixed(2)}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                                {detalle.observaciones || '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Acciones */}
                                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                                            {produccion.estado !== 'completada' && (
                                                <Button
                                                    onClick={() =>
                                                        cambiarEstado.mutate({
                                                            produccionId: produccion.id,
                                                            estado: 'completada',
                                                        })
                                                    }
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Marcar como Completada
                                                </Button>
                                            )}

                                            <Button
                                                onClick={() => {
                                                    if (confirm('¿Eliminar esta producción masiva? Esta acción no se puede deshacer.')) {
                                                        deleteProduccionMasiva.mutate(produccion.id);
                                                    }
                                                }}
                                                className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
