import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { TrendingUp, TrendingDown, ArrowUpDown, Package, ShoppingCart, Wrench, AlertTriangle, Warehouse } from 'lucide-react';
import type { EstadisticasListadoMovimientos } from '@/domain/entities/movimientos-inventario';

interface MovimientosStatsProps {
    stats: EstadisticasListadoMovimientos;
}

export const formatearUnidades = (n: number) => Number(n || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 });

// Nombres legibles de los tipos de movimiento
const NOMBRE_TIPO: Record<string, string> = {
    SALIDA_VENTA: 'Venta',
    CONSUMO_RESERVA: 'Venta desde proforma',
    ENTRADA_COMPRA: 'Compra',
    ENTRADA_AJUSTE: 'Ajuste (entrada)',
    SALIDA_AJUSTE: 'Ajuste (salida)',
    AJUSTE_MASIVO: 'Ajuste masivo',
    ENTRADA_TRANSFERENCIA: 'Transferencia (entrada)',
    SALIDA_TRANSFERENCIA: 'Transferencia (salida)',
    ENTRADA_FRACCIONAMIENTO: 'Fraccionamiento (entrada)',
    SALIDA_FRACCIONAMIENTO: 'Fraccionamiento (salida)',
    SALIDA_MERMA: 'Merma',
    SALIDA_COMIDA_SIN_STOCK: 'Comida sin stock',
};

export const nombreTipo = (tipo: string) =>
    NOMBRE_TIPO[tipo] ?? tipo.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// Grupo de un tipo (mismas reglas que InventarioController::estadisticasMovimientos) con su ícono y color de badge
export const grupoDeTipo = (tipo: string): { icono: string; clase: string } => {
    const t = tipo || '';
    if (t.startsWith('ANULACION')) return { icono: '❌', clase: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-200' };
    if (t.includes('TRANSFERENCIA')) return { icono: '🔄', clase: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' };
    if (t.includes('RESERVA') && t !== 'CONSUMO_RESERVA') return { icono: '📋', clase: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200' };
    if (t === 'SALIDA_VENTA' || t === 'CONSUMO_RESERVA') return { icono: '🛒', clase: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200' };
    if (t.includes('DEVOLUCION')) return { icono: '↩️', clase: 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200' };
    if (t.includes('MERMA')) return { icono: '⚠️', clase: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200' };
    if (t.includes('FRACCIONAMIENTO')) return { icono: '✂️', clase: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200' };
    if (t.includes('AJUSTE')) return { icono: '🔧', clase: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200' };
    if (t.includes('COMPRA')) return { icono: '📥', clase: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' };
    return { icono: '📦', clase: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' };
};

const MovimientosStats: React.FC<MovimientosStatsProps> = ({ stats }) => {
    const tarjetas = [
        {
            titulo: 'Ventas',
            valor: formatearUnidades(stats.unidades_vendidas),
            detalle: `${stats.total_ventas.toLocaleString('es-ES')} movimientos`,
            icon: ShoppingCart,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            titulo: 'Entradas',
            valor: `+${formatearUnidades(stats.unidades_entradas)}`,
            detalle: `${stats.total_entradas.toLocaleString('es-ES')} movimientos · ${formatearUnidades(stats.unidades_compradas)} por compras`,
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            titulo: 'Salidas',
            valor: `-${formatearUnidades(stats.unidades_salidas)}`,
            detalle: `${stats.total_salidas.toLocaleString('es-ES')} movimientos`,
            icon: TrendingDown,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
        },
        {
            titulo: 'Transferencias',
            valor: formatearUnidades(stats.unidades_transferidas),
            detalle: `${stats.total_transferencias.toLocaleString('es-ES')} movimientos entre almacenes`,
            icon: ArrowUpDown,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            titulo: 'Ajustes',
            valor: stats.total_ajustes.toLocaleString('es-ES'),
            detalle: 'movimientos de ajuste',
            icon: Wrench,
            color: 'text-amber-600',
            bgColor: 'bg-amber-100',
        },
        {
            titulo: 'Mermas',
            valor: formatearUnidades(stats.unidades_mermas),
            detalle: `${stats.total_mermas.toLocaleString('es-ES')} movimientos`,
            icon: AlertTriangle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
        {
            titulo: 'Productos afectados',
            valor: stats.productos_afectados.toLocaleString('es-ES'),
            detalle: `${stats.total_movimientos.toLocaleString('es-ES')} movimientos en total`,
            icon: Package,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
        },
        {
            titulo: 'Almacenes con movimiento',
            valor: stats.almacenes_activos.toLocaleString('es-ES'),
            detalle: stats.total_anulados > 0 ? `${stats.total_anulados.toLocaleString('es-ES')} movimientos anulados` : 'sin anulados',
            icon: Warehouse,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
        },
    ];

    // Escala de las barras por día: el mayor entre entradas y salidas del período
    const maxDia = Math.max(1, ...stats.tendencia.map((d) => Math.max(d.entradas, d.salidas)));

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {tarjetas.map((t) => {
                    const Icon = t.icon;
                    return (
                        <Card key={t.titulo}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t.titulo}</CardTitle>
                                <div className={`rounded-md p-2 ${t.bgColor}`}>
                                    <Icon className={`h-4 w-4 ${t.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{t.valor}</div>
                                <p className="text-xs text-muted-foreground">{t.detalle}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <p className="text-xs text-muted-foreground">
                Valores en unidades del período filtrado. Entradas y salidas no incluyen transferencias (solo mueven stock entre almacenes)
                ni reservas de proformas; las unidades no cuentan movimientos anulados.
            </p>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Por tipo de movimiento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.por_tipo.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sin movimientos en el período.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground">
                                        <th className="py-2">Tipo</th>
                                        <th className="py-2 text-right">Movimientos</th>
                                        <th className="py-2 text-right">Entran</th>
                                        <th className="py-2 text-right">Salen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.por_tipo.map((t) => (
                                        <tr key={t.tipo} className="border-b last:border-0">
                                            <td className="py-2">
                                                {nombreTipo(t.tipo)}
                                                {t.anulados > 0 && <span className="ml-1 text-xs text-red-500">({t.anulados} anulados)</span>}
                                            </td>
                                            <td className="py-2 text-right">{t.movimientos.toLocaleString('es-ES')}</td>
                                            <td className="py-2 text-right text-green-600">
                                                {t.unidades_entrada > 0 ? `+${formatearUnidades(t.unidades_entrada)}` : '—'}
                                            </td>
                                            <td className="py-2 text-right text-red-600">
                                                {t.unidades_salida > 0 ? `-${formatearUnidades(t.unidades_salida)}` : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Por día</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.tendencia.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sin movimientos en el período.</p>
                        ) : (
                            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                                {[...stats.tendencia].reverse().map((d) => (
                                    <div key={d.fecha} className="text-sm">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-medium">
                                                {new Date(`${d.fecha}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                            </span>
                                            <span className="text-muted-foreground">
                                                <span className="text-green-600">+{formatearUnidades(d.entradas)}</span>
                                                {' · '}
                                                <span className="text-red-600">-{formatearUnidades(d.salidas)}</span>
                                                {d.ventas > 0 && <> · vendido {formatearUnidades(d.ventas)}</>}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex h-1.5 gap-0.5">
                                            <div className="rounded bg-green-500" style={{ width: `${(d.entradas / maxDia) * 50}%` }} />
                                            <div className="rounded bg-red-500" style={{ width: `${(d.salidas / maxDia) * 50}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MovimientosStats;
