import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@/presentation/components/ui/button';

interface IngredienteForm {
    receta_ingrediente_id: string;
    cantidad_usada: string;
    nombre?: string;
    cantidad_requerida?: number;
}

interface FormProduccionProps {
    fechaSeleccionada: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function FormProduccion({ fechaSeleccionada, onClose, onSuccess }: FormProduccionProps) {
    const [formData, setFormData] = useState({
        producto_id: '',
        cantidad_producida: '',
        observaciones: '',
    });

    const [ingredientes, setIngredientes] = useState<IngredienteForm[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const queryClient = useQueryClient();

    // Fetch productos disponibles
    const { data: productosDisponibles } = useQuery({
        queryKey: ['productos-disponibles-produccion'],
        queryFn: async () => {
            const response = await axios.get('/api/producciones/productos/disponibles');
            return response.data.data;
        },
    });

    // Crear producción mutation
    const createProduccion = useMutation({
        mutationFn: async () => {
            const payload = {
                producto_id: formData.producto_id,
                fecha_produccion: fechaSeleccionada,
                cantidad_producida: formData.cantidad_producida,
                observaciones: formData.observaciones,
                ingredientes: ingredientes.map((i) => ({
                    receta_ingrediente_id: i.receta_ingrediente_id,
                    cantidad_usada: i.cantidad_usada,
                })),
            };

            const response = await axios.post('/api/producciones', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['producciones-dia'] });
            queryClient.invalidateQueries({ queryKey: ['reporte-produccion-dia'] });
            onSuccess();
        },
        onError: (error: any) => {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                alert(error.response.data.message);
            }
        },
    });

    const handleProductoChange = (productoId: string) => {
        setFormData({ ...formData, producto_id: productoId });

        // Buscar el producto seleccionado y cargar sus ingredientes
        const producto = productosDisponibles?.find((p: any) => p.id.toString() === productoId);
        if (producto?.receta?.ingredientes) {
            setIngredientes(
                producto.receta.ingredientes.map((ing: any) => ({
                    receta_ingrediente_id: ing.id.toString(),
                    cantidad_usada: ing.cantidad_requerida.toString(),
                    nombre: ing.ingrediente.nombre,
                    cantidad_requerida: ing.cantidad_requerida,
                }))
            );
        }
    };

    const handleIngredienteChange = (index: number, field: string, value: string) => {
        const nuevosIngredientes = [...ingredientes];
        (nuevosIngredientes[index] as any)[field] = value;
        setIngredientes(nuevosIngredientes);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!formData.producto_id) {
            setErrors({ producto_id: 'Selecciona un producto' });
            return;
        }

        if (!formData.cantidad_producida) {
            setErrors({ cantidad_producida: 'Ingresa la cantidad producida' });
            return;
        }

        await createProduccion.mutateAsync();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Nueva Producción</h2>
                    <button onClick={onClose} className="p-2 hover:bg-green-600 rounded-lg transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Fecha */}
                    <div>
                        <label className="block font-bold mb-2">Fecha</label>
                        <div className="p-3 bg-gray-100 rounded-lg text-gray-700 font-medium">
                            {new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </div>
                    </div>

                    {/* Producto */}
                    <div>
                        <label className="block font-bold mb-2">Producto a Producir *</label>
                        <select
                            value={formData.producto_id}
                            onChange={(e) => handleProductoChange(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="">Selecciona un producto</option>
                            {productosDisponibles?.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                        {errors.producto_id && (
                            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {errors.producto_id}
                            </p>
                        )}
                    </div>

                    {/* Cantidad Producida */}
                    <div>
                        <label className="block font-bold mb-2">Cantidad Producida *</label>
                        <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={formData.cantidad_producida}
                            onChange={(e) => setFormData({ ...formData, cantidad_producida: e.target.value })}
                            placeholder="Ej: 12.5"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        {errors.cantidad_producida && (
                            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> {errors.cantidad_producida}
                            </p>
                        )}
                    </div>

                    {/* Ingredientes */}
                    {ingredientes.length > 0 && (
                        <div className="border-t pt-6">
                            <h3 className="font-bold text-lg mb-4">Ingredientes Utilizados</h3>
                            <div className="space-y-3">
                                {ingredientes.map((ingrediente, index) => (
                                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                        <p className="font-medium text-sm mb-2">{ingrediente.nombre}</p>
                                        <div className="flex gap-3 items-end">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                                    Cantidad Utilizada
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    min="0"
                                                    value={ingrediente.cantidad_usada}
                                                    onChange={(e) =>
                                                        handleIngredienteChange(index, 'cantidad_usada', e.target.value)
                                                    }
                                                    placeholder="0"
                                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-600">
                                                (Requerida: {ingrediente.cantidad_requerida})
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Observaciones */}
                    <div>
                        <label className="block font-bold mb-2">Observaciones</label>
                        <textarea
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            rows={3}
                            placeholder="Ej: Producción realizada con atraso, ingredientes de calidad superior"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

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
                            disabled={createProduccion.isPending}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
                        >
                            {createProduccion.isPending ? 'Registrando...' : 'Registrar Producción'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
