import type { ConversionUnidad } from '@/domain/entities/productos';
import { Button } from '@/presentation/components/ui/button';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Input } from '@/presentation/components/ui/input';
import InputSearchSelect from '@/presentation/components/ui/input-search-select';
import { Label } from '@/presentation/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/presentation/components/ui/tooltip';
import axios from 'axios';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Option {
    value: number | string;
    label: string;
    description?: string;
    meta?: Record<string, any>;
}

export interface Step3Props {
    data: {
        nombre?: string;
        unidad_medida_id?: number | string;
        es_fraccionado?: boolean;
        conversiones?: ConversionUnidad[];
    };
    unidadesOptions: Option[];
    unidadBase?: { id: number | string; codigo: string; nombre: string };
    setData: (key: string, value: unknown) => void;
    errors?: Record<string, string>;
}

interface FormConversion {
    unidad_base_id: number | string;
    unidad_destino_id: number | string;
    producto_destino_id?: number | string; // ✨ NUEVO: Producto destino para fraccionamientos
    factor_conversion: number | string;
    nombre_cuando_se_vende_como?: string;
    activo: boolean;
    es_conversion_principal: boolean;
}

const initialFormConversion: FormConversion = {
    unidad_base_id: '',
    unidad_destino_id: '',
    producto_destino_id: '',
    factor_conversion: '',
    nombre_cuando_se_vende_como: '',
    activo: true,
    es_conversion_principal: false,
};

// ✨ NUEVO: Función para mostrar solo decimales necesarios
const formatearNumero = (num: number | string, maxDecimals: number = 2): string => {
    const numVal = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numVal)) return String(num);
    if (Number.isInteger(numVal)) return String(Math.floor(numVal));
    const formatted = numVal.toFixed(maxDecimals);
    return parseFloat(formatted).toString();
};

export default function Step3Conversiones({ data, unidadesOptions, unidadBase, setData, errors = {} }: Step3Props) {
    const [formConversion, setFormConversion] = useState<FormConversion>(initialFormConversion);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [validationError, setValidationError] = useState<string>('');
    const [conversionesComunes, setConversionesComunes] = useState<any[]>([]);
    const [loadingConversiones, setLoadingConversiones] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [productosDestino, setProductosDestino] = useState<Option[]>([]);
    const factorInputRef = useRef<HTMLInputElement>(null);

    const [buscandoProductos, setBuscandoProductos] = useState(false);
    // Evita que una respuesta lenta de una búsqueda anterior pise a la más reciente
    const ultimaBusquedaRef = useRef(0);
    // ✨ NUEVO: Stock de productos destino
    const [stockProductosDestino, setStockProductosDestino] = useState<Record<number, number>>({});

    // Stock de los productos destino que ya están en la tabla de conversiones
    const destinoIdsKey = (data.conversiones || [])
        .map((c: any) => c.producto_destino_id)
        .filter(Boolean)
        .join(',');
    useEffect(() => {
        if (destinoIdsKey) {
            cargarStockProductos(destinoIdsKey.split(',').map(Number));
        }
    }, [destinoIdsKey]);

    // ✨ NUEVO: Cargar stock total de productos
    const cargarStockProductos = async (productIds: number[]) => {
        try {
            const response = await axios.get('/api/productos/stock-total', {
                params: {
                    product_ids: productIds.join(','),
                },
            });
            if (response.data.success && response.data.data) {
                setStockProductosDestino(response.data.data);
            }
        } catch (error) {
            console.error('❌ Error cargando stock de productos:', error);
        }
    };

    const aOpcion = (prod: any): Option => ({
        value: prod.id,
        label: `#${prod.id}${prod.sku ? ` · ${prod.sku}` : ''} - ${prod.nombre}`,
        description: prod.unidad_nombre,
        meta: { unidad_id: prod.unidad_medida_id, nombre: prod.nombre },
    });

    const buscarProductos = async (termino: string): Promise<any[]> => {
        const response = await axios.get('/api/inventario/fraccionamientos/productos/disponibles', {
            params: { search: termino },
        });
        return response.data.success && Array.isArray(response.data.data) ? response.data.data : [];
    };

    // Búsqueda en servidor (sin límite de 50 productos precargados): ID, SKU, nombre o código de barras, sin distinguir mayúsculas
    // useCallback: una referencia estable evita que el debounce del input se reinicie en cada render
    const handleBuscarProductoDestino = useCallback(async (termino: string) => {
        const busquedaId = ++ultimaBusquedaRef.current;
        if (!termino.trim()) {
            setProductosDestino([]);
            return;
        }
        setBuscandoProductos(true);
        try {
            const productos = await buscarProductos(termino.trim());
            if (busquedaId === ultimaBusquedaRef.current) {
                setProductosDestino(productos.map(aOpcion));
            }
        } catch (error) {
            console.error('❌ Error buscando productos destino:', error);
        } finally {
            if (busquedaId === ultimaBusquedaRef.current) {
                setBuscandoProductos(false);
            }
        }
    }, []);

    const conversiones = data.conversiones || [];

    const cargarFactorDirecto = (factor: number) => {
        console.log('🚀 CARGAR FACTOR DIRECTO:', factor);
        const strFactor = String(factor);

        // Actualizar el input directamente
        if (factorInputRef.current) {
            factorInputRef.current.value = strFactor;
        }

        // Actualizar el estado
        setFormConversion((prev) => ({
            ...prev,
            factor_conversion: strFactor,
        }));
    };

    // Auto-asignar la unidad base cuando cambia
    useEffect(() => {
        if (unidadBase?.id && !editingIndex) {
            setFormConversion((prev) => ({
                ...prev,
                unidad_base_id: String(unidadBase.id),
            }));
        }
    }, [unidadBase?.id, editingIndex]);

    // Cargar conversiones comunes cuando se selecciona una unidad destino
    useEffect(() => {
        const cargarConversionesComunes = async () => {
            if (!formConversion.unidad_destino_id || !unidadBase?.id) {
                setConversionesComunes([]);
                return;
            }

            setLoadingConversiones(true);
            try {
                const response = await axios.get('/api/productos/conversiones/comunes', {
                    params: {
                        unidad_base_id: unidadBase.id,
                        unidad_destino_id: formConversion.unidad_destino_id,
                    },
                });

                if (response.data.success) {
                    setConversionesComunes(response.data.data);
                    console.log('✅ Conversiones comunes cargadas:', response.data.data);

                    // 🎯 CARGAR AUTOMÁTICAMENTE LA PRIMERA CONVERSIÓN AL INPUT
                    if (response.data.data && response.data.data.length > 0) {
                        const primerFactor = response.data.data[0].factor_conversion;
                        console.log('⚡ Cargando automáticamente factor:', primerFactor);
                        cargarFactorDirecto(primerFactor);
                    }
                }
            } catch (error) {
                console.error('❌ Error cargando conversiones comunes:', error);
                setConversionesComunes([]);
            } finally {
                setLoadingConversiones(false);
            }
        };

        cargarConversionesComunes();
    }, [formConversion.unidad_destino_id, unidadBase?.id]);

    const handleAddConversion = () => {
        setValidationError('');

        console.log('📋 Debug - Intento de agregar conversión:', {
            unidadBase,
            formConversion,
            unidad_destino_id: formConversion.unidad_destino_id,
            factor_conversion: formConversion.factor_conversion,
        });

        // La unidad base es auto-asignada del producto
        if (!unidadBase?.id) {
            setValidationError('No hay unidad base definida para el producto');
            console.error('❌ Error: No hay unidad base');
            return;
        }
        if (!formConversion.unidad_destino_id) {
            setValidationError('Debe seleccionar una unidad destino');
            return;
        }
        if (!formConversion.factor_conversion || Number(formConversion.factor_conversion) <= 0) {
            setValidationError('El factor de conversión debe ser mayor a 0');
            return;
        }
        if (formConversion.unidad_base_id === formConversion.unidad_destino_id) {
            setValidationError('La unidad base y destino deben ser diferentes');
            return;
        }

        // Validar que no exista un duplicado (mismo unidad_base_id y unidad_destino_id)
        const isDuplicate =
            editingIndex === null &&
            conversiones.some(
                (c: any) => c.unidad_base_id === Number(unidadBase?.id) && c.unidad_destino_id === Number(formConversion.unidad_destino_id),
            );

        if (isDuplicate) {
            setValidationError('Esta conversión ya existe');
            return;
        }

        // Validar que solo haya una conversión principal
        const otherPrincipals = conversiones.filter((c: any, i: number) => c.es_conversion_principal && i !== editingIndex);

        if (formConversion.es_conversion_principal && otherPrincipals.length > 0 && editingIndex === null) {
            setValidationError('Ya existe una conversión principal. Desmarca la actual o edita la existente.');
            return;
        }

        // ✨ NUEVA VALIDACIÓN: Si esta es la PRIMERA conversión, DEBE ser principal
        if (editingIndex === null && conversiones.length === 0 && !formConversion.es_conversion_principal) {
            setValidationError('La primera conversión DEBE marcarse como principal (conversión por defecto)');
            return;
        }

        const newConversion: ConversionUnidad = {
            unidad_base_id: Number(unidadBase?.id),
            unidad_destino_id: Number(formConversion.unidad_destino_id),
            producto_destino_id: formConversion.producto_destino_id ? Number(formConversion.producto_destino_id) : undefined,
            factor_conversion: Number(formConversion.factor_conversion),
            nombre_cuando_se_vende_como: formConversion.nombre_cuando_se_vende_como || undefined,
            activo: formConversion.activo,
            es_conversion_principal: formConversion.es_conversion_principal,
        };

        console.log('✅ Conversión creada:', newConversion);

        let updatedConversiones = [...conversiones];

        if (editingIndex !== null) {
            // Editar conversión existente
            updatedConversiones[editingIndex] = newConversion;
            setEditingIndex(null);
            console.log('✏️ Conversión actualizada en índice:', editingIndex);
        } else {
            // Agregar nueva conversión
            // Si esta es la conversión principal, desactivar otras
            if (newConversion.es_conversion_principal) {
                updatedConversiones = updatedConversiones.map((c) => ({
                    ...c,
                    es_conversion_principal: false,
                }));
            }
            updatedConversiones.push(newConversion);
            console.log('➕ Nueva conversión agregada. Total:', updatedConversiones.length);
        }

        setData('conversiones', updatedConversiones);
        setFormConversion(initialFormConversion);
        console.log('🔄 Formulario reseteado');
    };

    const handleEditConversion = (index: number) => {
        const conversion = conversiones[index];
        setFormConversion(conversion);
        setEditingIndex(index);
        setValidationError('');
        setShowForm(true); // 📂 Mostrar formulario automáticamente

        // ✨ NUEVO: Cargar el producto destino en el dropdown si existe
        if (conversion.producto_destino_id) {
            const destinoId = Number(conversion.producto_destino_id);
            buscarProductos(String(destinoId))
                .then((productos) => {
                    const productoDestino = productos.find((p: any) => p.id === destinoId);
                    if (productoDestino) {
                        setProductosDestino([aOpcion(productoDestino)]);
                    }
                })
                .catch((error) => console.error('❌ Error cargando producto destino:', error));
        }
    };

    const handleDeleteConversion = (index: number) => {
        const updatedConversiones = conversiones.filter((_: any, i: number) => i !== index);
        setData('conversiones', updatedConversiones);
    };

    const handleCancel = () => {
        setFormConversion(initialFormConversion);
        setEditingIndex(null);
        setValidationError('');
        setProductosDestino([]); // ✨ NUEVO: Limpiar el dropdown de productos
    };

    const handlePrincipalChange = (checked: boolean) => {
        setFormConversion((prev) => ({
            ...prev,
            es_conversion_principal: checked,
        }));
    };

    const getUnitLabel = (unitId: number | string) => {
        const unit = unidadesOptions.find((u) => u.value === unitId);
        return unit ? `${unit.label} (${unit.description})` : `ID: ${unitId}`;
    };

    // ✨ NUEVA VALIDACIÓN: Verificar que unidad_base_id coincida con data.unidad_medida_id
    const unitMismatch = conversiones.length > 0 && conversiones.some((c: any) => c.unidad_base_id !== Number(data.unidad_medida_id));

    if (!data.es_fraccionado) {
        return (
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <p>
                        <strong>Nota:</strong> Activa "Permitir Conversiones de Unidades" en el Paso 1 para configurar conversiones.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ✨ ALERTA: Mismatch entre unidad_base y unidad_medida_id */}
            {unitMismatch && (
                <div className="rounded border-2 border-red-400 bg-red-50 p-4 dark:border-red-600 dark:bg-red-950/30">
                    <div className="flex gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                            <p className="font-bold text-red-900 dark:text-red-200">Error de configuración: Unidad base no coincide</p>
                            <p className="mt-2 text-sm text-red-800 dark:text-red-300">
                                Las conversiones actuales usan una unidad base diferente a la del producto.
                                <strong className="mt-1 block">
                                    Acción: Cambiar unidad_medida_id del producto a {unidadBase?.nombre}({unidadBase?.codigo}), o eliminar todas las
                                    conversiones y crear nuevas.
                                </strong>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ✨ WARNING: Sin conversiones cuando es_fraccionado = true */}
            {data.es_fraccionado && conversiones.length === 0 && (
                <div className="rounded border-2 border-yellow-400 bg-yellow-50 p-4 dark:border-yellow-600 dark:bg-yellow-950/30">
                    <div className="flex gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                            <p className="font-bold text-yellow-900 dark:text-yellow-200">Producto fraccionado sin conversiones</p>
                            <p className="mt-2 text-sm text-yellow-800 dark:text-yellow-300">
                                Este producto está marcado como fraccionado, pero no tiene conversiones de unidades configuradas. Debes agregar al
                                menos una conversión para poder venderlo en diferentes unidades.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ✨ WARNING: Sin conversión principal */}
            {data.es_fraccionado && conversiones.length > 0 && !conversiones.some((c: any) => c.es_conversion_principal) && (
                <div className="rounded border-2 border-orange-400 bg-orange-50 p-4 dark:border-orange-600 dark:bg-orange-950/30">
                    <div className="flex gap-3">
                        <div className="text-2xl">⚡</div>
                        <div>
                            <p className="font-bold text-orange-900 dark:text-orange-200">Sin conversión principal definida</p>
                            <p className="mt-2 text-sm text-orange-800 dark:text-orange-300">
                                Debe haber exactamente una conversión marcada como principal. Edita una de las conversiones y márcala como
                                predeterminada.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Sección de Información */}
            {/* Título con ayuda emergente */}
            <div className="mb-4 flex items-center gap-2">
                <h3 className="text-lg font-semibold">Gestionar Conversiones de Unidades</h3>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800">
                            <span className="text-xs font-bold">?</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-2">
                            <p className="font-semibold">Unidad Base (Almacenamiento)</p>
                            <p>{unidadBase ? `${unidadBase.nombre} (${unidadBase.codigo})` : 'No definida'}</p>
                            <hr className="border-gray-400" />
                            <p className="text-xs italic">💡 Ejemplo: Si compras en CAJAS pero vendes en TABLETAS, define: 1 CAJA = 100 TABLETAS</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
                {/* Toggle Formulario - Encabezado clickeable */}
                <div
                    onClick={() => setShowForm(!showForm)}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-xs transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
                >
                    <p className="text-blue-900 dark:text-blue-100">➕ Agregar Nueva Conversión</p>
                    {showForm ? (
                        <ChevronUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                </div>
            </div>

            {/* Formulario de Conversión (Colapsable) */}
            {showForm && (
                <div className="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4 animate-in fade-in dark:border-slate-700 dark:bg-slate-900">
                    <h4 className="font-semibold">{editingIndex !== null ? '✏️ Editar Fraccionamiento' : '➕ Nuevo Fraccionamiento'}</h4>

                    {validationError && (
                        <div className="rounded border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300">
                            ⚠️ {validationError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-4">
                        {/* Unidad Base */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1">
                                <Label>Unidad Base (Almacenamiento)</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Auto-asignada del producto</TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="rounded border border-gray-300 bg-gray-100 p-2 text-sm dark:border-slate-600 dark:bg-slate-800">
                                {unidadBase ? `${unidadBase.nombre} (${unidadBase.codigo})` : 'N/A'}
                            </div>
                        </div>

                        {/* ✨ REFACTORIZADO: Búsqueda directa de Producto Destino */}
                        {/* El producto trae su unidad y nombre automáticamente */}
                        <div>
                            <div className="flex items-center gap-1">
                                <Label>Producto Destino (Fraccionamiento - Opcional)</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        Selecciona el producto en el que se fracciona este. Se auto-llenan: unidad destino y nombre.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <InputSearchSelect
                                options={productosDestino}
                                value={formConversion.producto_destino_id || ''}
                                onChange={(value) => {
                                    const productoSeleccionado = productosDestino.find((p) => p.value === value);
                                    if (productoSeleccionado?.meta) {
                                        setFormConversion((prev) => ({
                                            ...prev,
                                            producto_destino_id: value,
                                            unidad_destino_id: productoSeleccionado.meta?.unidad_id,
                                            nombre_cuando_se_vende_como: productoSeleccionado.meta?.nombre,
                                        }));
                                    }
                                }}
                                onSearch={handleBuscarProductoDestino}
                                placeholder="Busca por ID, SKU, código o nombre (Ej: Coca 2Lts)..."
                                loading={buscandoProductos}
                                emptyText="Sin coincidencias. Intenta otro término."
                            />
                        </div>

                        {/* Factor Conversión */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1">
                                <Label>Factor de Conversión *</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        Cuántas unidades destino hay en 1 unidad base (Ej: 100 significa 1 paquete = 100 unidades)
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    ref={factorInputRef}
                                    type="text"
                                    inputMode="decimal"
                                    value={String(formConversion.factor_conversion)}
                                    onChange={(e) => {
                                        console.log('📝 Cambio en factor:', e.target.value);
                                        setFormConversion((prev) => ({
                                            ...prev,
                                            factor_conversion: e.target.value,
                                        }));
                                    }}
                                    placeholder="Ej: 100"
                                    className="flex-1 text-base font-bold"
                                />
                            </div>
                            {loadingConversiones && <div className="mt-3 text-xs text-muted-foreground italic">Cargando conversiones comunes...</div>}
                        </div>

                        {/* ✨ NUEVO (2026-09-06): Nombre cuando se vende en esta unidad */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1">
                                <Label>Nombre cuando se vende en esta unidad (Opcional)</Label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        Si dejas vacío, se genera automáticamente. Ej: Si el producto es "Paquete de Coca Cola 6x1", se mostrará como
                                        "Coca Cola 2Lts" cuando se venda por unidad.
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Input
                                type="text"
                                value={formConversion.nombre_cuando_se_vende_como || ''}
                                onChange={(e) => {
                                    setFormConversion((prev) => ({
                                        ...prev,
                                        nombre_cuando_se_vende_como: e.target.value,
                                    }));
                                }}
                                placeholder="Ej: Coca Cola 2Lts (para mostrar en venta por unidad)"
                                className="text-base"
                            />
                        </div>

                        {/* Conversión Principal */}
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="es_principal"
                                checked={formConversion.es_conversion_principal}
                                onCheckedChange={handlePrincipalChange}
                                className="h-5 w-5"
                            />
                            <Label htmlFor="es_principal" className="flex-1 cursor-pointer text-sm font-medium">
                                ⭐ Usar como conversión predeterminada
                            </Label>
                        </div>

                        {/* ✨ NUEVO: Control de Activo */}
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="activo"
                                checked={formConversion.activo}
                                onCheckedChange={(checked) =>
                                    setFormConversion((prev) => ({
                                        ...prev,
                                        activo: Boolean(checked),
                                    }))
                                }
                                className="h-5 w-5"
                            />
                            <Label htmlFor="activo" className="flex-1 cursor-pointer text-sm font-medium">
                                ✅ Conversión Activa
                            </Label>
                        </div>

                        {formConversion.producto_destino_id && (
                            <div className="mt-2 flex gap-2 rounded bg-purple-50 p-2 dark:bg-purple-950/30">
                                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                    👶 Producto hijo:{' '}
                                    {productosDestino.find((p) => p.value === formConversion.producto_destino_id)?.label ||
                                        `ID: ${formConversion.producto_destino_id}`}
                                </span>
                            </div>
                        )}
                        {formConversion.unidad_destino_id && (
                            <div className="mt-2 flex gap-2 rounded bg-blue-50 p-2 dark:bg-blue-950/30">
                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                    ✓ Unidad destino: {unidadesOptions.find((u) => u.value === formConversion.unidad_destino_id)?.label}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button type="button" onClick={handleAddConversion} className="bg-blue-600 text-white hover:bg-blue-700">
                            {editingIndex !== null ? '✅ Actualizar' : '➕ Agregar Conversión'}
                        </Button>
                        {editingIndex !== null && (
                            <Button type="button" onClick={handleCancel} variant="outline">
                                ❌ Cancelar
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Tabla de Conversiones */}
            {conversiones.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-semibold">Conversiones Configuradas ({conversiones.length})</h4>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 dark:bg-slate-800">
                                <tr>
                                    <th className="px-4 py-2 text-left">Unidad Base</th>
                                    <th className="px-4 py-2 text-left">Factor</th>
                                    <th className="px-4 py-2 text-left">Unidad Destino</th>
                                    <th className="px-4 py-2 text-left">👶 Producto Hijo</th>
                                    {/* <th className="px-4 py-2 text-left">📊 Stock Hijo</th> */}
                                    <th className="px-4 py-2 text-left">📦 Nombre en Venta</th>
                                    <th className="px-4 py-2 text-center">Activo</th>
                                    <th className="px-4 py-2 text-center">Principal</th>
                                    <th className="px-4 py-2 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conversiones.map((conv: any, index: number) => (
                                    <tr
                                        key={index}
                                        className="border-t border-gray-200 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
                                    >
                                        <td className="px-4 py-2">{unidadBase?.nombre || 'N/A'}</td>
                                        <td className="px-4 py-2">
                                            <span className="ml-1 text-xs text-muted-foreground">{unidadBase?.codigo || ''} →</span>
                                            <strong>
                                                {formatearNumero(conv.factor_conversion)} {getUnitLabel(conv.unidad_destino_id)}
                                            </strong>
                                        </td>
                                        <td className="px-4 py-2">{getUnitLabel(conv.unidad_destino_id)}</td>
                                        {/* ✨ NUEVO: Mostrar producto hijo relacionado */}
                                        <td className="px-4 py-2 text-xs">
                                            {conv.producto_destino ? (
                                                <span className="inline-block rounded bg-purple-100 px-2 py-1 font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                    {conv.producto_destino.sku} - {conv.producto_destino.nombre}
                                                </span>
                                            ) : conv.producto_destino_id ? (
                                                <span className="inline-block rounded bg-gray-100 px-2 py-1 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                    ID: {conv.producto_destino_id}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground italic">-</span>
                                            )}
                                        </td>
                                        {/* ✨ NUEVO: Mostrar stock actual del producto hijo */}
                                        {/* <td className="px-4 py-2 text-xs text-center">
                                            {conv.producto_destino_id ? (
                                                <span className={`inline-block rounded px-2 py-1 font-semibold ${
                                                    (stockProductosDestino[conv.producto_destino_id] ?? 0) > 0
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                    {formatearNumero(stockProductosDestino[conv.producto_destino_id] ?? 0)}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground italic">-</span>
                                            )}
                                        </td>
                                        {/* ✨ NUEVO (2026-09-06): Mostrar nombre personalizado */}
                                        <td className="px-4 py-2 text-xs">
                                            {conv.nombre_cuando_se_vende_como ? (
                                                <span className="inline-block rounded bg-blue-100 px-2 py-1 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {conv.nombre_cuando_se_vende_como}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground italic">Automático</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-center">{conv.activo ? '✅' : '❌'}</td>
                                        <td className="px-4 py-2 text-center">{conv.es_conversion_principal ? '⭐' : ''}</td>
                                        <td className="space-x-1 px-4 py-2 text-center">
                                            <Button
                                                type="button"
                                                onClick={() => handleEditConversion(index)}
                                                size="sm"
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                ✏️
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => handleDeleteConversion(index)}
                                                size="sm"
                                                variant="outline"
                                                className="text-xs text-red-600 hover:text-red-700"
                                            >
                                                🗑️
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {conversiones.length === 0 && data.es_fraccionado && (
                <div className="rounded border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-300">
                    📝 Aún no hay conversiones configuradas. Agrega al menos una para poder vender en otras unidades.
                </div>
            )}
        </div>
    );
}
