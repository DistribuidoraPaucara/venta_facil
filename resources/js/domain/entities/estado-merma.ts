// Domain: Estado de Merma
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface EstadoMerma extends BaseEntity {
  id: Id;
  clave: string;
  label: string;
  color?: string | null;
  bg_color?: string | null;
  text_color?: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EstadoMermaFormData extends BaseFormData {
  clave: string;
  label: string;
  color?: string;
  activo?: boolean;
}
