/**
 * Component: MovimientosDelDiaTable
 *
 * Responsabilidades:
 * ✅ Renderizar tabla de movimientos de caja del día
 * ✅ Mostrar columnas: Hora, Tipo, Descripción, Documento, Monto
 * ✅ Indicadores visuales de ingresos/egresos
 * ✅ Agrupar movimientos por tipo
 * ✅ Resumen de totales por tipo
 */

import type { AperturaCaja, MovimientoCaja } from '@/domain/entities/cajas';
import { formatCurrency, formatDateTime, getMovimientoColor, getMovimientoIcon, toNumber } from '@/lib/cajas.utils';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';
import { Printer } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';
import { Eye, Loader2, MoreVertical, Trash2 } from 'lucide-react';

interface Props {
    cajaAbiertaHoy: AperturaCaja | null;
    movimientosHoy: MovimientoCaja[];
    ventasPorTipoPago?: Array<{ tipo: string; total: number; count: number }>; // ✅ Viene del backend
    ventasPorEstado?: Array<{ estado: string; total: number; count: number }>; // ✅ Viene del backend
    pagosPorTipoPago?: Array<{ tipo: string; total: number; count: number }>; // ✅ Viene del backend
    gastosPorTipoPago?: Array<{ tipo: string; total: number; count: number }>; // ✅ Viene del backend
    ventasTotales?: number; // ✅ NUEVO: Total de ventas de CierreCajaService
    ventasAnuladas?: number; // ✅ NUEVO: Ventas anuladas de CierreCajaService
    ventasCredito?: number; // ✅ NUEVO: Ventas a crédito de CierreCajaService
    sumatorialCompras?: number; // ✅ NUEVO: Sumatoria de compras de CierreCajaService
    sumatorialDevoluciones?: number; // ✅ NUEVO (2026-03-09): Sumatoria de devoluciones
    sumatorialServicio?: number; // ✅ NUEVO (2026-03-09): Sumatoria de servicios
    detallesPagoDesglosado?: Array<{ tipo_pago_id: number; tipo: string; total: number; cantidad: number }>; // ✅ NUEVO: Desglose de pagos desde detalles_pago_venta
    totalDetallesPago?: number; // ✅ NUEVO: Dinero real pagado por ventas (desde detalles_pago_venta)
    cargandoDatos?: boolean; // ✅ NUEVO: Indicador si se están cargando datos del servidor
}

// ✅ NUEVO: Función para detectar discrepancias en ventas
const tieneDiscrepancia = (movimiento: MovimientoCaja): boolean => {
    if (!movimiento.venta) return false;

    const montoMovimiento = Number(movimiento.monto);
    const totalVenta = Number(movimiento.venta.total ?? 0);
    const montoPagado = Number(movimiento.venta.monto_pagado ?? 0);

    // Discrepancia 1: El monto del movimiento no coincide con el total de la venta
    if (Math.abs(montoMovimiento - totalVenta) > 0.01) {
        return true;
    }

    // Discrepancia 2: El monto del movimiento no coincide con el monto pagado
    if (Math.abs(montoMovimiento - montoPagado) > 0.01) {
        return true;
    }

    return false;
};

// ✅ NUEVO: Función para obtener colores según el tipo de operación
const getTipoOperacionColor = (codigo: string): string => {
    switch (codigo.toUpperCase()) {
        case 'VENTA':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'PAGO':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'GASTOS':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'APERTURA':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        case 'CIERRE':
            return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
        case 'AJUSTE':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'COMPRA':
            return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
        case 'ANULACION':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        case 'CREDITO':
            return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
        case 'DEVOLUCION':
            return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300';
        case 'SERVICIO':
            return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
        default:
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
};

export function MovimientosDelDiaTable({
    cajaAbiertaHoy,
    movimientosHoy,
    ventasPorTipoPago = [],
    ventasPorEstado = [],
    pagosPorTipoPago = [],
    gastosPorTipoPago = [],
    ventasTotales = 0,
    ventasAnuladas = 0,
    ventasCredito = 0,
    sumatorialCompras = 0,
    sumatorialDevoluciones = 0,
    sumatorialServicio = 0,
    detallesPagoDesglosado = [],
    totalDetallesPago = 0,
    cargandoDatos = false,
}: Props) {
    const [pagina, setPagina] = useState(1);
    const [exportando, setExportando] = useState(false); // Generando el Excel
    const [porPagina, setPorPagina] = useState<number>(() => {
        try {
            return Number(localStorage.getItem('cajas.movimientos.porPagina')) || 25;
        } catch {
            return 25;
        }
    });
    const cambiarPorPagina = (n: number) => {
        setPorPagina(n);
        setPagina(1);
        try {
            localStorage.setItem('cajas.movimientos.porPagina', String(n));
        } catch {
            // Sin almacenamiento: no se recuerda
        }
    };
    const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
    // Hora (HH:MM) en lugar de fecha: la caja es de un día y sirve para revisar un cambio de turno
    const [horaDesde, setHoraDesde] = useState<string>('');
    const [horaHasta, setHoraHasta] = useState<string>('');
    const [filtroSigno, setFiltroSigno] = useState<'todos' | 'ingresos' | 'egresos'>('todos');
    const [filtroPago, setFiltroPago] = useState<string>(''); // Medio de pago (Efectivo, QR...): para cuadrar el efectivo
    const [busqueda, setBusqueda] = useState<string>(''); // Folio, descripción, cliente, monto o N° de venta
    const [montoMin, setMontoMin] = useState<string>('');
    const [montoMax, setMontoMax] = useState<string>('');
    const [filtroUsuario, setFiltroUsuario] = useState<string>('');
    const [filtroEstadoVenta, setFiltroEstadoVenta] = useState<'todos' | 'APROBADO' | 'ANULADO'>('todos'); // ✅ NUEVO: Filtro estado venta
    const [ordenarPor, setOrdenarPor] = useState<'fecha' | 'monto' | 'tipo'>('fecha');
    const [filtrosVisibles, setFiltrosVisibles] = useState(false);
    const [mostrarModalMovimientoIndividual, setMostrarModalMovimientoIndividual] = useState(false);
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<MovimientoCaja | null>(null);
    const [mostrarDialogoEliminacion, setMostrarDialogoEliminacion] = useState(false);
    const [movimientoAEliminar, setMovimientoAEliminar] = useState<MovimientoCaja | null>(null);
    const [eliminandoMovimiento, setEliminandoMovimiento] = useState(false);
    const [mostrarModalVenta, setMostrarModalVenta] = useState(false);
    const [movimientoVentaSeleccionado, setMovimientoVentaSeleccionado] = useState<MovimientoCaja | null>(null);
    const [movimientosExpandidos, setMovimientosExpandidos] = useState<Set<number>>(() => {
        const expandidos = new Set<number>();
        movimientosHoy.forEach((mov) => {
            if (mov.venta) {
                expandidos.add(mov.id);
            }
        });
        return expandidos;
    });

    // Al cambiar un filtro o el orden, volver a la primera página
    useEffect(() => {
        setPagina(1);
    }, [filtroTipo, horaDesde, horaHasta, filtroSigno, filtroPago, busqueda, montoMin, montoMax, filtroUsuario, filtroEstadoVenta, ordenarPor]);

    if (!cajaAbiertaHoy || movimientosHoy.length === 0) {
        return (
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="mb-4 text-5xl opacity-50">📋</div>
                        <p className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">Aún no hay movimientos</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {!cajaAbiertaHoy ? 'Abra una caja para registrar movimientos' : 'Los movimientos aparecerán aquí cuando se registren'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ NUEVO: Determinar si la caja es de hoy o de otro día
    const fechaApertura = new Date(cajaAbiertaHoy.fecha);
    const hoy = new Date();
    const esHoy = fechaApertura.toDateString() === hoy.toDateString();
    const etiquetaPeriodo = esHoy ? 'del Día' : `desde ${fechaApertura.toLocaleDateString('es-BO', { month: 'short', day: 'numeric' })}`;

    // ✅ MEJORADO: Agrupar movimientos por tipo, EXCLUYENDO ventas anuladas del tipo VENTA y ANULADO-VENTA
    const movimientosAgrupados = movimientosHoy.reduce((acc: Record<string, MovimientoCaja[]>, mov) => {
        const tipo = mov.tipo_operacion.nombre;

        // ✅ NUEVO: Excluir el tipo ANULADO-VENTA completamente
        if (tipo === 'Venta Anulada' || tipo === 'ANULADO-VENTA') {
            return acc; // Saltar movimientos de tipo ANULADO-VENTA
        }

        // 🔴 IMPORTANTE: Si es VENTA, solo contar si está APROBADA (excluir ANULADAS)
        if (tipo === 'Venta' || tipo === 'VENTA') {
            if (mov.venta?.estado_documento?.codigo !== 'APROBADO') {
                return acc; // Saltar ventas no aprobadas
            }
        }

        if (!acc[tipo]) {
            acc[tipo] = [];
        }
        acc[tipo].push(mov);
        return acc;
    }, {});

    // ✅ NUEVO: Calcular totales por tipo de operación
    const totalesPorTipo = Object.entries(movimientosAgrupados)
        .filter(([tipo]) => tipo !== 'Venta Anulada' && tipo !== 'ANULADO-VENTA') // ✅ NUEVO: Excluir ANULADO-VENTA
        .map(([tipo, movs]) => {
            // ✅ ACTUALIZADO (2026-04-29): Para VENTA, usar totalDetallesPago (dinero real pagado desde detalles_pago_venta)
            // Para otros tipos, sumar los montos localmente PERO solo si están APROBADOS
            if (tipo === 'Venta' || tipo === 'VENTA') {
                return {
                    tipo,
                    total: totalDetallesPago || 0, // Usar dinero real pagado (desde detalles_pago_venta)
                    count: movs.length,
                };
            }

            // ✅ CORREGIDO (2026-04-30): Filtrar solo movimientos APROBADOS antes de sumar
            const movsAprobados = movs.filter((m) => {
                // Para movimientos con venta asociada, verificar que esté aprobada
                if (m.venta?.estado_documento) {
                    return m.venta.estado_documento.codigo === 'APROBADO';
                }
                // Para otros movimientos sin venta (gastos, etc.), incluirlos
                return true;
            });

            return {
                tipo,
                total: movsAprobados.reduce((sum, m) => sum + m.monto, 0),
                count: movsAprobados.length,
            };
        });

    // ✅ CORREGIDO (2026-04-30): Si hay totalDetallesPago pero NO hay movimiento VENTA en movimientosHoy,
    // agregar un card de VENTA manual (puede ocurrir si los movimientos aún no se crean en backend)
    const tieneVentaEnTotales = totalesPorTipo.some((t) => t.tipo === 'Venta' || t.tipo === 'VENTA');
    if (totalDetallesPago > 0 && !tieneVentaEnTotales) {
        totalesPorTipo.unshift({
            tipo: 'Venta',
            total: totalDetallesPago,
            count: detallesPagoDesglosado.length,
        });

    }

    // ✅ CORREGIDO (2026-04-30): Si hay ventasAnuladas pero el card de ANULACION tiene total=0,
    // reemplazarlo con el valor correcto desde props (ventasAnuladas viene del backend calculado correctamente)
    const anulacionIndex = totalesPorTipo.findIndex((t) => t.tipo === 'Anulación' || t.tipo === 'ANULACION');
    if (ventasAnuladas > 0) {
        if (anulacionIndex >= 0) {
            // Reemplazar si existe
            totalesPorTipo[anulacionIndex] = {
                tipo: 'Anulación',
                total: -ventasAnuladas, // Negativo porque es salida
                count: totalesPorTipo[anulacionIndex].count,
            };
        } else {
            // Agregar si no existe
            totalesPorTipo.push({
                tipo: 'Anulación',
                total: -ventasAnuladas, // Negativo porque es salida
                count: 0,
            });
        }

    }

    // ✅ NUEVO: Agrupar movimientos por tipo de pago y calcular totales
    const movimientosAgrupadosPorTipoPago = movimientosHoy.reduce((acc: Record<string, any[]>, mov: any) => {
        const tipoPagoNombre = mov.tipo_pago?.nombre || 'Sin tipo de pago';
        if (!acc[tipoPagoNombre]) {
            acc[tipoPagoNombre] = [];
        }
        acc[tipoPagoNombre].push(mov);
        return acc;
    }, {});

    const totalesPorTipoPago = Object.entries(movimientosAgrupadosPorTipoPago).map(([tipoPago, movs]: [string, any]) => ({
        tipoPago,
        total: movs.reduce((sum, m) => sum + m.monto, 0),
        count: movs.length,
    }));

    // ✅ MEJORADO: ventasPorTipoPago ahora viene del backend (MovimientoCajaService)
    // No calcular localmente, simplemente usar lo que viene en props

    // ✅ NUEVO: Calcular rango de IDs de venta (venta_id)
    const calcularRangoVentas = () => {
        if (movimientosHoy.length === 0) return null;

        // Extraer IDs de venta válidos
        const ventaIds = movimientosHoy.map((mov) => mov.venta_id).filter((id): id is number => id !== null && id !== undefined && id > 0);

        if (ventaIds.length === 0) return null;

        const minId = Math.min(...ventaIds);
        const maxId = Math.max(...ventaIds);
        // Ventas distintas: una venta puede tener hasta 3 movimientos (pago mixto efectivo + QR y/o vuelto),
        // así que contar movimientos daba de más (ej. 590 en lugar de 474)
        const totalVentas = new Set(ventaIds).size;

        return { minId, maxId, totalVentas };
    };

    const rangoVentas = calcularRangoVentas();

    // Opciones de los filtros, a partir de los movimientos del día
    const usuariosUnicos = Array.from(new Set(movimientosHoy.map((mov) => mov.usuario?.name).filter((u): u is string => !!u))).sort();
    const nombrePago = (mov: MovimientoCaja): string => mov.tipo_pago?.nombre || 'Sin medio de pago';
    const mediosPago = Array.from(new Set(movimientosHoy.map(nombrePago))).sort();
    // Hora local HH:MM del movimiento (para el filtro por turno)
    const horaDe = (mov: MovimientoCaja) => {
        const d = new Date(mov.fecha);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // Filtrar movimientos por todos los criterios
    let movimientosAMostrar = movimientosHoy.filter((mov) => {
        if (filtroTipo && mov.tipo_operacion.nombre !== filtroTipo) return false;
        if (filtroPago && nombrePago(mov) !== filtroPago) return false;

        const monto = toNumber(mov.monto);
        if (filtroSigno === 'ingresos' && monto < 0) return false;
        if (filtroSigno === 'egresos' && monto > 0) return false;

        // Turno: horaHasta < horaDesde cruza la medianoche (ej. 22:00 a 02:00)
        if (horaDesde || horaHasta) {
            const hora = horaDe(mov);
            const desde = horaDesde || '00:00';
            const hasta = horaHasta || '23:59';
            const dentro = desde <= hasta ? hora >= desde && hora <= hasta : hora >= desde || hora <= hasta;
            if (!dentro) return false;
        }

        // Buscador único: folio, descripción, tipo, cliente, N° de venta o monto
        if (busqueda.trim()) {
            const texto = busqueda.trim().toLowerCase();
            const campos = [
                mov.numero_documento,
                mov.observaciones,
                mov.tipo_operacion.nombre,
                mov.venta?.cliente?.nombre,
                mov.venta?.numero_documento,
                mov.venta_id ? String(mov.venta_id) : '',
                Math.abs(monto).toFixed(2),
            ];
            if (!campos.some((c) => c && c.toLowerCase().includes(texto))) return false;
        }

        if (montoMin || montoMax) {
            const montoAbsoluto = Math.abs(monto);
            const min = montoMin ? parseFloat(montoMin) : 0;
            const max = montoMax ? parseFloat(montoMax) : Infinity;
            if (!(montoAbsoluto >= min && montoAbsoluto <= max)) return false;
        }

        if (filtroUsuario && (mov.usuario?.name || '') !== filtroUsuario) return false;

        // Estado de venta: solo aplica a movimientos de venta (los demás no se ocultan)
        if (filtroEstadoVenta !== 'todos' && mov.venta?.estado_documento && mov.venta.estado_documento.codigo !== filtroEstadoVenta) {
            return false;
        }

        return true;
    });

    // ✅ Aplicar ordenamiento
    movimientosAMostrar = [...movimientosAMostrar].sort((a, b) => {
        switch (ordenarPor) {
            case 'fecha':
                // ✅ CORREGIDO: Ordenar por fecha DESCENDENTE (más nuevos primero)
                return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
            case 'monto':
                return Math.abs(toNumber(b.monto)) - Math.abs(toNumber(a.monto));
            case 'tipo':
                return a.tipo_operacion.nombre.localeCompare(b.tipo_operacion.nombre);
            default:
                return 0;
        }
    });

    // Totales de lo filtrado (ej. "¿cuánto entró por QR?")
    const totalesFiltrados = movimientosAMostrar.reduce(
        (t, mov) => {
            const m = toNumber(mov.monto);
            return m >= 0 ? { ...t, entradas: t.entradas + m } : { ...t, salidas: t.salidas + Math.abs(m) };
        },
        { entradas: 0, salidas: 0 },
    );

    // Neto de todos los movimientos de la caja (tarjeta "Todos")
    const netoDia = movimientosHoy.reduce((suma, mov) => suma + toNumber(mov.monto), 0);

    // Filtros activos como chips (cada uno con su forma de quitarlo)
    const filtrosActivos: { etiqueta: string; quitar: () => void }[] = [
        ...(filtroTipo ? [{ etiqueta: `Tipo: ${filtroTipo}`, quitar: () => setFiltroTipo(null) }] : []),
        ...(filtroPago ? [{ etiqueta: `Pago: ${filtroPago}`, quitar: () => setFiltroPago('') }] : []),
        ...(filtroSigno !== 'todos' ? [{ etiqueta: filtroSigno === 'ingresos' ? 'Solo ingresos' : 'Solo egresos', quitar: () => setFiltroSigno('todos') }] : []),
        ...(busqueda.trim() ? [{ etiqueta: `Busca: "${busqueda.trim()}"`, quitar: () => setBusqueda('') }] : []),
        ...(horaDesde || horaHasta ? [{ etiqueta: `Hora: ${horaDesde || '00:00'} – ${horaHasta || '23:59'}`, quitar: () => { setHoraDesde(''); setHoraHasta(''); } }] : []),
        ...(montoMin || montoMax ? [{ etiqueta: `Monto: ${montoMin || '0'} – ${montoMax || '∞'}`, quitar: () => { setMontoMin(''); setMontoMax(''); } }] : []),
        ...(filtroUsuario ? [{ etiqueta: `Usuario: ${filtroUsuario}`, quitar: () => setFiltroUsuario('') }] : []),
        ...(filtroEstadoVenta !== 'todos' ? [{ etiqueta: filtroEstadoVenta === 'APROBADO' ? 'Ventas aprobadas' : 'Ventas anuladas', quitar: () => setFiltroEstadoVenta('todos') }] : []),
    ];
    const limpiarFiltros = () => filtrosActivos.forEach((f) => f.quitar());

    // Paginación en pantalla: filtros, totales, CSV e impresión siguen usando todos los movimientos filtrados
    const totalPaginas = Math.max(1, Math.ceil(movimientosAMostrar.length / porPagina));
    const paginaActual = Math.min(pagina, totalPaginas); // Si un filtro achica la lista, no quedar en una página vacía
    const movimientosPagina = movimientosAMostrar.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

    // ✅ Función para exportar movimientos a CSV
    // Excel (.xlsx) de los movimientos filtrados: con filtros aplicados, totales, autofiltro y montos como número.
    // ExcelJS se carga solo al exportar para no pesar en la pantalla de caja.
    const exportarExcel = async () => {
        if (exportando || movimientosAMostrar.length === 0) return;
        setExportando(true);
        try {
            const { default: ExcelJS } = await import('exceljs');
            const libro = new ExcelJS.Workbook();
            const hoja = libro.addWorksheet('Movimientos');

            hoja.addRow([`Movimientos de caja ${cajaAbiertaHoy?.caja?.nombre ?? ''} ${etiquetaPeriodo}`.trim()]).font = { bold: true, size: 13 };
            hoja.addRow([filtrosActivos.length ? `Filtros: ${filtrosActivos.map((f) => f.etiqueta).join(' · ')}` : 'Sin filtros']);
            hoja.addRow([]);

            const encabezados = hoja.addRow(['ID', 'Fecha', 'Hora', 'Tipo', 'Medio de pago', 'Documento', 'Cliente', 'Descripción', 'Usuario', 'Monto (Bs)']);
            encabezados.font = { bold: true };
            const filaEncabezados = encabezados.number;

            movimientosAMostrar.forEach((mov) => {
                const fecha = new Date(mov.fecha);
                hoja.addRow([
                    mov.id,
                    fecha.toLocaleDateString('es-BO'),
                    fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
                    mov.tipo_operacion.nombre,
                    nombrePago(mov),
                    mov.numero_documento || '',
                    mov.venta?.cliente?.nombre || '',
                    mov.observaciones || '',
                    mov.usuario?.name || 'Sin usuario',
                    toNumber(mov.monto),
                ]);
            });
            const ultimaFila = hoja.rowCount;

            hoja.addRow([]);
            [
                ['Entradas', totalesFiltrados.entradas],
                ['Salidas', -totalesFiltrados.salidas],
                ['Neto', totalesFiltrados.entradas - totalesFiltrados.salidas],
            ].forEach(([etiqueta, monto]) => {
                const fila = hoja.addRow(['', '', '', '', '', '', '', '', etiqueta, monto]);
                fila.font = { bold: true };
            });

            hoja.getColumn(10).numFmt = '#,##0.00;[Red]-#,##0.00';
            [8, 12, 8, 22, 18, 22, 24, 40, 18, 14].forEach((ancho, i) => (hoja.getColumn(i + 1).width = ancho));
            hoja.views = [{ state: 'frozen', ySplit: filaEncabezados }];
            hoja.autoFilter = { from: { row: filaEncabezados, column: 1 }, to: { row: ultimaFila, column: 10 } };

            const buffer = await libro.xlsx.writeBuffer();
            const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `movimientos-caja-${new Date().toLocaleDateString('en-CA')}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('❌ Error al exportar a Excel:', error);
            alert('No se pudo generar el Excel');
        } finally {
            setExportando(false);
        }
    };

    // ✅ NUEVO: Función para toggle expandir/contraer movimiento
    const toggleMovimientoExpandido = (movimientoId: number) => {
        const nuevoExpandidos = new Set(movimientosExpandidos);
        if (nuevoExpandidos.has(movimientoId)) {
            nuevoExpandidos.delete(movimientoId);
        } else {
            nuevoExpandidos.add(movimientoId);
        }
        setMovimientosExpandidos(nuevoExpandidos);
    };

    // ✅ NUEVO: Función para eliminar movimiento
    const handleEliminarMovimiento = async () => {
        if (!movimientoAEliminar) return;

        setEliminandoMovimiento(true);
        try {
            const response = await fetch(`/cajas/movimiento/${movimientoAEliminar.id}/eliminar`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });

            if (!response.ok) {
                const data = await response.json();
                console.error('❌ Error al eliminar movimiento:', data);
                alert(`Error: ${data.message || 'No se pudo eliminar el movimiento'}`);
                return;
            }

            const data = await response.json();

            // Mostrar notificación de éxito
            alert('✅ Movimiento eliminado exitosamente');

            // Recargar la página
            window.location.reload();
        } catch (error) {
            console.error('❌ Error en solicitud de eliminación:', error);
            alert('Error al eliminar el movimiento');
        } finally {
            setEliminandoMovimiento(false);
            setMostrarDialogoEliminacion(false);
            setMovimientoAEliminar(null);
        }
    };

    return (
        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
            <div className="p-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Movimientos {etiquetaPeriodo}</h3>
                    </div>
                    <br />
                    {/* ✅ NUEVO: Rango de IDs de Venta */}
                    <div className="display-block text-right">
                        <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Rango de Ventas (ID)</p>
                        {rangoVentas ? (
                            <>
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {rangoVentas.minId} - {rangoVentas.maxId}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {rangoVentas.totalVentas} venta{rangoVentas.totalVentas !== 1 ? 's' : ''}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-lg font-bold text-gray-400 dark:text-gray-500">—</p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Sin ventas</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Filtros principales: buscador, tipo de operación, medio de pago y signo (siempre visibles) */}
                <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[220px] flex-1">
                            <input
                                type="search"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="🔍 Buscar folio, descripción, cliente, N° de venta o monto…"
                                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                        <div className="flex overflow-hidden rounded-lg border border-gray-300 text-sm dark:border-gray-600">
                            {(['todos', 'ingresos', 'egresos'] as const).map((signo) => (
                                <button
                                    key={signo}
                                    onClick={() => setFiltroSigno(signo)}
                                    className={`px-3 py-1.5 font-medium transition ${
                                        filtroSigno === signo
                                            ? signo === 'egresos' ? 'bg-red-600 text-white' : signo === 'ingresos' ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {signo === 'todos' ? 'Todos' : signo === 'ingresos' ? '📈 Ingresos' : '📉 Egresos'}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setFiltrosVisibles(!filtrosVisibles)}
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            {filtrosVisibles ? '🔼 Menos filtros' : '🔽 Más filtros'}
                        </button>
                        <button
                            onClick={exportarExcel}
                            disabled={movimientosAMostrar.length === 0 || exportando}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                            title="Descarga en Excel los movimientos que se ven (con los filtros aplicados)"
                        >
                            {exportando ? '⏳ Generando…' : '📥 Excel'}
                        </button>
                    </div>

                    {/* Tipo de operación: cada tarjeta muestra el resumen y filtra al hacer clic (antes eran chips + tarjetas) */}
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        <button
                            type="button"
                            onClick={() => setFiltroTipo(null)}
                            aria-pressed={!filtroTipo}
                            className={`rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-2 text-left transition hover:shadow-md dark:bg-indigo-900/20 ${
                                !filtroTipo ? 'ring-2 ring-indigo-500' : 'opacity-80 hover:opacity-100'
                            }`}
                        >
                            <p className="flex items-center justify-between gap-1 text-xs font-medium tracking-wide text-gray-600 uppercase dark:text-gray-400">
                                <span>Todos · neto</span>
                                <span className="normal-case">{movimientosHoy.length} mov.</span>
                            </p>
                            <p className={`mt-1 text-lg font-bold ${getMovimientoColor(netoDia)}`}>
                                {netoDia < 0 ? '-' : ''}
                                {formatCurrency(Math.abs(netoDia))}
                            </p>
                        </button>
                        {totalesPorTipo.map(({ tipo, total }) => {
                            // Color según el código del tipo de operación
                            const codigo = movimientosHoy.find((m) => m.tipo_operacion.nombre === tipo)?.tipo_operacion.codigo || tipo.toUpperCase();
                            const color = getTipoOperacionColor(codigo);
                            const estilo = color.includes('bg-green')
                                ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                                : color.includes('bg-red')
                                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                                  : color.includes('bg-blue')
                                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                    : color.includes('bg-yellow')
                                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                                      : color.includes('bg-orange')
                                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                                        : color.includes('bg-purple')
                                          ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                                          : color.includes('bg-indigo')
                                            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-gray-400 bg-gray-50 dark:bg-gray-900/20';
                            const seleccionado = filtroTipo === tipo;
                            // ✅ ACTUALIZADO (2026-04-30): Para VENTA, mostrar desglose de tipos de pago
                            const esVenta = tipo === 'Venta' || tipo === 'VENTA';
                            const mostrarDesglose = esVenta && detallesPagoDesglosado && detallesPagoDesglosado.length > 0;

                            return (
                                <button
                                    type="button"
                                    key={tipo}
                                    onClick={() => setFiltroTipo(seleccionado ? null : tipo)}
                                    aria-pressed={seleccionado}
                                    title={seleccionado ? 'Quitar filtro' : `Ver solo: ${tipo}`}
                                    className={`rounded-lg border-l-4 p-2 text-left transition hover:shadow-md ${estilo} ${
                                        seleccionado ? 'ring-2 ring-indigo-500' : filtroTipo ? 'opacity-60 hover:opacity-100' : ''
                                    }`}
                                >
                                    <p className="flex items-center justify-between gap-1 text-xs font-medium tracking-wide text-gray-600 uppercase dark:text-gray-400">
                                        <span className="truncate">{tipo}</span>
                                        <span className="shrink-0 normal-case">{movimientosAgrupados[tipo]?.length ?? 0} mov.</span>
                                    </p>
                                    <p className={`mt-1 text-lg font-bold ${getMovimientoColor(total)}`}>{formatCurrency(Math.abs(total))}</p>

                                    {/* ✅ ACTUALIZADO (2026-05-03): SOLO EFECTIVO + TRANSFERENCIA (CRÉDITO tiene su propio card) */}
                                    {mostrarDesglose && (
                                        <div className="mt-1 space-y-0.5 border-t border-gray-300 pt-1 dark:border-gray-600">
                                            {detallesPagoDesglosado
                                                .filter((detalle) => {
                                                    const c = String((detalle as { codigo?: string }).codigo ?? detalle.tipo).toUpperCase();
                                                    return c === 'EFECTIVO' || c === 'TRANSFERENCIA/QR';
                                                })
                                                .map((detalle) => (
                                                    <div key={detalle.tipo_pago_id} className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-600 dark:text-gray-400">{detalle.tipo}</span>
                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(detalle.total)}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Medio de pago: clave para cuadrar el efectivo al cerrar */}
                    {mediosPago.length > 1 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Pago:</span>
                            {mediosPago.map((medio) => (
                                <button
                                    key={medio}
                                    onClick={() => setFiltroPago(filtroPago === medio ? '' : medio)}
                                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${filtroPago === medio ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    {medio} ({movimientosHoy.filter((m) => nombrePago(m) === medio).length})
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filtros avanzados */}
                {filtrosVisibles && (
                    <div className="mt-3 grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-5 dark:bg-gray-700">
                        <div>
                            <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">Hora (turno)</p>
                            <div className="flex items-center gap-1">
                                <input type="time" value={horaDesde} onChange={(e) => setHoraDesde(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" aria-label="Desde la hora" />
                                <span className="text-gray-500">–</span>
                                <input type="time" value={horaHasta} onChange={(e) => setHoraHasta(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" aria-label="Hasta la hora" />
                            </div>
                        </div>
                        <div>
                            <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">Monto (Bs.)</p>
                            <div className="flex items-center gap-1">
                                <input type="number" min={0} placeholder="Mín." value={montoMin} onChange={(e) => setMontoMin(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white w-24" />
                                <span className="text-gray-500">–</span>
                                <input type="number" min={0} placeholder="Máx." value={montoMax} onChange={(e) => setMontoMax(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white w-24" />
                            </div>
                        </div>
                        <div>
                            <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">Usuario</p>
                            <select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white w-full">
                                <option value="">Todos</option>
                                {usuariosUnicos.map((u) => (
                                    <option key={u} value={u}>
                                        {u}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">Estado de venta</p>
                            <select
                                value={filtroEstadoVenta}
                                onChange={(e) => setFiltroEstadoVenta(e.target.value as 'todos' | 'APROBADO' | 'ANULADO')}
                                className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white w-full"
                            >
                                <option value="todos">Todas</option>
                                <option value="APROBADO">✅ Aprobadas</option>
                                <option value="ANULADO">❌ Anuladas</option>
                            </select>
                        </div>
                        <div>
                            <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">Ordenar por</p>
                            <select
                                value={ordenarPor}
                                onChange={(e) => setOrdenarPor(e.target.value as 'fecha' | 'monto' | 'tipo')}
                                className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white w-full"
                            >
                                <option value="fecha">📅 Más reciente</option>
                                <option value="monto">💰 Mayor monto</option>
                                <option value="tipo">📋 Tipo de operación</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Resultado: solo con filtros activos (sin filtros repetía lo de las tarjetas): chips con ✕ y totales de lo filtrado */}
                {filtrosActivos.length > 0 && (
                <div className="mt-2 mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900/40">
                    {filtrosActivos.map((f) => (
                        <span key={f.etiqueta} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
                            {f.etiqueta}
                            <button onClick={f.quitar} className="ml-0.5 hover:text-indigo-950 dark:hover:text-white" aria-label={`Quitar filtro ${f.etiqueta}`}>
                                ✕
                            </button>
                        </span>
                    ))}
                    {filtrosActivos.length > 1 && (
                        <button onClick={limpiarFiltros} className="text-xs font-medium text-red-600 hover:underline dark:text-red-400">
                            Limpiar todo
                        </button>
                    )}
                    <span className="text-gray-600 dark:text-gray-300">
                        <strong>{movimientosAMostrar.length}</strong> de {movimientosHoy.length} movimientos
                        {movimientosAMostrar.length > 0 && (
                            <>
                                {' · '}
                                <span className="text-green-700 dark:text-green-400">Entradas {formatCurrency(totalesFiltrados.entradas)}</span>
                                {' · '}
                                <span className="text-red-700 dark:text-red-400">Salidas {formatCurrency(totalesFiltrados.salidas)}</span>
                                {' · '}
                                <strong>Neto {formatCurrency(totalesFiltrados.entradas - totalesFiltrados.salidas)}</strong>
                            </>
                        )}
                    </span>
                </div>
                )}
                {movimientosAMostrar.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Ningún movimiento coincide con los filtros.</p>
                )}

                <div className="overflow-x-auto mt-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                            <tr>
                                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Id</th>
                                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tipo Operación</th>
                                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Estado</th>
                                {/* <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Estado Pago</th> */}
                                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Pago</th>
                                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Monto</th>
                                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Fecha</th>
                                <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Descripcion</th>
                                <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase dark:text-gray-400">-</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800 rounded-lg">
                            {movimientosPagina.map((movimiento) => (
                                <React.Fragment key={movimiento.id}>
                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-1 py-2 text-sm text-gray-900 dark:text-gray-100">
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">#{movimiento.id}</p>
                                        </td>
                                        <td className="px-1 py-2 text-left text-sm">
                                            <span
                                                className={`inline-flex items-center rounded-full px-1 py-1 text-left text-xs ${getTipoOperacionColor(movimiento.tipo_operacion.codigo)}`}
                                            >
                                                {movimiento.tipo_operacion.nombre}{' '}
                                                {(movimiento.venta_id || movimiento.pago_id || movimiento.egreso_id) && (
                                                    <div className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                                        {movimiento.venta_id && (
                                                            <span className="mr-2 inline-block">
                                                                {' '}
                                                                {/* Abre la venta (ventas.show) en otra pestaña */}
                                                                <a
                                                                    href={`/ventas/${movimiento.venta_id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="font-semibold text-blue-700 hover:underline dark:text-blue-300"
                                                                    title="Ver la venta en otra pestaña"
                                                                >
                                                                    Vta #{movimiento.venta_id} ↗
                                                                </a>
                                                            </span>
                                                        )}
                                                        {movimiento.pago_id && (
                                                            <span className="mr-2 inline-block">
                                                                {' '}
                                                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                                    Pgo #{movimiento.pago_id}
                                                                </span>
                                                            </span>
                                                        )}
                                                        {movimiento.egreso_id && (
                                                            <span className="inline-block">
                                                                {' '}
                                                                <span className="font-semibold text-white-600 dark:text-white-400">
                                                                    Egr #{movimiento.egreso_id}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </span>
                                        </td>

                                        <td className="px-1 py-2 text-sm">
                                            {movimiento.venta?.estado_documento && (
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        movimiento.venta.estado_documento.codigo === 'APROBADO'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                            : movimiento.venta.estado_documento.codigo === 'ANULADO'
                                                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                              : movimiento.venta.estado_documento.codigo === 'PENDIENTE'
                                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {movimiento.venta.estado_documento.nombre}
                                                </span>
                                            )}
                                            {movimiento.pago?.estado && (
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        movimiento.pago.estado.toUpperCase() === 'REGISTRADO'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                            : movimiento.pago.estado.toUpperCase() === 'ANULADO'
                                                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                                    }`}
                                                    title={`Estado de pago: ${movimiento.pago.estado}`}
                                                >
                                                    {movimiento.pago.estado}
                                                </span>
                                            )}
                                            {movimiento.egreso?.estado_documento && (
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        movimiento.egreso.estado_documento.codigo === 'APROBADO'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                            : movimiento.egreso.estado_documento.codigo === 'ANULADO'
                                                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                                    }`}
                                                    title={`Estado de egreso: ${movimiento.egreso.estado_documento.nombre}`}
                                                >
                                                    {movimiento.egreso.estado_documento.nombre}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-1 py-2 text-sm">
                                            {movimiento.tipo_pago?.nombre ? (
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        movimiento.tipo_pago.nombre.toUpperCase() === 'EFECTIVO'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                                                            : movimiento.tipo_pago.nombre.toUpperCase() === 'TRANSFERENCIA/QR'
                                                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                              : movimiento.tipo_pago.nombre.toUpperCase() === 'CHEQUE'
                                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                                                : movimiento.tipo_pago.nombre.toUpperCase() === 'CREDITO'
                                                                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300'
                                                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {movimiento.tipo_pago.nombre}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">—</span>
                                            )}
                                        </td>
                                        <td className="px-1 py-2 text-sm">
                                            {/* Monto */}
                                            <div className="flex items-center">
                                                {getMovimientoIcon(toNumber(movimiento.monto))}
                                                <span className={`ml-1 text-sm font-medium ${getMovimientoColor(toNumber(movimiento.monto))}`}>
                                                    {formatCurrency(Math.abs(toNumber(movimiento.monto)))}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-1 py-2 text-left text-xs text-gray-500 dark:text-gray-400">
                                            {formatDateTime(movimiento.fecha)}
                                        </td>
                                        <td className="max-w-[180px] px-1 py-2 text-xs text-gray-900 dark:text-gray-100">
                                            {movimiento.observaciones ? (
                                                <div className="truncate" title={movimiento.observaciones}>
                                                    {movimiento.observaciones.length > 25
                                                        ? `${movimiento.observaciones.slice(0, 25)}...`
                                                        : movimiento.observaciones}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">—</span>
                                            )}
                                        </td>
                                        <td className="px-1 py-2 text-right">
                                            {/* ✅ MENÚ DROPDOWN DE ACCIONES */}
                                            <div className="flex items-center justify-end">
                                                {/* Imprimir Movimiento Individual */}
                                                {movimiento.venta_id === null && movimiento.pago_id === null && (
                                                    <button
                                                        onClick={() => {
                                                            setMovimientoSeleccionado(movimiento);
                                                            setMostrarModalMovimientoIndividual(true);
                                                        }}
                                                        disabled={movimiento.venta_id !== null}
                                                    title={
                                                        movimiento.venta_id !== null
                                                            ? 'No se puede imprimir movimientos vinculados a ventas'
                                                            : 'Imprimir este movimiento'
                                                    }
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </button> )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            className="inline-flex items-center justify-center rounded-lg p-1.5 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                                                            title="Acciones"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        {/* Ver Detalles de Venta */}
                                                        {movimiento.venta && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setMovimientoVentaSeleccionado(movimiento);
                                                                        setMostrarModalVenta(true);
                                                                    }}
                                                                    className={
                                                                        tieneDiscrepancia(movimiento)
                                                                            ? 'text-orange-600 dark:text-orange-400'
                                                                            : 'text-purple-600 dark:text-purple-400'
                                                                    }
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                    {tieneDiscrepancia(movimiento)
                                                                        ? '⚠️ Ver detalles (Discrepancia)'
                                                                        : 'Ver detalles de venta'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}

                                                        {/* Eliminar (para cualquier movimiento menos VENTA/PAGO) */}
                                                        {movimiento.tipo_operacion.codigo !== 'VENTA' &&
                                                            movimiento.tipo_operacion.codigo !== 'PAGO' && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setMovimientoAEliminar(movimiento);
                                                                            setMostrarDialogoEliminacion(true);
                                                                        }}
                                                                        variant="destructive"
                                                                        title="Eliminar este movimiento"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        Eliminar
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {movimientosAMostrar.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                            <span>
                                {(paginaActual - 1) * porPagina + 1}–{Math.min(paginaActual * porPagina, movimientosAMostrar.length)} de{' '}
                                <strong>{movimientosAMostrar.length}</strong>
                            </span>
                            <select
                                value={porPagina}
                                onChange={(e) => cambiarPorPagina(Number(e.target.value))}
                                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                aria-label="Movimientos por página"
                            >
                                {[10, 25, 50, 100].map((n) => (
                                    <option key={n} value={n}>
                                        {n} por página
                                    </option>
                                ))}
                            </select>
                        </div>
                        {totalPaginas > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPagina(1)}
                                    disabled={paginaActual === 1}
                                    className="rounded-md px-2 py-1 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-700"
                                    aria-label="Primera página"
                                >
                                    «
                                </button>
                                <button
                                    onClick={() => setPagina(paginaActual - 1)}
                                    disabled={paginaActual === 1}
                                    className="rounded-md px-2 py-1 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-700"
                                    aria-label="Página anterior"
                                >
                                    ‹ Anterior
                                </button>
                                <span className="px-2">
                                    Página <strong>{paginaActual}</strong> de {totalPaginas}
                                </span>
                                <button
                                    onClick={() => setPagina(paginaActual + 1)}
                                    disabled={paginaActual === totalPaginas}
                                    className="rounded-md px-2 py-1 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-700"
                                    aria-label="Página siguiente"
                                >
                                    Siguiente ›
                                </button>
                                <button
                                    onClick={() => setPagina(totalPaginas)}
                                    disabled={paginaActual === totalPaginas}
                                    className="rounded-md px-2 py-1 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-700"
                                    aria-label="Última página"
                                >
                                    »
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* La impresión de todos los movimientos está en el botón "📊 Movimientos" de la página */}

                {/* ✅ NUEVO: Modal de Impresión (Movimiento Individual) */}
                {movimientoSeleccionado && (
                    <OutputSelectionModal
                        isOpen={mostrarModalMovimientoIndividual}
                        onClose={() => {
                            setMostrarModalMovimientoIndividual(false);
                            setMovimientoSeleccionado(null);
                        }}
                        documentoId={movimientoSeleccionado.id}
                        tipoDocumento="movimiento"
                        documentoInfo={{
                            numero: `Movimiento #${movimientoSeleccionado.id}`,
                            fecha: new Date(movimientoSeleccionado.fecha).toLocaleDateString('es-ES'),
                            monto: movimientoSeleccionado.monto,
                        }}
                    />
                )}

                {/* ✅ NUEVO: Diálogo de Confirmación para Eliminar */}
                <AlertDialog open={mostrarDialogoEliminacion} onOpenChange={setMostrarDialogoEliminacion}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Se eliminará el movimiento de <strong>{movimientoAEliminar?.tipo_operacion.nombre}</strong>
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        {/* ✅ Detalles del movimiento */}
                        <div className="space-y-3 border-y border-gray-200 py-4 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monto:</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(Math.abs(toNumber(movimientoAEliminar?.monto || 0)))}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha:</span>
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {movimientoAEliminar && formatDateTime(movimientoAEliminar.fecha)}
                                </span>
                            </div>
                            <div className="flex items-start justify-between">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Observación:</span>
                                <span className="max-w-xs text-right text-sm text-gray-900 dark:text-gray-100">
                                    {movimientoAEliminar?.observaciones || 'Sin observaciones'}
                                </span>
                            </div>
                        </div>

                        {/* ✅ Advertencia */}
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer.
                            </p>
                        </div>

                        {/* ✅ Botones */}
                        <div className="flex justify-end gap-3">
                            <AlertDialogCancel disabled={eliminandoMovimiento}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleEliminarMovimiento}
                                disabled={eliminandoMovimiento}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                {eliminandoMovimiento ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Eliminando...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </>
                                )}
                            </AlertDialogAction>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>

                {/* ✅ NUEVO: Modal de Detalles de Venta */}
                <Dialog open={mostrarModalVenta} onOpenChange={setMostrarModalVenta}>
                    <DialogContent className="max-w-2xl dark:border-slate-700 dark:bg-slate-800">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white">Detalles de Venta</DialogTitle>
                        </DialogHeader>

                        {movimientoVentaSeleccionado?.venta && (
                            <div className="space-y-6 py-4">
                                {/* IDs y Monto */}
                                <div className="grid grid-cols-3 gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
                                    <div>
                                        <p className="text-xs font-medium text-blue-600 uppercase dark:text-blue-400">ID Venta</p>
                                        <p className="mt-1 text-lg font-bold text-blue-900 dark:text-blue-100">
                                            #{movimientoVentaSeleccionado.venta.id}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-blue-600 uppercase dark:text-blue-400">ID Movimiento</p>
                                        <p className="mt-1 text-lg font-bold text-blue-900 dark:text-blue-100">#{movimientoVentaSeleccionado.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-blue-600 uppercase dark:text-blue-400">Monto Movimiento</p>
                                        <p
                                            className={`mt-1 text-lg font-bold ${movimientoVentaSeleccionado.monto > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                        >
                                            {movimientoVentaSeleccionado.monto > 0 ? '+' : ''}Bs.{' '}
                                            {Number(movimientoVentaSeleccionado.monto).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Información General */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Número de Venta</p>
                                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                            {movimientoVentaSeleccionado.venta.numero_documento || movimientoVentaSeleccionado.venta.numero}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado</p>
                                        <p className="mt-1">
                                            {movimientoVentaSeleccionado.venta.estado_documento ? (
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        movimientoVentaSeleccionado.venta.estado_documento.codigo === 'APROBADO'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                            : movimientoVentaSeleccionado.venta.estado_documento.codigo === 'ANULADO'
                                                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {movimientoVentaSeleccionado.venta.estado_documento.nombre}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Montos */}
                                <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-900/50">
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 uppercase dark:text-gray-400">Total</p>
                                        <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                                            Bs. {Number(movimientoVentaSeleccionado.venta.total ?? 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 uppercase dark:text-gray-400">Pagado</p>
                                        <p className="mt-2 text-xl font-bold text-green-600 dark:text-green-400">
                                            Bs. {Number(movimientoVentaSeleccionado.venta.monto_pagado ?? 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 uppercase dark:text-gray-400">Pendiente</p>
                                        <p
                                            className={`mt-2 text-xl font-bold ${Number(movimientoVentaSeleccionado.venta.monto_pendiente ?? 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}
                                        >
                                            Bs. {Number(movimientoVentaSeleccionado.venta.monto_pendiente ?? 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Detalles de Pago */}
                                {movimientoVentaSeleccionado.venta.detallesPagoVenta &&
                                    movimientoVentaSeleccionado.venta.detallesPagoVenta.length > 0 && (
                                        <div>
                                            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Desglose de Pagos</h3>
                                            <div className="space-y-2">
                                                {movimientoVentaSeleccionado.venta.detallesPagoVenta.map((detalle, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between rounded bg-gray-50 p-3 dark:bg-slate-900/50"
                                                    >
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {detalle.tipoPago?.nombre || 'Sin tipo'}
                                                        </span>
                                                        <span className="font-semibold text-gray-900 dark:text-white">
                                                            Bs. {Number(detalle.monto).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                {/* Cliente */}
                                {movimientoVentaSeleccionado.venta.cliente && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cliente</p>
                                        <p className="mt-1 text-gray-900 dark:text-white">{movimientoVentaSeleccionado.venta.cliente.nombre}</p>
                                    </div>
                                )}

                                {/* Acciones */}
                                <div className="flex justify-end gap-2 border-t pt-4 dark:border-slate-700">
                                    <button
                                        onClick={() => setMostrarModalVenta(false)}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
