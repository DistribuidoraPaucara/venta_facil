import type { ConversionUnidad } from '@/domain/entities/productos';
import { Button } from '@/presentation/components/ui/button';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import SearchSelect from '@/presentation/components/ui/search-select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/presentation/components/ui/tooltip';
import axios from 'axios';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Option {
    value: number | string;
    label: string;
    description?: string;
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
    factor_conversion: number | string;
    activo: boolean;
    es_conversion_principal: boolean;
}

const initialFormConversion: FormConversion = {
    unidad_base_id: '',
    unidad_destino_id: '',
    factor_conversion: '',
    activo: true,
    es_conversion_principal: false,
};

export default function Step3Conversiones({ data, unidadesOptions, unidadBase, setData, errors = {} }: Step3Props) {
    const [formConversion, setFormConversion] = useState<FormConversion>(initialFormConversion);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [validationError, setValidationError] = useState<string>('');
    const [conversionesComunes, setConversionesComunes] = useState<any[]>([]);
    const [loadingConversiones, setLoadingConversiones] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const factorInputRef = useRef<HTMLInputElement>(null);

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

        const newConversion: ConversionUnidad = {
            unidad_base_id: Number(unidadBase?.id),
            unidad_destino_id: Number(formConversion.unidad_destino_id),
            factor_conversion: Number(formConversion.factor_conversion),
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
        setFormConversion(conversiones[index]);
        setEditingIndex(index);
        setValidationError('');
        setShowForm(true); // 📂 Mostrar formulario automáticamente
    };

    const handleDeleteConversion = (index: number) => {
        const updatedConversiones = conversiones.filter((_: any, i: number) => i !== index);
        setData('conversiones', updatedConversiones);
    };

    const handleCancel = () => {
        setFormConversion(initialFormConversion);
        setEditingIndex(null);
        setValidationError('');
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
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
                >
                    <p className="font-semibold text-blue-900 dark:text-blue-100">➕ Agregar Nueva Conversión</p>
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
                    <h4 className="font-semibold">{editingIndex !== null ? '✏️ Editar Conversión' : '➕ Nueva Conversión'}</h4>

                    {validationError && (
                        <div className="rounded border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300">
                            ⚠️ {validationError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-4">
                        {/* Unidad Base */}
                        <div className="space-y-2">
                            <Label>Unidad Base (Almacenamiento)</Label>
                            <div className="rounded border border-gray-300 bg-gray-100 p-2 text-sm dark:border-slate-600 dark:bg-slate-800">
                                {unidadBase ? `${unidadBase.nombre} (${unidadBase.codigo})` : 'N/A'}
                            </div>
                            <p className="text-xs text-muted-foreground">Auto-asignada del producto</p>
                        </div>

                        {/* Unidad Destino */}
                        <div className="space-y-2">
                            <Label>Unidad Destino (Venta) *</Label>
                            <SearchSelect
                                options={unidadesOptions.filter((u) => u.value !== unidadBase?.id)}
                                value={formConversion.unidad_destino_id}
                                onChange={(value) =>
                                    setFormConversion((prev) => ({
                                        ...prev,
                                        unidad_destino_id: value,
                                    }))
                                }
                                placeholder="Ej: TABLETA, PIEZA, METRO..."
                            />
                        </div>

                        {/* Factor Conversión */}
                        <div className="space-y-2">
                            <Label>Factor de Conversión *</Label>
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
                            <p className="text-xs text-muted-foreground">Cuántas unidades destino hay en 1 unidad base</p>
                            {loadingConversiones && <div className="mt-3 text-xs text-muted-foreground italic">Cargando conversiones comunes...</div>}
                        </div>

                        {/* Conversión Principal */}
                        <div className="flex items-end space-y-2">
                            <div className="flex flex-1 items-center gap-3 rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-2 transition-shadow hover:shadow-md dark:border-blue-700 dark:from-blue-950/30 dark:to-indigo-950/30">
                                <Checkbox
                                    id="es_principal"
                                    checked={formConversion.es_conversion_principal}
                                    onCheckedChange={handlePrincipalChange}
                                    className="h-5 w-5"
                                />
                                <div className="flex flex-1 flex-col gap-1">
                                    <Label htmlFor="es_principal" className="cursor-pointer text-sm font-bold text-blue-900 dark:text-blue-100">
                                        ⭐ Usar como conversión predeterminada
                                    </Label>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">Se aplicará automáticamente en operaciones de venta</p>
                                </div>
                            </div>
                        </div>
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
                                            <strong>{conv.factor_conversion}</strong>
                                            <span className="ml-1 text-xs text-muted-foreground">
                                                {unidadBase?.codigo || ''} → {getUnitLabel(conv.unidad_destino_id)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">{getUnitLabel(conv.unidad_destino_id)}</td>
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
