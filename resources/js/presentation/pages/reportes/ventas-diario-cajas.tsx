import { usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { ChevronDown, ChevronRight, FileText, Download } from 'lucide-react';

interface Pago {
    tipo_pago: string;
    total: number;
    cantidad: number;
    porcentaje: number;
}

interface Estado {
    estado: string;
    total: number;
    cantidad: number;
    porcentaje: number;
}

interface Cliente {
    cliente: string;
    total: number;
    cantidad: number;
}

interface Venta {
    id: number;
    numero: string;
    cliente: string;
    total: number;
    tipo_pago: string;
    estado: string;
    hora: string;
    registrado_por: string;
}

interface ResumenCaja {
    total_ventas: number;
    cantidad_ventas: number;
    ticket_promedio: number;
    monto_apertura: number;
}

interface HorarioCaja {
    apertura: string;
    cierre: string | null;
    estado: 'CERRADA' | 'ABIERTA';
    duracion: string | null;
}

interface CajaNombre {
    id: number;
    nombre: string;
    ubicacion: string;
    usuario: string;
    usuario_id: number;
}

interface DetallesCaja {
    caja: CajaNombre;
    horario: HorarioCaja;
    resumen: ResumenCaja;
    por_tipo_pago: Pago[];
    por_estado: Estado[];
    top_clientes: Cliente[];
    cantidad_detalles: number;
    detalles_ventas: Venta[];
}

interface ResumenGeneral {
    total_ventas: number;
    cantidad_ventas: number;
    ticket_promedio: number;
    cajas_activas: number;
    por_tipo_pago: Pago[];
    por_estado: Estado[];
}

interface Reporte {
    fecha: string;
    fecha_formato: string;
    resumen_general: ResumenGeneral;
    ventas_por_caja: DetallesCaja[];
}

interface PageProps {
    reporte: Reporte;
    fecha_actual: string;
    fecha_hoy: string;
}

const formatearMoneda = (valor: number): string => {
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(valor);
};

export default function VentasDiarioCajas() {
    const { props } = usePage<PageProps>();
    const { reporte, fecha_actual, fecha_hoy } = props;
    const [fechaSeleccionada, setFechaSeleccionada] = useState(fecha_actual);
    const [cajaExpandida, setCajaExpandida] = useState<{ [key: number]: boolean }>({});

    const cambiarFecha = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFechaSeleccionada(e.target.value);
        router.get('/reportes/ventas-diario-cajas', { fecha: e.target.value });
    };

    const toggleCaja = (index: number) => {
        setCajaExpandida((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const descargarPDF = () => {
        alert('PDF - Próximamente');
    };

    const descargarExcel = () => {
        alert('Excel - Próximamente');
    };

    return (
        <AppLayout title="Reporte Diario de Ventas por Cajas">
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Reporte Diario de Ventas por Cajas
                                </h1>
                                <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                                    {reporte.fecha_formato}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <input
                                    value={fechaSeleccionada}
                                    onChange={cambiarFecha}
                                    type="date"
                                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                />
                                <Button
                                    onClick={descargarPDF}
                                    variant="outline"
                                    className="bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 border-red-600 dark:border-red-700"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    PDF
                                </Button>
                                <Button
                                    onClick={descargarExcel}
                                    variant="outline"
                                    className="bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800 border-green-600 dark:border-green-700"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Excel
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Resumen General */}
                    <Card className="mb-8 p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            📊 Resumen General del Día
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {/* Card: Total Ventas */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">Total Ventas</p>
                                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                                    Bs. {formatearMoneda(reporte.resumen_general.total_ventas)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {reporte.resumen_general.cantidad_ventas} transacciones
                                </p>
                            </div>

                            {/* Card: Ticket Promedio */}
                            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">
                                    Ticket Promedio
                                </p>
                                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                                    Bs. {formatearMoneda(reporte.resumen_general.ticket_promedio)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Por transacción</p>
                            </div>

                            {/* Card: Cajas Activas */}
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                                <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">
                                    Cajas Activas
                                </p>
                                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                                    {reporte.resumen_general.cajas_activas}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hoy</p>
                            </div>

                            {/* Card: Cantidad Ventas */}
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                                <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">
                                    Cantidad Ventas
                                </p>
                                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                                    {reporte.resumen_general.cantidad_ventas}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Transacciones totales</p>
                            </div>
                        </div>

                        {/* Desglose por Tipo de Pago y Estado */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Por Tipo de Pago */}
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3">💰 Por Tipo de Pago</h3>
                                <div className="space-y-2">
                                    {reporte.resumen_general.por_tipo_pago.map((pago) => (
                                        <div
                                            key={pago.tipo_pago}
                                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {pago.tipo_pago}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Bs. {formatearMoneda(pago.total)}
                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                    ({pago.porcentaje}%)
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Por Estado */}
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3">📋 Por Estado</h3>
                                <div className="space-y-2">
                                    {reporte.resumen_general.por_estado.map((estado) => (
                                        <div
                                            key={estado.estado}
                                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {estado.estado}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Bs. {formatearMoneda(estado.total)}
                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                    ({estado.porcentaje}%)
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Desglose por Caja */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🏪 Desglose por Caja</h2>

                        {reporte.ventas_por_caja.map((caja, index) => (
                            <Card key={index} className="overflow-hidden bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                                {/* Header de Caja */}
                                <div className="bg-gradient-to-r from-gray-700 to-gray-900 dark:from-slate-700 dark:to-slate-900 text-white px-6 py-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold">{caja.caja.nombre}</h3>
                                            <p className="text-sm text-gray-300 dark:text-gray-400">
                                                👤 {caja.caja.usuario}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                    caja.horario.estado === 'CERRADA'
                                                        ? 'bg-green-500 dark:bg-green-600 text-white'
                                                        : 'bg-yellow-500 dark:bg-yellow-600 text-white'
                                                }`}
                                            >
                                                {caja.horario.estado}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Body de Caja */}
                                <div className="px-6 py-4">
                                    {/* Horario */}
                                    <div className="flex gap-8 mb-6 pb-6 border-b border-gray-200 dark:border-slate-600">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Apertura</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {caja.horario.apertura}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Cierre</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {caja.horario.cierre || 'Abierta'}
                                            </p>
                                        </div>
                                        {caja.horario.duracion && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Duración</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {caja.horario.duracion}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Resumen de Caja */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3">
                                            <p className="text-xs text-gray-600 dark:text-gray-300">Total Ventas</p>
                                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                                Bs. {formatearMoneda(caja.resumen.total_ventas)}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-3">
                                            <p className="text-xs text-gray-600 dark:text-gray-300">Cantidad</p>
                                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                                {caja.resumen.cantidad_ventas}
                                            </p>
                                        </div>
                                        <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded p-3">
                                            <p className="text-xs text-gray-600 dark:text-gray-300">Ticket Promedio</p>
                                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                                Bs. {formatearMoneda(caja.resumen.ticket_promedio)}
                                            </p>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded p-3">
                                            <p className="text-xs text-gray-600 dark:text-gray-300">Monto Apertura</p>
                                            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                                                Bs. {formatearMoneda(caja.resumen.monto_apertura)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Desglose */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* Por Tipo de Pago */}
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                                                💳 Tipo de Pago
                                            </h4>
                                            <div className="space-y-2">
                                                {caja.por_tipo_pago.map((pago) => (
                                                    <div
                                                        key={pago.tipo_pago}
                                                        className="flex justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                                                    >
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                                            {pago.tipo_pago}
                                                        </span>
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            Bs. {formatearMoneda(pago.total)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Por Estado */}
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                                                📊 Por Estado
                                            </h4>
                                            <div className="space-y-2">
                                                {caja.por_estado.map((estado) => (
                                                    <div
                                                        key={estado.estado}
                                                        className="flex justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                                                    >
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                                            {estado.estado}
                                                        </span>
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            Bs. {formatearMoneda(estado.total)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top Clientes */}
                                    <div className="mb-6">
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                                            ⭐ Top Clientes
                                        </h4>
                                        <div className="space-y-2">
                                            {caja.top_clientes.map((cliente, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                                                >
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        {idx + 1}. {cliente.cliente}
                                                    </span>
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        Bs. {formatearMoneda(cliente.total)}
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                            ({cliente.cantidad})
                                                        </span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tabla de Ventas Colapsable */}
                                    <div>
                                        <button
                                            onClick={() => toggleCaja(index)}
                                            className="w-full flex justify-between items-center p-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded font-semibold text-gray-900 dark:text-white transition-colors"
                                        >
                                            <span>
                                                📋 Ver {caja.cantidad_detalles} Ventas Detalladas
                                            </span>
                                            {cajaExpandida[index] ? (
                                                <ChevronDown className="w-5 h-5" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5" />
                                            )}
                                        </button>

                                        {cajaExpandida[index] && (
                                            <div className="mt-3 overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-100 dark:bg-slate-700">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-gray-900 dark:text-white">
                                                                ID
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-gray-900 dark:text-white">
                                                                Número
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-gray-900 dark:text-white">
                                                                Cliente
                                                            </th>
                                                            <th className="px-3 py-2 text-right text-gray-900 dark:text-white">
                                                                Total
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-gray-900 dark:text-white">
                                                                Tipo Pago
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-gray-900 dark:text-white">
                                                                Estado
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-gray-900 dark:text-white">
                                                                Registrado por
                                                            </th>
                                                            <th className="px-3 py-2 text-left text-gray-900 dark:text-white">
                                                                Hora
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                                                        {caja.detalles_ventas.map((venta) => (
                                                            <tr
                                                                key={venta.id}
                                                                className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                            >
                                                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                                                                    {venta.id}
                                                                </td>
                                                                <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">
                                                                    {venta.numero}
                                                                </td>
                                                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                                                                    {venta.cliente}
                                                                </td>
                                                                <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                                                                    Bs.{' '}
                                                                    {formatearMoneda(venta.total)}
                                                                </td>
                                                                <td className="px-3 py-2 text-xs">
                                                                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                                        {venta.tipo_pago}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-xs">
                                                                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                                                        {venta.estado}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                                                                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs">
                                                                        {venta.registrado_por}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                                                                    {venta.hora}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
