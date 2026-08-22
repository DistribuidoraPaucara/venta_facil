import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface Adicion {
    id: string;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    nombre?: string;
}

interface TablaAdicionesVentaProps {
    detalleVentaId?: number;
    productoTipo: string;
    onAdicionesChange?: (adiciones: Adicion[]) => void;
}

export default function TablaAdicionesVenta({
    detalleVentaId,
    productoTipo,
    onAdicionesChange,
}: TablaAdicionesVentaProps) {
    const [adiciones, setAdiciones] = useState<Adicion[]>([]);
    const [nuevoProductoId, setNuevoProductoId] = useState('');
    const [nuevaCantidad, setNuevaCantidad] = useState('');
    const [nuevoPrecio, setNuevoPrecio] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Solo mostrar si es producto comprado
    if (productoTipo !== 'comprado') {
        return null;
    }

    // Fetch productos disponibles para adiciones
    const { data: productosDisponibles } = useQuery({
        queryKey: ['productos-adiciones'],
        queryFn: async () => {
            const response = await axios.get('/api/adiciones-venta/productos/disponibles');
            return response.data.data || [];
        },
    });

    const handleAgregarAdicion = (e: React.FormEvent) => {
        e.preventDefault();

        if (!nuevoProductoId || !nuevaCantidad || !nuevoPrecio) {
            alert('Completa todos los campos');
            return;
        }

        const producto = productosDisponibles?.find((p: any) => p.id.toString() === nuevoProductoId);
        if (!producto) return;

        const nuevaAdicion: Adicion = {
            id: Math.random().toString(),
            producto_id: parseInt(nuevoProductoId),
            cantidad: parseFloat(nuevaCantidad),
            precio_unitario: parseFloat(nuevoPrecio),
            nombre: producto.nombre,
        };

        const nuevasAdiciones = [...adiciones, nuevaAdicion];
        setAdiciones(nuevasAdiciones);

        // Reset form
        setNuevoProductoId('');
        setNuevaCantidad('');
        setNuevoPrecio('');
        setShowForm(false);

        // Notificar al padre
        onAdicionesChange?.(nuevasAdiciones);
    };

    const handleEliminarAdicion = (id: string) => {
        const nuevasAdiciones = adiciones.filter((a) => a.id !== id);
        setAdiciones(nuevasAdiciones);
        onAdicionesChange?.(nuevasAdiciones);
    };

    const totalAdiciones = adiciones.reduce((sum, a) => sum + a.cantidad * a.precio_unitario, 0);

    return (
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">Adiciones al Producto</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                    {adiciones.length} adiciones
                </span>
            </div>

            {/* Tabla de adiciones */}
            {adiciones.length > 0 && (
                <div className="bg-white rounded border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 py-2 text-left font-bold">Producto</th>
                                <th className="px-3 py-2 text-right font-bold">Cantidad</th>
                                <th className="px-3 py-2 text-right font-bold">Precio</th>
                                <th className="px-3 py-2 text-right font-bold">Subtotal</th>
                                <th className="px-3 py-2 text-center font-bold">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adiciones.map((adicion) => (
                                <tr key={adicion.id} className="border-b border-gray-200 hover:bg-blue-50">
                                    <td className="px-3 py-2">{adicion.nombre}</td>
                                    <td className="px-3 py-2 text-right">{adicion.cantidad.toFixed(3)}</td>
                                    <td className="px-3 py-2 text-right">
                                        Bs. {adicion.precio_unitario.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold">
                                        Bs. {(adicion.cantidad * adicion.precio_unitario).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleEliminarAdicion(adicion.id)}
                                            className="text-red-600 hover:text-red-800 inline-block"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-blue-50 font-bold border-t-2 border-blue-200">
                                <td colSpan={3} className="px-3 py-2 text-right">
                                    Total Adiciones:
                                </td>
                                <td className="px-3 py-2 text-right">
                                    Bs. {totalAdiciones.toFixed(2)}
                                </td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Formulario de agregar adición */}
            {!showForm ? (
                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
                >
                    <Plus className="w-4 h-4" />
                    Agregar Adición
                </button>
            ) : (
                <form onSubmit={handleAgregarAdicion} className="space-y-3 bg-white p-3 rounded border border-gray-200">
                    <div>
                        <label className="block text-xs font-bold mb-1">Producto</label>
                        <select
                            value={nuevoProductoId}
                            onChange={(e) => setNuevoProductoId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Selecciona producto</option>
                            {productosDisponibles?.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold mb-1">Cantidad</label>
                            <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={nuevaCantidad}
                                onChange={(e) => setNuevaCantidad(e.target.value)}
                                placeholder="0.00"
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">Precio Unitario</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={nuevoPrecio}
                                onChange={(e) => setNuevoPrecio(e.target.value)}
                                placeholder="0.00"
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition"
                        >
                            Agregar
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="flex-1 px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded text-sm font-medium transition"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Info */}
            <div className="flex gap-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                    Las adiciones son productos extras que se agregan a la compra (ej: jamón, salchicha). Se suman al
                    precio total del detalle.
                </p>
            </div>
        </div>
    );
}
