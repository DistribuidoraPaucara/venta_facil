import apiClient from '@/lib/apiClient';

export interface DetalleFraccionamiento {
  producto_padre_id: number;
  cantidad_padre: number;
  producto_hijo_id: number;
  cantidad_hijo: number;
  factor_conversion?: number;
}

export interface CreateFraccionamientoMasivoRequest {
  almacen_id: number;
  sector_id: number;
  razon: 'fraccionamiento_manual' | 'fraccionamiento_compra' | 'reagrupamiento' | 'ajuste_inventario';
  notas?: string;
  detalles: DetalleFraccionamiento[];
}

export const registrarFraccionamientoMasivo = (data: CreateFraccionamientoMasivoRequest) =>
  apiClient.post('/fraccionamientos-masivos', data);

export const listarFraccionamientosMasivos = (almacen_id?: number, page = 1) => {
  const params: any = { per_page: 15, page };
  if (almacen_id) params.almacen_id = almacen_id;
  return apiClient.get('/fraccionamientos-masivos', { params });
};

export const obtenerFraccionamientoMasivo = (id: number) =>
  apiClient.get(`/fraccionamientos-masivos/${id}`);
