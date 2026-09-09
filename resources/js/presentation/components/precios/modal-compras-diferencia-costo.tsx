/**
 * Componente: Modal para actualizar cascada de precios por diferencia de costo
 *
 * Responsabilidad:
 * - Cargar precios del producto desde el backend
 * - Mostrar precio actual vs nuevo precio de compra
 * - Calcular y mostrar cascada de precios propuestos
 * - Permitir ajuste manual de precios/márgenes
 * - Guardar cambios
 */

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/compras.utils';
import { NotificationService } from '@/infrastructure/services/notification.service';
import { useCascadaPreciosCompra } from '@/domain/hooks/useCascadaPreciosCompra';
import { preciosService } from '@/application/services/precios.service';
import type { PrecioProductoDTO } from '@/domain/entities/precios';

interface ModalComprasDiferenciaCostoProps {
    isOpen: boolean;
    onClose: () => void;
    producto: {
        id: number;
        nombre: string;
        sku?: string;
        precios?: PrecioProductoDTO[];
    } | null;
    precioActual: number | null;
    precioCostoNuevo: number | null;
    onActualizarPrecios?: (precios: Array<{
        precio_id: number;
        precio_nuevo: number;
        porcentaje_ganancia: number;
        motivo: string;
    }>) => Promise<void>;
    onSuccess?: () => void;
}

export const ModalComprasDiferenciaCostoComponent: React.FC<ModalComprasDiferenciaCostoProps> = ({
    isOpen,
    onClose,
    producto,
    precioActual,
    precioCostoNuevo,
    onActualizarPrecios,
    onSuccess,
}) => {
    const [activeTab, setActiveTab] = useState<'precios'>('precios');
    const [guardando, setGuardando] = useState(false);
    const [cargandoPreciosApi, setCargandoPreciosApi] = useState(false);
    const [motivoActualizacion, setMotivoActualizacion] = useState('Cambio de costo en compra');
    const [inputsEditando, setInputsEditando] = useState<Record<number, { precio?: string; ganancia?: string }>>({});
    const [preciosCompletos, setPreciosCompletos] = useState<PrecioProductoDTO[] | null>(null);
    const [tablaExpandida, setTablaExpandida] = useState(true); // ✅ NUEVO: Control expansión tabla de precios

    // ✅ CARGAR precios del backend cuando el modal se abre
    useEffect(() => {
        if (!isOpen || !producto?.id) {
            setPreciosCompletos(null);
            return;
        }

        const cargarPreciosDelProducto = async () => {
            setCargandoPreciosApi(true);
            try {
                // Obtener precios del producto desde el backend
                const precios = await preciosService.obtenerPreciosProducto(producto.id);
                setPreciosCompletos(precios || null);
            } catch (error) {
                console.error('Error cargando precios:', error);
                // No mostrar error si es un producto nuevo sin precios aún
                setPreciosCompletos(null);
            } finally {
                setCargandoPreciosApi(false);
            }
        };

        cargarPreciosDelProducto();
    }, [isOpen, producto?.id]);

    // ✅ USAR HOOK PERSONALIZADO para cascada de precios
    const {
        preciosPropuestos,
        error: errorCascada,
        calcularCascada,
        inicializarConPreciosActuales, // ✅ Nueva función para no auto-calcular
        actualizarPrecioPropuesto,
        actualizarGananciaPropuesta,
        validarCambios
    } = useCascadaPreciosCompra(
        preciosCompletos,
        precioActual,
        precioCostoNuevo
    );

    // ✅ MODIFICADO: Inicializar con precios actuales (SIN calcular cascada automáticamente)
    // El usuario verá los precios registrados y podrá decidir manualmente cuáles actualizar
    useEffect(() => {
        if (isOpen && preciosCompletos && preciosCompletos.length > 0) {
            // Inicializar precios propuestos con los valores ACTUALES (sin calcular cascada)
            inicializarConPreciosActuales();
        }
    }, [isOpen, preciosCompletos, inicializarConPreciosActuales]);

    // Handler: Cambio de precio propuesto
    const handleCambioPrecioPropuesto = (index: number, nuevoValor: number) => {
        actualizarPrecioPropuesto(index, nuevoValor);
    };

    // Handler: Cambio de ganancia propuesta
    const handleCambioGananciaPropuesta = (index: number, nuevoValor: number) => {
        actualizarGananciaPropuesta(index, nuevoValor);
    };

    // Handler para navegar entre inputs con Enter
    const handleKeyDownPrecio = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Aplicar el cambio
            const valor = e.currentTarget.value ? Number(e.currentTarget.value) : 0;
            handleCambioPrecioPropuesto(index, valor);
            setInputsEditando(prev => ({
                ...prev,
                [index]: { ...prev[index], precio: undefined }
            }));

            // Enfocar el input de ganancia más cercano
            const gridDiv = e.currentTarget.nextElementSibling as HTMLElement;
            if (gridDiv) {
                const ganananciaInput = gridDiv.querySelector('input[type="number"]') as HTMLInputElement;
                if (ganananciaInput) {
                    setTimeout(() => ganananciaInput.focus(), 0);
                }
            }
        }
    };

    const handleKeyDownGanancia = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Aplicar el cambio
            const valor = e.currentTarget.value ? Number(e.currentTarget.value) : 0;
            handleCambioGananciaPropuesta(index, valor);
            setInputsEditando(prev => ({
                ...prev,
                [index]: { ...prev[index], ganancia: undefined }
            }));

            // Enfocar el siguiente input de precio (del siguiente tipo de precio)
            // Obtener todos los inputs de precio en orden
            const allPrecioInputs = document.querySelectorAll('input[data-precio-input]') as NodeListOf<HTMLInputElement>;

            // Encontrar cuál es el input de precio en la card actual
            const cardActual = e.currentTarget.closest('div[data-precio-card]');
            const precioInputActual = cardActual?.querySelector('input[data-precio-input]');

            // Encontrar el índice del input actual
            const currentIndex = Array.from(allPrecioInputs).indexOf(precioInputActual as HTMLInputElement);

            // Enfocar el siguiente input de precio
            if (currentIndex !== -1 && currentIndex < allPrecioInputs.length - 1) {
                setTimeout(() => allPrecioInputs[currentIndex + 1].focus(), 0);
            }
        }
    };

    // Handler: Guardar cambios de precios
    const handleGuardarPrecios = async () => {
        if (!onActualizarPrecios) {
            NotificationService.warning('No hay función para guardar precios');
            return;
        }

        // Validar cambios
        const validacion = validarCambios();
        if (!validacion.esValido) {
            NotificationService.warning(validacion.mensaje);
            return;
        }

        // Validar motivo
        if (!motivoActualizacion.trim()) {
            NotificationService.warning('El motivo de la actualización es obligatorio');
            return;
        }

        // Preparar datos
        const preciosCambiados = validacion.preciosCambiados.map(p => ({
            precio_id: p.id,
            precio_nuevo: p.precio_propuesto,
            porcentaje_ganancia: p.porcentaje_ganancia_propuesto,
            motivo: motivoActualizacion.trim(),
        }));

        setGuardando(true);
        try {
            await onActualizarPrecios(preciosCambiados);
            NotificationService.success(
                `✅ ${preciosCambiados.length} precio(s) actualizado(s) exitosamente`
            );
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'Error desconocido al guardar precios';
            NotificationService.error(`Error: ${mensaje}`);
            console.error('❌ Error al actualizar precios:', error);
        } finally {
            setGuardando(false);
        }
    };

    if (!isOpen || !producto) {
        return null;
    }

    // Mostrar error si ocurrió
    if (errorCascada) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
                <div className="flex min-h-screen items-center justify-center p-4">
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 border border-red-300 dark:border-red-800">
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">⚠️</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-slate-50 mb-2">
                                    Error al calcular cascada
                                </h3>
                                <p className="text-gray-600 dark:text-slate-400 mb-4">
                                    {errorCascada.mensaje}
                                </p>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-50 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 font-medium transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative w-full bg-white dark:bg-slate-900 rounded-lg shadow-xl dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-b border-blue-200 dark:border-blue-800/50 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">💰</div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-slate-50">
                                        Actualizar Precios
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">
                                        {producto.nombre} (SKU: {producto.sku || 'N/A'})
                                    </p>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono">
                                        Costo actual: {formatCurrency(precioActual || 0)}
                                        {precioCostoNuevo && precioCostoNuevo !== precioActual && (
                                            <span className="ml-3 text-blue-600 dark:text-blue-400 font-semibold">
                                                → Nuevo: {formatCurrency(precioCostoNuevo)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-full overflow-y-auto space-y-6">
                        {/* ✅ NUEVO: Tabla expandible de precios por unidad */}
                        {preciosCompletos && preciosCompletos.length > 0 && (
                            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setTablaExpandida(!tablaExpandida)}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-600 flex items-center justify-between transition-colors border-b border-gray-200 dark:border-slate-700"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{tablaExpandida ? '▼' : '▶'}</span>
                                        <span className="font-medium text-gray-900 dark:text-slate-50">Precios por Unidad</span>
                                    </div>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {preciosCompletos.length} precios registrados
                                    </span>
                                </button>

                                {tablaExpandida && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-slate-300">Unidad</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-slate-300">Tipo Precio</th>
                                                    <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-slate-300">Precio</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                                {preciosCompletos.map((precio, idx) => (
                                                    <tr key={`${precio.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-4 py-2 text-gray-900 dark:text-slate-200">
                                                            <span className="inline-flex items-center gap-1">
                                                                {precio.unidad_medida?.nombre || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                precio.tipo_precio?.codigo === 'COSTO'
                                                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                                                                    : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                                            }`}>
                                                                {precio.tipo_precio?.nombre || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-slate-50">
                                                            {formatCurrency(precio.precio || 0)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {cargandoPreciosApi || preciosPropuestos.length === 0 ? (
                            <div className="py-8 text-center">
                                <div className="mb-4 text-4xl">⏳</div>
                                <p className="text-gray-600 dark:text-slate-400">
                                    {cargandoPreciosApi ? 'Cargando precios del producto...' : 'Cargando cascada de precios...'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {preciosPropuestos
                                        .sort((a, b) => a.tipo_precio_id - b.tipo_precio_id)
                                        .map((precio, index) => (
                                            <div key={precio.id} data-precio-card className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Precio Actual */}
                                                    <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span
                                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                                                style={{ backgroundColor: precio.tipo_color || '#999999' }}
                                                            >
                                                                {precio.tipo_nombre}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {precio.tipo_codigo}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                            Precio Actual
                                                        </div>
                                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                            {formatCurrency(precio.precio_actual)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            Ganancia: {precio.porcentaje_ganancia_actual.toFixed(1)}%
                                                        </div>
                                                    </div>

                                                    {/* Precio Propuesto (Editable) */}
                                                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded">
                                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                            Precio Propuesto
                                                        </div>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            data-precio-input
                                                            value={inputsEditando[index]?.precio !== undefined ? inputsEditando[index].precio : precio.precio_propuesto.toFixed(2)}
                                                            onChange={(e) => {
                                                                setInputsEditando(prev => ({
                                                                    ...prev,
                                                                    [index]: { ...prev[index], precio: e.target.value }
                                                                }));
                                                            }}
                                                            onKeyDown={(e) => handleKeyDownPrecio(e, index)}
                                                            onBlur={(e) => {
                                                                const valor = e.target.value ? Number(e.target.value) : 0;
                                                                handleCambioPrecioPropuesto(index, valor);
                                                                setInputsEditando(prev => ({
                                                                    ...prev,
                                                                    [index]: { ...prev[index], precio: undefined }
                                                                }));
                                                            }}
                                                            className="w-full text-2xl font-bold px-3 py-2 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                                                        />
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                                                                    Ganancia (%)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    data-ganancia-input
                                                                    value={inputsEditando[index]?.ganancia !== undefined ? inputsEditando[index].ganancia : precio.porcentaje_ganancia_propuesto.toFixed(2)}
                                                                    onChange={(e) => {
                                                                        setInputsEditando(prev => ({
                                                                            ...prev,
                                                                            [index]: { ...prev[index], ganancia: e.target.value }
                                                                        }));
                                                                    }}
                                                                    onKeyDown={(e) => handleKeyDownGanancia(e, index)}
                                                                    onBlur={(e) => {
                                                                        const valor = e.target.value ? Number(e.target.value) : 0;
                                                                        handleCambioGananciaPropuesta(index, valor);
                                                                        setInputsEditando(prev => ({
                                                                            ...prev,
                                                                            [index]: { ...prev[index], ganancia: undefined }
                                                                        }));
                                                                    }}
                                                                    className="w-full px-2 py-1 text-sm border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                                    Actual
                                                                </div>
                                                                <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                                    {precio.porcentaje_ganancia_actual.toFixed(1)}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {Math.abs(precio.precio_propuesto - precio.precio_actual) > 0.01 && (
                                                            <div className={`text-xs font-semibold mt-2 ${precio.precio_propuesto > precio.precio_actual
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : 'text-red-600 dark:text-red-400'
                                                                }`}>
                                                                {precio.precio_propuesto > precio.precio_actual ? '↑ Aumento' : '↓ Disminución'}: {formatCurrency(Math.abs(precio.precio_propuesto - precio.precio_actual))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                {/* Campo de motivo */}
                                <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Motivo de la actualización
                                    </label>
                                    <input
                                        type="text"
                                        value={motivoActualizacion}
                                        onChange={(e) => setMotivoActualizacion(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ej: Cambio de costo en compra"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 dark:bg-slate-800/30 border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 font-medium transition-colors"
                        >
                            Cerrar
                        </button>

                        {preciosPropuestos.length > 0 && onActualizarPrecios && (
                            <button
                                onClick={handleGuardarPrecios}
                                disabled={guardando}
                                className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {guardando && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                {guardando ? 'Actualizando...' : '💾 Guardar Cambios'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
