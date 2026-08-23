/**
 * Component: DetalleVentaModal
 *
 * Modal para mostrar detalles completos de una venta de comidas
 * Incluye productos, adicionales, pagos y resumen
 * ✅ NUEVO (2026-08-23)
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { X, Loader2 } from 'lucide-react';

interface AdicionalDetalle {
    id: number;
    producto_id: number;
    producto_nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

interface DetalleProducto {
    id: number;
    producto_id: number;
    producto_nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    adicionales: AdicionalDetalle[];
}

interface VentaDetalle {
    id: number;
    numero: string;
    fecha: string;
    cliente_id: number | null;
    cliente_nombre: string | null;
    usuario_id: number;
    usuario_nombre: string;
    tipo_pago_id: number;
    tipo_pago_nombre: string;
    subtotal: number;
    descuento: number;
    impuesto: number;
    total: number;
    monto_pagado: number;
    estado_documento: string;
    detalles: DetalleProducto[];
}

interface DetalleVentaModalProps {
    ventaId: number;
    isOpen: boolean;
    onClose: () => void;
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export function DetalleVentaModal({ ventaId, isOpen, onClose }: DetalleVentaModalProps) {
    const [venta, setVenta] = useState<VentaDetalle | null>(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !ventaId) {
            setVenta(null);
            setError(null);
            return;
        }

        const cargarDetalles = async () => {
            setCargando(true);
            setError(null);

            try {
                const response = await fetch(`/api/ventas-comidas/${ventaId}`);
                const data = await response.json();

                if (data.success && data.data) {
                    setVenta(data.data);
                } else {
                    setError('No se pudieron cargar los detalles de la venta');
                }
            } catch (err) {
                setError('Error al cargar los detalles');
                console.error(err);
            } finally {
                setCargando(false);
            }
        };

        cargarDetalles();
    }, [ventaId, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-gray-900 dark:text-white">
                        {cargando ? 'Cargando...' : `Detalles Venta ${venta?.numero}`}
                    </CardTitle>
                    <button
                        onClick={onClose}
                        className="rounded hover:bg-gray-100 p-2 dark:hover:bg-gray-700 transition"
                    >
                        <X size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                </CardHeader>

                <CardContent className="space-y-6">
                    {cargando && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando detalles...</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {venta && (
                        <>
                            {/* Información General */}
                            <div className="grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                        Número
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{venta.numero}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                        Fecha
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {new Date(venta.fecha).toLocaleDateString('es-BO')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                        Cliente
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {venta.cliente_nombre || 'Sin cliente'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                        Vendedor
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {venta.usuario_nombre}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                        Tipo Pago
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {venta.tipo_pago_nombre}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                        Estado
                                    </p>
                                    <span className="inline-block text-xs font-semibold px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                        {venta.estado_documento}
                                    </span>
                                </div>
                            </div>

                            {/* Detalle de Productos */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Productos</h3>
                                {venta.detalles.map((detalle) => (
                                    <div
                                        key={detalle.id}
                                        className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900/50"
                                    >
                                        {/* Producto Principal */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {detalle.producto_nombre}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    Cantidad: {detalle.cantidad}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(detalle.subtotal)}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    @ {formatCurrency(detalle.precio_unitario)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Adicionales */}
                                        {detalle.adicionales && detalle.adicionales.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 space-y-1 ml-2">
                                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                                    Adicionales:
                                                </p>
                                                {detalle.adicionales.map((adicional) => (
                                                    <div
                                                        key={adicional.id}
                                                        className="flex items-center justify-between text-xs"
                                                    >
                                                        <span className="text-gray-700 dark:text-gray-400">
                                                            + {adicional.producto_nombre}
                                                        </span>
                                                        <span className="text-gray-900 dark:text-white font-medium">
                                                            {formatCurrency(adicional.subtotal)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Resumen de Totales */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-400">Subtotal:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(venta.subtotal)}
                                    </span>
                                </div>
                                {venta.descuento > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700 dark:text-gray-400">Descuento:</span>
                                        <span className="font-medium text-red-600 dark:text-red-400">
                                            -{formatCurrency(venta.descuento)}
                                        </span>
                                    </div>
                                )}
                                {venta.impuesto > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700 dark:text-gray-400">Impuesto:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(venta.impuesto)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(venta.total)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-400">Pagado:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(venta.monto_pagado)}
                                    </span>
                                </div>
                            </div>

                            {/* Botón Cerrar */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={onClose}
                                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
