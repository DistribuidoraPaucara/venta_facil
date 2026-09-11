import React, { useState, useEffect } from 'react';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import { X, Loader2, ArrowRight } from 'lucide-react';

interface Fraccionamiento {
  id: number;
  producto_padre_id: number;
  cantidad_padre: string;
  unidad_padre?: { id: number; nombre: string; codigo: string };
  producto_hijo_id: number;
  cantidad_hijo: string;
  unidad_hijo?: { id: number; nombre: string; codigo: string };
  productoPadre: { id: number; nombre: string; sku: string };
  productoHijo: { id: number; nombre: string; sku: string };
  almacen: { id: number; nombre: string };
  sector: { id: number; nombre: string };
  usuario: { id: number; name: string; email: string };
  fecha_fraccionamiento: string;
  razon: string;
  notas?: string;
}

interface Props {
  fraccionamiento: Fraccionamiento;
  onClose: () => void;
}

export default function DetallesFraccionamientoModal({ fraccionamiento, onClose }: Props) {
  const [historial, setHistorial] = useState<Fraccionamiento[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [pestaña, setPestaña] = useState<'detalles' | 'historial' | 'estadisticas'>('detalles');

  useEffect(() => {
    if (pestaña === 'historial') {
      cargarHistorial();
    } else if (pestaña === 'estadisticas') {
      cargarEstadisticas();
    }
  }, [pestaña]);

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const response = await fetch(
        `/api/inventario/fraccionamientos/producto/${fraccionamiento.producto_padre_id}/historial`
      );
      const data = await response.json();

      if (data.success) {
        setHistorial(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async () => {
    setCargando(true);
    try {
      const response = await fetch(
        `/api/inventario/fraccionamientos/producto/${fraccionamiento.producto_padre_id}/estadisticas`
      );
      const data = await response.json();

      if (data.success) {
        setEstadisticas(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRazonLabel = (razon: string) => {
    const labels: Record<string, string> = {
      fraccionamiento_manual: 'Fraccionamiento Manual',
      fraccionamiento_compra: 'Fraccionamiento de Compra',
      reagrupamiento: 'Reagrupamiento',
      ajuste_inventario: 'Ajuste de Inventario',
    };
    return labels[razon] || razon;
  };

  const factor = (parseFloat(fraccionamiento.cantidad_hijo) / parseFloat(fraccionamiento.cantidad_padre)).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            📦 Detalles del Fraccionamiento #{fraccionamiento.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex gap-4">
            {['detalles', 'historial', 'estadisticas'].map((tab) => (
              <button
                key={tab}
                onClick={() => setPestaña(tab as any)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  pestaña === tab
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab === 'detalles' && '📋 Detalles'}
                {tab === 'historial' && '📜 Historial'}
                {tab === 'estadisticas' && '📊 Estadísticas'}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {pestaña === 'detalles' && (
            <div className="space-y-6">
              {/* Resumen de Fraccionamiento */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">De</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {fraccionamiento.cantidad_padre} {fraccionamiento.unidad_padre?.codigo || 'un'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {fraccionamiento.productoPadre.sku} - {fraccionamiento.productoPadre.nombre}
                      </p>
                    </div>

                    <div className="flex flex-col items-center">
                      <ArrowRight className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-1" />
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        Factor: {factor}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">A</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {fraccionamiento.cantidad_hijo} {fraccionamiento.unidad_hijo?.codigo || 'un'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {fraccionamiento.productoHijo.sku} - {fraccionamiento.productoHijo.nombre}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Razón */}
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Razón
                  </p>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 inline-block">
                    {getRazonLabel(fraccionamiento.razon)}
                  </Badge>
                </div>

                {/* Fecha */}
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Fecha
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {formatearFecha(fraccionamiento.fecha_fraccionamiento)}
                  </p>
                </div>

                {/* Almacén */}
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Almacén
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {fraccionamiento.almacen.nombre}
                  </p>
                </div>

                {/* Sector */}
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Sector
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {fraccionamiento.sector.nombre}
                  </p>
                </div>

                {/* Usuario */}
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Realizado por
                  </p>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {fraccionamiento.usuario.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {fraccionamiento.usuario.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {fraccionamiento.notas && (
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Notas
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                      {fraccionamiento.notas}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {pestaña === 'historial' && (
            <div>
              {cargando ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : historial.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No hay más fraccionamientos para este producto
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {historial.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.productoPadre.sku} → {item.productoHijo.sku}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatearFecha(item.fecha_fraccionamiento)}
                          </p>
                        </div>
                        <Badge className="text-xs">
                          {item.cantidad_padre} → {item.cantidad_hijo}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {item.usuario.name} - {getRazonLabel(item.razon)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {pestaña === 'estadisticas' && (
            <div>
              {cargando ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : estadisticas ? (
                <div className="space-y-4">
                  {/* Resumen */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Total de Fraccionamientos
                      </p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {estadisticas.total_fraccionamientos}
                      </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Factor Promedio
                      </p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {parseFloat(estadisticas.factor_promedio).toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Cantidad Total Padre
                      </p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {estadisticas.cantidad_padre_total}
                      </p>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Cantidad Total Hijo
                      </p>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {estadisticas.cantidad_hijo_total}
                      </p>
                    </div>
                  </div>

                  {/* Por Razón */}
                  {Object.keys(estadisticas.por_razon).length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Por Razón
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(estadisticas.por_razon).map(([razon, data]: any) => (
                          <div
                            key={razon}
                            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {getRazonLabel(razon)}
                              </p>
                              <Badge className="text-xs">
                                {data.cantidad} fraccionamiento{data.cantidad !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <p>Padre: {data.cantidad_padre}</p>
                              <p>Hijo: {data.cantidad_hijo}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No hay datos disponibles
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <Button onClick={onClose} variant="outline" className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
