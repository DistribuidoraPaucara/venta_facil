// Domain: Tipo de Merma
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface TipoMerma extends BaseEntity {
  id: Id;
  clave: string;
  label: string;
  descripcion?: string | null;
  color?: string | null;
  bg_color?: string | null;
  text_color?: string | null;
  requiere_aprobacion: boolean;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TipoMermaFormData extends BaseFormData {
  clave: string;
  label: string;
  descripcion?: string;
  color?: string;
  requiere_aprobacion?: boolean;
  activo?: boolean;
}
