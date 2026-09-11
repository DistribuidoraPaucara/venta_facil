import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function ListarFraccionamientosMasivos() {
  const [fraccionamientos, setFraccionamientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(15);

  useEffect(() => {
    cargarFraccionamientos();
  }, [page]);

  const cargarFraccionamientos = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/fraccionamientos-masivos', {
        params: { page, per_page: perPage },
      });
      const data = response.data?.data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) {
          setFraccionamientos(data.data);
          setTotal(data.total || 0);
        } else {
          setFraccionamientos(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error('Error cargando fraccionamientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  if (loading) {
    return (
      <AppLayout>
        <Head title="Fraccionamientos Masivos" />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head title="Fraccionamientos Masivos" />

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fraccionamientos Masivos</h1>
              <p className="text-gray-600 mt-2">Historial de operaciones de fraccionamiento múltiple</p>
            </div>
            <Button onClick={() => router.visit(route('fraccionamientos-masivos.crear'))}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Fraccionamiento
            </Button>
          </div>

          {fraccionamientos.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600 mb-4">No hay fraccionamientos masivos registrados</p>
              <Button onClick={() => router.visit(route('fraccionamientos-masivos.crear'))}>
                Crear el primero
              </Button>
            </Card>
          ) : (
            <>
              <Card className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Almacén</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Sector</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Usuario</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cantidad</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Razón</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {fraccionamientos.map((f: any) => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{f.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{f.almacen?.nombre || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{f.sector?.nombre || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{f.usuario?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{f.cantidad_detalles}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                          {f.razon?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {f.fecha_fraccionamiento ? new Date(f.fecha_fraccionamiento).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              {totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-900 disabled:opacity-50"
                  >
                    Anterior
                  </Button>
                  <span className="px-4 py-2 text-gray-600">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-900 disabled:opacity-50"
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
