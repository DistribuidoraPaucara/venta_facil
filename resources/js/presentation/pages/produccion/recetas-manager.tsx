import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import EditorReceta from '@/presentation/components/produccion/editor-receta';
import { Button } from '@/presentation/components/ui/button';

interface Ingrediente {
    id: number;
    producto_id: number;
    receta_id: number;
    cantidad_requerida: number;
    ingrediente: {
        id: number;
        nombre: string;
        unidad_medida: string;
        precio_compra: number;
    };
}

interface Receta {
    id: number;
    producto_id: number;
    descripcion: string;
    instrucciones: string;
    costo_estimado: number;
    activa: boolean;
    created_at: string;
    producto: {
        id: number;
        nombre: string;
        tipo_producto: string;
    };
    ingredientes: Ingrediente[];
}

export default function RecetasManager() {
    const [showEditor, setShowEditor] = useState(false);
    const [editingReceta, setEditingReceta] = useState<Receta | null>(null);
    const [expandedReceta, setExpandedReceta] = useState<number | null>(null);
    const [filtroActivas, setFiltroActivas] = useState(true);

    const queryClient = useQueryClient();

    // Fetch recetas
    const { data: recetasData, isLoading } = useQuery({
        queryKey: ['recetas', filtroActivas],
        queryFn: async () => {
            const response = await axios.get('/api/recetas', {
                params: { activas: filtroActivas ? 'true' : 'false' },
            });
            return response.data.data;
        },
    });

    // Delete receta mutation
    const deleteReceta = useMutation({
        mutationFn: async (recetaId: number) => {
            await axios.delete(`/api/recetas/${recetaId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recetas'] });
        },
    });

    // Delete ingrediente mutation
    const deleteIngrediente = useMutation({
        mutationFn: async ({ recetaId, ingredienteId }: { recetaId: number; ingredienteId: number }) => {
            await axios.delete(`/api/recetas/${recetaId}/ingredientes/${ingredienteId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recetas'] });
        },
    });

    const handleCloseEditor = () => {
        setShowEditor(false);
        setEditingReceta(null);
    };

    const handleRecetaCreated = () => {
        queryClient.invalidateQueries({ queryKey: ['recetas'] });
        handleCloseEditor();
    };

    if (isLoading) {
        return <div className="p-8 text-center">Cargando recetas...</div>;
    }

    const recetas = recetasData?.data || [];

    return (
        <AppLayout>
            <Head title="Gestión de Recetas" />
            <div className="space-y-6 p-6 bg-white dark:bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Recetas</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Administra las recetas de productos elaborados en cafetería</p>
                </div>
                <Button
                    onClick={() => setShowEditor(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Receta
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <button
                    onClick={() => setFiltroActivas(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                        filtroActivas
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    Activas
                </button>
                <button
                    onClick={() => setFiltroActivas(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                        !filtroActivas
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    Todas
                </button>
            </div>

            {/* Recetas List */}
            <div className="space-y-3">
                {recetas.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                        <p className="text-gray-600 dark:text-gray-300 font-medium">No hay recetas para mostrar</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Crea la primera receta haciendo clic en "Nueva Receta"</p>
                    </div>
                ) : (
                    recetas.map((receta: Receta) => (
                        <div key={receta.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-blue-900/20 transition bg-white dark:bg-gray-800">
                            {/* Receta Header */}
                            <div
                                className="bg-gradient-to-r from-blue-50 dark:from-blue-900/30 to-blue-100 dark:to-blue-800/30 p-4 cursor-pointer hover:from-blue-100 dark:hover:from-blue-900/50 hover:to-blue-200 dark:hover:to-blue-800/50 transition flex items-center justify-between"
                                onClick={() => setExpandedReceta(expandedReceta === receta.id ? null : receta.id)}
                            >
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{receta.producto.nombre}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{receta.descripcion}</p>
                                    <div className="flex gap-3 mt-2 text-xs">
                                        <span className={`px-2 py-1 rounded ${receta.activa ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
                                            {receta.activa ? '✓ Activa' : 'Inactiva'}
                                        </span>
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                                            {receta.ingredientes.length} ingredientes
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingReceta(receta);
                                            setShowEditor(true);
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('¿Eliminar esta receta?')) {
                                                deleteReceta.mutate(receta.id);
                                            }
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <div className="ml-2">
                                        {expandedReceta === receta.id ? (
                                            <ChevronUp className="w-5 h-5 text-gray-600" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-600" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Ingredientes */}
                            {expandedReceta === receta.id && (
                                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                                    <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Ingredientes Requeridos</h4>
                                    {receta.ingredientes.length === 0 ? (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm italic">Sin ingredientes definidos</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {receta.ingredientes.map((ingrediente) => (
                                                <div key={ingrediente.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-white">{ingrediente.ingrediente.nombre}</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {ingrediente.cantidad_requerida} {ingrediente.ingrediente.unidad_medida}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium text-gray-900 dark:text-white">Bs. {ingrediente.ingrediente.precio_compra?.toFixed(2) || '0.00'}</p>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('¿Eliminar este ingrediente?')) {
                                                                    deleteIngrediente.mutate({
                                                                        recetaId: receta.id,
                                                                        ingredienteId: ingrediente.id,
                                                                    });
                                                                }
                                                            }}
                                                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm ml-3"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

                {/* Editor Modal */}
                {showEditor && (
                    <EditorReceta
                        receta={editingReceta}
                        onClose={handleCloseEditor}
                        onSuccess={handleRecetaCreated}
                    />
                )}
            </div>
        </AppLayout>
    );
}
