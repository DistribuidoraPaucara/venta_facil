import { Label } from '@/presentation/components/ui/label';
import { Input } from '@/presentation/components/ui/input';
import { Button } from '@/presentation/components/ui/button';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import SearchSelect from '@/presentation/components/ui/search-select';
import { useState, useEffect } from 'react';
import type { ConversionUnidad } from '@/domain/entities/productos';
import axios from 'axios';

interface Option { value: number | string; label: string; description?: string }

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

export default function Step3Conversiones({
  data,
  unidadesOptions,
  unidadBase,
  setData,
  errors = {}
}: Step3Props) {
  const [formConversion, setFormConversion] = useState<FormConversion>(initialFormConversion);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [conversionesComunes, setConversionesComunes] = useState<any[]>([]);
  const [loadingConversiones, setLoadingConversiones] = useState(false);

  const conversiones = data.conversiones || [];

  // Auto-asignar la unidad base cuando cambia
  useEffect(() => {
    if (unidadBase?.id && !editingIndex) {
      setFormConversion(prev => ({
        ...prev,
        unidad_base_id: String(unidadBase.id)
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
          }
        });

        if (response.data.success) {
          setConversionesComunes(response.data.data);
          console.log('✅ Conversiones comunes cargadas:', response.data.data);
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
    const isDuplicate = editingIndex === null && conversiones.some((c: any) =>
      c.unidad_base_id === Number(unidadBase?.id) &&
      c.unidad_destino_id === Number(formConversion.unidad_destino_id)
    );

    if (isDuplicate) {
      setValidationError('Esta conversión ya existe');
      return;
    }

    // Validar que solo haya una conversión principal
    const otherPrincipals = conversiones.filter((c: any, i: number) =>
      c.es_conversion_principal && i !== editingIndex
    );

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
        updatedConversiones = updatedConversiones.map(c => ({
          ...c,
          es_conversion_principal: false
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
    setFormConversion(prev => ({
      ...prev,
      es_conversion_principal: checked
    }));
  };

  const getUnitLabel = (unitId: number | string) => {
    const unit = unidadesOptions.find(u => u.value === unitId);
    return unit ? `${unit.label} (${unit.description})` : `ID: ${unitId}`;
  };

  if (!data.es_fraccionado) {
    return (
      <div className="space-y-4 p-6 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Gestionar Conversiones de Unidades</h3>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Unidad Base (Almacenamiento):</strong> {unidadBase ? `${unidadBase.nombre} (${unidadBase.codigo})` : 'No definida'}
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
          Ejemplo: Si compras en CAJAS pero vendes en TABLETAS, define: 1 CAJA = 100 TABLETAS
        </p>
      </div>

      {/* Formulario de Conversión */}
      <div className="space-y-4 p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg">
        <h4 className="font-semibold">
          {editingIndex !== null ? '✏️ Editar Conversión' : '➕ Nueva Conversión'}
        </h4>

        {validationError && (
          <div className="p-3 bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
            ⚠️ {validationError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
          {/* Unidad Base */}
          <div className="space-y-2">
            <Label>Unidad Base (Almacenamiento)</Label>
            <div className="p-2 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-sm">
              {unidadBase ? `${unidadBase.nombre} (${unidadBase.codigo})` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Auto-asignada del producto</p>
          </div>

          {/* Unidad Destino */}
          <div className="space-y-2">
            <Label>Unidad Destino (Venta) *</Label>
            <SearchSelect
              options={unidadesOptions.filter(
                u => u.value !== unidadBase?.id
              )}
              value={formConversion.unidad_destino_id}
              onChange={(value) => setFormConversion(prev => ({
                ...prev,
                unidad_destino_id: value
              }))}
              placeholder="Ej: TABLETA, PIEZA, METRO..."
            />
          </div>

          {/* Factor Conversión */}
          <div className="space-y-2">
            <Label>Factor de Conversión *</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.000001"
                min="0"
                value={formConversion.factor_conversion || ''}
                onChange={(e) => {
                  console.log('📝 Cambio en factor:', e.target.value);
                  setFormConversion(prev => ({
                    ...prev,
                    factor_conversion: e.target.value
                  }));
                }}
                placeholder="Ej: 100"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {unidadBase?.nombre} → Destino
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cuántas unidades destino hay en 1 unidad base
            </p>

            {/* Conversiones comunes sugeridas */}
            {console.log('🔍 DEBUG - conversionesComunes:', conversionesComunes)}
            {conversionesComunes.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-700 rounded">
                <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">
                  💡 Conversiones comunes ({conversionesComunes.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                    {conversionesComunes.map((conv, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('📌 Click en conversión común:', conv.factor_conversion);
                          setFormConversion(prev => ({
                            ...prev,
                            factor_conversion: String(conv.factor_conversion)
                          }));
                        }}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors border border-blue-300 dark:border-blue-700 cursor-pointer"
                        title={`Usar factor ${conv.factor_conversion}`}
                      >
                        {conv.label}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {loadingConversiones && (
              <div className="mt-3 text-xs text-muted-foreground italic">
                Cargando conversiones comunes...
              </div>
            )}
          </div>

          {/* Conversión Principal */}
          <div className="space-y-2 flex items-end pb-2">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-700 flex-1">
              <Checkbox
                id="es_principal"
                checked={formConversion.es_conversion_principal}
                onCheckedChange={handlePrincipalChange}
              />
              <Label htmlFor="es_principal" className="font-medium cursor-pointer text-sm">
                Conversión Principal (por defecto)
              </Label>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleAddConversion}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {editingIndex !== null ? '✅ Actualizar' : '➕ Agregar Conversión'}
          </Button>
          {editingIndex !== null && (
            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
            >
              ❌ Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de Conversiones */}
      {conversiones.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold">Conversiones Configuradas ({conversiones.length})</h4>
          <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
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
                    className="border-t border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-4 py-2">{unidadBase?.nombre || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <strong>{conv.factor_conversion}</strong>
                      <span className="text-xs text-muted-foreground ml-1">
                        {unidadBase?.codigo || ''} → {getUnitLabel(conv.unidad_destino_id)}
                      </span>
                    </td>
                    <td className="px-4 py-2">{getUnitLabel(conv.unidad_destino_id)}</td>
                    <td className="px-4 py-2 text-center">
                      {conv.activo ? '✅' : '❌'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {conv.es_conversion_principal ? '⭐' : ''}
                    </td>
                    <td className="px-4 py-2 text-center space-x-1">
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
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-300">
          📝 Aún no hay conversiones configuradas. Agrega al menos una para poder vender en otras unidades.
        </div>
      )}
    </div>
  );
}
