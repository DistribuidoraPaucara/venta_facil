import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { ArrowLeft, Send, Check, Edit2, Trash2 } from 'lucide-react';

interface Detalle {
  id: number;
  producto_id: number;
  cantidad_solicitada: number;
  cantidad_recibida: number;
  producto: {
    id: number;
    nombre: string;
    sku: string;
  };
}

interface Reposicion {
  id: number;
  numero: string;
  estado: 'BORRADOR' | 'ENVIADO' | 'RECIBIDO';
  almacen_origen: { id: number; nombre: string };
  almacen_destino: { id: number; nombre: string };
  usuario: { id: number; name: string };
  observaciones: string | null;
  fecha_envio: string | null;
  fecha_recepcion: string | null;
  detalles: Detalle[];
  created_at: string;
}

interface Props {
  reposicion: Reposicion;
}

export default function ReposicionesShow({ reposicion }: Props) {
  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      BORRADOR: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      ENVIADO: { bg: 'bg-blue-100', text: 'text-blue-800' },
      RECIBIDO: { bg: 'bg-green-100', text: 'text-green-800' },
    };
    const v = variants[estado] || variants.BORRADOR;
    return <Badge className={`${v.bg} ${v.text}`}>{estado}</Badge>;
  };

  const handleEnviar = () => {
    if (confirm('¿Enviar esta reposición?')) {
      router.post(route('reposiciones.enviar', reposicion.id));
    }
  };

  const handleRecibir = () => {
    if (confirm('¿Confirmar recepción de esta reposición?')) {
      router.post(route('reposiciones.recibir', reposicion.id));
    }
  };

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta reposición?')) {
      router.delete(route('reposiciones.destroy', reposicion.id));
    }
  };

  return (
    <>
      <Head title={`Reposición ${reposicion.numero}`} />
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href={route('reposiciones.index')}>
            <Button variant="outline" size="sm">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{reposicion.numero}</h1>
            <p className="text-gray-600">Detalles de la reposición</p>
          </div>
          <div>{getEstadoBadge(reposicion.estado)}</div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Información general */}
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Almacén Origen</p>
                    <p className="text-lg font-semibold">{reposicion.almacen_origen.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Almacén Destino</p>
                    <p className="text-lg font-semibold">{reposicion.almacen_destino.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Usuario</p>
                    <p className="text-lg font-semibold">{reposicion.usuario.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha Creación</p>
                    <p className="text-lg font-semibold">
                      {new Date(reposicion.created_at).toLocaleDateString('es-BO')}
                    </p>
                  </div>
                </div>

                {reposicion.observaciones && (
                  <div>
                    <p className="text-sm text-gray-600">Observaciones</p>
                    <p className="text-base">{reposicion.observaciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detalles */}
            <Card>
              <CardHeader>
                <CardTitle>Productos ({reposicion.detalles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-4">Producto</th>
                        <th className="text-left py-3 px-4">SKU</th>
                        <th className="text-right py-3 px-4">Solicitado</th>
                        <th className="text-right py-3 px-4">Recibido</th>
                        {reposicion.estado === 'RECIBIDO' && (
                          <th className="text-right py-3 px-4">Faltante</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {reposicion.detalles.map((detalle) => {
                        const faltante = detalle.cantidad_solicitada - detalle.cantidad_recibida;
                        return (
                          <tr key={detalle.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-semibold">{detalle.producto.nombre}</td>
                            <td className="py-3 px-4 text-gray-600">{detalle.producto.sku}</td>
                            <td className="py-3 px-4 text-right">{detalle.cantidad_solicitada}</td>
                            <td className="py-3 px-4 text-right">{detalle.cantidad_recibida}</td>
                            {reposicion.estado === 'RECIBIDO' && (
                              <td
                                className={`py-3 px-4 text-right ${
                                  faltante > 0 ? 'text-red-600 font-semibold' : 'text-green-600'
                                }`}
                              >
                                {faltante}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel de acciones */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reposicion.estado === 'BORRADOR' && (
                  <>
                    <Link href={route('reposiciones.edit', reposicion.id)}>
                      <Button className="w-full gap-2" variant="outline">
                        <Edit2 size={16} />
                        Editar
                      </Button>
                    </Link>
                    <Button onClick={handleEnviar} className="w-full gap-2">
                      <Send size={16} />
                      Enviar Reposición
                    </Button>
                    <Button onClick={handleDelete} variant="destructive" className="w-full gap-2">
                      <Trash2 size={16} />
                      Eliminar
                    </Button>
                  </>
                )}

                {reposicion.estado === 'ENVIADO' && (
                  <Button onClick={handleRecibir} className="w-full gap-2">
                    <Check size={16} />
                    Confirmar Recepción
                  </Button>
                )}

                {reposicion.estado === 'RECIBIDO' && (
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-semibold">✓ Recepción Confirmada</p>
                    {reposicion.fecha_recepcion && (
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(reposicion.fecha_recepcion).toLocaleDateString('es-BO')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="text-lg">📝</div>
                  <div>
                    <p className="font-semibold">Creado</p>
                    <p className="text-gray-600">
                      {new Date(reposicion.created_at).toLocaleDateString('es-BO')}
                    </p>
                  </div>
                </div>

                {reposicion.fecha_envio && (
                  <div className="flex gap-3">
                    <div className="text-lg">📤</div>
                    <div>
                      <p className="font-semibold">Enviado</p>
                      <p className="text-gray-600">
                        {new Date(reposicion.fecha_envio).toLocaleDateString('es-BO')}
                      </p>
                    </div>
                  </div>
                )}

                {reposicion.fecha_recepcion && (
                  <div className="flex gap-3">
                    <div className="text-lg">✓</div>
                    <div>
                      <p className="font-semibold">Recibido</p>
                      <p className="text-gray-600">
                        {new Date(reposicion.fecha_recepcion).toLocaleDateString('es-BO')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
