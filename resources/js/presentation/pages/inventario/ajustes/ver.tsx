import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Printer, XCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useAuth } from '@/application/hooks/use-auth';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';

interface DetalleAjuste {
    id: number;
    producto_id: number | null;
    producto_nombre: string;
    producto_sku: string | null;
    lote: string | null;
    fecha_vencimiento: string | null;
    tipo: 'entrada' | 'salida';
    tipo_ajuste: string | null;
    cantidad: number;
    stock_anterior: number;
    stock_posterior: number;
    anulado: boolean;
}

interface Usuario {
    id: number;
    name: string;
}

interface AjusteDetalle {
    id: number;
    numero: string;
    estado: 'pendiente' | 'procesado' | 'anulado';
    observacion: string | null;
    created_at: string;
    cantidad_productos: number;
    cantidad_entradas: number;
    cantidad_salidas: number;
    almacen: { id: number; nombre: string } | null;
    user: Usuario | null;
    fecha_anulacion: string | null;
    motivo_anulacion: string | null;
    user_anulacion: Usuario | null;
    detalles: DetalleAjuste[];
}

// Muestra solo los decimales necesarios (10 → "10", 2.5 → "2,5"), hasta 6 para productos fraccionados
const formatCantidad = (valor: unknown) =>
    new Intl.NumberFormat('es-BO', { maximumFractionDigits: 6 }).format(Number(valor) || 0);

const formatFecha = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-BO') : '—');

const ESTADOS: Record<AjusteDetalle['estado'], { label: string; className: string }> = {
    procesado: { label: '✅ Procesado', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    anulado: { label: '❌ Anulado', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    pendiente: { label: '⏳ Pendiente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
};

export default function VerAjuste({ ajuste }: { ajuste: AjusteDetalle }) {
    const { can, hasRole } = useAuth();
    const [modalImpresionOpen, setModalImpresionOpen] = useState(false);
    const [dialogAnularOpen, setDialogAnularOpen] = useState(false);
    const [motivoAnulacion, setMotivoAnulacion] = useState('');
    const [anulando, setAnulando] = useState(false);

    const estado = ESTADOS[ajuste.estado] ?? ESTADOS.pendiente;
    // Las observaciones de tipo se guardan como "texto | Tipos: X, Y"
    const [observacion, tiposTexto] = (ajuste.observacion ?? '').split(' | Tipos: ');

    const handleAnular = async () => {
        setAnulando(true);
        try {
            const response = await fetch(`/api/inventario/ajuste/${ajuste.id}/anular`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ motivo: motivoAnulacion }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(data.message || 'El ajuste ha sido anulado exitosamente');
                setDialogAnularOpen(false);
                router.reload();
            } else {
                toast.error(data.message || 'No se pudo anular el ajuste');
            }
        } catch {
            toast.error('Ocurrió un error al anular el ajuste');
        } finally {
            setAnulando(false);
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Inventario', href: '/inventario/dashboard' },
                { title: 'Ajustes', href: '/inventario/ajuste' },
                { title: ajuste.numero, href: '#' },
            ]}
        >
            <Head title={`Ajuste ${ajuste.numero}`} />

            <div className="space-y-6 p-4">
                {/* Encabezado */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.visit('/inventario/ajuste')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                        <div>
                            <h1 className="font-mono text-2xl font-bold text-gray-900 dark:text-white">{ajuste.numero}</h1>
                            <p className="text-sm text-muted-foreground">Ajuste de inventario</p>
                        </div>
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-semibold ${estado.className}`}>
                            {estado.label}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setModalImpresionOpen(true)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir
                        </Button>
                        {ajuste.estado !== 'anulado' && hasRole('admin') && (
                            <Button variant="destructive" onClick={() => setDialogAnularOpen(true)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Anular
                            </Button>
                        )}
                    </div>
                </div>

                {/* Aviso de anulación */}
                {ajuste.estado === 'anulado' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        <strong>Ajuste anulado</strong>
                        {ajuste.user_anulacion && ` por ${ajuste.user_anulacion.name}`}
                        {ajuste.fecha_anulacion && ` el ${formatFecha(ajuste.fecha_anulacion)}`}. Los movimientos de stock fueron revertidos.
                        {ajuste.motivo_anulacion && <span className="mt-1 block">Motivo: {ajuste.motivo_anulacion}</span>}
                    </div>
                )}

                {/* Información general y resumen */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card className="md:col-span-3">
                        <CardHeader>
                            <CardTitle>Información General</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-muted-foreground">Almacén</p>
                                <p className="font-medium">{ajuste.almacen?.nombre ?? 'Sin almacén'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Registrado por</p>
                                <p className="font-medium">{ajuste.user?.name ?? 'Usuario desconocido'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Fecha</p>
                                <p className="font-medium">{formatFecha(ajuste.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Tipo de ajuste</p>
                                <p className="font-medium">{tiposTexto || '—'}</p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-4">
                                <p className="text-muted-foreground">Observación</p>
                                <p className="font-medium whitespace-pre-line">{observacion || '(sin observación)'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Productos</span>
                                <span className="font-semibold">{ajuste.cantidad_productos}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">📥 Entradas</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">{formatCantidad(ajuste.cantidad_entradas)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">📤 Salidas</span>
                                <span className="font-semibold text-red-600 dark:text-red-400">{formatCantidad(ajuste.cantidad_salidas)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detalle de productos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Productos Ajustados</CardTitle>
                        <CardDescription>Stock antes y después corresponde al total del producto en el almacén</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {ajuste.detalles.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">Este ajuste no tiene movimientos registrados</p>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16">ID</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Lote</TableHead>
                                            <TableHead className="text-center">Movimiento</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Stock antes</TableHead>
                                            <TableHead className="text-right">Stock después</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ajuste.detalles.map((detalle) => (
                                            <TableRow key={detalle.id} className={detalle.anulado ? 'opacity-60' : ''}>
                                                <TableCell className="font-mono text-muted-foreground">
                                                    {detalle.producto_id && can('productos.manage') ? (
                                                        <a
                                                            href={`/productos/${detalle.producto_id}/edit`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline dark:text-blue-400"
                                                            title="Abrir producto en otra pestaña"
                                                        >
                                                            {detalle.producto_id}
                                                        </a>
                                                    ) : (
                                                        detalle.producto_id ?? '—'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{detalle.producto_nombre}</div>
                                                    {detalle.producto_sku && (
                                                        <div className="text-xs text-muted-foreground">SKU: {detalle.producto_sku}</div>
                                                    )}
                                                    {detalle.tipo_ajuste && (
                                                        <div className="text-xs text-muted-foreground">{detalle.tipo_ajuste}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {detalle.lote || '—'}
                                                    {detalle.fecha_vencimiento && (
                                                        <div className="text-xs">
                                                            Vence: {new Date(`${detalle.fecha_vencimiento}T00:00:00`).toLocaleDateString('es-BO')}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                                                            detalle.tipo === 'entrada'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                        }`}
                                                    >
                                                        {detalle.tipo === 'entrada' ? '📥 Entrada' : '📤 Salida'}
                                                    </span>
                                                    {detalle.anulado && <div className="mt-1 text-xs text-red-600">Revertido</div>}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-right font-semibold whitespace-nowrap ${
                                                        detalle.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                    }`}
                                                >
                                                    {detalle.tipo === 'entrada' ? '+' : '−'}
                                                    {formatCantidad(detalle.cantidad)}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">{formatCantidad(detalle.stock_anterior)}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCantidad(detalle.stock_posterior)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-right font-medium">
                                                Total ({ajuste.detalles.length} {ajuste.detalles.length === 1 ? 'producto' : 'productos'})
                                            </TableCell>
                                            <TableCell className="text-right text-sm whitespace-nowrap">
                                                <div className="text-green-600 dark:text-green-400">
                                                    +{formatCantidad(ajuste.detalles.filter((d) => d.tipo === 'entrada').reduce((t, d) => t + d.cantidad, 0))}
                                                </div>
                                                <div className="text-red-600 dark:text-red-400">
                                                    −{formatCantidad(ajuste.detalles.filter((d) => d.tipo === 'salida').reduce((t, d) => t + d.cantidad, 0))}
                                                </div>
                                            </TableCell>
                                            <TableCell colSpan={2} />
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <OutputSelectionModal
                isOpen={modalImpresionOpen}
                onClose={() => setModalImpresionOpen(false)}
                documentoId={ajuste.id}
                tipoDocumento="ajuste"
                documentoInfo={{ numero: ajuste.numero }}
            />

            <Dialog
                open={dialogAnularOpen}
                onOpenChange={(open) => {
                    setDialogAnularOpen(open);
                    if (!open) setMotivoAnulacion('');
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>¿Anular ajuste?</DialogTitle>
                        <DialogDescription>
                            Esta acción revertirá todos los movimientos de stock asociados al ajuste {ajuste.numero}. No se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <label htmlFor="motivo-anulacion" className="text-sm font-medium">
                            Motivo de anulación (opcional)
                        </label>
                        <Textarea
                            id="motivo-anulacion"
                            value={motivoAnulacion}
                            onChange={(e) => setMotivoAnulacion(e.target.value)}
                            placeholder="Ej: ajuste registrado por error"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogAnularOpen(false)} disabled={anulando}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleAnular} disabled={anulando}>
                            {anulando ? 'Anulando...' : 'Anular ajuste'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
