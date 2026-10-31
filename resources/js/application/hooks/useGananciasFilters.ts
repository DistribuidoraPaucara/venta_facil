import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { GananciasFilterOptions, OrdenGanancias } from '@/domain/entities/reportes';

const ALL_VALUE = 'all';

interface FilterState {
  fecha_desde: string;
  fecha_hasta: string;
  tipo_precio_id: string;
  costo: string;
  q: string;
  orden: string;
  direccion: string;
}

/**
 * Hook para manejar filtros de reportes de ganancias
 * @param initialFilters - Filtros iniciales desde el servidor
 * @param onNavigate - Callback opcional cuando se navega (para testing)
 * @returns Estado y manejadores de filtros
 */
export function useGananciasFilters(
  initialFilters: GananciasFilterOptions = {},
  onNavigate?: (params: Record<string, string>) => void
) {
  // Establecer fechas por defecto: del 1° del mes actual hasta hoy
  const hoy = new Date();
  const primerDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<FilterState>({
    fecha_desde: initialFilters.fecha_desde || formatDate(primerDiaDelMes),
    fecha_hasta: initialFilters.fecha_hasta || formatDate(hoy),
    tipo_precio_id: initialFilters.tipo_precio_id?.toString() || ALL_VALUE,
    costo: initialFilters.costo || ALL_VALUE,
    q: initialFilters.q || '',
    orden: initialFilters.orden || 'ganancia',
    direccion: initialFilters.direccion || 'desc',
  });

  /**
   * Parámetros limpios: sin valores "all" ni vacíos
   */
  const getParams = (datos: FilterState = formData): Record<string, string> =>
    Object.fromEntries(
      Object.entries(datos).filter(([, v]) => v !== '' && v !== ALL_VALUE)
    );

  const navegar = (params: Record<string, string>) => {
    if (onNavigate) {
      onNavigate(params);
    } else {
      router.get('/reportes/ganancias', params, { preserveState: true, preserveScroll: true });
    }
  };

  /**
   * Maneja el filtrado de datos
   */
  const handleFilter = () => navegar(getParams());

  /**
   * Limpia los filtros y vuelve al mes actual (el periodo por defecto del servidor)
   */
  const clearFilters = () => {
    setFormData({
      fecha_desde: formatDate(primerDiaDelMes),
      fecha_hasta: formatDate(hoy),
      tipo_precio_id: ALL_VALUE,
      costo: ALL_VALUE,
      q: '',
      orden: 'ganancia',
      direccion: 'desc',
    });
    navegar({});
  };

  /**
   * Ordena por una columna: el primer clic usa el sentido más útil (desc en números, asc en producto), el siguiente lo invierte
   */
  const ordenar = (columna: OrdenGanancias) => {
    const inicial = columna === 'producto' ? 'asc' : 'desc';
    const direccion = formData.orden === columna ? (formData.direccion === 'asc' ? 'desc' : 'asc') : inicial;
    const nuevo = { ...formData, orden: columna, direccion };
    setFormData(nuevo);
    navegar(getParams(nuevo));
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
    getParams,
    ordenar,
    ALL_VALUE,
  };
}
