// Domain: Tipos de precio domain types
import type { BaseEntity, BaseFormData } from '@/domain/entities/generic';

export interface TipoPrecio extends BaseEntity {
  codigo: string;
  nombre: string;
  descripcion?: string;
  porcentaje_ganancia: number;
  precios_count:number;
  color: string;
  es_ganancia: boolean;
  es_precio_base: boolean;
  orden: number;
  activo: boolean;
  es_sistema: boolean;
  almacen_id?: number | string | null; // Almacén del que descuenta en ventas (ej. FRIO → REFRIGERADOR); vacío = el de la empresa
  configuracion: {
    icono?: string;
    tooltip?: string;
    porcentaje_ganancia?: number;
  };
}

export interface TipoPrecioFormData extends BaseFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  porcentaje_ganancia: number;
  precios_count:number;
  color: string;
  es_ganancia: boolean;
  es_precio_base: boolean;
  orden: number;
  activo: boolean;
  es_sistema: boolean;
  almacen_id?: number | string | null; // Almacén del que descuenta en ventas (ej. FRIO → REFRIGERADOR); vacío = el de la empresa
  configuracion: {
    icono?: string;
    tooltip?: string;
    porcentaje_ganancia?: number;
  };
}
