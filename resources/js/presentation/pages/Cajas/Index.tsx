/**
 * Page: Cajas/Index
 *
 * Responsabilidades:
 * ✅ Renderizar página principal de gestión de cajas
 * ✅ Orquestar componentes sub-módulos
 * ✅ Gestionar estado de modales
 * ✅ Pasar datos de cierre a componentes
 *
 * Arquitectura:
 * - Types: Domain entities from /domain/entities/cajas.ts
 * - Utils: Formatting functions from /lib/cajas.utils.tsx
 * - Hook: Business logic from /application/hooks/use-cajas.ts
 * - Components: Sub-components from ./components/
 */

import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import AppLayout from '@/layouts/app-layout';
import AperturaCajaModal from '@/presentation/components/AperturaCajaModal';
import CierreCajaModal from '@/presentation/components/CierreCajaModal';
import RegistrarMovimientoModal from '@/presentation/components/RegistrarGastoModal';
import { OutputSelectionModal, type TipoDocumento } from '@/presentation/components/impresion/OutputSelectionModal';
import { CajaEstadoCard, MovimientosDelDiaTable, HistorialAperturasTable, DesglosePageosCard } from './components';
import { ResumenCajaCard } from './components/resumen-caja-card';
import { useCajas } from '@/application/hooks/use-cajas';
import { formatCurrency } from '@/lib/cajas.utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/presentation/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog';
import type { AperturaHistorico, CajasIndexProps } from '@/domain/entities/cajas';



// Respuesta del modal de movimientos: uno o varios (pago mixto efectivo + transferencia)
interface MovimientoRegistrado {
    ids?: number[];
    movimientos_count?: number;
}

const CLAVE_PESTANA = 'cajas.pestana';
const REFRESCO_MS = 2 * 60 * 1000; // Recarga automática de los totales de la caja

// Monto en bolivianos, igual que el resto de la caja (decimales solo si los tiene)
const bs = (monto: unknown) => formatCurrency(Number(monto || 0));

export default function Index(props: CajasIndexProps) {
    const {
        showAperturaModal,
        showCierreModal,
        handleAbrirModal,
        handleCerrarModalApertura,
        handleAbrirCierreModal,
        handleCerrarModalCierre,
        cajaAbiertaHoy,
        cajas
    } = useCajas(props);

    const [showMovimientoModal, setShowMovimientoModal] = useState(false);
    const [isConsolidating, setIsConsolidating] = useState(false);
    const [showConsolidateDialog, setShowConsolidateDialog] = useState(false);
    const [outputModal, setOutputModal] = useState<{ isOpen: boolean; printType?: 'cierre' | 'movimientos'; movimientoId?: number }>({ isOpen: false });

    // Pestaña activa recordada en este navegador
    const [pestana, setPestana] = useState<string>(() => {
        try {
            return localStorage.getItem(CLAVE_PESTANA) || 'movimientos';
        } catch {
            return 'movimientos';
        }
    });
    const cambiarPestana = (valor: string) => {
        setPestana(valor);
        try {
            localStorage.setItem(CLAVE_PESTANA, valor);
        } catch {
            // Sin almacenamiento: no se recuerda
        }
    };

    // Totales al día: si se vende en otra pestaña o caja, aquí quedaban viejos hasta recargar la página.
    // Se recargan solo los datos de la caja (no catálogos ni historial) con el botón o cada REFRESCO_MS.
    const [actualizando, setActualizando] = useState(false);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(() => new Date());
    const hayModalAbierto = showAperturaModal || showCierreModal || showMovimientoModal || showConsolidateDialog || outputModal.isOpen;
    const actualizarDatos = () => {
        if (actualizando) return;
        setActualizando(true);
        router.reload({
            except: ['tiposOperacion', 'tiposOperacionClasificados', 'tiposPago', 'cajas', 'historicoAperturas', 'historialFiltro'],
            onSuccess: () => setUltimaActualizacion(new Date()),
            onFinish: () => setActualizando(false),
        });
    };
    useEffect(() => {
        const id = window.setInterval(() => {
            // No recargar con un modal abierto (se perdería lo que se está escribiendo) ni con la pestaña oculta
            if (!hayModalAbierto && document.visibilityState === 'visible') actualizarDatos();
        }, REFRESCO_MS);
        return () => window.clearInterval(id);
    }, [hayModalAbierto, actualizando]);

    const { movimientosHoy, totalMovimientos, esVistaAdmin = false, usuarioDestino, historicoAperturas, ventasCreditoTotales } = props;

    // ✅ NUEVO: Callback cuando se registra exitosamente un movimiento (puede ser 1 o múltiples)
    const handleMovimientoRegistrado = (movimiento: MovimientoRegistrado | null | undefined) => {
        // ✅ Obtener array de IDs (nuevo formato multi-pago)
        const movimientosIds = movimiento?.ids || [];

        if (!movimientosIds || movimientosIds.length === 0) {
            console.error('❌ [Cajas/Index] No se pudo obtener IDs de movimiento(s)');
            toast.error('Error: No se pudo obtener ID de movimiento');
            return;
        }

        // ✅ Usar el primer ID para impresión (todos son del mismo tipo de operación)
        const primerMovimientoId = Number(movimientosIds[0]);

        // Solo descartar IDs que no sean un número entero positivo (antes también rechazaba los mayores a 1.000.000)
        if (!Number.isInteger(primerMovimientoId) || primerMovimientoId <= 0) {
            console.error('❌ [Cajas/Index] ID de movimiento inválido:', movimientosIds[0]);
            toast.error('Error: ID de movimiento inválido');
            return;
        }

        // ✅ Mostrar notificación según cantidad de movimientos
        const cantidad = movimiento?.movimientos_count ?? 1;
        const mensaje = cantidad > 1
            ? `${cantidad} movimientos registrados (Efectivo + Transferencia)`
            : 'Movimiento registrado';
        toast.success(mensaje);

        // ✅ NUEVO: Abrir OutputSelectionModal para que el usuario seleccione formato
        setOutputModal({
            isOpen: true,
            printType: 'movimientos',
            movimientoId: primerMovimientoId,
        });
    };

    // ✅ Título dinámico según contexto
    const titulo = esVistaAdmin ? `Caja de ${usuarioDestino?.name}` : 'Gestión de Cajas';

    // Cajas CERRADAS con estado PENDIENTE (listas para consolidar) y su cantidad
    const cierresPendientesDetalle: AperturaHistorico[] = (historicoAperturas ?? []).filter(
        (a) => a.estado === 'Cerrada' && a.estado_cierre === 'PENDIENTE',
    );
    const cierresPendientes = cierresPendientesDetalle.length;

    // Totales de los cierres pendientes (diálogo de consolidación), calculados una sola vez
    const totalesPendientes = cierresPendientesDetalle.reduce(
        (t, c) => ({
            real: t.real + Number(c.monto_real || 0),
            esperado: t.esperado + Number(c.monto_esperado || 0),
            diferencia: t.diferencia + Number(c.diferencia || 0),
        }),
        { real: 0, esperado: 0, diferencia: 0 },
    );

    // ✅ NUEVO: Función para consolidar la caja del usuario
    const handleConsolidarCaja = () => {
        setShowConsolidateDialog(true);
    };

    // ✅ NUEVO: Confirmar consolidación con toast mejorado
    const confirmConsolidar = async () => {
        if (!usuarioDestino?.id) {
            toast.error('Error: Usuario no encontrado');
            return;
        }

        setShowConsolidateDialog(false);
        setIsConsolidating(true);

        const loadingToast = toast.loading('Consolidando cajas...');

        router.post(
            `/cajas/admin/cajas/${usuarioDestino.id}/consolidar`,
            {},
            {
                onSuccess: (page) => {
                    toast.dismiss(loadingToast);
                    setIsConsolidating(false);

                    // Obtener el mensaje desde flash (Inertia lo proporciona en page.props.flash)
                    const successMessage = (page?.props?.flash as { success?: string } | undefined)?.success ||
                        `✅ Cajas consolidadas exitosamente\n${cierresPendientes} cierre(s) consolidado(s)`;

                    toast.success(successMessage, {
                        duration: 5000,
                        icon: '✅',
                    });
                },
                onError: (errors: Record<string, string>) => {
                    toast.dismiss(loadingToast);
                    setIsConsolidating(false);

                    let errorMessage = 'Error desconocido al consolidar';

                    // Si hay respuesta del servidor con mensaje específico
                    if (errors?.cierre) {
                        errorMessage = errors.cierre;
                    } else if (errors?.message) {
                        errorMessage = errors.message;
                    } else if (Object.keys(errors).length > 0) {
                        errorMessage = Object.values(errors).join(', ');
                    }

                    console.error('Error consolidando cajas:', errorMessage);
                    toast.error(`❌ Error al consolidar:\n${errorMessage}`, {
                        duration: 5000,
                        icon: '❌',
                    });
                }
            }
        );
    };

    return (
        <AppLayout breadcrumbs={[
                { title: esVistaAdmin ? `Caja de ${usuarioDestino?.name ?? ''}` : 'Mi caja', href: '/cajas' },
            ]}>
            <Head title={titulo} />

            <div className="px-3 py-2">
                <div className="space-y-2">
                    {/* ✅ NUEVO: Banner si es vista admin */}
                    {esVistaAdmin && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                👤 Visualizando caja de: <strong>{usuarioDestino?.name}</strong> ({usuarioDestino?.email})
                            </p>
                        </div>
                    )}

                    {/* <CajaHeader cajaAbiertaHoy={cajaAbiertaHoy} esVistaAdmin={esVistaAdmin} usuarioDestino={usuarioDestino} /> */}

                    <CajaEstadoCard
                        cajaAbiertaHoy={cajaAbiertaHoy}
                        totalMovimientos={totalMovimientos}
                        datosActualizados={props.datosResumen}
                        cargandoDatos={false}
                        ventasCreditoTotales={ventasCreditoTotales}
                        desgloseIngresos={props.desgloseIngresos}  // ✅ NUEVO (2026-06-20)
                        desgloseEgresos={props.desgloseEgresos}   // ✅ NUEVO (2026-06-20)
                        ventasPorTipoPago={props.ventasPorTipoPago} // ✅ NUEVO: Resumen de ventas por tipo de pago
                        desgloseMovimientos={props.desgloseMovimientos} // ✅ NUEVO (2026-07-24): Desglose por tipo de pago
                        detallesPagoDesglosado={props.detallesPagoDesglosado}
                        onAbrirClick={handleAbrirModal}
                        onCerrarClick={handleAbrirCierreModal}
                        onGastoClick={() => setShowMovimientoModal(true)}
                        onConsolidarClick={handleConsolidarCaja}
                        cierreDatos={cajaAbiertaHoy?.cierre || undefined}
                        esVistaAdmin={esVistaAdmin}
                        cierresPendientes={cierresPendientes}
                        isConsolidating={isConsolidating}
                    />

                    {/* Tabs: Movimientos del Día vs Historial de Cajas */}
                    <Tabs value={pestana} onValueChange={cambiarPestana} className="space-y-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <div className="px-2 pb-0 flex justify-between items-center">
                                <TabsList className="bg-transparent border-gray-200 dark:border-gray-700">
                                    <TabsTrigger value="movimientos" className="dark:text-gray-300 dark:hover:text-gray-100">
                                        📊 Movimientos del Día
                                    </TabsTrigger>
                                    <TabsTrigger value="historial" className="dark:text-gray-300 dark:hover:text-gray-100">
                                        📋 Historial de Cajas
                                    </TabsTrigger>
                                </TabsList>

                                {/* ✅ NUEVO: Botones de impresión */}
                                <div className="flex items-center gap-2">
                                    <span className="hidden text-xs text-gray-500 sm:inline dark:text-gray-400" title="Se actualiza sola cada 2 minutos">
                                        Actualizado {ultimaActualizacion.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <button
                                        onClick={actualizarDatos}
                                        disabled={actualizando}
                                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition disabled:opacity-60 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                                        title="Traer los totales y movimientos más recientes"
                                    >
                                        {actualizando ? '⏳ Actualizando…' : '🔄 Actualizar'}
                                    </button>

                                    {/* Impresión de movimientos */}
                                    {cajaAbiertaHoy && movimientosHoy && movimientosHoy.length > 0 && (
                                        <button
                                            onClick={() => setOutputModal({ isOpen: true, printType: 'movimientos' })}
                                            className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                                        >
                                            📊 Movimientos
                                        </button>
                                    )}

                                    {/* Impresión de cierre */}
                                    {cajaAbiertaHoy?.cierre && (
                                        <button
                                            onClick={() => setOutputModal({ isOpen: true, printType: 'cierre' })}
                                            className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                                        >
                                            🔒 Cierre de Caja
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tab: Movimientos del Día */}
                        <TabsContent value="movimientos">
                            <MovimientosDelDiaTable
                                cajaAbiertaHoy={cajaAbiertaHoy}
                                movimientosHoy={movimientosHoy}
                                ventasPorTipoPago={props.ventasPorTipoPago}
                                ventasPorEstado={props.ventasPorEstado}
                                pagosPorTipoPago={props.pagosPorTipoPago}
                                gastosPorTipoPago={props.gastosPorTipoPago}
                                ventasTotales={props.ventasTotales}
                                ventasAnuladas={props.ventasAnuladas}
                                ventasCredito={props.ventasCredito}
                                sumatorialCompras={props.sumatorialCompras}
                                sumatorialDevoluciones={props.datosResumen?.sumatorialDevoluciones || 0}
                                sumatorialServicio={props.datosResumen?.sumatorialServicio || 0}
                                detallesPagoDesglosado={props.detallesPagoDesglosado}
                                totalDetallesPago={props.totalDetallesPago}
                                cargandoDatos={false}
                            />
                        </TabsContent>

                        {/* Tab: Historial de Aperturas */}
                        <TabsContent value="historial">
                            {props.historicoAperturas && (
                                <HistorialAperturasTable
                                    historicoAperturas={props.historicoAperturas}
                                    historialFiltro={props.historialFiltro}
                                />
                            )}
                            {!props.historicoAperturas && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                                    <p className="text-gray-500 dark:text-gray-400">No hay historial de cajas disponible</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Modales */}
            <AperturaCajaModal
                show={showAperturaModal}
                onClose={handleCerrarModalApertura}
                cajas={cajas}
                cajaUsuarioId={cajas && cajas.length > 0 ? cajas[0].id : undefined}
            />

            <CierreCajaModal
                show={showCierreModal}
                onClose={handleCerrarModalCierre}
                cajaAbierta={cajaAbiertaHoy}
            />

            <RegistrarMovimientoModal
                show={showMovimientoModal}
                onClose={() => setShowMovimientoModal(false)}
                tiposOperacion={props.tiposOperacion || []}
                tiposOperacionClasificados={props.tiposOperacionClasificados || { ENTRADA: [], SALIDA: [], AJUSTE: [] }}
                tiposPago={props.tiposPago || []}
                onSuccessWithMovement={handleMovimientoRegistrado} // ✅ NUEVO: Callback para abrir print modal
            />

            {/* ✅ NUEVO: Diálogo de confirmación para consolidación - Mejorado */}
            <AlertDialog open={showConsolidateDialog} onOpenChange={setShowConsolidateDialog}>
                <AlertDialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                    <AlertDialogTitle className="text-xl font-bold">
                        ✅ Consolidar Cajas de {usuarioDestino?.name}
                    </AlertDialogTitle>

                    <AlertDialogDescription className="sr-only">
                        Diálogo de confirmación para consolidar cajas cerradas con estado pendiente
                    </AlertDialogDescription>

                    <div className="space-y-4">
                        {/* Información del usuario objetivo y consolidador */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">👤 Caja de Usuario</p>
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    {usuarioDestino?.name}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    {usuarioDestino?.email}
                                </p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">✅ Consolidado por</p>
                                <p className="text-sm text-purple-800 dark:text-purple-300">
                                    Admin (Tú)
                                </p>
                                <p className="text-xs text-purple-600 dark:text-purple-400">
                                    {new Date().toLocaleDateString('es-BO')} {new Date().toLocaleTimeString('es-BO')}
                                </p>
                            </div>
                        </div>

                        {/* Resumen de cierres */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                                🔒 Cajas Cerradas Pendiente de Consolidación:
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                                Se aprobarán <strong>{cierresPendientes}</strong> caja(s) cerrada(s) con estado PENDIENTE
                            </p>
                        </div>

                        {/* Detalle de cada cierre pendiente - Mejorado */}
                        {cierresPendientesDetalle.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    📋 Detalles de cierres pendientes:
                                </p>
                                <div className="space-y-2 max-h-52 overflow-y-auto">
                                    {cierresPendientesDetalle.map((cierre) => (
                                        <div
                                            key={cierre.id}
                                            className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-xs space-y-2 border-l-4 border-yellow-400"
                                        >
                                            {/* Encabezado: Caja y ID */}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        {cierre.caja_nombre}
                                                    </span>
                                                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                                                        (Apertura #{cierre.id})
                                                    </span>
                                                </div>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                    ⏳ Pendiente
                                                </span>
                                            </div>

                                            {/* Fechas de apertura y cierre */}
                                            <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
                                                <div>
                                                    <span className="font-medium">📅 Abierta:</span> {new Date(cierre.fecha_apertura).toLocaleDateString('es-BO', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                                <div>
                                                    <span className="font-medium">🕐 Cerrada:</span> {cierre.fecha_cierre ? new Date(cierre.fecha_cierre).toLocaleDateString('es-BO', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : '-'}
                                                </div>
                                            </div>

                                            {/* Montos */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-white dark:bg-gray-600 rounded p-1">
                                                    <p className="text-gray-600 dark:text-gray-300">💰 Real</p>
                                                    <p className="font-semibold">{bs(cierre.monto_real)}</p>
                                                </div>
                                                <div className="bg-white dark:bg-gray-600 rounded p-1">
                                                    <p className="text-gray-600 dark:text-gray-300">📊 Esperado</p>
                                                    <p className="font-semibold">{bs(cierre.monto_esperado)}</p>
                                                </div>
                                                <div className={`rounded p-1 ${Number(cierre.diferencia) > 0
                                                    ? 'bg-green-100 dark:bg-green-900'
                                                    : Number(cierre.diferencia) < 0
                                                        ? 'bg-red-100 dark:bg-red-900'
                                                        : 'bg-blue-100 dark:bg-blue-900'
                                                    }`}>
                                                    <p className="text-gray-600 dark:text-gray-300">Δ Diferencia</p>
                                                    <p className={`font-semibold ${Number(cierre.diferencia) > 0
                                                        ? 'text-green-700 dark:text-green-300'
                                                        : Number(cierre.diferencia) < 0
                                                            ? 'text-red-700 dark:text-red-300'
                                                            : 'text-blue-700 dark:text-blue-300'
                                                        }`}>
                                                        {Number(cierre.diferencia) > 0 ? '+' : ''}{bs(cierre.diferencia)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Observaciones si existen */}
                                            {cierre.observaciones_cierre && (
                                                <div className="bg-white dark:bg-gray-600 rounded p-2 border-l-2 border-blue-400">
                                                    <p className="text-gray-600 dark:text-gray-300 font-medium">📝 Notas:</p>
                                                    <p className="text-gray-700 dark:text-gray-200">{cierre.observaciones_cierre}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resumen de totales */}
                        {cierresPendientesDetalle.length > 0 && (
                            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    📊 Resumen Total
                                </p>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                    <div className="text-center">
                                        <p className="text-slate-600 dark:text-slate-400">Cajas</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{cierresPendientesDetalle.length}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-600 dark:text-slate-400">Total Real</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{bs(totalesPendientes.real)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-600 dark:text-slate-400">Total Esperado</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{bs(totalesPendientes.esperado)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-600 dark:text-slate-400">Δ Total</p>
                                        <p className={`font-bold ${totalesPendientes.diferencia > 0
                                            ? 'text-green-600'
                                            : totalesPendientes.diferencia < 0
                                                ? 'text-red-600'
                                                : 'text-slate-900 dark:text-white'
                                            }`}>
                                            {totalesPendientes.diferencia > 0 ? '+' : ''}{bs(totalesPendientes.diferencia)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Advertencia */}
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-800 dark:text-red-300">
                                ⚠️ Advertencia:
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-200 mt-1">
                                Esta acción aprobará automáticamente todos los cierres pendientes. No se puede deshacer.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <AlertDialogCancel disabled={isConsolidating}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmConsolidar}
                            disabled={isConsolidating}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            {isConsolidating ? '⏳ Consolidando...' : '✅ Consolidar'}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* ✅ Modal de selección de formato/acción para impresión */}
            {cajaAbiertaHoy && (
                <OutputSelectionModal
                    isOpen={outputModal.isOpen}
                    onClose={() => setOutputModal({ isOpen: false })}
                    documentoId={outputModal.movimientoId || cajaAbiertaHoy.id}
                    tipoDocumento={outputModal.movimientoId ? ('movimiento' as TipoDocumento) : ('caja' as TipoDocumento)}
                    printType={outputModal.printType}
                    documentoInfo={outputModal.movimientoId ? {
                        numero: `Movimiento #${outputModal.movimientoId}`,
                        fecha: new Date().toLocaleDateString('es-ES'),
                    } : undefined}
                />
            )}

            {/* ✅ NUEVO: Toaster para notificaciones */}
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
            />
        </AppLayout>
    );
}
