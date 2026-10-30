import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Label } from '@/presentation/components/ui/label';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import { formatCurrencyMinimalDecimals } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/presentation/components/ui/dialog';
import { ArrowLeft, CheckCircle, XCircle, Calendar, MapPin, AlertTriangle, FileText, Printer } from 'lucide-react';
import { useAuth } from '@/application/hooks/use-auth';
import { NotificationService } from '@/infrastructure/services/notification.service';
import type { MermaInventario } from '@/domain/entities/mermas-inventario';
import { TIPOS_MERMA, ESTADOS_MERMA } from '@/presentation/config/inventory.config';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';

// Muestra solo los decimales necesarios (10 → "10", 2.5 → "2,5"), hasta 6 para productos fraccionados
const formatCantidad = (valor: unknown) =>
    new Intl.NumberFormat('es-BO', { maximumFractionDigits: 6 }).format(Number(valor) || 0);

// Componente EstadoBadge simple para mermas
const EstadoBadge = ({ estado }: { estado: string }) => {
    const configs = {
        'PENDIENTE': { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
        'APROBADO': { label: 'Aprobada', className: 'bg-green-100 text-green-800' },
        'RECHAZADO': { label: 'Rechazada', className: 'bg-red-100 text-red-800' },
    };

    const config = configs[estado as keyof typeof configs] || configs.PENDIENTE;

    return (
        <Badge className={config.className}>
            {config.label}
        </Badge>
    );
};

interface VerMermaProps {
    merma: MermaInventario;
}

export default function VerMerma({ merma }: VerMermaProps) {
    console.log('Merma data:', merma); // LOG para depuración
    const { can } = useAuth();
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [observacionesAprobacion, setObservacionesAprobacion] = useState('');
    const [observacionesRechazo, setObservacionesRechazo] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'aprobar' | 'rechazar'>('aprobar');
    const [mostrarModalImpresion, setMostrarModalImpresion] = useState(false);

    // Las rutas de aprobar/rechazar responden JSON (no Inertia), por eso se usa fetch
    const enviarDecision = async (accion: 'aprobar' | 'rechazar', body: Record<string, string>) => {
        const response = await fetch(`/inventario/mermas/${merma.id}/${accion}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify(body),
        });
        return response.json();
    };

    const handleAprobar = async () => {
        setIsApproving(true);
        try {
            const result = await enviarDecision('aprobar', { observaciones_aprobacion: observacionesAprobacion });
            if (result.success) {
                NotificationService.success('Merma aprobada exitosamente');
                setDialogOpen(false);
                setObservacionesAprobacion('');
                router.reload();
            } else {
                NotificationService.error(result.message || 'Error al aprobar la merma');
            }
        } catch {
            NotificationService.error('Error al aprobar la merma');
        } finally {
            setIsApproving(false);
        }
    };

    const handleRechazar = async () => {
        setIsRejecting(true);
        try {
            const result = await enviarDecision('rechazar', { observaciones_rechazo: observacionesRechazo });
            if (result.success) {
                NotificationService.success('Merma rechazada exitosamente');
                setDialogOpen(false);
                setObservacionesRechazo('');
                router.reload();
            } else {
                NotificationService.error(result.message || 'Error al rechazar la merma');
            }
        } catch {
            NotificationService.error('Error al rechazar la merma');
        } finally {
            setIsRejecting(false);
        }
    };

    const openDialog = (type: 'aprobar' | 'rechazar') => {
        setDialogType(type);
        setDialogOpen(true);
    };

    const handleImprimir = async (formato: 'A4' | 'TICKET_80' | 'TICKET_58') => {
        setIsPrinting(true);
        try {
            const url = `/inventario/mermas/${merma.id}/imprimir?formato=${formato}&accion=stream`;
            window.open(url, '_blank');
        } catch (error) {
            NotificationService.error('Error al abrir documento de impresión');
            console.error(error);
        } finally {
            setIsPrinting(false);
        }
    };

    // Acceder a configuraciones de tipo y estado
    const tipoMermaConfig = TIPOS_MERMA[merma.tipo_merma];
    const estadoConfig = ESTADOS_MERMA[merma.estado];

    return (
        <AppLayout>
            <Head title={`Merma ${merma.numero || 'Detalle'}`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.visit('/inventario/mermas')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al listado
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Merma {merma.numero || `#${merma.id}`}</h1>
                            <p className="text-muted-foreground">
                                Registrada el {new Date(merma.fecha).toLocaleDateString('es-ES')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <EstadoBadge estado={merma.estado} />

                        {/* Botón de impresión con modal */}
                        <div className="border-l pl-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMostrarModalImpresion(true)}
                                title="Imprimir o descargar merma"
                            >
                                <Printer className="h-4 w-4 mr-1" />
                                Imprimir
                            </Button>
                        </div>

                        {merma.estado === 'PENDIENTE' && can('inventario.mermas.aprobar') && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => openDialog('aprobar')}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Aprobar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => openDialog('rechazar')}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rechazar
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Información Principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Datos Generales */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Información General
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Número
                                        </Label>
                                        <p className="font-medium">{merma.numero || `#${merma.id}`}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Estado
                                        </Label>
                                        <div className="mt-1">
                                            <EstadoBadge estado={merma.estado} />
                                        </div>
                                        {merma.estado === 'PENDIENTE' && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                El stock se descontará al aprobarla
                                            </p>
                                        )}
                                        {merma.aprobado_por && merma.estado !== 'PENDIENTE' && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {merma.estado === 'RECHAZADO' ? 'Rechazada' : 'Aprobada'} por {merma.aprobado_por.name}
                                                {merma.fecha_aprobacion && ` el ${new Date(merma.fecha_aprobacion).toLocaleString('es-BO')}`}
                                                {merma.observacion_aprobacion && (
                                                    <span className="block">
                                                        {merma.estado === 'RECHAZADO' ? 'Motivo: ' : 'Obs.: '}{merma.observacion_aprobacion}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Almacén
                                        </Label>
                                        <p className="font-medium flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            {merma.almacen.nombre}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Tipo de Merma
                                        </Label>
                                        <p className="font-medium">
                                            {tipoMermaConfig?.label || merma.tipo_merma}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Fecha de Registro
                                        </Label>
                                        <p className="font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(merma.fecha).toLocaleString('es-ES')}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Valor Total Perdido
                                        </Label>
                                        <p className="font-medium text-lg text-red-600">
                                            Bs. {merma.total_costo?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                </div>

                                {merma.motivo && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Motivo
                                        </Label>
                                        <p className="mt-1 p-3 bg-muted rounded-md">
                                            {merma.motivo}
                                        </p>
                                    </div>
                                )}

                                {merma.observaciones && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">
                                            Observaciones
                                        </Label>
                                        <p className="mt-1 p-3 bg-muted rounded-md">
                                            {merma.observaciones}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Detalles de Productos */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Productos Afectados</CardTitle>
                                <CardDescription>
                                    Listado de productos incluidos en esta merma
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {merma.detalles && merma.detalles.length > 0 ? (
                                    <div className="overflow-x-auto rounded-lg border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-16">ID</TableHead>
                                                    <TableHead>Producto</TableHead>
                                                    <TableHead>Lote</TableHead>
                                                    <TableHead className="text-right">Cantidad</TableHead>
                                                    <TableHead className="text-right">Costo Unit.</TableHead>
                                                    <TableHead className="text-right">Subtotal</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {merma.detalles.map((detalle, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-mono text-muted-foreground">
                                                            {can('productos.manage') ? (
                                                                <a
                                                                    href={`/productos/${detalle.producto?.id || detalle.producto_id}/edit`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline dark:text-blue-400"
                                                                    title="Abrir producto en otra pestaña"
                                                                >
                                                                    {detalle.producto?.id || detalle.producto_id}
                                                                </a>
                                                            ) : (
                                                                detalle.producto?.id || detalle.producto_id
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">
                                                                {detalle.producto?.nombre || 'Producto no especificado'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {[detalle.producto?.sku && `SKU: ${detalle.producto.sku}`, detalle.producto?.codigo && `Código: ${detalle.producto.codigo}`]
                                                                    .filter(Boolean)
                                                                    .join(' · ')}
                                                            </div>
                                                            {detalle.observaciones && (
                                                                <div className="text-xs text-muted-foreground mt-1">{detalle.observaciones}</div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {detalle.lote || '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right whitespace-nowrap">
                                                            {formatCantidad(detalle.cantidad)}
                                                        </TableCell>
                                                        <TableCell className="text-right whitespace-nowrap">
                                                            {formatCurrencyMinimalDecimals(Number(detalle.costo_unitario) || 0)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-red-600 whitespace-nowrap">
                                                            {formatCurrencyMinimalDecimals(Number(detalle.costo_total) || 0)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                            <TableFooter>
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                                                    <TableCell className="text-right font-medium whitespace-nowrap">
                                                        {formatCantidad(merma.detalles.reduce((total, d) => total + (Number(d.cantidad) || 0), 0))}
                                                    </TableCell>
                                                    <TableCell />
                                                    <TableCell className="text-right font-semibold text-red-600 whitespace-nowrap">
                                                        {formatCurrencyMinimalDecimals(merma.detalles.reduce((total, d) => total + (Number(d.costo_total) || 0), 0))}
                                                    </TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No hay productos registrados en esta merma</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Panel Lateral */}
                    <div className="space-y-6">
                        {/* Resumen */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm">Total productos:</span>
                                        <span className="font-medium">
                                            {merma.total_productos || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm">Cantidad total:</span>
                                        <span className="font-medium">
                                            {merma.total_cantidad || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-sm font-medium">Valor perdido:</span>
                                        <span className="font-bold text-red-600">
                                            Bs. {merma.total_costo?.toFixed(2) || '0.00'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Acciones Rápidas */}
                        {merma.estado === 'PENDIENTE' && can('inventario.mermas.aprobar') && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Acciones</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button
                                        onClick={() => openDialog('aprobar')}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Aprobar Merma
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => openDialog('rechazar')}
                                        className="w-full"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Rechazar Merma
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Dialog de Aprobación/Rechazo */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {dialogType === 'aprobar' ? 'Aprobar Merma' : 'Rechazar Merma'}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogType === 'aprobar'
                                ? 'Al aprobar esta merma, se aplicarán los ajustes de inventario correspondientes.'
                                : 'Al rechazar esta merma, deberá proporcionar una justificación.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="observaciones">
                                {dialogType === 'aprobar' ? 'Observaciones (opcional)' : 'Motivo del rechazo *'}
                            </Label>
                            <Textarea
                                id="observaciones"
                                placeholder={
                                    dialogType === 'aprobar'
                                        ? 'Comentarios adicionales sobre la aprobación...'
                                        : 'Especifique el motivo del rechazo...'
                                }
                                value={dialogType === 'aprobar' ? observacionesAprobacion : observacionesRechazo}
                                onChange={(e) =>
                                    dialogType === 'aprobar'
                                        ? setObservacionesAprobacion(e.target.value)
                                        : setObservacionesRechazo(e.target.value)
                                }
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={isApproving || isRejecting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={dialogType === 'aprobar' ? handleAprobar : handleRechazar}
                            disabled={
                                isApproving ||
                                isRejecting ||
                                (dialogType === 'rechazar' && !observacionesRechazo.trim())
                            }
                            className={dialogType === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : ''}
                            variant={dialogType === 'aprobar' ? 'default' : 'destructive'}
                        >
                            {isApproving || isRejecting ? 'Procesando...' :
                                dialogType === 'aprobar' ? 'Aprobar' : 'Rechazar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Selección de Formato de Impresión */}
            {mostrarModalImpresion && (
                <OutputSelectionModal
                    isOpen={mostrarModalImpresion}
                    onClose={() => setMostrarModalImpresion(false)}
                    documentoId={merma.id}
                    tipoDocumento="merma"
                    documentoInfo={{
                        numero: merma.numero,
                        fecha: new Date(merma.fecha).toLocaleDateString('es-ES'),
                    }}
                />
            )}
        </AppLayout>
    );
}
