import { Head, useForm, Link } from '@inertiajs/react';
import { route } from '@/infrastructure/routing/routes';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Textarea } from '@/presentation/components/ui/textarea';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Almacen {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  sku: string;
  unidad?: { nombre: string };
  stock?: { cantidad_disponible: number };
}

interface Props {
  almacenes: Almacen[];
  productosStockBajo: Producto[];
}

interface Detalle {
  producto_id: number;
  cantidad_solicitada: number;
}

export default function ReposicionesCreate({ almacenes, productosStockBajo }: Props) {
  const { data, setData, post, errors, processing } = useForm({
    almacen_origen_id: '',
    almacen_destino_id: '',
    observaciones: '',
    detalles: [] as Detalle[],
  });

  const [selectedProducto, setSelectedProducto] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);

  const agregarProducto = () => {
    if (!selectedProducto || cantidad <= 0) return;

    const productoYaAnadido = data.detalles.some((d) => d.producto_id === selectedProducto);
    if (productoYaAnadido) {
      alert('Este producto ya está agregado');
      return;
    }

    setData('detalles', [
      ...data.detalles,
      {
        producto_id: selectedProducto,
        cantidad_solicitada: cantidad,
      },
    ]);

    setSelectedProducto(null);
    setCantidad(1);
  };

  const quitarProducto = (index: number) => {
    setData(
      'detalles',
      data.detalles.filter((_, i) => i !== index)
    );
  };

  const actualizarCantidad = (index: number, cantidad: number) => {
    const nuevoDetalles = [...data.detalles];
    nuevoDetalles[index].cantidad_solicitada = cantidad;
    setData('detalles', nuevoDetalles);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.detalles.length === 0) {
      alert('Debe agregar al menos un producto');
      return;
    }
    post(route('reposiciones.store'));
  };

  const productoSeleccionado = productosStockBajo.find((p) => p.id === selectedProducto);

  return (
    <>
      <Head title="Nueva Reposición" />
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href={route('reposiciones.index')}>
            <Button variant="outline" size="sm">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Nueva Reposición</h1>
            <p className="text-gray-600">Crear una nueva reposición de inventario</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Datos de la Reposición</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-6">
                  {/* Almacenes */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Almacén Origen *</label>
                      <select
                        value={data.almacen_origen_id}
                        onChange={(e) => setData('almacen_origen_id', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="">Seleccionar...</option>
                        {almacenes.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nombre}
                          </option>
                        ))}
                      </select>
                      {errors.almacen_origen_id && (
                        <p className="text-red-500 text-sm mt-1">{errors.almacen_origen_id}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Almacén Destino *</label>
                      <select
                        value={data.almacen_destino_id}
                        onChange={(e) => setData('almacen_destino_id', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="">Seleccionar...</option>
                        {almacenes.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nombre}
                          </option>
                        ))}
                      </select>
                      {errors.almacen_destino_id && (
                        <p className="text-red-500 text-sm mt-1">{errors.almacen_destino_id}</p>
                      )}
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Observaciones</label>
                    <Textarea
                      value={data.observaciones}
                      onChange={(e) => setData('observaciones', e.target.value)}
                      placeholder="Notas adicionales..."
                      rows={3}
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex gap-2 justify-end">
                    <Link href={route('reposiciones.index')}>
                      <Button variant="outline">Cancelar</Button>
                    </Link>
                    <Button type="submit" disabled={processing || data.detalles.length === 0}>
                      Crear Reposición
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Agregador de productos */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agregar Productos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Producto con stock bajo *</label>
                  <select
                    value={selectedProducto || ''}
                    onChange={(e) => setSelectedProducto(Number(e.target.value) || null)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {productosStockBajo.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {productoSeleccionado && (
                  <div className="bg-blue-50 p-3 rounded text-sm space-y-1">
                    <p>
                      <span className="font-semibold">SKU:</span> {productoSeleccionado.sku}
                    </p>
                    <p>
                      <span className="font-semibold">Unidad:</span>{' '}
                      {productoSeleccionado.unidad?.nombre || '-'}
                    </p>
                    <p>
                      <span className="font-semibold">Stock actual:</span>{' '}
                      {productoSeleccionado.stock?.cantidad_disponible || 0}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Cantidad *</label>
                  <Input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    className="text-sm"
                  />
                </div>

                <Button onClick={agregarProducto} className="w-full gap-2" disabled={!selectedProducto}>
                  <Plus size={16} />
                  Agregar Producto
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabla de detalles */}
        {data.detalles.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Productos a Reabastecer ({data.detalles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4">Producto</th>
                      <th className="text-left py-3 px-4">SKU</th>
                      <th className="text-right py-3 px-4">Cantidad</th>
                      <th className="text-center py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.detalles.map((detalle, index) => {
                      const producto = productosStockBajo.find((p) => p.id === detalle.producto_id);
                      return (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4">{producto?.nombre}</td>
                          <td className="py-3 px-4 text-gray-600">{producto?.sku}</td>
                          <td className="py-3 px-4 text-right">
                            <input
                              type="number"
                              min="1"
                              value={detalle.cantidad_solicitada}
                              onChange={(e) =>
                                actualizarCantidad(index, Number(e.target.value))
                              }
                              className="w-20 border rounded px-2 py-1 text-right"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => quitarProducto(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
