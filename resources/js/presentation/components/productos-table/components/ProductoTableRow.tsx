import { formatCurrency, formatCurrencyMinimalDecimals, formatCurrencyWith2Decimals } from '@/lib/utils';
import { Fragment } from 'react';
import type { DetalleProducto } from '../types';
import ComboExpandedRows from './ComboExpandedRows';

interface ProductoTableRowProps {
    detalle: DetalleProducto;
    index: number;
    tipo: 'compra' | 'venta';
    readOnly?: boolean;
    editingField: { index: number; field: string; value: string } | null;
    setEditingField: (value: { index: number; field: string; value: string } | null) => void;
    manuallySelectedTipoPrecio?: Record<number, boolean>;
    selectedTipoPrecio: Record<number, string | number>;
    setSelectedTipoPrecio: (value: Record<number, string | number>) => void;
    expandedCombos: Record<number, boolean>;
    setExpandedCombos: (value: Record<number, boolean>) => void;
    tieneDiferencia: boolean;
    esAumento: boolean;
    es_farmacia?: boolean;
    default_tipo_precio_id?: number | string;
    comboItemsMap: Record<number, any[]>;
    setComboItemsMap: (value: any) => void;
    onUpdateDetail: (index: number, field: string, value: any) => void;
    onUpdateDetailMultiple?: (index: number, updates: Record<string, any>) => void;
    onRemoveDetail: (index: number) => void;
    onManualTipoPrecioChange?: (index: number) => void;
    onAbrirModalCascada: (index: number, detalle: DetalleProducto) => void;
    onComboItemsChange?: (detailIndex: number, items: any[]) => void;
    onMedicamentoInfo?: (producto: any) => void;
    calcularPrecioPorUnidad?: (precio: number, unidadId: number, conversiones: any[]) => number;
    formatearPrecioVenta?: (precio: number) => string;
    normalizeDateForInput?: (fecha: string | null) => string;
    onUpdateDetailUnidadConPrecio?: (index: number, unidadId: number, precio: number) => void;
    proformaConvertida?: boolean;
}

export default function ProductoTableRow({
    detalle,
    index,
    tipo,
    readOnly = false,
    editingField,
    setEditingField,
    manuallySelectedTipoPrecio,
    selectedTipoPrecio,
    setSelectedTipoPrecio,
    expandedCombos,
    setExpandedCombos,
    tieneDiferencia,
    esAumento,
    es_farmacia = false,
    default_tipo_precio_id,
    comboItemsMap,
    setComboItemsMap,
    onUpdateDetail,
    onUpdateDetailMultiple,
    onRemoveDetail,
    onManualTipoPrecioChange,
    onAbrirModalCascada,
    onComboItemsChange,
    onMedicamentoInfo,
    calcularPrecioPorUnidad = (precio) => precio,
    formatearPrecioVenta = (precio) => precio.toString(),
    normalizeDateForInput = (fecha) => fecha || '',
    onUpdateDetailUnidadConPrecio,
    proformaConvertida = false,
}: ProductoTableRowProps) {
    const productoInfo = detalle.producto as any;
    console.log('ProductoTableRow - productoInfo:', productoInfo);
    console.log('📊 [ProductoTableRow] Detalle cantidad:', {
        cantidad: detalle.cantidad,
        unidad_medida_id: detalle.unidad_medida_id,
        unidad_venta_id: detalle.unidad_venta_id,
    });
    const esCombo = productoInfo && productoInfo.es_combo;
    const precioCosto = detalle.precio_costo || productoInfo?.precio_costo || 0;

    const content = (
        <tr
            key={detalle.producto_id}
            className={`font-small text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 ${
                tipo === 'compra' && tieneDiferencia && esAumento
                    ? 'bg-amber-50 px-2 py-2 dark:bg-amber-950/10'
                    : tipo === 'compra' && tieneDiferencia && !esAumento
                      ? 'bg-green-50 px-2 py-2 dark:bg-green-950/10'
                      : ''
            }`}
        >
            {/* Producto Info */}
            <td className="items-start px-2 py-2">
                <div className="items-start text-xs font-bold text-gray-900 dark:text-white">{productoInfo?.nombre || 'Producto no encontrado'}</div>
                <div className="mt-1 text-left text-xs text-gray-500 dark:text-gray-400">
                    {productoInfo?.codigo_barras && productoInfo.codigo_barras !== productoInfo.sku && (
                        <div>Cod Barras: {productoInfo.codigo_barras}</div>
                    )}
                    {(() => {
                        const tieneDataMedicamentos = (productoInfo as any)?.principio_activo || (productoInfo as any)?.uso_de_medicacion;
                        const mostrarMedicamentos = es_farmacia && tieneDataMedicamentos;
                        return (
                            mostrarMedicamentos && (
                                <div className="mt-1 space-y-0.5 text-xs text-blue-600 dark:text-blue-400">
                                    {(productoInfo as any)?.principio_activo && <div>💊 P.A.: {(productoInfo as any).principio_activo}</div>}
                                    {(productoInfo as any)?.uso_de_medicacion && <div>📋 Uso: {(productoInfo as any).uso_de_medicacion}</div>}
                                </div>
                            )
                        );
                    })()}
                </div>
            </td>

            {/* SKU */}
            <td className="items-start px-2 py-2">
                {productoInfo?.sku || productoInfo?.codigo ? (
                    <span className="items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {productoInfo.sku || productoInfo.codigo}
                    </span>
                ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-600">-</span>
                )}
            </td>
            {/* Disponibilidad */}
            <td className="w-20 items-start px-2 py-2 text-xs">
                {!proformaConvertida &&
                    (() => {
                        const stockDisponible =
                            (productoInfo as any)?.stock_disponible_calc ??
                            (productoInfo as any)?.stock_disponible ??
                            (productoInfo as any)?.stock ??
                            0;
                        const stockReservado = (productoInfo as any)?.stock_reservado_calc ?? (productoInfo as any)?.stock_reservado ?? 0;
                        const stockTotal = (productoInfo as any)?.stock_total_calc ?? (productoInfo as any)?.stock_total ?? 0;
                        return (
                            <div
                                className={`flex flex-col rounded p-1 text-xs text-center ${
                                    stockDisponible === 0
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                                        : stockDisponible < 5
                                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200'
                                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                                }`}
                            >
                                {/* Disp. {stockDisponible} | Res. {stockReservado} | Total {stockTotal} */}
                                {/* disponible */}
                                <p>{stockDisponible}</p>
                                {/* Reservado */}
                                {/* <p>Res.: {stockReservado}</p> */}
                                {/* Total */}
                                {/* <p>T: {stockTotal}</p> */}
                            </div>
                        );
                    })()}
            </td>

            {/* Cantidad */}
            <td className="items-center px-2 py-2">
                <div className="flex flex-col gap-1">
                    <input
                        type="text"
                        inputMode="decimal"
                        disabled={readOnly}
                        value={editingField?.index === index && editingField?.field === 'cantidad' ? editingField.value : detalle.cantidad.toString()}
                        placeholder="0.00"
                        onFocus={() => {
                            setEditingField({
                                index,
                                field: 'cantidad',
                                value: detalle.cantidad.toString(),
                            });
                        }}
                        onChange={(e) => {
                            const valor = e.target.value;
                            setEditingField((prev) => (prev && prev.index === index ? { ...prev, value: valor } : prev));
                            if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
                                const num = valor === '' ? 0 : parseFloat(valor);
                                if (num >= 0) {
                                    onUpdateDetail(index, 'cantidad', num);
                                }
                            }
                        }}
                        onBlur={() => {
                            setEditingField(null);
                        }}
                        className="w-24 flex-col rounded-lg border border-gray-300 px-1 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    />
                    {/* ✨ NUEVO: Selector de unidades para productos fraccionados */}
                </div>
            </td>

            {/* Precio Unitario (Compra) */}
            {tipo === 'compra' && (
                <>
                    <td className="px-2 py-4">
                        <input
                            type="text"
                            inputMode="decimal"
                            disabled={readOnly}
                            value={
                                editingField?.index === index && editingField?.field === 'precio_unitario'
                                    ? editingField.value
                                    : detalle.precio_unitario.toString()
                            }
                            placeholder="0.0000"
                            onFocus={() => {
                                setEditingField({
                                    index,
                                    field: 'precio_unitario',
                                    value: detalle.precio_unitario.toString(),
                                });
                            }}
                            onChange={(e) => {
                                const valor = e.target.value;
                                setEditingField((prev) => (prev && prev.index === index ? { ...prev, value: valor } : prev));
                                if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
                                    const num = valor === '' ? 0 : parseFloat(valor);
                                    if (num >= 0) {
                                        onUpdateDetail(index, 'precio_unitario', num);
                                    }
                                }
                            }}
                            onBlur={() => {
                                setEditingField(null);
                            }}
                            className={`w-28 rounded-lg border px-2 py-2 font-mono text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-white ${
                                tieneDiferencia
                                    ? esAumento
                                        ? 'border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20'
                                        : 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                                    : 'border-gray-300 dark:border-zinc-600'
                            }`}
                        />
                        {tieneDiferencia && (
                            <div
                                className={`mt-0.5 text-xs font-semibold ${
                                    esAumento ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
                                }`}
                            >
                                {esAumento ? '↑' : '↓'} {formatCurrency(Math.abs(detalle.precio_unitario - precioCosto))}
                            </div>
                        )}
                        {detalle.es_fraccionado && detalle.conversiones && detalle.conversiones.length > 0 && (
                            <div>
                                {(() => {
                                    const unidadActual = detalle.unidad_venta_id || detalle.unidad_medida_id;

                                    if (unidadActual === detalle.unidad_medida_id) {
                                        return (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatCurrency(detalle.precio_unitario)} / {detalle.unidad_medida_nombre || 'Base'}
                                            </div>
                                        );
                                    }

                                    const conversion = detalle.conversiones.find((c) => c.unidad_destino_id === unidadActual);

                                    if (conversion && conversion.factor_conversion > 0) {
                                        const precioPorUnidad = detalle.precio_unitario / conversion.factor_conversion;
                                        return (
                                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                {formatCurrency(precioPorUnidad)} /{' '}
                                                {conversion.unidad_destino_nombre || `Unidad ${conversion.unidad_destino_id}`}
                                            </div>
                                        );
                                    }

                                    return <div className="text-sm text-gray-500 dark:text-gray-400">N/A</div>;
                                })()}
                            </div>
                        )}
                    </td>

                    {/* Lote */}
                    <td className="px-2 py-4">
                        <input
                            type="text"
                            disabled={readOnly}
                            value={detalle.lote || ''}
                            placeholder="LOT-001"
                            onChange={(e) => {
                                onUpdateDetail(index, 'lote', e.target.value);
                            }}
                            className="w-28 rounded-lg border border-gray-300 px-2 py-2 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                        />
                    </td>

                    {/* Fecha Vencimiento */}
                    <td className="px-2 py-4">
                        <input
                            type="date"
                            disabled={readOnly}
                            value={normalizeDateForInput(detalle.fecha_vencimiento)}
                            onChange={(e) => {
                                onUpdateDetail(index, 'fecha_vencimiento', e.target.value);
                            }}
                            className="w-32 rounded-lg border border-gray-300 px-2 py-2 text-sm font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                        />
                    </td>
                </>
            )}

            {/* Precio Venta + Tipo Precio */}
            {tipo === 'venta' && (
                <td className="font-small px-2 py-2 text-xs">
                    {(() => {
                        const valorMostrado = editingField?.index === index && editingField?.field === 'precio_venta'
                            ? editingField.value
                            : formatearPrecioVenta(detalle.precio_unitario);
                        console.log(`💰 [Input Precio] detalle.precio_unitario=${detalle.precio_unitario}, editingField=${editingField?.index === index && editingField?.field === 'precio_venta' ? 'SÍ' : 'NO'}, valorMostrado=${valorMostrado}`);
                        return (
                            <>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    disabled={readOnly}
                                    value={valorMostrado}
                                    placeholder="0"
                                    onFocus={() => {
                                        setEditingField({
                                            index,
                                            field: 'precio_venta',
                                            value: formatearPrecioVenta(detalle.precio_unitario),
                                        });
                                    }}
                                    onChange={(e) => {
                                        const valor = e.target.value;
                                        setEditingField((prev) => (prev && prev.index === index ? { ...prev, value: valor } : prev));
                                        // ✅ MEJORADO: Permitir decimales y validación más flexible
                                        if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
                                            const num = valor === '' ? 0 : parseFloat(valor);
                                            if (num >= 0) {
                                                // ✅ NUEVO: Marcar como selección manual cuando se edita el precio
                                                // ✅ REFACTORIZADO (2026-07-03): Pasar producto_id en lugar de index
                                                if (onManualTipoPrecioChange) {
                                                    onManualTipoPrecioChange(detalle.producto_id);
                                                }
                                                onUpdateDetail(index, 'precio_unitario', num);
                                            }
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const valor = e.target.value;
                                        // ✅ MEJORADO: Permitir decimales y validación más flexible
                                        if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
                                            const num = valor === '' ? 0 : parseFloat(valor);
                                            if (num >= 0) {
                                                // ✅ NUEVO: Marcar como selección manual cuando se edita el precio
                                                // ✅ REFACTORIZADO (2026-07-03): Pasar producto_id en lugar de index
                                                if (onManualTipoPrecioChange) {
                                                    onManualTipoPrecioChange(detalle.producto_id);
                                                }
                                                onUpdateDetail(index, 'precio_unitario', num);
                                            }
                                        }
                                        setEditingField(null);
                                    }}
                                    className="font-small w-32 rounded-md border border-gray-300 px-1 py-1 text-xs focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                                />
                            </>
                        );
                    })()}
                    <br />

                    {/* Tipo de Precio Selector */}
                    {(() => {
                        const precios = detalle.producto?.precios || [];
                        const preciosVenta = precios.filter((p) => {
                            const nombre = (p.nombre || '').toLowerCase();
                            return !nombre.includes('costo') && !nombre.includes('cost');
                        });

                        // ✅ OPTIMIZADO: Si solo hay precio de venta, no mostrar leyenda
                        if (preciosVenta.length <= 1) {
                            return null; // No mostrar leyenda si solo hay un tipo de precio
                        }

                        // ✅ PRIORIDAD:
                        // 1. Si usuario seleccionó algo explícitamente → mantenerlo
                        // 2. Si tipo_precio_id === null → mostrar "OTROS"
                        // 3. Si tiene tipo_precio_id → usarlo (del detalle del backend)
                        // 4. Fallback: tipo_precio_id_recomendado o default
                        // ✅ REFACTORIZADO (2026-07-03): Usar producto_id como clave en lugar de index
                        // ✅ MEJORADO: Incluir unidad_medida_id en el valor para productos fraccionados
                        const productoId = detalle.producto_id;
                        const unidadMedidaId = detalle.unidad_medida_id || detalle.unidad_venta_id;

                        let valorInicial = '';
                        if (selectedTipoPrecio[productoId] !== undefined) {
                            valorInicial = String(selectedTipoPrecio[productoId]); // Usuario seleccionó algo
                        } else if (detalle.tipo_precio_id === null) {
                            valorInicial = 'otros'; // Mostrar "OTROS" si es null
                        } else if (detalle.tipo_precio_id) {
                            // Para el valor inicial, incluir unidad_medida_id si está disponible
                            valorInicial = unidadMedidaId
                                ? `${detalle.tipo_precio_id}_${unidadMedidaId}`
                                : String(detalle.tipo_precio_id);
                        } else if (detalle.tipo_precio_id_recomendado) {
                            valorInicial = String(detalle.tipo_precio_id_recomendado);
                        } else if (default_tipo_precio_id) {
                            valorInicial = String(default_tipo_precio_id);
                        }

                        return (
                            <select
                                disabled={readOnly}
                                value={valorInicial}
                                onChange={(e) => {
                                    const valorSeleccionado = e.target.value;

                                    // ✅ NUEVO: Manejar opción "OTROS"
                                    if (valorSeleccionado === 'otros') {
                                        if (onManualTipoPrecioChange) {
                                            // ✅ REFACTORIZADO (2026-07-03): Pasar producto_id en lugar de index
                                            onManualTipoPrecioChange(detalle.producto_id);
                                        }

                                        setSelectedTipoPrecio((prev) => ({
                                            ...prev,
                                            [productoId]: 'otros',
                                        }));

                                        // Limpiar tipo_precio pero mantener el precio actual
                                        onUpdateDetail(index, 'tipo_precio_id', null);
                                        onUpdateDetail(index, 'tipo_precio_nombre', null);
                                        return;
                                    }

                                    // ✅ IMPORTANTE: Para productos fraccionados, hay múltiples precios con el mismo tipo_precio_id
                                    // El valor es "tipo_precio_id_unidad_medida_id" para distinguir entre opciones
                                    const partes = valorSeleccionado.split('_');
                                    const tipoPrecioIdSeleccionado = parseInt(partes[0]);
                                    const unidadMedidaIdSeleccionada = partes[1] ? parseInt(partes[1]) : null;

                                    const precioSeleccionado = preciosVenta.find(
                                        (p) =>
                                            String(p.tipo_precio_id) === String(tipoPrecioIdSeleccionado) &&
                                            (unidadMedidaIdSeleccionada === null || Number(p.unidad_medida_id) === unidadMedidaIdSeleccionada),
                                    );

                                    if (precioSeleccionado) {
                                        if (onManualTipoPrecioChange) {
                                            // ✅ REFACTORIZADO (2026-07-03): Pasar producto_id en lugar de index
                                            onManualTipoPrecioChange(detalle.producto_id);
                                        }

                                        setSelectedTipoPrecio((prev) => ({
                                            ...prev,
                                            [productoId]: valorSeleccionado,
                                        }));

                                        // ✅ IMPORTANTE: Limpiar editingField para que el input de precio muestre el nuevo valor
                                        setEditingField(null);

                                        // ✅ CRÍTICO: Usar updateDetailMultiple para hacer TODOS los cambios de una sola vez
                                        // Esto evita estados inconsistentes donde unidad_venta_id ≠ precio_unitario

                                        // ✅ NUEVO: Convertir cantidad si la unidad cambió
                                        let cantidadConvertida = detalle.cantidad;
                                        const unidadActual = detalle.unidad_medida_id || detalle.unidad_venta_id;
                                        const unidadBase = detalle.unidad_medida_id;
                                        const unidadNueva = precioSeleccionado.unidad_medida_id || unidadBase;

                                        if (unidadActual !== unidadNueva && detalle.es_fraccionado && detalle.conversiones) {
                                            // ✅ IMPORTANTE: Buscar la conversión según HACIA DÓNDE vas

                                            if (unidadNueva === unidadBase) {
                                                // Volviendo a la unidad base → DIVIDIR por el factor
                                                // Buscar la conversión DE la unidad actual AL base
                                                const conversionActual = detalle.conversiones.find(
                                                    (c: any) => c.unidad_destino_id === unidadActual
                                                );
                                                if (conversionActual?.factor_conversion) {
                                                    console.log(`🔄 [Conversion] Volviendo al base: ${detalle.cantidad} / ${conversionActual.factor_conversion} = ${detalle.cantidad / conversionActual.factor_conversion}`);
                                                    cantidadConvertida = detalle.cantidad / conversionActual.factor_conversion;
                                                }
                                            } else {
                                                // Yendo a una conversión → MULTIPLICAR por el factor
                                                const conversionNueva = detalle.conversiones.find(
                                                    (c: any) => c.unidad_destino_id === unidadNueva
                                                );
                                                if (conversionNueva?.factor_conversion) {
                                                    console.log(`🔄 [Conversion] Yendo a conversión: ${detalle.cantidad} * ${conversionNueva.factor_conversion} = ${detalle.cantidad * conversionNueva.factor_conversion}`);
                                                    cantidadConvertida = detalle.cantidad * conversionNueva.factor_conversion;
                                                }
                                            }
                                        }

                                        // ✅ NUEVO: Obtener el nombre de la nueva unidad
                                        let unidadNombreNueva = productoInfo?.unidad?.nombre || 'Unidad';
                                        if (unidadNueva && unidadNueva !== detalle.unidad_medida_id) {
                                            const conversionNueva = productoInfo?.conversiones?.find(
                                                (c: any) => c.unidad_destino_id === unidadNueva,
                                            );
                                            if (conversionNueva?.unidad_destino_nombre) {
                                                unidadNombreNueva = conversionNueva.unidad_destino_nombre;
                                            }
                                        }

                                        if (onUpdateDetailMultiple) {
                                            onUpdateDetailMultiple(index, {
                                                tipo_precio_id: precioSeleccionado.tipo_precio_id,
                                                tipo_precio_nombre: precioSeleccionado.nombre || '',
                                                precio_unitario: precioSeleccionado.precio || 0,
                                                unidad_medida_id: precioSeleccionado.unidad_medida_id || null,
                                                unidad_venta_id: precioSeleccionado.unidad_medida_id || detalle.unidad_medida_id,
                                                cantidad: cantidadConvertida,
                                                unidad_medida_nombre: unidadNombreNueva,
                                            });
                                        } else {
                                            // Fallback si onUpdateDetailMultiple no está disponible
                                            onUpdateDetail(index, 'tipo_precio_id', precioSeleccionado.tipo_precio_id);
                                            onUpdateDetail(index, 'tipo_precio_nombre', precioSeleccionado.nombre || '');
                                            onUpdateDetail(index, 'precio_unitario', precioSeleccionado.precio || 0);
                                            onUpdateDetail(index, 'unidad_medida_id', precioSeleccionado.unidad_medida_id || null);
                                            onUpdateDetail(index, 'unidad_venta_id', precioSeleccionado.unidad_medida_id || detalle.unidad_medida_id);
                                        }
                                    }
                                }}
                                className="font-small mt-1 rounded-lg border border-gray-300 px-1 py-1 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            >
                                {!valorInicial && <option value="">Seleccionar tipo de precio</option>}
                                {preciosVenta.map((precio) => {
                                    // ✅ Mostrar precio con hasta 6 decimales para productos fraccionados
                                    const precioFormato = (precio.precio || 0).toLocaleString('es-BO', {
                                        style: 'currency',
                                        currency: 'BOB',
                                        minimumFractionDigits: precio.precio % 1 === 0 ? 0 : 2,
                                        maximumFractionDigits: 6,
                                    });

                                    // ✅ IMPORTANTE: Agregar unidad al nombre para productos fraccionados
                                    // Sino ambas opciones se llamarían igual (ej: "PRECIO DE VENTA")
                                    let unidadNombre = 'Unidad';

                                    if (precio.unidad_medida_id) {
                                        // Buscar en conversiones por unidad_destino_id
                                        const conversion = productoInfo?.conversiones?.find(
                                            (c: any) => c.unidad_destino_id === precio.unidad_medida_id,
                                        );
                                        if (conversion?.unidad_destino_nombre) {
                                            unidadNombre = conversion.unidad_destino_nombre;
                                        } else {
                                            // Fallback: si es la unidad base (igual a unidad_medida_id del producto)
                                            unidadNombre = productoInfo?.unidad?.nombre || 'Unidad';
                                        }
                                    } else {
                                        unidadNombre = productoInfo?.unidad?.nombre || 'Unidad Base';
                                    }

                                    const nombreConUnidad = detalle.es_fraccionado
                                        ? `${precio.nombre || `Tipo ${precio.tipo_precio_id}`} - ${unidadNombre}`
                                        : precio.nombre || `Tipo ${precio.tipo_precio_id}`;

                                    // ✅ IMPORTANTE: Value incluye tipo_precio_id y unidad_medida_id para poder distinguir
                                    // precios de la misma familia pero de diferentes unidades (Kg vs Gr)
                                    const optionValue = precio.unidad_medida_id
                                        ? `${precio.tipo_precio_id}_${precio.unidad_medida_id}`
                                        : String(precio.tipo_precio_id);

                                    return (
                                        <option
                                            className="font-small text-xs"
                                            key={precio.id || optionValue}
                                            value={optionValue}
                                        >
                                            {nombreConUnidad} - {precioFormato}
                                        </option>
                                    );
                                })}
                                {/* ✅ NUEVO: Opción OTROS para precios personalizados */}
                                <option value="otros" className="font-small text-xs">
                                    ➕ OTROS (Precio Personalizado)
                                </option>
                            </select>
                        );
                    })()}
                </td>
            )}

            {/* Subtotal */}
            <td className="items-start px-2 py-4 text-center">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrencyMinimalDecimals(detalle.subtotal)}</span>
            </td>

            {/* Categoría */}
            {/* <td className="items-start px-2 py-2 text-center">
                <span className="font-small text-xs text-gray-700 dark:text-gray-300">
                    {typeof productoInfo?.categoria === 'string' ? productoInfo.categoria : productoInfo?.categoria?.nombre || '-'}
                </span>
            </td> */}

            {/* Unidad */}
            <td className="items-start px-2 py-2 text-center">
                <span className="font-small text-xs text-gray-700 uppercase dark:text-gray-300">
                    {detalle.unidad_medida_nombre || productoInfo?.unidad_medida?.nombre || '-'}
                </span>
            </td>

            {/* Marca */}
            <td className="items-start px-2 py-2 text-center">
                <span className="font-small text-xs text-gray-700 uppercase dark:text-gray-300">
                    {typeof productoInfo?.marca === 'string' ? productoInfo.marca : productoInfo?.marca?.nombre || '-'}
                </span>
            </td>

            {/* Acciones */}
            <td className="items-start px-2 py-4 text-center">
                <div className="flex items-center justify-center gap-1">
                    {/* Botón expandir/contraer combo */}
                    {detalle.producto && (detalle.producto as any).es_combo && (
                        <button
                            type="button"
                            onClick={() =>
                                setExpandedCombos((prev) => ({
                                    ...prev,
                                    [index]: !prev[index],
                                }))
                            }
                            className="rounded-lg p-1.5 text-purple-600 transition-colors hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30"
                            title={expandedCombos[index] ? 'Ocultar componentes' : 'Mostrar componentes'}
                        >
                            <svg
                                className={`h-5 w-5 transition-transform ${expandedCombos[index] ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </button>
                    )}

                    {/* Botón modal cascada para compras */}
                    {tipo === 'compra' && tieneDiferencia && (
                        <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => onAbrirModalCascada(index, detalle)}
                            className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                            title="Editar cascada de precios"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </button>
                    )}

                    {/* Botón eliminar */}
                    <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => onRemoveDetail(index)}
                        className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
                        title="Eliminar producto"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );

    // Si es combo expandido, incluir las filas del combo
    if (esCombo && expandedCombos[index]) {
        return (
            <Fragment key={`combo-${index}`}>
                {content}
                <ComboExpandedRows
                    detalle={detalle}
                    index={index}
                    tipo={tipo}
                    readOnly={readOnly}
                    comboItemsMap={comboItemsMap}
                    setComboItemsMap={setComboItemsMap}
                    onComboItemsChange={onComboItemsChange}
                />
            </Fragment>
        );
    }

    return content;
}
