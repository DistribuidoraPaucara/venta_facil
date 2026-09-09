import { Head, Link, router } from '@inertiajs/react';
import { route } from '@/infrastructure/routing/routes';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Trash2, Edit2, Plus, Eye } from 'lucide-react';
import type { Pagination } from '@/domain/entities/shared';

interface Reposicion {
  id: number;
  numero: string;
  estado: 'BORRADOR' | 'ENVIADO' | 'RECIBIDO';
  almacen_origen: { id: number; nombre: string };
  almacen_destino: { id: number; nombre: string };
  usuario: { id: number; name: string };
  created_at: string;
}

interface Props {
  reposiciones: Pagination<Reposicion>;
}

export default function ReposicionesIndex({ reposiciones }: Props) {
  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      BORRADOR: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      ENVIADO: { bg: 'bg-blue-100', text: 'text-blue-800' },
      RECIBIDO: { bg: 'bg-green-100', text: 'text-green-800' },
    };
    const v = variants[estado] || variants.BORRADOR;
    return <Badge className={`${v.bg} ${v.text}`}>{estado}</Badge>;
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta reposición?')) {
      router.delete(route('reposiciones.destroy', id));
    }
  };

  return (
    <>
      <Head title="Reposiciones" />
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Reposiciones</h1>
            <p className="text-gray-600">Gestiona reposiciones de inventario</p>
          </div>
          <Link href={route('reposiciones.create')}>
            <Button className="gap-2">
              <Plus size={20} />
              Nueva Reposición
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Reposiciones</CardTitle>
          </CardHeader>
          <CardContent>
            {reposiciones.data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay reposiciones registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4">Número</th>
                      <th className="text-left py-3 px-4">Origen</th>
                      <th className="text-left py-3 px-4">Destino</th>
                      <th className="text-left py-3 px-4">Estado</th>
                      <th className="text-left py-3 px-4">Usuario</th>
                      <th className="text-left py-3 px-4">Fecha</th>
                      <th className="text-center py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reposiciones.data.map((reposicion) => (
                      <tr key={reposicion.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold">{reposicion.numero}</td>
                        <td className="py-3 px-4">{reposicion.almacen_origen.nombre}</td>
                        <td className="py-3 px-4">{reposicion.almacen_destino.nombre}</td>
                        <td className="py-3 px-4">{getEstadoBadge(reposicion.estado)}</td>
                        <td className="py-3 px-4">{reposicion.usuario.name}</td>
                        <td className="py-3 px-4">{new Date(reposicion.created_at).toLocaleDateString('es-BO')}</td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <Link href={route('reposiciones.show', reposicion.id)}>
                            <Button variant="outline" size="sm">
                              <Eye size={16} />
                            </Button>
                          </Link>
                          {reposicion.estado === 'BORRADOR' && (
                            <>
                              <Link href={route('reposiciones.edit', reposicion.id)}>
                                <Button variant="outline" size="sm">
                                  <Edit2 size={16} />
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(reposicion.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
