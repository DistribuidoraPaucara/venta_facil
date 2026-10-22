import { useRef, useState, type ReactNode } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { useAuth } from '@/application/hooks/use-auth';
import { PrintableContent } from '@/presentation/components/Export/PrintableContent';
import { AlertCircle, AlertTriangle, Calendar, Copy, CreditCard, Edit, ExternalLink, FileText, Package, Printer, User, Warehouse } from 'lucide-react';
import { duplicarCompra } from '@/presentation/components/compras/duplicar-compra';
import { toast } from 'react-toastify';
import AnularCompraModal from '@/presentation/components/compras/AnularCompraModal';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';

// Importar tipos del domain
import type { Compra, DetalleCompra } from '@/domain/entities/compras';
import type { EstadoDocumento } from '@/domain/entities/estados-documento';

interface PageProps extends InertiaPageProps {
    compra: Compra;
}

// ✅ NUEVO 2026-03-24: Formateador de números que muestra decimales solo cuando existen
const formatDecimal = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return '0';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';

    // Convertir a string con suficientes decimales
    const str = num.toString();

    // Si es un número entero o no tiene decimales significativos
    if (!str.includes('.') || /\.0+$/.test(str)) {
        return Math.round(num).toString();
    }

    // Si tiene decimales, eliminar ceros al final
    return parseFloat(num.toFixed(10)).toString();
};

// ✅ NUEVO 2026-03-24: Formateador de moneda inteligente (sin decimales innecesarios)
const formatCurrencySmartDecimal = (value: number | string | null | undefined, symbol: string = '$'): string => {
    if (value === null || value === undefined) return symbol + '0';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return symbol + '0';

    // Formatear el número quitando decimales innecesarios
    const formatted = formatDecimal(num);

    // Formatear como número con separadores de miles
    const parts = formatted.split('.');
    const intPart = parts[0];
    const decPart = parts[1];

    const formattedInt = parseFloat(intPart).toLocaleString('es-ES');

    if (decPart) {
        return symbol + formattedInt + ',' + decPart;
    }

    return symbol + formattedInt;
};

/**
 * Fecha en hora LOCAL. Una fecha sola ('2026-12-29', como el vencimiento) new Date() la toma como medianoche
 * UTC y en Bolivia (UTC−4) se mostraba el día anterior: se arma con año/mes/día locales. Si trae hora
 * ('2026-10-21T04:00:00Z'), new Date() ya la convierte bien a la hora local.
 */
const fechaLocal = (valor?: string | null): Date | null => {
    if (!valor) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(valor);
};

const formatearFecha = (valor?: string | null, opciones: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }) => {
    const fecha = fechaLocal(valor);
    return fecha ? fecha.toLocaleDateString('es-ES', opciones) : '-';
};

// Días desde hoy hasta la fecha (negativo = ya pasó)
const diasHasta = (valor?: string | null): number | null => {
    const fecha = fechaLocal(valor);
    if (!fecha) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000);
};

// Colores por CÓDIGO de estado (los nombres son "Aprobado", "Anulado"…: comparar con "aprobada" no coincidía)
const getEstadoColor = (estado?: EstadoDocumento) => {
    switch (estado?.codigo) {
        case 'BORRADOR':
            return 'bg-slate-100 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600';
        case 'PENDIENTE':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case 'APROBADO':
            return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case 'FACTURADO':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        case 'ANULADO':
        case 'CANCELADO':
            return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
};

// Estilos de botón comunes (antes cada botón tenía tamaño y mayúsculas distintos)
const botonBase =
    'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50';

function Dato({ icono: Icono, etiqueta, children }: { icono: typeof User; etiqueta: string; children: ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <Icono className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{etiqueta}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{children}</dd>
            </div>
        </div>
    );
}

export default function CompraShow() {
    const { props } = usePage<PageProps>();
    const { can } = useAuth();
    const compra = props.compra;
    const printableRef = useRef<HTMLDivElement>(null);
    const [mostrarModalAnular, setMostrarModalAnular] = useState(false);
    const [isAnulando, setIsAnulando] = useState(false);
    const [outputModal, setOutputModal] = useState(false);
    const [duplicando, setDuplicando] = useState(false);

    const simbolo = compra.moneda?.simbolo || 'Bs';
    const dinero = (valor: number | string | null | undefined) => formatCurrencySmartDecimal(valor, `${simbolo} `);
    const detalles: DetalleCompra[] = compra.detalles || [];
    const codigoEstado = compra.estado_documento?.codigo;

    // Verificar si la compra está APROBADA
    const esAprobada = codigoEstado === 'APROBADO';
    const esBorrador = codigoEstado === 'BORRADOR';
    // Editable solo en BORRADOR o PENDIENTE (el backend rechaza editar facturadas, anuladas y canceladas)
    const puedeEditar = can('compras.update') && !esAprobada && !['FACTURADO', 'ANULADO', 'CANCELADO'].includes(codigoEstado ?? '');

    const descuentoLineas = detalles.reduce((sum, d) => sum + (Number(d.descuento) || 0), 0);

    // Cuenta por pagar (si la compra es a crédito y está aprobada)
    const cuenta = compra.cuenta_por_pagar ?? null;
    const pagadoCuenta = cuenta ? Number(cuenta.monto_original) - Number(cuenta.saldo_pendiente) : 0;
    const diasVencimiento = cuenta ? diasHasta(String(cuenta.fecha_vencimiento).slice(0, 10)) : null;
    const vencida = !!cuenta && cuenta.estado !== 'PAGADO' && diasVencimiento !== null && diasVencimiento < 0;

    // Qué le falta a un borrador para poder aprobarse
    const sinPrecio = detalles.filter((d) => Number(d.precio_unitario) <= 0).length;
    const pendientesBorrador = [
        !compra.proveedor ? 'elegir el proveedor' : null,
        sinPrecio > 0 ? `completar ${sinPrecio} precio(s)` : null,
        detalles.length === 0 ? 'agregar productos' : null,
    ].filter(Boolean) as string[];

    const handleAnularCompra = async (motivo?: string) => {
        setIsAnulando(true);
        try {
            const response = await fetch(`/compras/${compra.id}/anular`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ motivo }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Error al anular la compra');
                return;
            }

            toast.success('Compra anulada exitosamente');
            setMostrarModalAnular(false);

            // Recargar la página
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Error al anular compra:', error);
            toast.error('Error al anular la compra');
        } finally {
            setIsAnulando(false);
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Compras', href: '/compras' },
            { title: `Compra #${compra.id}`, href: '#' }
        ]}>
            <Head title={`Compra #${compra.id}`} />

            {/* Encabezado */}
            <div className="flex flex-wrap items-start justify-between gap-3 p-2">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Compra #{compra.id}</h1>
                        <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {compra.numero}
                        </span>
                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getEstadoColor(compra.estado_documento)}`}>
                            {compra.estado_documento?.nombre || 'Sin estado'}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Creada el{' '}
                        {compra.created_at
                            ? new Date(compra.created_at).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })
                            : 'fecha no disponible'}
                        {compra.usuario?.name ? ` por ${compra.usuario.name}` : ''}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setOutputModal(true)}
                        className={`${botonBase} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700`}
                        title="Exportar/Imprimir documento"
                    >
                        <Printer className="h-4 w-4" />
                        Imprimir / Exportar
                    </button>

                    {/* Duplicar: compra nueva en borrador con los mismos productos, cantidades y precios */}
                    {can('compras.store') && (
                        <button
                            onClick={() => {
                                setDuplicando(true);
                                duplicarCompra(compra.id, () => setDuplicando(false));
                            }}
                            disabled={duplicando}
                            title="Crear una compra nueva en borrador con los mismos productos, cantidades y precios"
                            className={`${botonBase} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700`}
                        >
                            <Copy className="h-4 w-4" />
                            {duplicando ? 'Duplicando…' : 'Duplicar'}
                        </button>
                    )}

                    {/* Editar: mientras no esté aprobada ni anulada */}
                    {puedeEditar && (
                        <Link href={`/compras/${compra.id}/edit`} className={`${botonBase} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`}>
                            <Edit className="h-4 w-4" />
                            Editar
                        </Link>
                    )}

                    {/* Anular: solo si está aprobada */}
                    {can('compras.update') && esAprobada && (
                        <button
                            onClick={() => setMostrarModalAnular(true)}
                            disabled={isAnulando}
                            className={`${botonBase} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`}
                        >
                            <AlertCircle className="h-4 w-4" />
                            {isAnulando ? 'Anulando...' : 'Anular'}
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3 px-2 pb-4">
                {/* Aviso de borrador: qué falta para aprobarla (no mueve stock hasta aprobarse) */}
                {esBorrador && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                        <div className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                            <div>
                                <p className="font-semibold">Compra en borrador: todavía no ingresó stock ni se registró el pago.</p>
                                <p className="text-amber-800 dark:text-amber-300">
                                    {pendientesBorrador.length > 0
                                        ? `Antes de aprobarla falta ${pendientesBorrador.join(', ')}.`
                                        : 'Está lista para aprobarse.'}
                                </p>
                            </div>
                        </div>
                        {puedeEditar && (
                            <Link href={`/compras/${compra.id}/edit`} className={`${botonBase} bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400`}>
                                <Edit className="h-4 w-4" />
                                {pendientesBorrador.length > 0 ? 'Completar y aprobar' : 'Revisar y aprobar'}
                            </Link>
                        )}
                    </div>
                )}

                <div className="grid gap-3 lg:grid-cols-3">
                    {/* Información general */}
                    <div className="rounded-lg bg-white shadow lg:col-span-2 dark:bg-gray-800">
                        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                            <h3 className="flex items-center text-base font-medium text-gray-900 dark:text-white">
                                <FileText className="mr-2 h-5 w-5" />
                                Información general
                            </h3>
                        </div>
                        <dl className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 xl:grid-cols-3">
                            <Dato icono={Calendar} etiqueta="Fecha de compra">
                                {formatearFecha(compra.fecha, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </Dato>

                            <Dato icono={User} etiqueta="Proveedor">
                                {compra.proveedor ? (
                                    // Abre la edición del proveedor en otra pestaña
                                    <a
                                        href={`/proveedores/${compra.proveedor.id}/edit`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Editar proveedor en otra pestaña"
                                        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        {compra.proveedor.nombre}
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                ) : (
                                    <span className="font-medium text-amber-600 dark:text-amber-400">Sin proveedor</span>
                                )}
                            </Dato>

                            <Dato icono={Warehouse} etiqueta="Almacén de destino">
                                {compra.almacen?.nombre ?? <span className="text-gray-400">-</span>}
                            </Dato>

                            <Dato icono={CreditCard} etiqueta="Pago">
                                {compra.tipo_pago?.nombre ?? <span className="text-gray-400">Sin tipo de pago</span>}
                                <span className="text-gray-500 dark:text-gray-400"> · {compra.moneda?.nombre ?? simbolo}</span>
                            </Dato>

                            <Dato icono={FileText} etiqueta="N° de factura">
                                {compra.numero_factura ? (
                                    <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-gray-700">{compra.numero_factura}</span>
                                ) : (
                                    <span className="text-gray-400">Sin factura</span>
                                )}
                            </Dato>

                            <Dato icono={User} etiqueta="Registrado por">
                                {compra.usuario?.name || <span className="text-gray-400">No especificado</span>}
                            </Dato>

                            {compra.observaciones && (
                                <div className="sm:col-span-2 xl:col-span-3">
                                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Observaciones</dt>
                                    <dd className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                                        {compra.observaciones}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Resumen de importes */}
                    <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                            <h3 className="text-base font-medium text-gray-900 dark:text-white">Resumen</h3>
                        </div>
                        <dl className="space-y-2 p-4 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">Productos</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">{detalles.length}</dd>
                            </div>
                            {/* Suma de descuentos por producto (ya restados del subtotal) */}
                            {descuentoLineas > 0 && (
                                <>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600 dark:text-gray-400">Importe bruto</dt>
                                        <dd className="font-mono text-gray-900 dark:text-white">{dinero(Number(compra.subtotal) + descuentoLineas)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600 dark:text-gray-400">Desc. por productos</dt>
                                        <dd className="font-mono text-green-600 dark:text-green-400">−{dinero(descuentoLineas)}</dd>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">Subtotal</dt>
                                <dd className="font-mono text-gray-900 dark:text-white">{dinero(compra.subtotal)}</dd>
                            </div>
                            {Number(compra.descuento) > 0 && (
                                <div className="flex justify-between">
                                    <dt className="text-gray-600 dark:text-gray-400">Descuento general</dt>
                                    <dd className="font-mono text-red-600 dark:text-red-400">-{dinero(compra.descuento)}</dd>
                                </div>
                            )}
                            {Number(compra.impuesto) > 0 && (
                                <div className="flex justify-between">
                                    <dt className="text-gray-600 dark:text-gray-400">Impuesto</dt>
                                    <dd className="font-mono text-gray-900 dark:text-white">+{dinero(compra.impuesto)}</dd>
                                </div>
                            )}
                            <div className="flex items-baseline justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                                <dt className="text-base font-semibold text-gray-900 dark:text-white">Total</dt>
                                <dd className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{dinero(compra.total)}</dd>
                            </div>
                            {sinPrecio > 0 && (
                                <p className="pt-1 text-xs text-amber-600 dark:text-amber-400">
                                    {sinPrecio} producto(s) sin precio: el total todavía no es el real.
                                </p>
                            )}

                            {/* Cuenta por pagar (compra a crédito aprobada) */}
                            {cuenta && (
                                <div className="mt-3 space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                                            Cuenta por pagar
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                cuenta.estado === 'PAGADO'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                                    : vencida
                                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                            }`}
                                        >
                                            {cuenta.estado === 'PAGADO' ? 'Pagada' : vencida ? 'Vencida' : cuenta.estado === 'PARCIAL' ? 'Pago parcial' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600 dark:text-gray-400">Pagado</dt>
                                        <dd className="font-mono text-gray-900 dark:text-white">{dinero(pagadoCuenta)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="font-medium text-gray-700 dark:text-gray-300">Saldo</dt>
                                        <dd className="font-mono font-bold text-gray-900 dark:text-white">{dinero(cuenta.saldo_pendiente)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600 dark:text-gray-400">Vence</dt>
                                        <dd className={vencida ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>
                                            {formatearFecha(cuenta.fecha_vencimiento)}
                                            {diasVencimiento !== null && cuenta.estado !== 'PAGADO' && (
                                                <span className="ml-1 text-xs">
                                                    ({diasVencimiento < 0 ? `hace ${Math.abs(diasVencimiento)} día(s)` : diasVencimiento === 0 ? 'hoy' : `en ${diasVencimiento} día(s)`})
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                    <Link
                                        href={`/compras/cuentas-por-pagar/${cuenta.id}/show`}
                                        className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        {cuenta.estado === 'PAGADO' ? 'Ver pagos' : 'Registrar pago / ver pagos'}
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </div>
                            )}
                            {/* A crédito pero todavía sin aprobar: avisar cuándo se crea la cuenta */}
                            {!cuenta && compra.tipo_pago?.es_credito && !esAprobada && (
                                <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                                    Compra a crédito: la cuenta por pagar se crea al aprobarla
                                    {compra.fecha_vencimiento_credito ? ` (vencerá el ${formatearFecha(compra.fecha_vencimiento_credito)})` : ''}.
                                </p>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Productos */}
                <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                        <h3 className="flex items-center text-base font-medium text-gray-900 dark:text-white">
                            <Package className="mr-2 h-5 w-5" />
                            Productos ({detalles.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">ID</th>
                                    <th className="px-3 py-2 text-left font-medium">Producto</th>
                                    <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                                    <th className="px-3 py-2 text-right font-medium">Precio unit.</th>
                                    <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                                    <th className="px-3 py-2 text-center font-medium">Lote</th>
                                    <th className="px-3 py-2 text-center font-medium">Vencimiento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {detalles.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                                            Esta compra no tiene productos.
                                        </td>
                                    </tr>
                                )}
                                {detalles.map((detalle) => {
                                    const producto = detalle.producto as any;
                                    const codigos: { id: number; codigo: string; es_principal?: boolean }[] = [...(producto?.codigos_barra ?? [])].sort(
                                        (a, b) => Number(!!b.es_principal) - Number(!!a.es_principal),
                                    );
                                    const [principal, ...otros] = codigos;
                                    const sinPrecioFila = Number(detalle.precio_unitario) <= 0;
                                    const dias = diasHasta(detalle.fecha_vencimiento);

                                    return (
                                        <tr
                                            key={detalle.id}
                                            className={sinPrecioFila ? 'bg-amber-50/70 dark:bg-amber-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                                        >
                                            <td className="px-3 py-2 align-top">
                                                {/* Abre la edición del producto en otra pestaña */}
                                                <a
                                                    href={`/productos/${detalle.producto_id}/edit`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Editar producto en otra pestaña"
                                                    className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    #{detalle.producto_id}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </td>
                                            <td className="px-3 py-2 align-top">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {producto?.nombre ?? `Producto #${detalle.producto_id}`}
                                                </div>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-gray-400">
                                                    {producto?.sku && <span className="font-mono">SKU {producto.sku}</span>}
                                                    {principal && (
                                                        <span className="font-mono">
                                                            ▮▯ {principal.codigo}
                                                            {otros.length > 0 && (
                                                                <span
                                                                    title={`Otros códigos de barras:\n${otros.map((c) => c.codigo).join('\n')}`}
                                                                    className="ml-1 cursor-help rounded bg-gray-200 px-1 font-sans text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                                                >
                                                                    +{otros.length}
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-right align-top font-mono text-gray-900 dark:text-white">
                                                {formatDecimal(detalle.cantidad)}
                                                {detalle.unidad?.nombre && (
                                                    <span className="ml-1 font-sans text-xs text-gray-500 dark:text-gray-400">{detalle.unidad.nombre}</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-right align-top font-mono">
                                                {sinPrecioFila ? (
                                                    <span className="font-sans text-xs font-medium text-amber-600 dark:text-amber-400">Sin precio</span>
                                                ) : (
                                                    <span className="text-gray-900 dark:text-white">{dinero(detalle.precio_unitario)}</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-right align-top font-mono font-semibold text-gray-900 dark:text-white">
                                                {dinero(detalle.subtotal)}
                                                {/* Descuento de la línea (el subtotal ya viene descontado) */}
                                                {Number(detalle.descuento) > 0 && (
                                                    <div className="font-sans text-xs font-normal text-green-600 dark:text-green-400">
                                                        −{dinero(detalle.descuento)} desc.
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center align-top">
                                                {detalle.lote ? (
                                                    <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                                        {detalle.lote}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-center align-top">
                                                {dias === null ? (
                                                    <span className="text-gray-400">-</span>
                                                ) : (
                                                    <>
                                                        <div className="text-gray-900 dark:text-white">{formatearFecha(detalle.fecha_vencimiento)}</div>
                                                        <div
                                                            className={`text-xs ${
                                                                dias < 0
                                                                    ? 'font-medium text-red-600 dark:text-red-400'
                                                                    : dias <= 30
                                                                      ? 'font-medium text-amber-600 dark:text-amber-400'
                                                                      : 'text-gray-500 dark:text-gray-400'
                                                            }`}
                                                        >
                                                            {dias < 0 ? `vencido hace ${Math.abs(dias)} día(s)` : dias === 0 ? 'vence hoy' : `vence en ${dias} día(s)`}
                                                        </div>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {detalles.length > 0 && (
                                <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <td colSpan={4} className="px-3 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            Total de la compra
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-base font-bold text-gray-900 dark:text-white">
                                            {dinero(compra.total)}
                                        </td>
                                        <td colSpan={2} />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>

            {/* Contenido para impresión (oculto visualmente pero disponible en DOM) */}
            <div className="absolute -left-full -top-full opacity-0 pointer-events-none print:block print:relative print:left-0 print:top-0 print:opacity-100 print:pointer-events-auto">
                <PrintableContent
                    ref={printableRef}
                    compra={compra}
                    title={`Compra ${compra.numero}`}
                />
            </div>

            {/* Modal de anulación */}
            <AnularCompraModal
                isOpen={mostrarModalAnular}
                onClose={() => setMostrarModalAnular(false)}
                compraNumero={compra.numero}
                onConfirm={handleAnularCompra}
                isLoading={isAnulando}
            />

            {/* Modal de exportación/impresión */}
            <OutputSelectionModal
                isOpen={outputModal}
                onClose={() => setOutputModal(false)}
                documentoId={compra.id}
                tipoDocumento="compra"
                documentoInfo={{
                    numero: compra.numero,
                    fecha: compra.fecha ? formatearFecha(compra.fecha) : undefined,
                    monto: compra.total,
                }}
            />
        </AppLayout>
    );
}
