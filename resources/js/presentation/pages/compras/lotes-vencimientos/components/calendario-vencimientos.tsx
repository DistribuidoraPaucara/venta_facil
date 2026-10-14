import React, { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    isToday,
    parse,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ImageOff, CalendarDays, Trash2, ExternalLink, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';

export interface LoteCalendario {
    id: number;
    producto_id: number;
    producto_nombre: string | null;
    sku: string | null;
    imagen_url: string | null;
    lote: string;
    almacen: string | null;
    cantidad: number;
    fecha_vencimiento: string;
    estado_vencimiento: 'VIGENTE' | 'PROXIMO_VENCER' | 'VENCIDO' | 'CRITICO' | 'SIN_VENCIMIENTO';
}

export interface CuentaCalendario {
    id: number;
    cliente_nombre: string;
    saldo_pendiente: number;
    fecha_vencimiento: string;
    referencia_documento: string | null;
    estado: string;
    vencida: boolean;
}

interface Props {
    lotes: LoteCalendario[];
    cuentas?: CuentaCalendario[]; // cuentas por cobrar que vencen en el mes (opcional)
    mes: string; // YYYY-MM
    filtros?: Record<string, string | undefined>;
    ruta?: string; // página que recarga el calendario al cambiar de mes
    onDarDeBaja?: (id: number, lote: string, onDone?: () => void) => void;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MAX_POR_DIA = 3;

const colorEstado: Record<LoteCalendario['estado_vencimiento'], string> = {
    VIGENTE: 'border-green-400',
    PROXIMO_VENCER: 'border-yellow-400',
    CRITICO: 'border-orange-500',
    VENCIDO: 'border-red-500',
    SIN_VENCIMIENTO: 'border-gray-300',
};

// Cuentas por cobrar: rojo si ya venció, azul si aún está por vencer
const colorCuenta = (c: CuentaCalendario) =>
    c.vencida
        ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200'
        : 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200';

const formatBs =(monto: number) =>
    `Bs. ${monto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Evita que el modal se cierre al hacer clic en el toast de confirmación (se renderiza fuera del modal)
export const ignorarClicEnToast = (e: Event) => {
    if ((e.target as HTMLElement | null)?.closest('[data-toast-confirmacion]')) {
        e.preventDefault();
    }
};

function ImagenProducto({ url, alt, className }: { url: string | null; alt: string; className: string }) {
    const [error, setError] = useState(false);

    if (!url || error) {
        return (
            <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-zinc-800 text-gray-400`}>
                <ImageOff className="w-1/2 h-1/2" />
            </div>
        );
    }

    return <img src={url} alt={alt} loading="lazy" onError={() => setError(true)} className={`${className} object-cover`} />;
}

export default function CalendarioVencimientos({ lotes, cuentas, mes, filtros = {}, ruta = '/compras/lotes-vencimientos', onDarDeBaja }: Props) {
    const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

    const fechaMes = useMemo(() => parse(mes, 'yyyy-MM', new Date()), [mes]);

    const dias = useMemo(
        () =>
            eachDayOfInterval({
                start: startOfWeek(startOfMonth(fechaMes), { weekStartsOn: 1 }),
                end: endOfWeek(endOfMonth(fechaMes), { weekStartsOn: 1 }),
            }),
        [fechaMes],
    );

    // Agrupar por fecha usando la cadena YYYY-MM-DD (evita desfases de zona horaria)
    const lotesPorDia = useMemo(() => {
        const mapa: Record<string, LoteCalendario[]> = {};
        lotes.forEach((l) => {
            (mapa[l.fecha_vencimiento] ??= []).push(l);
        });
        return mapa;
    }, [lotes]);

    const cuentasPorDia = useMemo(() => {
        const mapa: Record<string, CuentaCalendario[]> = {};
        (cuentas ?? []).forEach((c) => {
            (mapa[c.fecha_vencimiento] ??= []).push(c);
        });
        return mapa;
    }, [cuentas]);

    const cambiarMes = (delta: number) => {
        const nuevoMes = format(addMonths(fechaMes, delta), 'yyyy-MM');
        irAMes(nuevoMes);
    };

    const irAMes = (nuevoMes: string) => {
        const params: Record<string, string> = { mes: nuevoMes };
        Object.entries(filtros).forEach(([k, v]) => {
            if (v) params[k] = v;
        });
        router.get(ruta, params, {
            preserveState: true,
            preserveScroll: true,
            only: ['calendario', 'mesCalendario', ...(cuentas ? ['cuentasCalendario'] : [])],
        });
    };

    const lotesDelDia = diaSeleccionado ? lotesPorDia[diaSeleccionado] ?? [] : [];
    const cuentasDelDia = diaSeleccionado ? cuentasPorDia[diaSeleccionado] ?? [] : [];

    return (
        <div>
            <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="p-2">
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5" />
                            Calendario de Vencimientos
                        </CardTitle>
                        <CardDescription>
                            {lotes.length} lote{lotes.length !== 1 ? 's' : ''}
                            {cuentas && ` y ${cuentas.length} cuenta${cuentas.length !== 1 ? 's' : ''} por cobrar`}
                            {' '}vence{lotes.length + (cuentas?.length ?? 0) !== 1 ? 'n' : ''} este mes
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => cambiarMes(-1)}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="min-w-36 text-center font-semibold capitalize">
                            {format(fechaMes, 'MMMM yyyy', { locale: es })}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => cambiarMes(1)}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => irAMes(format(new Date(), 'yyyy-MM'))}>
                            Hoy
                        </Button>
                    </div>
                </div>
            </div>
            <div>
                <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-gray-200 dark:bg-gray-700">
                    {DIAS_SEMANA.map((d) => (
                        <div
                            key={d}
                            className="bg-gray-50 dark:bg-gray-800 py-2 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
                        >
                            {d}
                        </div>
                    ))}

                    {dias.map((dia) => {
                        const clave = format(dia, 'yyyy-MM-dd');
                        const delDia = lotesPorDia[clave] ?? [];
                        const cuentasDia = cuentasPorDia[clave] ?? [];
                        const totalDia = delDia.length + cuentasDia.length;
                        const lotesVisibles = delDia.slice(0, MAX_POR_DIA);
                        const cuentasVisibles = cuentasDia.slice(0, MAX_POR_DIA - lotesVisibles.length);
                        const esDelMes = isSameMonth(dia, fechaMes);
                        const hoy = isToday(dia);

                        return (
                            <button
                                type="button"
                                key={clave}
                                disabled={totalDia === 0}
                                onClick={() => setDiaSeleccionado(clave)}
                                className={`min-h-28 p-1.5 text-left align-top transition-colors flex flex-col gap-1
                                    ${esDelMes ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950 opacity-50'}
                                    ${totalDia > 0 ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950' : 'cursor-default'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`text-xs font-semibold ${
                                            hoy ? 'rounded-full bg-blue-600 px-1.5 py-0.5 text-white' : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {format(dia, 'd')}
                                    </span>
                                    {totalDia > 0 && (
                                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                                            {totalDia}
                                        </Badge>
                                    )}
                                </div>

                                {lotesVisibles.map((l) => (
                                    <div
                                        key={l.id}
                                        className={`flex items-center gap-1 rounded border-l-4 bg-gray-50 dark:bg-gray-800 p-0.5 ${colorEstado[l.estado_vencimiento]}`}
                                        title={`${l.producto_nombre ?? ''} · Lote ${l.lote}`}
                                    >
                                        <ImagenProducto url={l.imagen_url} alt={l.producto_nombre ?? ''} className="h-7 w-7 shrink-0 rounded" />
                                        <div className="min-w-0 text-[10px] leading-tight">
                                            <div className="truncate font-medium">#{l.producto_id} · {l.sku ?? '-'}</div>
                                            <div className="truncate font-mono text-gray-500">{l.lote}</div>
                                        </div>
                                    </div>
                                ))}

                                {cuentasVisibles.map((c) => (
                                    <div
                                        key={`cxc-${c.id}`}
                                        className={`flex items-center gap-1 rounded border-l-4 p-0.5 ${colorCuenta(c)}`}
                                        title={`${c.cliente_nombre} · ${formatBs(c.saldo_pendiente)}`}
                                    >
                                        <Wallet className="h-4 w-4 shrink-0" />
                                        <div className="min-w-0 text-[10px] leading-tight">
                                            <div className="truncate font-medium">{c.cliente_nombre}</div>
                                            <div className="truncate font-mono">{formatBs(c.saldo_pendiente)}</div>
                                        </div>
                                    </div>
                                ))}

                                {totalDia > MAX_POR_DIA && (
                                    <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                                        +{totalDia - MAX_POR_DIA} más
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <Dialog open={diaSeleccionado !== null} onOpenChange={(open) => !open && setDiaSeleccionado(null)}>
                <DialogContent className="max-w-2xl" onInteractOutside={ignorarClicEnToast}>
                    <DialogHeader>
                        <DialogTitle className="capitalize">
                            {diaSeleccionado && format(parse(diaSeleccionado, 'yyyy-MM-dd', new Date()), "EEEE d 'de' MMMM yyyy", { locale: es })}
                        </DialogTitle>
                        <DialogDescription>
                            {lotesDelDia.length} lote{lotesDelDia.length !== 1 ? 's' : ''}
                            {cuentas && ` y ${cuentasDelDia.length} cuenta${cuentasDelDia.length !== 1 ? 's' : ''} por cobrar`}
                            {' '}vence{lotesDelDia.length + cuentasDelDia.length !== 1 ? 'n' : ''} este día
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                        {cuentasDelDia.length > 0 && (
                            <h4 className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <Wallet className="h-4 w-4" />
                                Cuentas por cobrar
                                <span className="ml-auto font-mono">
                                    {formatBs(cuentasDelDia.reduce((s, c) => s + c.saldo_pendiente, 0))}
                                </span>
                            </h4>
                        )}
                        {cuentasDelDia.map((c) => (
                            <div key={`cxc-${c.id}`} className={`flex items-center gap-3 rounded-lg border border-l-4 p-2 ${colorCuenta(c)}`}>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium">{c.cliente_nombre}</div>
                                    <div className="text-sm opacity-80">
                                        Ref.:{' '}
                                        <a
                                            href={`/ventas/cuentas-por-cobrar/${c.id}/show`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Ver cuenta por cobrar (nueva pestaña)"
                                            className="inline-flex items-center gap-0.5 font-bold text-blue-600 hover:underline dark:text-blue-400"
                                        >
                                            {c.referencia_documento ?? `#${c.id}`}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <span className="font-mono font-bold">{formatBs(c.saldo_pendiente)}</span>
                                    <Badge variant="outline" className="text-[10px]">
                                        {c.vencida ? 'VENCIDA' : c.estado}
                                    </Badge>
                                </div>
                            </div>
                        ))}

                        {cuentasDelDia.length > 0 && lotesDelDia.length > 0 && (
                            <h4 className="pt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Lotes</h4>
                        )}
                        {lotesDelDia.map((l) => (
                            <div key={l.id} className={`flex items-center gap-3 rounded-lg border border-l-4 p-2 ${colorEstado[l.estado_vencimiento]}`}>
                                <ImagenProducto url={l.imagen_url} alt={l.producto_nombre ?? ''} className="h-16 w-16 shrink-0 rounded-md" />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium">{l.producto_nombre ?? 'Producto no encontrado'}</div>
                                    <div className="mt-1 grid grid-cols-2 gap-x-4 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-4">
                                        <span>
                                            ID:{' '}
                                            <a
                                                href={`/productos/${l.producto_id}/edit`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Editar producto (nueva pestaña)"
                                                className="inline-flex items-center gap-0.5 font-bold text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                #{l.producto_id}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </span>
                                        <span>SKU: <b className="text-gray-900 dark:text-white">{l.sku ?? '-'}</b></span>
                                        <span>Lote: <b className="font-mono text-gray-900 dark:text-white">{l.lote}</b></span>
                                        <span>Cant.: <b className="text-gray-900 dark:text-white">{l.cantidad}</b></span>
                                    </div>
                                    {l.almacen && <div className="text-xs text-gray-500">{l.almacen}</div>}
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <Badge variant="outline" className="text-[10px]">
                                        {l.estado_vencimiento.replace('_', ' ')}
                                    </Badge>
                                    {onDarDeBaja && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            title="Dar de baja"
                                            className="h-7 text-red-600 hover:text-red-700"
                                            onClick={() => onDarDeBaja(l.id, l.lote)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
