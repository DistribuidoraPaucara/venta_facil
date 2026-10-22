import type { CuentaPorPagar, CuentasPorPagarIndexResponse, FiltrosCuentasPorPagar } from '@/domain/entities/compras';
import AppLayout from '@/layouts/app-layout';
import RegistrarPagoModal from '@/presentation/components/clientes/RegistrarPagoModal';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';
import { Alert, AlertDescription } from '@/presentation/components/ui/alert';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Input } from '@/presentation/components/ui/input';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronUp,
    CreditCard,
    Eye,
    Printer,
    Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

// Helper functions
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2,
    }).format(amount);
};

// Las fechas sin hora ("2026-11-04" o "2026-11-04T00:00:00.000000Z") se leen como fecha local:
// con new Date() se toman como UTC y en Bolivia (UTC−4) salían un día antes.
const fechaLocal = (date: string): Date => {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]00:00:00(?:\.0+)?Z?)?$/.exec(date);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(date);
};

const formatDate = (date?: string | null): string => {
    if (!date) return '—';
    return fechaLocal(date).toLocaleDateString('es-BO');
};

// Colores fijos por estado: pendiente azul, parcial ámbar, vencido rojo, pagado verde
const ESTADO_ESTILOS: Record<string, string> = {
    PENDIENTE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    PARCIAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    VENCIDO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    PAGADO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const estaPagada = (cuenta: CuentaPorPagar) => cuenta.estado === 'PAGADO' || Number(cuenta.saldo_pendiente) <= 0;

// Situación del vencimiento en lenguaje simple (una cuenta pagada nunca sale como "al día" ni "vencida")
const situacionVencimiento = (cuenta: CuentaPorPagar): { texto: string; clase: string } => {
    if (estaPagada(cuenta)) return { texto: 'Pagada', clase: 'text-green-700 dark:text-green-400' };
    if (!cuenta.fecha_vencimiento) return { texto: 'Sin fecha', clase: 'text-gray-500' };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const dias = Math.round((fechaLocal(cuenta.fecha_vencimiento).getTime() - hoy.getTime()) / 86_400_000);

    if (dias < 0) return { texto: `Vencida hace ${-dias} ${-dias === 1 ? 'día' : 'días'}`, clase: 'font-semibold text-red-600 dark:text-red-400' };
    if (dias === 0) return { texto: 'Vence hoy', clase: 'font-semibold text-amber-600 dark:text-amber-400' };
    if (dias <= 7) return { texto: `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`, clase: 'text-amber-600 dark:text-amber-400' };
    return { texto: `Vence en ${dias} días`, clase: 'text-gray-500 dark:text-gray-400' };
};

interface Props extends InertiaPageProps {
    cuentasPorPagar: CuentasPorPagarIndexResponse;
}

const CuentasPorPagarIndex: React.FC<Props> = ({ cuentasPorPagar }) => {
    // Inicializar hooks con valores por defecto seguros
    const filtrosDefault: FiltrosCuentasPorPagar = {};
    const [filtros, setFiltros] = useState<FiltrosCuentasPorPagar>(cuentasPorPagar?.filtros || filtrosDefault);
    const [modalDetalle, setModalDetalle] = useState<{ isOpen: boolean; cuenta?: CuentaPorPagar }>({ isOpen: false });

    // Estados para expandir/contraer filas de pagos
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Estados para el modal de impresión
    const [modalImpresionOpen, setModalImpresionOpen] = useState(false);
    const [cuentaAImprimir, setCuentaAImprimir] = useState<CuentaPorPagar | null>(null);

    const toggleRowExpanded = (cuentaId: number) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(cuentaId)) {
            newExpandedRows.delete(cuentaId);
        } else {
            newExpandedRows.add(cuentaId);
        }
        setExpandedRows(newExpandedRows);
    };

    // Estados para el modal de pago
    const [mostrarModalPago, setMostrarModalPago] = useState(false);
    const [cuentaSeleccionadaPago, setCuentaSeleccionadaPago] = useState<CuentaPorPagar | null>(null);
    const [cuentasDelProveedor, setCuentasDelProveedor] = useState<any[]>([]);

    const handleAbrirModalPago = (cuenta: CuentaPorPagar) => {
        // Cargar cuentas del proveedor ANTES de abrir el modal
        cargarCuentasDelProveedor(cuenta.compra?.proveedor?.id);

        // Esperar un tick para asegurar que cuentasDelProveedor se actualice antes de abrir
        setTimeout(() => {
            setCuentaSeleccionadaPago(cuenta);
            setMostrarModalPago(true);
            console.log('✅ Modal de pago abierto con cuenta preseleccionada:', {
                cuenta_id: cuenta.id,
                proveedor_id: cuenta.compra?.proveedor?.id,
                saldo: cuenta.saldo_pendiente,
            });
        }, 50);
    };

    const cargarCuentasDelProveedor = async (proveedorId?: number) => {
        if (!proveedorId) return;
        try {
            // Filtrar cuentas pendientes del proveedor actual de los datos que ya tenemos
            const cuentasPendientes = cuentasPorPagar.cuentas_por_pagar.data.filter((c) => c.compra?.proveedor?.id === proveedorId);
            const cuentasFormateadas = cuentasPendientes.map((c) => ({
                id: c.id,
                venta_id: c.compra_id, // Para compras, usamos compra_id como venta_id
                numero_venta: c.compra?.numero || `#${c.compra_id}`,
                referencia_documento: '',
                fecha_venta: c.compra?.fecha || '',
                monto_original: c.monto_original,
                saldo_pendiente: c.saldo_pendiente,
                fecha_vencimiento: c.fecha_vencimiento,
                dias_vencido: c.dias_vencido,
                estado: c.estado,
            }));
            setCuentasDelProveedor(cuentasFormateadas);
            console.log('✅ Cuentas cargadas para proveedor:', { proveedorId, cantidad: cuentasFormateadas.length, cuentas: cuentasFormateadas });
        } catch (error) {
            console.error('Error cargando cuentas del proveedor:', error);
        }
    };

    const handlePagoRegistrado = () => {
        // Recargar la página para actualizar los datos
        router.get('/compras/cuentas-por-pagar');
    };

    // Estados para anular pagos
    const [pagoAAnular, setPagoAAnular] = useState<{ id: number; monto: number; cuenta_id: number } | null>(null);
    const [motivoAnulacion, setMotivoAnulacion] = useState('');
    const [anulandoPago, setAnulandoPago] = useState(false);

    const handleAnularPago = async () => {
        if (!pagoAAnular) return;

        try {
            setAnulandoPago(true);
            const response = await fetch(`/compras/cuentas-por-pagar/${pagoAAnular.cuenta_id}/anular-pago/${pagoAAnular.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    motivo: motivoAnulacion,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`✅ Pago de ${formatCurrency(pagoAAnular.monto)} anulado exitosamente`);
                setPagoAAnular(null);
                setMotivoAnulacion('');
                router.get('/compras/cuentas-por-pagar');
            } else {
                toast.error(data.message || 'Error al anular el pago');
            }
        } catch (error) {
            console.error('Error anulando pago:', error);
            toast.error('Error al anular el pago');
        } finally {
            setAnulandoPago(false);
        }
    };

    // Validación defensiva para evitar errores si cuentasPorPagar es undefined
    if (!cuentasPorPagar || !cuentasPorPagar.filtros) {
        return (
            <AppLayout>
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cargando...</h2>
                        <p className="text-gray-600 dark:text-gray-400">Por favor espere mientras se cargan los datos.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const handleFiltroChange = (field: keyof FiltrosCuentasPorPagar, value: string | boolean) => {
        const nuevosFiltros = { ...filtros, [field]: value };
        setFiltros(nuevosFiltros);

        // Aplicar filtros inmediatamente
        router.get('/compras/cuentas-por-pagar', nuevosFiltros as Record<string, string | boolean | undefined>, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const limpiarFiltros = () => {
        const filtrosVacios: FiltrosCuentasPorPagar = {};
        setFiltros(filtrosVacios);
        router.get('/compras/cuentas-por-pagar');
    };

    const irAPagina = (page: number, perPage?: string) => {
        router.get(
            '/compras/cuentas-por-pagar',
            { ...(cuentasPorPagar.filtros || {}), per_page: perPage ?? cuentasPorPagar.cuentas_por_pagar.per_page, page } as Record<
                string,
                string | number | boolean | undefined
            >,
            { preserveState: true, preserveScroll: true },
        );
    };

    // Reporte PDF con los filtros ya aplicados al listado (los que devolvió el servidor)
    const imprimirReporte = () => {
        const params = new URLSearchParams({ accion: 'stream' });
        Object.entries(cuentasPorPagar.filtros || {}).forEach(([clave, valor]) => {
            if (valor === undefined || valor === null || valor === '' || valor === false || valor === 'false') return;
            params.set(clave, String(valor));
        });
        window.open(`/compras/cuentas-por-pagar/reporte?${params.toString()}`, '_blank');
    };

    const getEstadoBadge =(estado: string) => {
        const colores = {
            PENDIENTE: 'default',
            PAGADO: 'secondary',
            VENCIDO: 'destructive',
            PARCIAL: 'outline',
        };
        return colores[estado as keyof typeof colores] || 'default';
    };

    const getEstadoPagoBadge = (estado: string) => {
        const colores = {
            REGISTRADO: 'secondary',
            CONFIRMADO: 'secondary',
            PENDIENTE: 'default',
            PROCESANDO: 'default',
            RECHAZADO: 'destructive',
            ANULADO: 'destructive',
        };
        return colores[estado as keyof typeof colores] || 'default';
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Compras', href: '/compras' },
                { title: 'Cuentas por Pagar', href: '/compras/cuentas-por-pagar' },
            ]}
        >
            <Head title="Cuentas por Pagar" />

            <div className="space-y-2 p-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cuentas por Pagar</h1>
                        <p className="text-gray-600 dark:text-gray-400">Gestión de deudas con proveedores</p>
                    </div>
                    {/* <Button
                        onClick={() => router.get('/compras/cuentas-por-pagar/create')}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nueva Cuenta por Pagar
                    </Button> */}
                </div>

                {/* Estadísticas Rápidas */}
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pendiente</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(cuentasPorPagar.estadisticas.monto_total_pendiente)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/20">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vencidas</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(cuentasPorPagar.estadisticas.monto_total_vencido)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/20">
                                <CreditCard className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cuentas Vencidas</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{cuentasPorPagar.estadisticas.cuentas_vencidas}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
                                <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio Días</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{cuentasPorPagar.estadisticas.promedio_dias_pago}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Buscar</label>
                            <Input
                                value={filtros.q || ''}
                                onChange={(e) => handleFiltroChange('q', e.target.value)}
                                placeholder="Buscar por proveedor, número..."
                                className="dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor</label>
                            <select
                                className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                value={filtros.proveedor_id || ''}
                                onChange={(e) => handleFiltroChange('proveedor_id', e.target.value)}
                            >
                                <option value="">Todos los proveedores</option>
                                {cuentasPorPagar.datosParaFiltros.proveedores.map((proveedor) => (
                                    <option key={proveedor.id} value={proveedor.id}>
                                        {proveedor.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                            <select
                                className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                value={filtros.estado || ''}
                                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="PAGADO">Pagado</option>
                                <option value="VENCIDO">Vencido</option>
                                <option value="PARCIAL">Parcial</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <label
                                className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all duration-200 ${
                                    filtros.solo_vencidas
                                        ? 'border-red-500 bg-red-50 shadow-sm dark:border-red-400 dark:bg-red-950/20'
                                        : 'border-gray-200 bg-gray-50 hover:border-red-300 hover:bg-red-50/50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-red-700 dark:hover:bg-red-950/10'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={filtros.solo_vencidas || false}
                                    onChange={(e) => handleFiltroChange('solo_vencidas', e.target.checked)}
                                    className="peer sr-only"
                                />
                                <span
                                    aria-hidden="true"
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                                        filtros.solo_vencidas
                                            ? 'border-red-500 bg-red-500 text-white dark:border-red-400 dark:bg-red-400'
                                            : 'border-gray-300 bg-white text-transparent group-hover:border-red-300 dark:border-gray-600 dark:bg-gray-800 dark:group-hover:border-red-700'
                                    } peer-focus-visible:ring-4 peer-focus-visible:ring-red-500/25`}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">Solo vencidas</span>
                                    <span className="block text-xs text-gray-600 dark:text-gray-400">Cuentas con vencimiento anterior a hoy</span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha vencimiento desde</label>
                            <Input
                                type="date"
                                value={filtros.fecha_vencimiento_desde || ''}
                                onChange={(e) => handleFiltroChange('fecha_vencimiento_desde', e.target.value)}
                                className="dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha vencimiento hasta</label>
                            <Input
                                type="date"
                                value={filtros.fecha_vencimiento_hasta || ''}
                                onChange={(e) => handleFiltroChange('fecha_vencimiento_hasta', e.target.value)}
                                className="dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                        <Button onClick={limpiarFiltros} variant="outline">
                            Limpiar Filtros
                        </Button>
                        <Button
                            onClick={imprimirReporte}
                            variant="outline"
                            className="flex items-center gap-2"
                            title="PDF con todas las cuentas que cumplen los filtros aplicados (sin paginar)"
                        >
                            <Printer className="h-4 w-4" />
                            Imprimir reporte ({cuentasPorPagar.cuentas_por_pagar.total})
                        </Button>
                    </div>
                </div>

                {/* Tabla de Cuentas por Pagar */}
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr className="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                    <th className="px-2 py-2 text-left" title="Número de la cuenta por pagar">
                                        Cuenta
                                    </th>
                                    <th className="px-2 py-2 text-left">Compra</th>
                                    <th className="px-2 py-2 text-left">Proveedor</th>
                                    <th className="px-2 py-2 text-left">Fecha compra</th>
                                    <th className="px-2 py-2 text-left">Vence</th>
                                    <th className="px-2 py-2 text-right">Original</th>
                                    <th className="px-2 py-2 text-right">Pagado</th>
                                    <th className="px-2 py-2 text-right">Saldo</th>
                                    <th className="px-2 py-2 text-center">Estado</th>
                                    <th className="px-2 py-2 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                {cuentasPorPagar.cuentas_por_pagar.data.map((cuenta) => {
                                    const situacion = situacionVencimiento(cuenta);
                                    const pagado = Number(cuenta.monto_original) - Number(cuenta.saldo_pendiente);
                                    return (
                                    <React.Fragment key={cuenta.id}>
                                        <tr className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-white">#{cuenta.id}</td>
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                <a
                                                    href={`/compras/${cuenta.compra_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                    title="Ver la compra en otra pestaña"
                                                >
                                                    {cuenta.compra?.numero || `Compra #${cuenta.compra_id}`}
                                                </a>
                                                {cuenta.compra?.numero_factura && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Fact. {cuenta.compra.numero_factura}</div>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-gray-900 dark:text-white">
                                                {cuenta.compra?.proveedor?.nombre || 'Sin proveedor'}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                                {formatDate(cuenta.compra?.fecha)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                <div className="text-gray-900 dark:text-white">{formatDate(cuenta.fecha_vencimiento)}</div>
                                                <div className={`text-xs ${situacion.clase}`}>{situacion.texto}</div>
                                            </td>
                                            <td className="px-2 py-2 text-right whitespace-nowrap text-gray-700 dark:text-gray-300">
                                                {formatCurrency(Number(cuenta.monto_original))}
                                            </td>
                                            <td className="px-2 py-2 text-right whitespace-nowrap text-green-700 dark:text-green-400">
                                                {formatCurrency(pagado)}
                                            </td>
                                            <td className="px-2 py-2 text-right font-semibold whitespace-nowrap text-gray-900 dark:text-white">
                                                {formatCurrency(Number(cuenta.saldo_pendiente))}
                                            </td>
                                            <td className="px-2 py-2 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_ESTILOS[cuenta.estado] ?? 'bg-gray-100 text-gray-700'}`}
                                                >
                                                    {cuenta.estado}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2 text-right text-sm font-medium whitespace-nowrap">
                                                <div className="flex justify-end space-x-2">
                                                    {cuenta.pagos && cuenta.pagos.length > 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => toggleRowExpanded(cuenta.id)}
                                                            title={expandedRows.has(cuenta.id) ? 'Ocultar pagos' : 'Mostrar pagos'}
                                                        >
                                                            {expandedRows.has(cuenta.id) ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="outline" onClick={() => setModalDetalle({ isOpen: true, cuenta })}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {cuenta.estado !== 'PAGADO' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAbrirModalPago(cuenta)}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            Pagar
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setCuentaAImprimir(cuenta);
                                                            setModalImpresionOpen(true);
                                                        }}
                                                        title="Imprimir"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRows.has(cuenta.id) && cuenta.pagos && cuenta.pagos.length > 0 && (
                                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                <td colSpan={10} className="px-2 py-2">
                                                    <div className="space-y-2">
                                                        <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                                                            Historial de Pagos
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {cuenta.pagos.map((pago) => (
                                                                <div
                                                                    key={pago.id}
                                                                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="mb-1 flex items-center gap-2">
                                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                                {formatCurrency(pago.monto)}
                                                                            </p>
                                                                            {pago.estado && (
                                                                                <Badge
                                                                                    variant={
                                                                                        getEstadoPagoBadge(pago.estado) as
                                                                                            | 'default'
                                                                                            | 'secondary'
                                                                                            | 'destructive'
                                                                                            | 'outline'
                                                                                    }
                                                                                >
                                                                                    {pago.estado}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {formatDate(pago.fecha_pago)} - {pago.tipo_pago?.nombre || 'Sin tipo'}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {pago.observaciones && (
                                                                            <p className="max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">
                                                                                {pago.observaciones}
                                                                            </p>
                                                                        )}
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() =>
                                                                                setPagoAAnular({
                                                                                    id: pago.id,
                                                                                    monto: pago.monto,
                                                                                    cuenta_id: cuenta.id,
                                                                                })
                                                                            }
                                                                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                                                                            title="Anular pago"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación (antes no había: desde la cuenta 16 no se podían ver) */}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <span>
                                {cuentasPorPagar.cuentas_por_pagar.total === 0
                                    ? 'Sin resultados'
                                    : `Mostrando ${(cuentasPorPagar.cuentas_por_pagar.current_page - 1) * cuentasPorPagar.cuentas_por_pagar.per_page + 1}–${Math.min(
                                          cuentasPorPagar.cuentas_por_pagar.current_page * cuentasPorPagar.cuentas_por_pagar.per_page,
                                          cuentasPorPagar.cuentas_por_pagar.total,
                                      )} de ${cuentasPorPagar.cuentas_por_pagar.total}`}
                            </span>
                            <select
                                className="rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                value={String(cuentasPorPagar.cuentas_por_pagar.per_page)}
                                onChange={(e) => irAPagina(1, e.target.value)}
                                title="Cuentas por página"
                            >
                                {[10, 15, 25, 50, 100].map((n) => (
                                    <option key={n} value={n}>
                                        {n} por página
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" disabled={cuentasPorPagar.cuentas_por_pagar.current_page <= 1} onClick={() => irAPagina(1)}>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={cuentasPorPagar.cuentas_por_pagar.current_page <= 1}
                                onClick={() => irAPagina(cuentasPorPagar.cuentas_por_pagar.current_page - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="px-2">
                                Página {cuentasPorPagar.cuentas_por_pagar.current_page} de {Math.max(cuentasPorPagar.cuentas_por_pagar.last_page, 1)}
                            </span>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={cuentasPorPagar.cuentas_por_pagar.current_page >= cuentasPorPagar.cuentas_por_pagar.last_page}
                                onClick={() => irAPagina(cuentasPorPagar.cuentas_por_pagar.current_page + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={cuentasPorPagar.cuentas_por_pagar.current_page >= cuentasPorPagar.cuentas_por_pagar.last_page}
                                onClick={() => irAPagina(cuentasPorPagar.cuentas_por_pagar.last_page)}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {cuentasPorPagar.cuentas_por_pagar.data.length === 0 && (
                        <div className="py-12 text-center">
                            <CreditCard className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay cuentas por pagar</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No se encontraron cuentas con los filtros aplicados.</p>
                        </div>
                    )}
                </div>

                {/* Modal de Detalle */}
                <Dialog open={modalDetalle.isOpen} onOpenChange={() => setModalDetalle({ isOpen: false })}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Detalle de Cuenta por Pagar</DialogTitle>
                        </DialogHeader>
                        {modalDetalle.cuenta && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Compra</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {modalDetalle.cuenta.compra?.numero || `#${modalDetalle.cuenta.compra_id}`}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {modalDetalle.cuenta.compra?.proveedor?.nombre || 'Sin proveedor'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto Original</label>
                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(modalDetalle.cuenta.monto_original)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Pendiente</label>
                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(modalDetalle.cuenta.saldo_pendiente)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Vencimiento</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {formatDate(modalDetalle.cuenta.fecha_vencimiento)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                                        <Badge
                                            variant={
                                                getEstadoBadge(modalDetalle.cuenta.estado) as 'default' | 'secondary' | 'destructive' | 'outline'
                                            }
                                        >
                                            {modalDetalle.cuenta.estado}
                                        </Badge>
                                    </div>
                                </div>

                                {modalDetalle.cuenta.observaciones && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{modalDetalle.cuenta.observaciones}</p>
                                    </div>
                                )}

                                {modalDetalle.cuenta.pagos && modalDetalle.cuenta.pagos.length > 0 && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Historial de Pagos</label>
                                        <div className="space-y-2">
                                            {modalDetalle.cuenta.pagos.map((pago) => (
                                                <div
                                                    key={pago.id}
                                                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                                                >
                                                    <div>
                                                        <div className="mb-1 flex items-center gap-2">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {formatCurrency(pago.monto)}
                                                            </p>
                                                            {pago.estado && (
                                                                <Badge
                                                                    variant={
                                                                        getEstadoPagoBadge(pago.estado) as
                                                                            | 'default'
                                                                            | 'secondary'
                                                                            | 'destructive'
                                                                            | 'outline'
                                                                    }
                                                                >
                                                                    {pago.estado}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatDate(pago.fecha_pago)} - {pago.tipo_pago?.nombre}
                                                        </p>
                                                    </div>
                                                    {pago.observaciones && (
                                                        <p className="max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">
                                                            {pago.observaciones}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3">
                                    <Button variant="outline" onClick={() => setModalDetalle({ isOpen: false })}>
                                        Cerrar
                                    </Button>
                                    {modalDetalle.cuenta.estado !== 'PAGADO' && (
                                        <Button
                                            onClick={() => {
                                                setModalDetalle({ isOpen: false });
                                                handleAbrirModalPago(modalDetalle.cuenta!);
                                            }}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            Registrar Pago
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Modal para Registrar Pago */}
                <RegistrarPagoModal
                    show={mostrarModalPago}
                    onHide={() => {
                        setMostrarModalPago(false);
                        setCuentaSeleccionadaPago(null);
                    }}
                    clienteId={0}
                    cuentasPendientes={cuentasDelProveedor}
                    onPagoRegistrado={handlePagoRegistrado}
                    cuentaIdPreseleccionada={cuentaSeleccionadaPago?.id}
                    tipo="compras"
                    verificarCaja={false}
                    tipos_pago={cuentasPorPagar?.datosParaFiltros?.tipos_pago || []}
                />

                {/* Modal de confirmación para anular pago */}
                {pagoAAnular && (
                    <Dialog
                        open={!!pagoAAnular}
                        onOpenChange={() => {
                            setPagoAAnular(null);
                            setMotivoAnulacion('');
                        }}
                    >
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-red-600">⚠️ Anular Pago</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription className="text-red-800 dark:text-red-200">
                                        ¿Está seguro de que desea anular este pago de <strong>{formatCurrency(pagoAAnular.monto)}</strong>?
                                        <p className="mt-2 text-xs">
                                            Esta acción no puede deshacerse. Se revertirán todos los movimientos asociados.
                                        </p>
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-900 dark:text-white">Motivo de anulación (opcional)</label>
                                    <textarea
                                        value={motivoAnulacion}
                                        onChange={(e) => setMotivoAnulacion(e.target.value)}
                                        placeholder="Ej: Pago registrado erróneamente, proveedor no confirma..."
                                        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                        rows={3}
                                        disabled={anulandoPago}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPagoAAnular(null);
                                        setMotivoAnulacion('');
                                    }}
                                    disabled={anulandoPago}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button variant="destructive" onClick={handleAnularPago} disabled={anulandoPago} className="flex-1">
                                    {anulandoPago ? '⏳ Anulando...' : '❌ Anular Pago'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Modal de Impresión */}
                {cuentaAImprimir && (
                    <OutputSelectionModal
                        isOpen={modalImpresionOpen}
                        onClose={() => {
                            setModalImpresionOpen(false);
                            setCuentaAImprimir(null);
                        }}
                        documentoId={cuentaAImprimir.id}
                        tipoDocumento="cuenta-por-pagar"
                        documentoInfo={{
                            numero: `#${cuentaAImprimir.id}`,
                            fecha: cuentaAImprimir.fecha_vencimiento,
                            monto: cuentaAImprimir.saldo_pendiente,
                        }}
                    />
                )}
            </div>
        </AppLayout>
    );
};

export default CuentasPorPagarIndex;
