import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Plus, Loader2 } from 'lucide-react';

export default function ListarFraccionamientosMasivos() {
  const [fraccionamientos, setFraccionamientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;

  useEffect(() => {
    cargarFraccionamientos();
  }, [page]);

  const cargarFraccionamientos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fraccionamientos-masivos?page=${page}&per_page=${perPage}`);
      const data = await response.json();
      if (data?.data) {
        setFraccionamientos(data.data.data || data.data);
        setTotal(data.data.total || 0);
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

      <div className="py-8 dark:bg-gray-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fraccionamientos Masivos</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Historial de operaciones de fraccionamiento múltiple</p>
            </div>
            <Button onClick={() => router.visit('/inventario/fraccionamientos-masivos/crear')}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Fraccionamiento
            </Button>
          </div>

          {fraccionamientos.length === 0 ? (
            <Card className="p-8 text-center dark:bg-gray-900 dark:border-gray-800">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No hay fraccionamientos masivos registrados</p>
              <Button onClick={() => router.visit('/inventario/fraccionamientos-masivos/crear')}>
                Crear el primero
              </Button>
            </Card>
          ) : (
            <>
              <Card className="overflow-hidden dark:bg-gray-900 dark:border-gray-800">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Almacén</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Sector</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Usuario</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Cantidad</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Razón</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {fraccionamientos.map((f: any) => (
                      <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{f.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{f.almacen?.nombre || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{f.sector?.nombre || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{f.usuario?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{f.cantidad_detalles}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {f.razon?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
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
                    className="bg-gray-300 hover:bg-gray-400 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white disabled:opacity-50"
                  >
                    Anterior
                  </Button>
                  <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white disabled:opacity-50"
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
