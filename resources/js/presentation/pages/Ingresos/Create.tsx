import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';
import toast from 'react-hot-toast';

interface TipoOperacion { id: number; nombre: string }
interface PageProps extends InertiaPageProps {
    [key: string]: any;
    tipos_operacion: TipoOperacion[];
}

interface DetalleForm {
    concepto: string;
    tipo_operacion_caja_id: string;
    monto_efectivo: number;
    monto_transferencia: number;
}

const detalleVacio = (): DetalleForm => ({
    concepto: '',
    tipo_operacion_caja_id: '',
    monto_efectivo: 0,
    monto_transferencia: 0,
});

export default function CreateIngreso() {
    const { props } = usePage<PageProps>();
    const [descripcion, setDescripcion] = useState(
        `Ingreso Diario - ${new Date().toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
    );
    const [detalles, setDetalles] = useState<DetalleForm[]>([detalleVacio()]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [outputModal, setOutputModal] = useState<{ isOpen: boolean; ingresoId?: number }>({ isOpen: false });

    const actualizarDetalle = (index: number, campo: keyof DetalleForm, valor: string | number) => {
        setDetalles(prev => prev.map((d, i) => (i === index ? { ...d, [campo]: valor } : d)));
    };

    const agregarDetalle = () => setDetalles(prev => [...prev, detalleVacio()]);

    const quitarDetalle = (index: number) => setDetalles(prev => prev.filter((_, i) => i !== index));

    const totalDetalle = (d: DetalleForm) => d.monto_efectivo + d.monto_transferencia;
    const totalIngreso = detalles.reduce((sum, d) => sum + totalDetalle(d), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('/api/ingresos', { descripcion, detalles });
            if (response.data.success) {
                toast.success('Ingreso registrado correctamente');
                setOutputModal({ isOpen: true, ingresoId: response.data.ingreso_id });
            }
        } catch (err: any) {
            const mensaje = err.response?.data?.message || 'Error al crear ingreso';
            setError(mensaje);
            toast.error(mensaje);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Ingresos', href: '/ingresos' }, { title: 'Nuevo', href: '/ingresos/create' }]}>
            <Head title="Nuevo Ingreso" />
            <div className="space-y-4 p-2">
                <h1 className="text-3xl font-bold dark:text-white">Nuevo Ingreso</h1>
                {error && (
                    <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div>
                        <label className="mb-2 block text-sm font-medium dark:text-gray-100">Descripción General</label>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="w-full rounded-lg border px-2 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            placeholder="Descripción general del ingreso (opcional)"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold dark:text-white">Detalles del Ingreso</h3>
                            <Button type="button" variant="outline" onClick={agregarDetalle} className="dark:border-slate-600 dark:text-white">
                                <Plus className="mr-2 h-4 w-4" /> Agregar Detalle
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-slate-700">
                                        <th className="border px-2 py-2 text-left text-sm font-semibold dark:border-slate-600 dark:text-gray-100">Tipo de Operación</th>
                                        <th className="border px-2 py-2 text-left text-sm font-semibold dark:border-slate-600 dark:text-gray-100">Concepto</th>
                                        <th className="border px-2 py-2 text-right text-sm font-semibold dark:border-slate-600 dark:text-gray-100">Efectivo</th>
                                        <th className="border px-2 py-2 text-right text-sm font-semibold dark:border-slate-600 dark:text-gray-100">Transferencia/QR</th>
                                        <th className="border px-2 py-2 text-right text-sm font-semibold dark:border-slate-600 dark:text-gray-100">Total</th>
                                        <th className="border px-2 py-2 text-center text-sm font-semibold dark:border-slate-600 dark:text-gray-100">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalles.map((detalle, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800">
                                            <td className="border px-2 py-2 dark:border-slate-600">
                                                <select
                                                    value={detalle.tipo_operacion_caja_id}
                                                    onChange={(e) => actualizarDetalle(index, 'tipo_operacion_caja_id', e.target.value)}
                                                    className="w-full rounded border px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                    required
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {props.tipos_operacion.map((t) => (
                                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="border px-2 py-2 dark:border-slate-600">
                                                <Input
                                                    value={detalle.concepto}
                                                    onChange={(e) => actualizarDetalle(index, 'concepto', e.target.value)}
                                                    placeholder="Concepto (opcional)"
                                                    className="text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                />
                                            </td>
                                            <td className="border px-2 py-2 dark:border-slate-600">
                                                <Input
                                                    type="number"
                                                    value={detalle.monto_efectivo}
                                                    onChange={(e) => actualizarDetalle(index, 'monto_efectivo', parseFloat(e.target.value) || 0)}
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    className="text-right text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                />
                                            </td>
                                            <td className="border px-2 py-2 dark:border-slate-600">
                                                <Input
                                                    type="number"
                                                    value={detalle.monto_transferencia}
                                                    onChange={(e) => actualizarDetalle(index, 'monto_transferencia', parseFloat(e.target.value) || 0)}
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    className="text-right text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                />
                                            </td>
                                            <td className="border px-2 py-2 text-right font-bold dark:border-slate-600 dark:text-white">
                                                Bs. {totalDetalle(detalle).toFixed(2)}
                                            </td>
                                            <td className="border px-2 py-2 text-center dark:border-slate-600">
                                                {detalles.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => quitarDetalle(index)}
                                                        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-lg border-2 border-green-200 bg-gradient-to-r from-green-100 to-green-50 p-2 dark:border-green-700 dark:from-green-900 dark:to-green-800">
                        <p className="mb-2 text-center text-gray-600 dark:text-gray-300">Total del Ingreso</p>
                        <p className="text-center text-4xl font-bold text-green-600 dark:text-green-300">Bs. {totalIngreso.toFixed(2)}</p>
                    </div>

                    <div className="flex gap-4">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Ingreso'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/ingresos')}
                            className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>

            {outputModal.ingresoId && (
                <OutputSelectionModal
                    isOpen={outputModal.isOpen}
                    onClose={() => {
                        setOutputModal({ isOpen: false });
                        setTimeout(() => router.visit('/ingresos'), 500);
                    }}
                    documentoId={outputModal.ingresoId}
                    tipoDocumento="ingreso"
                    documentoInfo={{
                        numero: `Ingreso #${outputModal.ingresoId}`,
                        fecha: new Date().toLocaleDateString('es-BO'),
                    }}
                />
            )}
        </AppLayout>
    );
}
