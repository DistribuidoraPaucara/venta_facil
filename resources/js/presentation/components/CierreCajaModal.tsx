import React, { Fragment, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import toast from 'react-hot-toast';
import { OutputSelectionModal, type TipoDocumento } from '@/presentation/components/impresion/OutputSelectionModal';

interface AperturaCaja {
    id: number;
    caja_id: number;
    user_id: number;
    fecha: string;
    monto_apertura: number;
    observaciones?: string;
    caja: {
        id: number;
        nombre: string;
        ubicacion: string;
    };
}

interface DatosCierre {
    apertura_id: number;
    caja_nombre: string;
    fecha_apertura: string;
    fecha_cierre: string;
    sumatoria_ventas_total: number;
    sumatoria_ventas_efectivo: number;
    sumatoria_ventas_credito: number;
    sumatoria_ventas_anuladas: number;
    sumatoria_gastos: number;
    monto_pagos_creditos: number;
    movimientos_agrupados: Array<{ tipo: string; total: number; cantidad: number }>;  // ← ACTUALIZADO
    movimientos_por_tipo_pago: Record<string, { cantidad: number; total: number }>;
    detalles_pagos_venta_por_tipo?: Record<string, { codigo: string; cantidad: number; total: number }>;  // ✅ NUEVO: Pagos desde detalles_pago_venta
    ventas_por_tipo_pago: Record<string, { cantidad: number; total: number }>;
    ventas_por_estado: Array<{ estado: string; count: number; total: number }>;
    pagos_credito_por_tipo_pago: Array<{ tipo: string; cantidad: number; total: number }>;
    gastos_por_tipo_pago: Array<{ tipo: string; cantidad: number; total: number }>;
    efectivo_esperado: {
        apertura: number;
        ventas_efectivo: number;
        pagos_credito: number;
        gastos: number;
        vueltos?: number;
        efectivo?: number;
        otros_medios?: Array<{ tipo: string; total: number }>;
        total: number;
    };
    rango_ventas_ids: { minId: number | null; maxId: number | null; totalVentas: number };
    rango_creditos: { minId: number | null; maxId: number | null; totalCreditos: number; montoCreditos: number };
    rango_pagos: { minId: number | null; maxId: number | null; totalPagos: number; montoPagos: number };
    total_ingresos: number;
    total_egresos: number;
}

interface Props {
    show: boolean;
    onClose: () => void;
    cajaAbierta: AperturaCaja | null;
    montoEsperado: number;
}

type Formato = (monto: number) => string;

function FilaResumen({
    concepto,
    cantidad,
    monto,
    signo,
    subtotal = false,
    formato,
}: {
    concepto: string;
    cantidad?: number;
    monto: number;
    signo?: '+' | '-';
    subtotal?: boolean;
    formato: Formato;
}) {
    const color =
        signo === '+' ? 'text-green-700 dark:text-green-300' : signo === '-' ? 'text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-gray-400';
    return (
        <TableRow className={subtotal ? 'bg-gray-50 font-semibold dark:bg-gray-700/50' : ''}>
            <TableCell className={`py-2 ${signo ? '' : 'text-gray-500 italic dark:text-gray-400'}`}>{concepto}</TableCell>
            <TableCell className="py-2 text-right text-gray-500 dark:text-gray-400">{cantidad ?? ''}</TableCell>
            <TableCell className={`py-2 text-right ${color}`}>
                {signo === '-' ? '−' : signo ?? ''} {formato(monto)}
            </TableCell>
        </TableRow>
    );
}

function CeldaDiferencia({ valor, formato }: { valor: number | null; formato: Formato }) {
    if (valor === null) return <span className="text-gray-400">—</span>;
    if (Math.abs(valor) < 0.01) return <span className="font-semibold text-green-600 dark:text-green-400">✅ 0</span>;
    return (
        <span className={`font-semibold ${valor > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
            {valor > 0 ? '+' : '−'}
            {formato(Math.abs(valor))}
        </span>
    );
}

export default function CierreCajaModal({ show, onClose, cajaAbierta, montoEsperado }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        monto_real: '',
        observaciones: '',
        fecha_cierre: new Date().toISOString().split('T')[0]
    });

    const [outputModal, setOutputModal] = useState<{ isOpen: boolean; aperturaId?: number }>({ isOpen: false });
    const [datosCierre, setDatosCierre] = useState<DatosCierre | null>(null);
    const [cargandoDatos, setCargandoDatos] = useState(false);

    // ✅ NUEVO (2026-10-29): Conteo separado por medio de pago.
    // El efectivo se cuenta en el cajón; los otros medios (QR, etc.) se precargan con lo registrado para confirmarlos.
    const [efectivoContado, setEfectivoContado] = useState('');
    const [otrosContados, setOtrosContados] = useState<Record<string, string>>({});
    const [confirmaDiferencia, setConfirmaDiferencia] = useState(false);

    React.useEffect(() => {
        const otros = datosCierre?.efectivo_esperado?.otros_medios ?? [];
        setOtrosContados(Object.fromEntries(otros.map((m) => [m.tipo, Number(m.total).toFixed(2)])));
    }, [datosCierre]);

    const montoOtros = Object.values(otrosContados).reduce((s, v) => s + (parseFloat(v) || 0), 0);
    const montoReal = efectivoContado !== '' ? (parseFloat(efectivoContado) || 0) + montoOtros : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            console.log('📤 [CierreCajaModal] Enviando petición POST /cajas/cerrar');

            // ✅ Usar fetch directamente (no Inertia) para evitar redirección
            const response = await fetch('/cajas/cerrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    monto_real: montoReal,
                    observaciones: data.observaciones,
                    fecha_cierre: data.fecha_cierre,
                    conteo: [
                        { tipo: 'Efectivo', monto: parseFloat(efectivoContado) || 0 },
                        ...Object.entries(otrosContados).map(([tipo, monto]) => ({ tipo, monto: parseFloat(monto) || 0 })),
                    ],
                }),
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ [CierreCajaModal] Éxito en cerrar caja');
                toast.success('Caja cerrada exitosamente');

                // ✅ Abrir OutputSelectionModal INMEDIATAMENTE
                if (cajaAbierta?.id) {
                    console.log('🔓 [CierreCajaModal] Abriendo OutputSelectionModal con apertura_id:', cajaAbierta.id);
                    setOutputModal({ isOpen: true, aperturaId: cajaAbierta.id });
                    reset();
                    setEfectivoContado('');
                    setConfirmaDiferencia(false);
                } else {
                    console.warn('⚠️ No hay cajaAbierta.id');
                    reset();
                    setEfectivoContado('');
                    setConfirmaDiferencia(false);
                    onClose();
                }
            } else {
                console.error('❌ Error en respuesta:', result);
                toast.error(result.message || 'Error al cerrar la caja');
            }
        } catch (error) {
            console.error('❌ [CierreCajaModal] Error en petición:', error);
            toast.error('Error al cerrar la caja. Intenta nuevamente.');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Nota: Los cálculos ahora vienen del servidor (CierreCajaService)
    // Los métodos locales han sido eliminados para evitar duplicación de lógica

    // ✅ NUEVO: Cargar datos desde el servidor (CierreCajaService)
    React.useEffect(() => {
        if (show && cajaAbierta?.id) {
            setCargandoDatos(true);
            console.log('🔵 [CierreCajaModal] Iniciando petición a /cajas/' + cajaAbierta.id + '/datos-cierre');

            fetch(`/cajas/${cajaAbierta.id}/datos-cierre`)
                .then(res => {
                    console.log('🟦 [CierreCajaModal] Response status:', res.status);
                    return res.json();
                })
                .then(result => {
                    console.log('🟩 [CierreCajaModal] Respuesta completa del backend:', result);
                    console.log('📊 [CierreCajaModal] Datos desglosados:', {
                        apertura_id: result.data?.apertura_id,
                        caja_nombre: result.data?.caja_nombre,
                        sumatoria_ventas_total: result.data?.sumatoria_ventas_total,
                        sumatoria_ventas_efectivo: result.data?.sumatoria_ventas_efectivo,
                        sumatoria_gastos: result.data?.sumatoria_gastos,
                        monto_pagos_creditos: result.data?.monto_pagos_creditos,
                        total_ingresos: result.data?.total_ingresos,
                        total_egresos: result.data?.total_egresos,
                        efectivo_esperado: result.data?.efectivo_esperado,
                        movimientos_agrupados: result.data?.movimientos_agrupados,
                    });
                    console.log('🔢 [CierreCajaModal] Efectivo esperado calculadosssss:', result);

                    if (result.success && result.data) {
                        console.log('✅ [CierreCajaModal] Datos cargados exitosamente');
                        setDatosCierre(result.data);
                    }
                })
                .catch(err => {
                    console.error('❌ [CierreCajaModal] Error cargando datos de cierre:', err);
                })
                .finally(() => {
                    console.log('🔴 [CierreCajaModal] Petición finalizada');
                    setCargandoDatos(false);
                });
        }
    }, [show, cajaAbierta?.id]);

    // Usar datos del servidor si están disponibles, si no usar valores por defecto
    const efectivoEsperado = datosCierre?.efectivo_esperado || {
        apertura: cajaAbierta?.monto_apertura || 0,
        ventas_efectivo: 0,
        pagos_credito: 0,
        gastos: 0,
        total: cajaAbierta?.monto_apertura || 0,
    };

    // ✅ REFACTORIZADO (2026-06-20): Usar desgloses dinámicos en lugar de valores hardcodeados
    // Esto permite que nuevos tipos como DEVOLUCION-INGRESO se incluyan automáticamente
    const desgloseIngresos = datosCierre?.desglose_ingresos || [];
    const desgloseEgresos = datosCierre?.desglose_egresos || [];

    // Calcular dinámicamente sumando todos los tipos desde los desgloses
    const ingresos = desgloseIngresos.reduce((sum: number, ingreso: any) => sum + (ingreso.total || 0), 0);
    const egresos = desgloseEgresos.reduce((sum: number, egreso: any) => sum + (egreso.total || 0), 0);
    const apertura = datosCierre?.apertura || cajaAbierta?.monto_apertura || 0;

    // ✅ CORREGIDO (2026-10-29): Total Esperado = Apertura + Ingresos - Egresos - Vueltos
    // Las ventas registran lo que entregó el cliente; el vuelto es efectivo que sale de caja
    const vueltos = efectivoEsperado.vueltos ?? 0;
    const totalEsperadoMejorado = apertura + ingresos - egresos - vueltos;
    const esperadoEfectivo = efectivoEsperado.efectivo;
    const esperadoOtrosMedios = efectivoEsperado.otros_medios ?? [];

    // Mantener referencias a valores individuales para compatibilidad con templates
    const ventasTotales = datosCierre?.sumatoria_ventas_total || 0;
    const ventasEnEfectivo = datosCierre?.sumatoria_ventas_efectivo || 0;
    const ventasCredito = datosCierre?.sumatoria_ventas_credito || 0;
    const pagosDeCredito = datosCierre?.monto_pagos_creditos || 0;
    const gastosTotales = datosCierre?.sumatoria_gastos || 0;
    const serviciosTotales = datosCierre?.sumatoria_servicio || 0;
    const devolucionesTotales = datosCierre?.sumatoria_devoluciones || 0;

    // ✅ DEBUG: Log de cómo se calcula Total Esperado (ACTUALIZADO 2026-03-09)
    console.log('💰 [CierreCajaModal] TOTAL ESPERADO CORRECTO:', {
        apertura: apertura,
        ventasEfectivo: ventasEnEfectivo,
        pagosCredito: pagosDeCredito,
        servicios: serviciosTotales,
        totalEgresos: egresos,
        devoluciones: devolucionesTotales,
        formula: `${apertura} + ${ventasEnEfectivo} + ${pagosDeCredito} + ${serviciosTotales} - ${egresos}`,
        total: totalEsperadoMejorado,
    });

    const efectivoReal = ventasEnEfectivo + pagosDeCredito - gastosTotales;
    const ventasAnuladas = datosCierre?.sumatoria_ventas_anuladas || 0;

    const diferencia = montoReal !== null ? Math.round((montoReal - totalEsperadoMejorado) * 100) / 100 : 0;
    const diferenciaEfectivo =
        efectivoContado !== '' && esperadoEfectivo !== undefined ? Math.round(((parseFloat(efectivoContado) || 0) - esperadoEfectivo) * 100) / 100 : null;

    // ✅ NUEVO (2026-10-29): Protección contra errores de digitación
    // Una diferencia mayor a Bs. 50 o al 10% del esperado exige revisar, confirmar y explicar
    const diferenciaGrande = montoReal !== null && Math.abs(diferencia) > Math.max(50, Math.abs(totalEsperadoMejorado) * 0.1);
    const puedeCerrar = montoReal !== null && (!diferenciaGrande || (confirmaDiferencia && data.observaciones.trim() !== ''));

    // Pagos de ventas por tipo (solo Efectivo y Transferencia/QR; el crédito va en su propia fila)
    const pagosPorTipo = Object.entries(datosCierre?.detalles_pagos_venta_por_tipo || {}).filter(([tipo]) =>
        ['EFECTIVO', 'TRANSFERENCIA / QR', 'TRANSFERENCIA/QR'].includes(tipo.toUpperCase()),
    );

    const rangoVentas = datosCierre?.rango_ventas_ids
        ? {
            minId: datosCierre.rango_ventas_ids.minId,
            maxId: datosCierre.rango_ventas_ids.maxId,
            totalVentas: datosCierre.rango_ventas_ids.totalVentas,
        }
        : null;

    // 🔍 DEBUG: Logs en consola para verificar los datos
    React.useEffect(() => {
        if (datosCierre) {
            console.log('📊 CierreCajaModal - Datos del Servidor (CierreCajaService):', {
                efectivo_esperado: datosCierre.efectivo_esperado,
                sumatoria_ventas_total: datosCierre.sumatoria_ventas_total,
                sumatoria_ventas_efectivo: datosCierre.sumatoria_ventas_efectivo,
                sumatoria_gastos: datosCierre.sumatoria_gastos,
                monto_pagos_creditos: datosCierre.monto_pagos_creditos,
            });
        }
    }, [datosCierre]);

    // Guard check: only render if cajaAbierta exists (after hooks are declared)
    if (!cajaAbierta) return null;

    return (
        <Fragment>
            <Dialog open={show && !outputModal.isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[800px] flex flex-col max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            🔒 Cerrar Caja del Día
                        </DialogTitle>
                        <DialogDescription>
                            Cuenta el dinero físico en caja y registra el cierre del día.
                        </DialogDescription>
                    </DialogHeader>

                    {cargandoDatos && (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-gray-600 dark:text-gray-400">Cargando datos de cierre...</p>
                            </div>
                        </div>
                    )}

                    {!cargandoDatos && (
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="space-y-4 overflow-y-auto flex-1 px-6">
                                {/* Información de la caja */}
                                <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm sm:grid-cols-3 dark:border-gray-600 dark:bg-gray-700">
                                    <div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Caja</span>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{cajaAbierta.caja.nombre}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Apertura</span>
                                        <p className="text-gray-900 dark:text-gray-100">
                                            {new Date(cajaAbierta.fecha).toLocaleDateString('es-BO', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            })} {new Date(cajaAbierta.fecha).toLocaleTimeString('es-BO', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Cierre</span>
                                        <input
                                            type="date"
                                            value={data.fecha_cierre}
                                            onChange={(e) => setData('fecha_cierre', e.target.value)}
                                            max={new Date().toISOString().split('T')[0]}
                                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                </div>

                                {/* ✅ NUEVO (2026-10-29): Resumen de movimientos en formato tabla */}
                                <div className="rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-600">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">📊 Movimientos del turno</h4>
                                        {rangoVentas && (
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                                                Ventas #{rangoVentas.minId} → #{rangoVentas.maxId} ({rangoVentas.totalVentas})
                                            </span>
                                        )}
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Concepto</TableHead>
                                                <TableHead className="text-right">Cant.</TableHead>
                                                <TableHead className="text-right">Monto</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <FilaResumen concepto="Monto inicial" monto={cajaAbierta.monto_apertura} signo="+" formato={formatCurrency} />
                                            {pagosPorTipo.map(([tipo, datos]) => (
                                                <FilaResumen
                                                    key={tipo}
                                                    concepto={`Ventas · ${tipo}`}
                                                    cantidad={datos.cantidad}
                                                    monto={datos.total}
                                                    signo="+"
                                                    formato={formatCurrency}
                                                />
                                            ))}
                                            <FilaResumen concepto="CxC (pagos de créditos)" monto={pagosDeCredito} signo="+" formato={formatCurrency} />
                                            {serviciosTotales > 0 && <FilaResumen concepto="Servicios" monto={serviciosTotales} signo="+" formato={formatCurrency} />}
                                            <FilaResumen concepto="Total ingresos" monto={ingresos} signo="+" formato={formatCurrency} subtotal />
                                            <FilaResumen concepto="Anulaciones de ventas" monto={ventasAnuladas} signo="-" formato={formatCurrency} />
                                            {devolucionesTotales > 0 && (
                                                <FilaResumen concepto="Devoluciones de productos" monto={devolucionesTotales} signo="-" formato={formatCurrency} />
                                            )}
                                            <FilaResumen concepto="Total egresos" monto={egresos} signo="-" formato={formatCurrency} subtotal />
                                            {vueltos > 0 && <FilaResumen concepto="Vueltos / cambio (efectivo)" monto={vueltos} signo="-" formato={formatCurrency} />}
                                            <FilaResumen concepto="Ventas a crédito (no ingresan a caja)" monto={ventasCredito} formato={formatCurrency} />
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow className="bg-yellow-50 dark:bg-yellow-900/20">
                                                <TableCell colSpan={2} className="font-semibold text-yellow-900 dark:text-yellow-200">💰 Total esperado</TableCell>
                                                <TableCell className="text-right text-lg font-bold text-yellow-700 dark:text-yellow-300">
                                                    {formatCurrency(totalEsperadoMejorado)}
                                                </TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </div>

                                {/* ✅ NUEVO (2026-10-29): Arqueo por medio de pago en formato tabla */}
                                <div className="rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-600">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">🧮 Arqueo de caja</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Efectivo: solo billetes y monedas del cajón. Los otros medios vienen precargados con lo registrado; corrígelos solo si no coinciden.
                                        </p>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Medio de pago</TableHead>
                                                <TableHead className="text-right">Esperado</TableHead>
                                                <TableHead className="w-40 text-right">Contado</TableHead>
                                                <TableHead className="text-right">Diferencia</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">💵 Efectivo *</TableCell>
                                                <TableCell className="text-right">{esperadoEfectivo !== undefined ? formatCurrency(esperadoEfectivo) : '—'}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        id="efectivo_contado"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={efectivoContado}
                                                        onChange={(e) => {
                                                            setEfectivoContado(e.target.value);
                                                            setConfirmaDiferencia(false);
                                                        }}
                                                        placeholder="0.00"
                                                        autoFocus
                                                        className="h-8 text-right font-medium dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <CeldaDiferencia valor={diferenciaEfectivo} formato={formatCurrency} />
                                                </TableCell>
                                            </TableRow>
                                            {Object.keys(otrosContados).map((tipo) => {
                                                const esperado = esperadoOtrosMedios.find((m) => m.tipo === tipo)?.total ?? 0;
                                                const contado = otrosContados[tipo];
                                                return (
                                                    <TableRow key={tipo}>
                                                        <TableCell className="font-medium">📱 {tipo}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(esperado)}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                id={`conteo_${tipo}`}
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={contado}
                                                                onChange={(e) => {
                                                                    setOtrosContados((actual) => ({ ...actual, [tipo]: e.target.value }));
                                                                    setConfirmaDiferencia(false);
                                                                }}
                                                                className="h-8 text-right dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <CeldaDiferencia
                                                                valor={contado === '' ? null : Math.round(((parseFloat(contado) || 0) - esperado) * 100) / 100}
                                                                formato={formatCurrency}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell className="font-semibold">Total</TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(totalEsperadoMejorado)}</TableCell>
                                                <TableCell className="text-right font-semibold">{montoReal !== null ? formatCurrency(montoReal) : '—'}</TableCell>
                                                <TableCell className="text-right text-base">
                                                    <CeldaDiferencia valor={montoReal !== null ? diferencia : null} formato={formatCurrency} />
                                                </TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                    {errors.monto_real && <p className="px-3 py-2 text-sm text-red-600 dark:text-red-400">{errors.monto_real}</p>}
                                    {montoReal !== null && (
                                        <p
                                            className={`border-t px-3 py-2 text-sm dark:border-gray-600 ${
                                                diferencia === 0
                                                    ? 'text-green-700 dark:text-green-300'
                                                    : diferencia > 0
                                                      ? 'text-blue-700 dark:text-blue-300'
                                                      : 'text-red-700 dark:text-red-300'
                                            }`}
                                        >
                                            {diferencia === 0 && '✅ Perfecto! No hay diferencias.'}
                                            {diferencia > 0 && '📈 Sobrante - Tienes más dinero del esperado.'}
                                            {diferencia < 0 && '📉 Faltante - Tienes menos dinero del esperado.'}
                                        </p>
                                    )}
                                </div>

                                {/* ⚠️ Diferencia grande: posible error de digitación */}
                                {diferenciaGrande && (
                                    <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700 dark:bg-amber-900/20">
                                        <p className="font-medium text-amber-800 dark:text-amber-300">
                                            ⚠️ La diferencia es muy grande. Revisa que hayas escrito bien los montos.
                                        </p>
                                        <label className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                                            <input
                                                type="checkbox"
                                                checked={confirmaDiferencia}
                                                onChange={(e) => setConfirmaDiferencia(e.target.checked)}
                                                className="mt-0.5"
                                            />
                                            Confirmo que los montos son correctos y explico el motivo en Observaciones.
                                        </label>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="observaciones" className="text-gray-900 dark:text-gray-100">
                                        Observaciones {diferencia !== 0 && '(Explica la diferencia)'}
                                    </Label>
                                    <Textarea
                                        id="observaciones"
                                        value={data.observaciones}
                                        onChange={(e) => setData('observaciones', e.target.value)}
                                        placeholder={
                                            diferencia !== 0
                                                ? "Explica el motivo de la diferencia..."
                                                : "Notas adicionales sobre el cierre..."
                                        }
                                        rows={3}
                                        className="dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    {errors.observaciones && (
                                        <p className="text-sm text-red-600 dark:text-red-400">{errors.observaciones}</p>
                                    )}
                                </div>
                                <div className='py-2'></div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end space-x-2 bg-white dark:bg-gray-800 flex-shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={processing}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !puedeCerrar}
                                    className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
                                >
                                    {processing ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Cerrando...
                                        </span>
                                    ) : (
                                        '🔒 Cerrar Caja'
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de selección de salida (impresión/PDF) */}
            {outputModal.isOpen && outputModal.aperturaId && (
                <OutputSelectionModal
                    isOpen={outputModal.isOpen}
                    onClose={() => {
                        console.log('🔴 [OutputSelectionModal] Cerrando y recargando página');
                        setOutputModal({ isOpen: false });
                        // Pequeño delay para permitir que se complete la descarga antes de recargar
                        setTimeout(() => {
                            window.location.href = '/cajas';
                        }, 500);
                    }}
                    documentoId={outputModal.aperturaId}
                    tipoDocumento={'caja' as TipoDocumento}
                    printType="cierre"
                />
            )}
        </Fragment>
    );
}
