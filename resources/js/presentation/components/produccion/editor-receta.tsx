import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@/presentation/components/ui/button';

interface Receta {
    id: number;
    producto_id: number;
    descripcion: string;
    instrucciones: string;
    costo_estimado: number;
    activa: boolean;
    ingredientes: any[];
}

interface Ingrediente {
    producto_id: number;
    cantidad_requerida: number;
}

interface EditorRecetaProps {
    receta?: Receta | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditorReceta({ receta, onClose, onSuccess }: EditorRecetaProps) {
    const [formData, setFormData] = useState({
        producto_id: '',
        descripcion: '',
        instrucciones: '',
        activa: true,
    });

    const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
    const [nuevoIngrediente, setNuevoIngrediente] = useState({
        producto_id: '',
        cantidad_requerida: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const queryClient = useQueryClient();

    // Fetch productos disponibles (solo elaborados si es nueva, sino todos)
    const { data: productosElaborados } = useQuery({
        queryKey: ['productos-elaborados'],
        queryFn: async () => {
            const response = await axios.get('/api/recetas/productos/disponibles');
            return response.data.data;
        },
    });

    // Fetch productos para ingredientes
    const { data: productosIngredientes } = useQuery({
        queryKey: ['productos-ingredientes'],
        queryFn: async () => {
            const response = await axios.get('/api/recetas/productos/disponibles');
            return response.data.data;
        },
    });

    // Create/Update receta mutation
    const saveReceta = useMutation({
        mutationFn: async () => {
            if (receta) {
                await axios.put(`/api/recetas/${receta.id}`, {
                    descripcion: formData.descripcion,
                    instrucciones: formData.instrucciones,
                    activa: formData.activa,
                });
            } else {
                await axios.post('/api/recetas', {
                    producto_id: formData.producto_id,
                    descripcion: formData.descripcion,
                    instrucciones: formData.instrucciones,
                    activa: formData.activa,
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recetas'] });
            onSuccess();
        },
        onError: (error: any) => {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        },
    });

    // Add ingrediente mutation
    const addIngrediente = useMutation({
        mutationFn: async () => {
            if (!receta) return;
            await axios.post(`/api/recetas/${receta.id}/ingredientes`, {
                producto_id: nuevoIngrediente.producto_id,
                cantidad_requerida: nuevoIngrediente.cantidad_requerida,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recetas'] });
            setNuevoIngrediente({ producto_id: '', cantidad_requerida: '' });
        },
        onError: (error: any) => {
            if (error.response?.data?.message) {
                alert(error.response.data.message);
            }
        },
    });

    // Delete ingrediente mutation
    const deleteIngrediente = useMutation({
        mutationFn: async (ingredienteId: number) => {
            if (!receta) return;
            await axios.delete(`/api/recetas/${receta.id}/ingredientes/${ingredienteId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recetas'] });
        },
    });

    useEffect(() => {
        if (receta) {
            setFormData({
                producto_id: receta.producto_id.toString(),
                descripcion: receta.descripcion || '',
                instrucciones: receta.instrucciones || '',
                activa: receta.activa,
            });
            setIngredientes(receta.ingredientes);
        }
    }, [receta]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!formData.producto_id && !receta) {
            setErrors({ producto_id: 'Selecciona un producto' });
            return;
        }

        await saveReceta.mutateAsync();
    };

    const handleAddIngrediente = async () => {
        if (!nuevoIngrediente.producto_id) {
            alert('Selecciona un producto');
            return;
        }
        if (!nuevoIngrediente.cantidad_requerida) {
            alert('Ingresa la cantidad requerida');
            return;
        }

        await addIngrediente.mutateAsync();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                        {receta ? 'Editar Receta' : 'Nueva Receta'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-blue-600 rounded-lg transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Producto */}
                    <div>
                        <label className="block font-bold mb-2">Producto a Producir</label>
                        {receta ? (
                            <div className="p-3 bg-gray-100 rounded-lg text-gray-700 font-medium">
                                {productosElaborados?.find((p: any) => p.id === receta.producto_id)?.nombre}
                            </div>
                        ) : (
                            <select
                                value={formData.producto_id}
                                onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Selecciona un producto</option>
                                {productosElaborados?.map((p: any) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre}
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.producto_id && (
                            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {errors.producto_id}
                            </p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block font-bold mb-2">Descripción</label>
                        <textarea
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            rows={3}
                            placeholder="Ej: Empanada casera de queso"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Instrucciones */}
                    <div>
                        <label className="block font-bold mb-2">Instrucciones de Preparación</label>
                        <textarea
                            value={formData.instrucciones}
                            onChange={(e) => setFormData({ ...formData, instrucciones: e.target.value })}
                            rows={4}
                            placeholder="Pasos para preparar el producto..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Activa */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="activa"
                            checked={formData.activa}
                            onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                            className="w-5 h-5 rounded"
                        />
                        <label htmlFor="activa" className="font-medium">
                            Receta Activa
                        </label>
                    </div>

                    {/* Ingredientes */}
                    {receta && (
                        <div className="border-t pt-6">
                            <h3 className="font-bold text-lg mb-4">Ingredientes Requeridos</h3>

                            {/* Lista de ingredientes actuales */}
                            {ingredientes.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {ingredientes.map((ing: any) => (
                                        <div
                                            key={ing.id}
                                            className="flex items-center justify-between bg-gray-50 p-3 rounded"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium">{ing.ingrediente.nombre}</p>
                                                <p className="text-sm text-gray-600">
                                                    {ing.cantidad_requerida} {ing.ingrediente.unidad_medida}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => deleteIngrediente.mutate(ing.id)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Agregar nuevo ingrediente */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <label className="block font-bold">Agregar Ingrediente</label>
                                <select
                                    value={nuevoIngrediente.producto_id}
                                    onChange={(e) =>
                                        setNuevoIngrediente({
                                            ...nuevoIngrediente,
                                            producto_id: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value="">Selecciona ingrediente</option>
                                    {productosIngredientes?.map((p: any) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="number"
                                    step="0.001"
                                    min="0.001"
                                    value={nuevoIngrediente.cantidad_requerida}
                                    onChange={(e) =>
                                        setNuevoIngrediente({
                                            ...nuevoIngrediente,
                                            cantidad_requerida: e.target.value,
                                        })
                                    }
                                    placeholder="Cantidad requerida"
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />

                                <button
                                    type="button"
                                    onClick={handleAddIngrediente}
                                    disabled={addIngrediente.isPending}
                                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                    <Plus className="w-4 h-4" />
                                    Agregar Ingrediente
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-3 border-t pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saveReceta.isPending}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
                        >
                            {saveReceta.isPending ? 'Guardando...' : receta ? 'Actualizar' : 'Crear Receta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
