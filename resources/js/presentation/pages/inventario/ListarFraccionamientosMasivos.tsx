import { useState, useEffect } from 'react';
import Button from '@/presentation/components/ui/Button';
import Card from '@/presentation/components/ui/Card';
import { listarFraccionamientosMasivos } from '@/actions/App/Http/Controllers/Api/FraccionamientoMasivoApiController';
import { useRouter } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ListarFraccionamientosMasivos() {
  const router = useRouter();
  const [fraccionamientos, setFraccionamientos] = useState([]);
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
      const response = await listarFraccionamientosMasivos(undefined, page);
      const data = response.data;
      setFraccionamientos(data.data || []);
      setTotal(data.total || 0);
      setPerPage(data.per_page || 15);
    } catch (error: any) {
      toast.error('Error al cargar fraccionamientos masivos');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fraccionamientos Masivos</h1>
            <p className="text-gray-600 mt-2">Historial de operaciones de fraccionamiento múltiple</p>
          </div>
          <Button onClick={() => router.visit(route('fraccionamientos-masivos.crear'))}>
            Nuevo Fraccionamiento
          </Button>
        </div>

        {fraccionamientos.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-600">No hay fraccionamientos masivos registrados</p>
            <Button onClick={() => router.visit(route('fraccionamientos-masivos.crear'))} className="mt-4">
              Crear el primero
            </Button>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fraccionamientos.map((f: any) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{f.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{f.almacen?.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{f.sector?.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{f.usuario?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{f.cantidad_detalles}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                        {f.razon.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {format(new Date(f.fecha_fraccionamiento), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => router.visit(route('fraccionamientos-masivos.detalle', f.id))}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 rounded border disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-4 py-2">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 rounded border disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
