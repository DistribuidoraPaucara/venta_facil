// Configuration: Estados de Merma module configuration
import type { ModuleConfig } from '@/domain/entities/generic';
import type { EstadoMerma, EstadoMermaFormData } from '@/domain/entities/estado-merma';
import { MERMA_COLOR_OPTIONS, renderEtiquetaMerma } from '@/config/modules/mermaColores';

export const estadosMermaConfig: ModuleConfig<EstadoMerma, EstadoMermaFormData> = {
  // Module identification
  moduleName: 'estados-merma',
  singularName: 'estado de merma',
  pluralName: 'estados de merma',

  // Display configuration
  displayName: 'Estados de Merma',
  description: 'Gestiona los estados del flujo de aprobación de mermas. PENDIENTE, APROBADO y RECHAZADO son del sistema: se puede cambiar su nombre y color, pero no su clave.',

  // Table configuration
  tableColumns: [
    { key: 'id', label: 'ID', type: 'number' },
    { key: 'clave', label: 'Clave', type: 'text' },
    {
      key: 'label',
      label: 'Nombre',
      type: 'custom',
      render: (value, entity) => renderEtiquetaMerma(value, entity.color),
    },
    { key: 'activo', label: 'Estado', type: 'boolean' },
  ],

  // Form configuration
  formFields: [
    {
      key: 'clave',
      label: 'Clave',
      type: 'text',
      required: true,
      placeholder: 'Ej: EN_REVISION',
      description: 'Solo letras, números y guion bajo. Las claves del sistema no se pueden cambiar.',
      validation: { maxLength: 50, pattern: '^[A-Za-z0-9_]+$' }
    },
    {
      key: 'label',
      label: 'Nombre visible',
      type: 'text',
      required: true,
      placeholder: 'Ej: En revisión',
      validation: { maxLength: 100 }
    },
    {
      key: 'color',
      label: 'Color',
      type: 'select',
      placeholder: 'Seleccione un color',
      options: MERMA_COLOR_OPTIONS,
    },
    {
      key: 'activo',
      label: 'Estado activo',
      type: 'boolean'
    }
  ],

  // Search configuration
  searchableFields: ['clave', 'label'],
  searchPlaceholder: 'Buscar estados de merma...',

  // Modern Index filters configuration
  indexFilters: {
    filters: [
      {
        key: 'activo',
        label: 'Estado',
        type: 'boolean',
        placeholder: 'Todos los estados',
        width: 'sm'
      }
    ],
    sortOptions: [
      { value: 'id', label: 'ID' },
      { value: 'clave', label: 'Clave' },
      { value: 'label', label: 'Nombre' },
      { value: 'created_at', label: 'Fecha creación' }
    ],
    defaultSort: { field: 'id', direction: 'asc' },
    layout: 'inline'
  },
};
