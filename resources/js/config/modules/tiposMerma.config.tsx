// Configuration: Tipos de Merma module configuration
import type { ModuleConfig } from '@/domain/entities/generic';
import type { TipoMerma, TipoMermaFormData } from '@/domain/entities/tipo-merma';
import { MERMA_COLOR_OPTIONS, renderEtiquetaMerma } from '@/config/modules/mermaColores';

export const tiposMermaConfig: ModuleConfig<TipoMerma, TipoMermaFormData> = {
  // Module identification
  moduleName: 'tipos-merma',
  singularName: 'tipo de merma',
  pluralName: 'tipos de merma',

  // Display configuration
  displayName: 'Tipos de Merma',
  description: 'Gestiona los motivos por los que un producto sale del inventario sin venderse',

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
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'requiere_aprobacion', label: 'Requiere aprobación', type: 'boolean' },
    { key: 'activo', label: 'Estado', type: 'boolean' },
  ],

  // Form configuration
  formFields: [
    {
      key: 'clave',
      label: 'Clave',
      type: 'text',
      required: true,
      placeholder: 'Ej: CONSUMO_INTERNO',
      description: 'Solo letras, números y guion bajo. No se puede cambiar si ya hay mermas con este tipo.',
      validation: { maxLength: 50, pattern: '^[A-Za-z0-9_]+$' }
    },
    {
      key: 'label',
      label: 'Nombre visible',
      type: 'text',
      required: true,
      placeholder: 'Ej: Consumo interno',
      validation: { maxLength: 100 }
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      placeholder: 'Ej: Productos usados por el propio negocio',
      validation: { maxLength: 255 }
    },
    {
      key: 'color',
      label: 'Color',
      type: 'select',
      placeholder: 'Seleccione un color',
      options: MERMA_COLOR_OPTIONS,
    },
    {
      key: 'requiere_aprobacion',
      label: 'Requiere aprobación',
      type: 'boolean',
      description: 'Si está marcado, la merma queda pendiente hasta que alguien la apruebe',
    },
    {
      key: 'activo',
      label: 'Tipo activo',
      type: 'boolean'
    }
  ],

  // Search configuration
  searchableFields: ['clave', 'label', 'descripcion'],
  searchPlaceholder: 'Buscar tipos de merma...',

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
    defaultSort: { field: 'label', direction: 'asc' },
    layout: 'inline'
  },
};
