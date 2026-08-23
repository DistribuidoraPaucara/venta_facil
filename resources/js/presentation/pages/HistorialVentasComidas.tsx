/**
 * Page: Historial de Ventas de Comidas
 *
 * Muestra el listado de ventas de comidas y permite ver detalles
 * ✅ NUEVO (2026-08-23)
 */

import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { DetalleVentaModal } from '@/presentation/components/DetalleVentaModal';
import { Search, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Venta {
    id: number;
    numero: string;
    fecha: string;
    cliente_nombre: string | null;
    usuario_nombre: string;
    tipo_pago_nombre: string;
    total: number;
    estado_documento: string;
}

interface VentasResponse {
    success: boolean;
    data: Venta[];
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function HistorialVentasComidas() {
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [ventaSeleccionada, setVentaSeleccionada] = useState<number | null>(null);
    const [showDetalles, setShowDetalles] = useState(false);

    // Cargar ventas al montar
    useEffect(() => {
        cargarVentas();
    }, []);

    const cargarVentas = async () => {
        setCargando(true);
        try {
            // Simulamos que obtenemos ventas de comidas desde una API
            // En producción, esto sería un endpoint real
            const response = await fetch('/api/ventas-comidas-historial');

            if (response.ok) {
                const data: VentasResponse = await response.json();
                if (data.success) {
                    setVentas(data.data);
                }
            } else {
                // Si no existe el endpoint, mostramos un mensaje
                toast.error('No se pudieron cargar las ventas');
            }
        } catch (error) {
            console.log('Nota: Endpoint /api/ventas-comidas-historial no disponible aún');
            setCargando(false);
            return;
        }
        setCargando(false);
    };

    const ventasFiltradas = ventas.filter(venta =>
        venta.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
        (venta.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ?? false) ||
        venta.usuario_nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <AppLayout>
            <Head title="Historial Ventas Comidas" />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <div className="mx-auto max-w-4xl">
                    {/* Encabezado */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            🍦 Historial de Ventas
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Ver detalles de ventas de comidas/helados registradas
                        </p>
                    </div>

                    {/* Buscador */}
                    <Card className="mb-6 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <CardContent className="pt-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar por número de venta, cliente o vendedor..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Listado de Ventas */}
                    <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">
                                Ventas Registradas ({ventasFiltradas.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {cargando ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                    <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando ventas...</span>
                                </div>
                            ) : ventasFiltradas.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {busqueda ? 'No se encontraron ventas que coincidan con tu búsqueda' : 'No hay ventas registradas aún'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {ventasFiltradas.map((venta) => (
                                        <button
                                            key={venta.id}
                                            onClick={() => {
                                                setVentaSeleccionada(venta.id);
                                                setShowDetalles(true);
                                            }}
                                            className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-left"
                                        >
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {venta.numero}
                                                    </p>
                                                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                                        {venta.estado_documento}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <span>👤 {venta.cliente_nombre || 'Cliente General'}</span>
                                                    <span>💼 {venta.usuario_nombre}</span>
                                                    <span>💳 {venta.tipo_pago_nombre}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    {new Date(venta.fecha).toLocaleDateString('es-BO', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-green-600 dark:text-green-400">
                                                        {formatCurrency(venta.total)}
                                                    </p>
                                                </div>
                                                <button className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-blue-600 dark:text-blue-400">
                                                    <Eye size={20} />
                                                </button>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modal de Detalles */}
            {ventaSeleccionada && (
                <DetalleVentaModal
                    ventaId={ventaSeleccionada}
                    isOpen={showDetalles}
                    onClose={() => {
                        setShowDetalles(false);
                        setVentaSeleccionada(null);
                    }}
                />
            )}
        </AppLayout>
    );
}
