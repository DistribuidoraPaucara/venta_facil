import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { PreciosFilterOptions } from '@/domain/entities/reportes';

const ALL_VALUE = 'all';

interface FilterState {
  fecha_desde: string;
  fecha_hasta: string;
  tipo_precio_id: string;
  usuario: string;
  motivo: string;
  variacion: string;
  q: string;
}

const VACIO: FilterState = {
  fecha_desde: '',
  fecha_hasta: '',
  tipo_precio_id: ALL_VALUE,
  usuario: ALL_VALUE,
  motivo: ALL_VALUE,
  variacion: ALL_VALUE,
  q: '',
};

/**
 * Hook para manejar filtros del reporte de actualizaciones de precios
 * @param initialFilters - Filtros iniciales desde el servidor
 * @param onNavigate - Callback opcional cuando se navega (para testing)
 * @returns Estado y manejadores de filtros
 */
export function usePreciosFilters(
  initialFilters: PreciosFilterOptions = {},
  onNavigate?: (params: Record<string, string>) => void
) {
  const [formData, setFormData] = useState<FilterState>({
    fecha_desde: initialFilters.fecha_desde || '',
    fecha_hasta: initialFilters.fecha_hasta || '',
    tipo_precio_id: initialFilters.tipo_precio_id?.toString() || ALL_VALUE,
    usuario: initialFilters.usuario || ALL_VALUE,
    motivo: initialFilters.motivo || ALL_VALUE,
    variacion: initialFilters.variacion || ALL_VALUE,
    q: initialFilters.q || '',
  });

  /**
   * Parámetros limpios: sin valores "all" ni vacíos
   */
  const getExportParams = (datos: FilterState = formData): Record<string, string> =>
    Object.fromEntries(
      Object.entries(datos).filter(([, v]) => v !== '' && v !== ALL_VALUE)
    );

  const navegar = (params: Record<string, string>) => {
    if (onNavigate) {
      onNavigate(params);
    } else {
      router.get('/reportes/precios', params, { preserveState: true, preserveScroll: true });
    }
  };

  /**
   * Maneja el filtrado de datos
   */
  const handleFilter = () => navegar(getExportParams());

  /**
   * Limpia todos los filtros
   */
  const clearFilters = () => {
    setFormData(VACIO);
    navegar({});
  };

  /**
   * Actualiza un campo individual del formulario
   */
  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Actualiza múltiples campos a la vez
   */
  const updateFields = (updates: Partial<FilterState>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return {
    formData,
    setFormData,
    handleFilter,
    clearFilters,
    updateField,
    updateFields,
    getExportParams,
    ALL_VALUE,
  };
}
