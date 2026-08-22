import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, Info } from 'lucide-react';

interface Produccion {
    id: number;
    fecha_produccion: string;
    cantidad_producida: number;
    estado: string;
    producto_id: number;
}

interface SelectorProduccionProps {
    productoId: number;
    productoTipo: string;
    onSelectProduccion: (produccionId: number | null) => void;
    required?: boolean;
}

export default function SelectorProduccion({
    productoId,
    productoTipo,
    onSelectProduccion,
    required = false,
}: SelectorProduccionProps) {
    const [produccionSeleccionada, setProduccionSeleccionada] = useState<number | null>(null);

    // Solo mostrar si es producto elaborado
    if (productoTipo !== 'elaborado_cafeteria') {
        return null;
    }

    // Fetch producciones disponibles para este producto
    const { data: produccionesData, isLoading } = useQuery({
        queryKey: ['producciones-disponibles', productoId],
        queryFn: async () => {
            const response = await axios.get('/api/producciones', {
                params: {
                    producto_id: productoId,
                    estado: 'completada',
                },
            });
            return response.data.data || [];
        },
        enabled: !!productoId,
    });

    const producciones: Produccion[] = produccionesData?.data || produccionesData || [];

    const handleSelectProduccion = (id: number | null) => {
        setProduccionSeleccionada(id);
        onSelectProduccion(id);
    };

    if (!isLoading && producciones.length === 0) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-yellow-800">Sin producciones disponibles</p>
                    <p className="text-sm text-yellow-700">No hay producciones completadas para este producto</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="block font-bold text-sm">
                Producción {required && <span className="text-red-600">*</span>}
            </label>

            {isLoading ? (
                <div className="p-3 bg-gray-100 rounded text-gray-700 text-sm">Cargando producciones...</div>
            ) : (
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => handleSelectProduccion(null)}
                        className={`w-full text-left px-3 py-2 rounded border-2 transition ${
                            produccionSeleccionada === null
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                        <p className="font-medium">Sin producción específica</p>
                        <p className="text-xs text-gray-600">Usar stock disponible</p>
                    </button>

                    {producciones.map((produccion) => (
                        <button
                            key={produccion.id}
                            type="button"
                            onClick={() => handleSelectProduccion(produccion.id)}
                            className={`w-full text-left px-3 py-2 rounded border-2 transition ${
                                produccionSeleccionada === produccion.id
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">
                                        Fecha: {new Date(produccion.fecha_produccion).toLocaleDateString('es-ES')}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        Cantidad disponible: {produccion.cantidad_producida}
                                    </p>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-800 rounded">
                                    Completada
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <div className="flex gap-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                    Las producciones agrupan ingredientes usados para rastrear costos. Si seleccionas una, el costo se
                    asociará a esa producción.
                </p>
            </div>
        </div>
    );
}
