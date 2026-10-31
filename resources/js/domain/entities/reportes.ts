import type { BaseEntity } from './generic';
import type { Id } from './shared';

// =============== GANANCIAS REPORT ===============

/** completo: todas las ventas tienen costo · parcial: algunas sí · sin_costo: ninguna */
export type EstadoCostoGanancia = 'completo' | 'parcial' | 'sin_costo';

export interface Ganancia {
  key: string;
  producto: { id: number; nombre: string; sku: string | null };
  unidad_medida: string | null;
  tipo_precio: { id: number | null; nombre: string; color: string | null };
  cantidad_vendida: number;
  ingresos_totales: number;
  ingresos_con_costo: number;
  ingresos_sin_costo: number;
  costos_totales: number;
  precio_promedio: number;
  costo_promedio: number | null;
  ganancia: number;
  /** Ganancia / ventas con costo × 100 */
  margen: number | null;
  /** Ganancia / costo × 100 */
  markup: number | null;
  estado_costo: EstadoCostoGanancia;
  ultima_venta: string | null;
}

export interface GananciasEstadisticas {
  ingresos_totales: number;
  ingresos_con_costo: number;
  costos_totales: number;
  ganancia_total: number;
  margen: number | null;
  ingresos_sin_costo: number;
  productos_sin_costo: number;
  productos_vendidos: number;
  productos_con_perdida: number;
}

export interface GananciasFilterOptions {
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_precio_id?: number | string;
  costo?: 'con_costo' | 'sin_costo';
  q?: string;
  orden?: OrdenGanancias;
  direccion?: 'asc' | 'desc';
}

export type OrdenGanancias = 'ganancia' | 'margen' | 'cantidad' | 'ingresos' | 'producto';

export interface GananciasPaginatedData {
  data: Ganancia[];
  current_page: number;
  last_page: number;
  per_page: number;
  from: number | null;
  to: number | null;
  total: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}

export interface GananciasPageProps {
  ganancias: GananciasPaginatedData;
  estadisticas: GananciasEstadisticas;
  filtros: GananciasFilterOptions;
  tipos_precio: Array<{
    id: number;
    nombre: string;
    color: string;
  }>;
  error?: string;
}

// =============== REPORT ENUMS & CONSTANTS ===============

export enum EstadoGanancia {
  EXCELENTE = 'excelente',      // >= 30%
  BUENO = 'bueno',               // >= 15% && < 30%
  REGULAR = 'regular',           // >= 5% && < 15%
  BAJO = 'bajo',                 // >= 0% && < 5%
  PERDIDA = 'perdida',           // < 0%
}

export const ESTADO_GANANCIA_CONFIG = {
  [EstadoGanancia.EXCELENTE]: {
    label: 'Excelente',
    icon: '🔥',
    badge: 'bg-green-100 text-green-800',
    textColor: 'text-green-600',
    minPercent: 30,
  },
  [EstadoGanancia.BUENO]: {
    label: 'Bueno',
    icon: '✅',
    badge: 'bg-green-50 text-green-700',
    textColor: 'text-green-500',
    minPercent: 15,
  },
  [EstadoGanancia.REGULAR]: {
    label: 'Regular',
    icon: '⚠️',
    badge: 'bg-yellow-50 text-yellow-700',
    textColor: 'text-yellow-600',
    minPercent: 5,
  },
  [EstadoGanancia.BAJO]: {
    label: 'Bajo',
    icon: '⚡',
    badge: 'bg-orange-50 text-orange-700',
    textColor: 'text-orange-600',
    minPercent: 0,
  },
  [EstadoGanancia.PERDIDA]: {
    label: 'Pérdida',
    icon: '❌',
    badge: 'bg-red-50 text-red-700',
    textColor: 'text-red-600',
    minPercent: -Infinity,
  },
};

// =============== COLOR MAPPING ===============

export const TIPO_PRECIO_COLOR_MAP = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
  red: 'bg-red-100 text-red-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  pink: 'bg-pink-100 text-pink-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  gray: 'bg-gray-100 text-gray-800',
  teal: 'bg-teal-100 text-teal-800',
} as const;

// =============== MOVIMIENTOS REPORT ===============

export interface StockProductoMovimiento {
  producto: {
    id: number;
    nombre: string;
  };
  almacen: {
    id: number;
    nombre: string;
  };
}

export interface MovimientoInventario {
  id: number;
  tipo: string;
  cantidad: number;
  fecha: string;
  motivo?: string;
  numero_referencia?: string;
  observaciones?: string;
  stock_producto: StockProductoMovimiento;
  user?: {
    id: number;
    name: string;
  };
}

export interface MovimientosEstadisticas {
  total_entradas: number;
  total_salidas: number;
  movimientos_por_tipo: Record<string, number>;
}

export interface MovimientosFilterOptions {
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo?: string;
  almacen_id?: number;
  producto_id?: number;
}

export interface MovimientosPaginatedData {
  data: MovimientoInventario[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}

export interface MovimientosPageProps {
  movimientos: MovimientosPaginatedData;
  estadisticas: MovimientosEstadisticas;
  filtros: MovimientosFilterOptions;
  tipos: Record<string, string>;
  almacenes: Array<{
    id: number;
    nombre: string;
  }>;
}

// =============== ROTACION REPORT ===============

export interface RotacionItem {
  producto_id: number;
  total_salidas: number;
  cantidad_vendida: number;
  stock_promedio: number;
  indice_rotacion: number;
  producto: {
    id: number;
    nombre: string;
  };
}

export interface RotacionEstadisticas {
  productos_con_movimiento: number;
  productos_sin_movimiento: number;
  rotacion_promedio: number;
}

export interface RotacionFilterOptions {
  fecha_inicio?: string;
  fecha_fin?: string;
  almacen_id?: string;
  categoria_id?: string;
}

export interface RotacionPaginatedData {
  data: RotacionItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}

export interface RotacionPageProps {
  rotacion: RotacionPaginatedData;
  estadisticas: RotacionEstadisticas;
  filtros: RotacionFilterOptions;
  almacenes: Array<{
    id: number;
    nombre: string;
  }>;
  categorias: Array<{
    id: number;
    nombre: string;
  }>;
}

// =============== STOCK ACTUAL REPORT ===============

export interface StockItem {
  id: number;
  cantidad: number;
  cantidad_disponible: number;
  cantidad_reservada: number;
  producto: {
    id: number;
    nombre: string;
    sku: string;
    stock_minimo: number;
    stock_maximo: number;
    categoria?: {
      nombre: string;
    };
  };
  almacen: {
    id: number;
    nombre: string;
  };
}

export interface StockEstadisticas {
  total_productos: number;
  total_stock: number;
  productos_stock_bajo: number;
  productos_stock_alto: number;
  valor_total_inventario: number;
}

export interface StockFilterOptions {
  almacen_id?: number;
  categoria_id?: number;
  stock_bajo?: boolean;
  stock_alto?: boolean;
  busqueda?: string;
}

export interface StockPaginatedData {
  data: StockItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}

export interface StockPageProps {
  stock: StockPaginatedData;
  estadisticas: StockEstadisticas;
  filtros: StockFilterOptions;
  almacenes: Array<{
    id: number;
    nombre: string;
  }>;
  categorias: Array<{
    id: number;
    nombre: string;
  }>;
}

// =============== VENCIMIENTOS REPORT ===============

export interface ProductoVencimiento {
  id: number;
  cantidad: number;
  fecha_vencimiento: string;
  producto: {
    id: number;
    nombre: string;
    categoria?: {
      id: number;
      nombre: string;
    };
  };
  almacen: {
    id: number;
    nombre: string;
  };
}

export interface VencimientosEstadisticas {
  productos_vencidos: number;
  productos_proximos_vencer: number;
  valor_productos_vencidos: number;
}

export interface VencimientosFilterOptions {
  almacen_id?: string;
  dias_anticipacion?: number;
  solo_vencidos?: boolean;
}

export interface VencimientosPaginatedData {
  data: ProductoVencimiento[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}

export interface VencimientosPageProps {
  productos: VencimientosPaginatedData;
  estadisticas: VencimientosEstadisticas;
  filtros: VencimientosFilterOptions;
  almacenes: Array<{
    id: number;
    nombre: string;
  }>;
}

// =============== INVENTARIO ENUMS & CONSTANTS ===============

export enum EstadoMovimiento {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
}

export enum EstadoRotacion {
  ALTA = 'alta',
  MEDIA = 'media',
  BAJA = 'baja',
}

export enum EstadoStock {
  BAJO = 'bajo',
  NORMAL = 'normal',
  ALTO = 'alto',
}

export enum EstadoVencimiento {
  VENCIDO = 'VENCIDO',
  PROXIMO_A_VENCER = 'PRÓXIMO A VENCER',
  VIGENTE = 'VIGENTE',
}

export const TIPO_MOVIMIENTO_CONFIG = {
  entrada: {
    color: 'default',
    icon: 'TrendingUp',
  },
  salida: {
    color: 'destructive',
    icon: 'TrendingDown',
  },
} as const;

export const ESTADO_ROTACION_CONFIG = {
  [EstadoRotacion.ALTA]: {
    badge: 'bg-green-100 text-green-800',
    label: 'Alta',
  },
  [EstadoRotacion.MEDIA]: {
    badge: 'bg-yellow-100 text-yellow-800',
    label: 'Media',
  },
  [EstadoRotacion.BAJA]: {
    badge: 'bg-red-100 text-red-800',
    label: 'Baja',
  },
} as const;

export const ESTADO_STOCK_CONFIG = {
  [EstadoStock.BAJO]: {
    color: 'destructive',
    icon: 'TrendingDown',
    label: 'Stock Bajo',
  },
  [EstadoStock.NORMAL]: {
    color: 'secondary',
    icon: 'Package2',
    label: 'Normal',
  },
  [EstadoStock.ALTO]: {
    color: 'outline',
    icon: 'TrendingUp',
    label: 'Stock Alto',
  },
} as const;

export const ESTADO_VENCIMIENTO_CONFIG = {
  [EstadoVencimiento.VENCIDO]: {
    className: 'bg-red-100 text-red-800',
    color: 'destructive',
    label: 'VENCIDO',
  },
  [EstadoVencimiento.PROXIMO_A_VENCER]: {
    className: 'bg-yellow-100 text-yellow-800',
    color: 'default',
    label: 'PRÓXIMO A VENCER',
  },
  [EstadoVencimiento.VIGENTE]: {
    className: 'bg-green-100 text-green-800',
    color: 'secondary',
    label: 'VIGENTE',
  },
} as const;

// =============== PRECIOS REPORT (actualizaciones desde historial_precios) ===============

export interface CambioPrecioItem {
  id: number;
  fecha_cambio: string | null;
  producto: { id: number; nombre: string; sku: string | null } | null;
  tipo_precio: { id: number; nombre: string; color: string | null } | null;
  unidad_medida: string | null;
  precio_activo: boolean;
  valor_anterior: number;
  valor_nuevo: number;
  variacion: number;
  porcentaje_cambio: number | null;
  motivo: string | null;
  usuario: string | null;
}

export interface PreciosEstadisticas {
  total_cambios: number;
  productos_afectados: number;
  subidas: number;
  bajadas: number;
  variacion_promedio: number | null;
  por_usuario: Array<{ usuario: string; cambios: number }>;
}

export interface PreciosFilterOptions {
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_precio_id?: number | string;
  usuario?: string;
  motivo?: string;
  variacion?: 'sube' | 'baja';
  q?: string;
}

export interface PreciosPaginatedData {
  data: CambioPrecioItem[];
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
  total: number;
}

export interface PreciosPageProps {
  cambios: PreciosPaginatedData;
  estadisticas: PreciosEstadisticas;
  filtros: PreciosFilterOptions;
  tipos_precio: Array<{
    id: number;
    nombre: string;
    color: string;
  }>;
  usuarios: string[];
  motivos: string[];
}
