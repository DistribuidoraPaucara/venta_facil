/**
 * Component: CajaEstadoCard
 *
 * Responsabilidades:
 * ✅ Renderizar estado actual de la caja del usuario
 * ✅ Mostrar información de apertura/cierre
 * ✅ Mostrar montos y movimientos
 * ✅ Proveer botones de acción (Abrir/Cerrar)
 * ✅ Mostrar estado del cierre (PENDIENTE/CONSOLIDADA/RECHAZADA)
 * ✅ Permitir corrección si está rechazado
 */

import type { AperturaCaja, DesgloseMovimientos, DesgloseOperacion, DetallePagoDesglosado } from '@/domain/entities/cajas';
import { formatCurrency, formatTime } from '@/lib/cajas.utils';
import EstadoCierreBadge from '@/presentation/components/cajas/EstadoCierreBadge';

interface Cierre {
    id: number;
    estado?: string;
    observaciones_rechazo?: string;
    requiere_reapertura?: boolean;
    diferencia: number;
    monto_esperado: number;
    monto_real: number;
}

interface VentaPorTipoPago {
    tipo: string;
    codigo: string;
    total: number;
    cantidad: number;
}

interface Props {
    cajaAbiertaHoy: AperturaCaja | null;
    totalMovimientos: number;
    datosActualizados?: any; // ✅ NUEVO: Datos frescos del servidor (incluye efectivoEsperado ya calculado)
    cargandoDatos?: boolean; // ✅ NUEVO: Indicador de carga
    ventasCreditoTotales?: number; // ✅ NUEVO: Sumatoria de ventas a crédito de esta caja
    desgloseIngresos?: DesgloseOperacion[]; // ✅ NUEVO (2026-06-20): Desglose dinámico de ingresos
    desgloseEgresos?: DesgloseOperacion[]; // ✅ NUEVO (2026-06-20): Desglose dinámico de egresos
    ventasPorTipoPago?: VentaPorTipoPago[]; // ✅ NUEVO: Resumen de ventas por tipo de pago
    desgloseMovimientos?: DesgloseMovimientos | null; // ✅ NUEVO (2026-07-24): Desglose de movimientos por tipo de pago
    detallesPagoDesglosado?: DetallePagoDesglosado[]; // Cobrado en ventas por medio de pago (Efectivo / QR)
    onAbrirClick: () => void;
    onCerrarClick: () => void;
    onGastoClick?: () => void;
    onCorregirClick?: () => void;
    onConsolidarClick?: () => void; // ✅ NUEVO: Para consolidar cajas
    cierreDatos?: Cierre | null;
    esVistaAdmin?: boolean; // ✅ NUEVO
    cierresPendientes?: number; // ✅ NUEVO: Cantidad de cierres pendientes
    isConsolidating?: boolean; // ✅ NUEVO: Estado de consolidación
}

export function CajaEstadoCard({
    cajaAbiertaHoy,
    datosActualizados,
    cargandoDatos = false,
    desgloseIngresos = [],
    desgloseEgresos = [],
    ventasPorTipoPago = [],
    desgloseMovimientos = null,
    detallesPagoDesglosado = [],
    onAbrirClick,
    onCerrarClick,
    onGastoClick,
    onCorregirClick,
    onConsolidarClick,
    cierreDatos,
    esVistaAdmin = false,
    cierresPendientes = 0,
    isConsolidating = false,
}: Props) {
    // ✅ NUEVO: Detectar si la caja es del día anterior o anterior
    const esDiaAnterior = () => {
        if (!cajaAbiertaHoy) return false;
        const fechaCaja = new Date(cajaAbiertaHoy.fecha);
        const hoy = new Date();

        // Comparar solo las fechas (sin hora)
        const fechaCajaDate = new Date(fechaCaja.getFullYear(), fechaCaja.getMonth(), fechaCaja.getDate());
        const hoyDate = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

        return fechaCajaDate < hoyDate;
    };

    const isDiaAnterior = esDiaAnterior();

    // ✅ SIMPLIFICADO (2026-03-03): Confiar en los cálculos del backend
    // No hacer lógica duplicada - el servidor ya calculó todo esto
    const totalEgresos = datosActualizados?.totalEgresos || 0;
    const apertura = Number(datosActualizados?.apertura || cajaAbiertaHoy?.monto_apertura || 0);
    const vueltos = Number(datosActualizados?.sumatorialVueltos || 0);
    const anulaciones = Number(datosActualizados?.sumatorialAnulaciones || 0);
    const ventasCredito = Number(datosActualizados?.ventasCreditoTotales || 0);
    // Ventas: lo cobrado (efectivo + QR, desde detalles de pago) más lo vendido a crédito
    const totalVentas = Number(datosActualizados?.totalDetallesPago || 0) + ventasCredito;
    const cobradoPor = (codigo: string) =>
        detallesPagoDesglosado.filter((d) => String(d.codigo ?? d.tipo).toUpperCase() === codigo).reduce((s, d) => s + Number(d.total || 0), 0);
    const ventasEfectivo = cobradoPor('EFECTIVO');
    const ventasQr = cobradoPor('TRANSFERENCIA/QR');
    // Ingresos que no son ventas (ej. ingreso manual): se muestran aparte en el resumen
    const otrosIngresos = desgloseIngresos.filter((i) => !/^venta$/i.test(i.nombre) && i.codigo?.toUpperCase() !== 'VENTA');
    // Resultado: lo que debe haber en el cajón y en transferencias (el servidor ya lo calculó por medio de pago)
    const efectivoEnCaja = desgloseMovimientos?.totales.efectivo;
    const transferencias = desgloseMovimientos?.totales.transferencia;
    const totalEsperado = Number(datosActualizados?.efectivoEsperado || 0);
    const fechaApertura = cajaAbiertaHoy ? new Date(cajaAbiertaHoy.fecha) : null;

    if (!cajaAbiertaHoy) {
        return (
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                <div className="p-2">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Mi Caja del Día</h3>
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
                            ⚠️ Sin abrir
                        </span>
                    </div>

                    <div className="py-8 text-center">
                        <div className="mx-auto h-12 w-12 text-4xl text-gray-400">💰</div>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No tienes caja abierta hoy</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {isDiaAnterior
                                ? '💡 Tienes una caja abierta de días anteriores. Verifica el historial.'
                                : 'Debes abrir una caja para comenzar a trabajar.'}
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={onAbrirClick}
                                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
                            >
                                💰 Abrir Caja
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
            <div className="p-4 sm:p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-4">
                        {cargandoDatos && <p className="text-xs text-blue-600 dark:text-blue-400">Actualizando...</p>}

                        {/* Resumen del día en una fila: apertura, ventas, egresos y vueltos */}
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Apertura</p>
                                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(apertura)}</p>
                            </div>
                            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Ventas</p>
                                <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(totalVentas)}</p>
                                {(ventasEfectivo > 0 || ventasQr > 0) && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Efectivo {formatCurrency(ventasEfectivo)} · QR {formatCurrency(ventasQr)}
                                    </p>
                                )}
                                {ventasCredito > 0 && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Crédito {formatCurrency(ventasCredito)}</p>
                                )}
                            </div>
                            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Egresos</p>
                                <p className="text-lg font-bold text-red-700 dark:text-red-300">{formatCurrency(totalEgresos)}</p>
                                {desgloseEgresos.length > 0 && (
                                    <p className="truncate text-xs text-gray-600 dark:text-gray-400" title={desgloseEgresos.map((e) => `${e.nombre}: ${formatCurrency(e.total)}`).join(' · ')}>
                                        {desgloseEgresos.map((e) => e.nombre).join(' · ')}
                                    </p>
                                )}
                            </div>
                            <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Vueltos / cambio</p>
                                <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{formatCurrency(vueltos)}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Salen del efectivo</p>
                            </div>
                        </div>

                        {otrosIngresos.length > 0 && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Otros ingresos: {otrosIngresos.map((i) => `${i.nombre} ${formatCurrency(i.total)}`).join(' · ')}
                            </p>
                        )}

                        {/* Resultado: lo que debe haber al cerrar. El efectivo a contar es el dato principal */}
                        {efectivoEnCaja !== undefined ? (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-3 md:col-span-2 dark:border-yellow-600 dark:bg-yellow-900/20">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">💵 Efectivo a contar en caja</p>
                                    <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{formatCurrency(efectivoEnCaja)}</p>
                                    {/* La cuenta, para que el cajero vea de dónde sale (antes era el bloque "Efectivo real esperado") */}
                                    {desgloseMovimientos && (
                                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                            {formatCurrency(apertura)} apertura + {formatCurrency(desgloseMovimientos.entradas.efectivo)} cobrado en efectivo
                                            {' − '}
                                            {formatCurrency(desgloseMovimientos.salidas.efectivo)} salidas en efectivo
                                            {vueltos > 0 && ` (vueltos ${formatCurrency(vueltos)}${totalEgresos > 0 ? ` · egresos ${formatCurrency(totalEgresos)}` : ''})`}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">📱 Transferencias / QR</p>
                                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(transferencias ?? 0)}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/40">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Total esperado (efectivo + QR): <strong className="text-gray-900 dark:text-white">{formatCurrency(totalEsperado)}</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-3 dark:border-yellow-600 dark:bg-yellow-900/20">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total esperado (efectivo + QR)</p>
                                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{formatCurrency(totalEsperado)}</p>
                            </div>
                        )}

                        {anulaciones > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                ℹ️ Ventas anuladas: {formatCurrency(anulaciones)} (referencial, no cambia el efectivo esperado)
                            </p>
                        )}
                    </div>

                    {/* Acciones - Usuario Normal */}
                    {!esVistaAdmin && (
                        <div className="mt-6 border-t border-gray-300 pt-6 lg:mt-0 lg:w-auto lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6 dark:border-gray-700">
                            {/* Información de la Caja */}
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Caja</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{cajaAbiertaHoy.caja.nombre}</p>
                                {cajaAbiertaHoy.cierre ? (
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                        ❌ Cerrada
                                    </span>
                                ) : (
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isDiaAnterior ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}
                                    >
                                        {isDiaAnterior
                                            ? `⏳ Abierta desde ${fechaApertura?.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(cajaAbiertaHoy.fecha)}`
                                            : `✅ Abierta hoy a las ${formatTime(cajaAbiertaHoy.fecha)}`}
                                    </span>
                                )}
                                {isDiaAnterior && !cajaAbiertaHoy.cierre && (
                                    <p className="text-xs text-orange-700 dark:text-orange-300">Es de un día anterior: ciérrala para empezar la caja de hoy.</p>
                                )}
                            </div>
                            {!cajaAbiertaHoy.cierre ? (
                                <div className="mt-6 flex flex-wrap gap-2">
                                    <button
                                        onClick={onCerrarClick}
                                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
                                    >
                                        🔒 Cerrar Caja
                                    </button>
                                    {onGastoClick && (
                                        <button
                                            onClick={onGastoClick}
                                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800"
                                        >
                                            💱 Registrar Movimiento
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700">
                                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                                            Caja cerrada a las {formatTime(cajaAbiertaHoy.cierre.created_at)}
                                        </p>
                                        {cajaAbiertaHoy.cierre.diferencia !== 0 && (
                                            <p
                                                className={`text-sm font-medium ${
                                                    cajaAbiertaHoy.cierre.diferencia > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}
                                            >
                                                Diferencia: {formatCurrency(cajaAbiertaHoy.cierre.diferencia)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Estado del Cierre - NUEVO */}
                                    {cierreDatos && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                                                <EstadoCierreBadge estado={cierreDatos.estado as any} size="md" />
                                            </div>

                                            {cierreDatos.estado === 'RECHAZADA' && cierreDatos.observaciones_rechazo && (
                                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                                                    <p className="mb-1 text-xs font-semibold text-red-800 dark:text-red-300">
                                                        ⚠️ Motivo del Rechazo:
                                                    </p>
                                                    <p className="text-sm text-red-700 dark:text-red-200">{cierreDatos.observaciones_rechazo}</p>
                                                    {cierreDatos.requiere_reapertura && (
                                                        <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">
                                                            ⚠️ Requiere reapertura de caja
                                                        </p>
                                                    )}
                                                    {onCorregirClick && (
                                                        <button
                                                            onClick={onCorregirClick}
                                                            className="mt-3 w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                                        >
                                                            🔧 Corregir Cierre
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {cierreDatos.estado === 'CONSOLIDADA' && (
                                                <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                                                    <p className="text-sm text-green-700 dark:text-green-200">
                                                        ✅ Tu cierre fue consolidado y aprobado
                                                    </p>
                                                </div>
                                            )}

                                            {cierreDatos.estado === 'PENDIENTE' && (
                                                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                                                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                                                        ⏳ Tu cierre está pendiente de verificación por el administrador
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
