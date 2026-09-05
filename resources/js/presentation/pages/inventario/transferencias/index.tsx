import { useAuth } from '@/application/hooks/use-auth';
import type { Almacen } from '@/domain/entities/almacenes';
import type { EstadoTransferencia, FiltrosTransferencias, TransferenciaInventario } from '@/domain/entities/transferencias-inventario';
import { NotificationService } from '@/infrastructure/services/notification.service';
import AppLayout from '@/layouts/app-layout';
import EstadoBadge from '@/presentation/components/Inventario/EstadoBadge';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { ESTADOS_TRANSFERENCIA } from '@/presentation/config/inventory.config';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Eye, Filter, Package, Plus, Send, X } from 'lucide-react';
import { useState } from 'react';

interface PageProps extends InertiaPageProps {
    transferencias: {
        data: TransferenciaInventario[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filtros: FiltrosTransferencias;
    almacenes: Almacen[];
    estadisticas?: {
        total: number;
        borradores: number;
        enviadas: number;
        recibidas: number;
        canceladas: number;
    };
}

const breadcrumbs = [
    {
        title: 'Inventario',
        href: '/inventario',
    },
    {
        title: 'Transferencias',
        href: '/inventario/transferencias',
    },
];

export default function TransferenciasIndex() {
    const { props } = usePage<PageProps>();
    const { transferencias, filtros, almacenes, estadisticas } = props;
    const { can } = useAuth();

    const [filtrosLocales, setFiltrosLocales] = useState<FiltrosTransferencias>(filtros || {});
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    const aplicarFiltros = () => {
        router.get('/inventario/transferencias', filtrosLocales as Record<string, string | number | undefined>, {
            preserveState: true,
            preserveScroll: true,
        });
        setMostrarFiltros(false);
    };

    const limpiarFiltros = () => {
        setFiltrosLocales({});
        router.get(
            '/inventario/transferencias',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
        setMostrarFiltros(false);
    };

    const enviarTransferencia = async (transferencia: TransferenciaInventario) => {
        const confirmed = await NotificationService.confirm('¿Deseas enviar esta transferencia? El stock se deducirá del almacén origen.', {
            title: 'Enviar Transferencia',
            confirmText: 'Enviar',
            cancelText: 'Cancelar',
        });

        if (!confirmed) return;

        const toastId = NotificationService.loading('Enviando transferencia...');

        try {
            const response = await fetch(`/inventario/transferencias/${transferencia.id}/enviar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const result = await response.json();

            if (result.success) {
                NotificationService.update(toastId, 'Transferencia enviada exitosamente', 'success');
                setTimeout(() => router.reload({ only: ['transferencias'] }), 1000);
            } else {
                NotificationService.update(toastId, result.message || 'Error al enviar transferencia', 'error');
            }
        } catch {
            NotificationService.update(toastId, 'Error al procesar la solicitud', 'error');
        }
    };

    const recibirTransferencia = async (transferencia: TransferenciaInventario) => {
        const confirmed = await NotificationService.confirm(
            '¿Confirmas la recepción de esta transferencia? El stock se añadirá al almacén destino.',
            {
                title: 'Recibir Transferencia',
                confirmText: 'Recibir',
                cancelText: 'Cancelar',
            },
        );

        if (!confirmed) return;

        const toastId = NotificationService.loading('Procesando recepción...');

        try {
            const response = await fetch(`/inventario/transferencias/${transferencia.id}/recibir`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const result = await response.json();

            if (result.success) {
                NotificationService.update(toastId, 'Transferencia recibida exitosamente', 'success');
                setTimeout(() => router.reload({ only: ['transferencias'] }), 1000);
            } else {
                NotificationService.update(toastId, result.message || 'Error al recibir transferencia', 'error');
            }
        } catch {
            NotificationService.update(toastId, 'Error al procesar la solicitud', 'error');
        }
    };

    const cancelarTransferencia = async (transferencia: TransferenciaInventario) => {
        const motivo = prompt('Ingresa el motivo de cancelación:');

        if (!motivo || motivo.trim() === '') {
            NotificationService.warning('Debes proporcionar un motivo para cancelar la transferencia');
            return;
        }

        const confirmed = await NotificationService.confirm(`Motivo: "${motivo}"\n\n¿Estás seguro de cancelar esta transferencia?`, {
            title: 'Cancelar Transferencia',
            confirmText: 'Cancelar Transferencia',
            cancelText: 'Volver',
        });

        if (!confirmed) return;

        const toastId = NotificationService.loading('Cancelando transferencia...');

        try {
            const response = await fetch(`/inventario/transferencias/${transferencia.id}/cancelar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ motivo_cancelacion: motivo }),
            });

            const result = await response.json();

            if (result.success) {
                NotificationService.update(toastId, 'Transferencia cancelada exitosamente', 'success');
                setTimeout(() => router.reload({ only: ['transferencias'] }), 1000);
            } else {
                NotificationService.update(toastId, result.message || 'Error al cancelar transferencia', 'error');
            }
        } catch {
            NotificationService.update(toastId, 'Error al procesar la solicitud', 'error');
        }
    };

    if (!can('inventario.transferencias.index')) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Acceso Denegado" />
                <div className="py-12 text-center">
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No tienes permisos para acceder a esta página</h3>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transferencias de Inventario" />

            <div className="flex flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Transferencias de Inventario</h2>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Gestiona las transferencias de productos entre almacenes</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
                            <Filter className="mr-2 h-4 w-4" />
                            Filtros
                        </Button>
                        <Link href="/inventario/transferencias/crear">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Transferencia
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Estadísticas */}
                {estadisticas && (
                    <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-5">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="text-center">
                                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{estadisticas.total}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="text-center">
                                <p className="text-2xl font-semibold text-gray-600 dark:text-gray-400">{estadisticas.borradores}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Borradores</p>
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="text-center">
                                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{estadisticas.enviadas}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Enviadas</p>
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="text-center">
                                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{estadisticas.recibidas}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Recibidas</p>
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="text-center">
                                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{estadisticas.canceladas}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Canceladas</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Panel de Filtros */}
                {mostrarFiltros && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4 p-6 dark:border-gray-700 dark:bg-gray-800">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Búsqueda</label>
                                <Input
                                    type="text"
                                    placeholder="Número o observaciones..."
                                    value={filtrosLocales.search || ''}
                                    onChange={(e) =>
                                        setFiltrosLocales({
                                            ...filtrosLocales,
                                            search: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                                    value={filtrosLocales.estado || ''}
                                    onChange={(e) =>
                                        setFiltrosLocales({
                                            ...filtrosLocales,
                                            estado: e.target.value as EstadoTransferencia,
                                        })
                                    }
                                >
                                    <option value="">Todos los estados</option>
                                    {Object.entries(ESTADOS_TRANSFERENCIA).map(([key, config]) => (
                                        <option key={key} value={key}>
                                            {config.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Almacén Origen</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                                    value={filtrosLocales.almacen_origen || ''}
                                    onChange={(e) =>
                                        setFiltrosLocales({
                                            ...filtrosLocales,
                                            almacen_origen: parseInt(e.target.value) || undefined,
                                        })
                                    }
                                >
                                    <option value="">Todos los almacenes</option>
                                    {almacenes.map((almacen) => (
                                        <option key={almacen.id} value={almacen.id}>
                                            {almacen.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Almacén Destino</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                                    value={filtrosLocales.almacen_destino || ''}
                                    onChange={(e) =>
                                        setFiltrosLocales({
                                            ...filtrosLocales,
                                            almacen_destino: parseInt(e.target.value) || undefined,
                                        })
                                    }
                                >
                                    <option value="">Todos los almacenes</option>
                                    {almacenes.map((almacen) => (
                                        <option key={almacen.id} value={almacen.id}>
                                            {almacen.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={aplicarFiltros} className="flex-1">
                                    Aplicar
                                </Button>
                                <Button variant="outline" onClick={limpiarFiltros}>
                                    Limpiar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabla de Transferencias */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Transferencia
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Almacenes
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Productos
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Fechas
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {!transferencias?.data || transferencias.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                            <p className="text-lg font-medium">No hay transferencias registradas</p>
                                            <p className="text-sm">
                                                {can('inventario.transferencias.crear') ? (
                                                    <>
                                                        Comienza creando tu primera transferencia{' '}
                                                        <Link href="/inventario/transferencias/crear" className="text-blue-600 hover:text-blue-500">
                                                            aquí
                                                        </Link>
                                                    </>
                                                ) : (
                                                    'No tienes permisos para crear transferencias'
                                                )}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    transferencias.data.map((transferencia) => (
                                        <tr key={transferencia.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{transferencia.numero}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(transferencia.fecha).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                                    <div className="flex items-center">
                                                        <span className="font-medium">{transferencia.almacen_origen.nombre}</span>
                                                        <span className="mx-2 text-gray-400">→</span>
                                                        <span className="font-medium">{transferencia.almacen_destino.nombre}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <EstadoBadge estado={transferencia.estado} />
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                <div>
                                                    <span className="font-medium">{transferencia.total_productos}</span> productos
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {transferencia.total_cantidad} unidades
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                <div>
                                                    {transferencia.fecha_envio && (
                                                        <div>Env: {new Date(transferencia.fecha_envio).toLocaleDateString()}</div>
                                                    )}
                                                    {transferencia.fecha_recepcion && (
                                                        <div>Rec: {new Date(transferencia.fecha_recepcion).toLocaleDateString()}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/inventario/transferencias/${transferencia.id}`}
                                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>

                                                    {transferencia.estado === 'BORRADOR' && can('inventario.transferencias.edit') && (
                                                        <Link
                                                            href={`/inventario/transferencias/${transferencia.id}/edit`}
                                                            className="ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    )}

                                                    {transferencia.estado === 'BORRADOR' && can('inventario.transferencias.enviar') && (
                                                        <button
                                                            onClick={() => enviarTransferencia(transferencia)}
                                                            className="ml-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                        >
                                                            <Send className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    {transferencia.estado === 'ENVIADO' && can('inventario.transferencias.recibir') && (
                                                        <button
                                                            onClick={() => recibirTransferencia(transferencia)}
                                                            className="ml-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                        >
                                                            <Package className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    {['BORRADOR', 'ENVIADO'].includes(transferencia.estado) &&
                                                        can('inventario.transferencias.cancelar') && (
                                                            <button
                                                                onClick={() => cancelarTransferencia(transferencia)}
                                                                className="ml-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {transferencias?.data?.length > 0 && transferencias?.last_page > 1 && (
                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-900">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    {transferencias && (
                                        <>
                                            Mostrando {(transferencias.current_page - 1) * transferencias.per_page + 1} a{' '}
                                            {Math.min(transferencias.current_page * transferencias.per_page, transferencias.total)} de{' '}
                                            {transferencias.total} resultados
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {transferencias.links?.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            className={`rounded px-3 py-1 text-sm ${
                                                link.active
                                                    ? 'bg-blue-600 text-white'
                                                    : link.url
                                                      ? 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                                      : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
