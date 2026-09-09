import { Head, useForm, Link } from '@inertiajs/react';
import { route } from '@/infrastructure/routing/routes';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Textarea } from '@/presentation/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Almacen {
  id: number;
  nombre: string;
}

interface Conversion {
  id: number;
  unidad_base_id: number;
  unidad_destino_id: number;
  factor_conversion: number;
  nombre_cuando_se_vende_como?: string;
  unidadBase?: { nombre: string };
  unidadDestino?: { nombre: string };
}

interface Producto {
  id: number;
  nombre: string;
  sku: string;
  unidad?: { nombre: string };
  stock?: { cantidad_disponible: number };
  stock_actual?: number;
  stock_minimo_requerido?: number;
  umbral_advertencia?: number;
  stock_principal?: number;
  es_fraccionado?: boolean;
  conversiones?: Conversion[];
}

interface Props {
  almacenes: Almacen[];
  productosStockBajo: Producto[];
}

interface Detalle {
  producto_id: number;
  cantidad_solicitada: number;
}

function ReposicionesCreate({ almacenes, productosStockBajo }: Props) {
  // Encontrar almacenes por nombre
  const almacenPrincipal = almacenes.find((a) =>
    a.nombre.toLowerCase().includes('principal')
  );
  const saladVentas = almacenes.find((a) =>
    a.nombre.toLowerCase().includes('sala de ventas') || a.nombre.toLowerCase().includes('venta')
  );

  const { data, setData, post, errors, processing } = useForm({
    almacen_origen_id: almacenPrincipal?.id.toString() || '',
    almacen_destino_id: saladVentas?.id.toString() || '',
    observaciones: '',
    detalles: [] as Detalle[],
  });

  const [cantidadesPorProducto, setCantidadesPorProducto] = useState<Record<number, number>>({});
  const [unidadesReposicion, setUnidadesReposicion] = useState<Record<number, 'base' | 'conversion'>>({});

  const agregarProducto = (productoId: number) => {
    const cantidad = cantidadesPorProducto[productoId];
    if (!cantidad || cantidad <= 0) {
      alert('Ingresa una cantidad válida antes de agregar');
      return;
    }

    const productoYaAnadido = data.detalles.some((d) => d.producto_id === productoId);
    if (productoYaAnadido) {
      alert('Este producto ya está agregado');
      return;
    }

    setData('detalles', [
      ...data.detalles,
      {
        producto_id: productoId,
        cantidad_solicitada: cantidad,
      },
    ]);

    setCantidadesPorProducto({
      ...cantidadesPorProducto,
      [productoId]: 0,
    });
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

  const obtenerUnidadBase = (producto: Producto) => {
    return producto.unidad?.nombre || 'Unidad';
  };

  const obtenerUnidadConversion = (producto: Producto) => {
    if (!producto.conversiones || producto.conversiones.length === 0) return null;
    const primera = producto.conversiones[0];
    return primera.nombre_cuando_se_vende_como || primera.unidadDestino?.nombre;
  };

  const calcularCantidadEnOtraUnidad = (producto: Producto, cantidad: number, haciaConversion: boolean) => {
    if (!producto.conversiones || producto.conversiones.length === 0) return cantidad;
    const conversion = producto.conversiones[0];
    if (!conversion) return cantidad;

    if (haciaConversion) {
      // De base a conversión: multiplicar
      return Math.round(cantidad * parseFloat(conversion.factor_conversion.toString()));
    } else {
      // De conversión a base: dividir
      return Math.round(cantidad / parseFloat(conversion.factor_conversion.toString()));
    }
  };

  const formatearNumero = (num: number | string | undefined) => {
    if (num === undefined || num === null || num === '') return '0';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '0';
    // Si es entero, muestra sin decimales
    if (Number.isInteger(n)) return n.toString();
    // Si tiene decimales, muestra solo los necesarios (máximo 2)
    return parseFloat(n.toFixed(2)).toString();
  };

  return (
    <>
      <Head title="Nueva Reposición" />
      <div className="py-2">
        <div className="flex items-center gap-3 p-2">
          {/* <Link href={route('reposiciones.index')}>
            <Button variant="outline" size="sm">
              <ArrowLeft size={20} />
            </Button>
          </Link> */}
          <div>
            <h1 className="text-3xl font-bold">Nueva Reposición</h1>
            <p className="text-gray-600">Crear una nueva reposición de inventario</p>
          </div>
        </div>

        <div className="space-y-6 p-2">
          {/* Formulario */}
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
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2"
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
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2"
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
                {/* <div>
                  <label className="block text-sm font-medium mb-2">Observaciones</label>
                  <Textarea
                    value={data.observaciones}
                    onChange={(e) => setData('observaciones', e.target.value)}
                    placeholder="Notas adicionales..."
                    rows={3}
                  />
                </div> */}

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

          {/* Tabla de productos para reposición */}
          <Card>
            <CardHeader>
              <CardTitle>Productos Cercanos al Límite Mínimo</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {productosStockBajo.length} productos requieren reposición
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Producto</th>
                      <th className="text-left py-3 px-4">SKU</th>
                      <th className="text-center py-3 px-4">Mínimo Req.</th>
                      <th className="text-center py-3 px-4">Stock en Sala</th>
                      <th className="text-center py-3 px-4">Stock en Dep.</th>
                      <th className="text-center py-3 px-4">Unidad Reposición</th>
                      <th className="text-right py-3 px-4">Cantidad a Reponer</th>
                      <th className="text-center py-3 px-4">Stock Final Sala</th>
                      <th className="text-center py-3 px-4">Estado</th>
                      <th className="text-center py-3 px-4">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosStockBajo.map((producto) => {
                      const isCritico = (producto.stock_actual ?? 0) < (producto.stock_minimo_requerido ?? 0);
                      const isAdvertencia = (producto.stock_actual ?? 0) <= (producto.umbral_advertencia ?? 0);
                      const yaAgregado = data.detalles.some((d) => d.producto_id === producto.id);
                      const detalleAgregado = data.detalles.find((d) => d.producto_id === producto.id);
                      const cantidadAgregada = detalleAgregado?.cantidad_solicitada ?? 0;

                      return (
                        <tr
                          key={producto.id}
                          className={`border-b ${
                            isCritico
                              ? 'bg-red-50 dark:bg-red-950'
                              : isAdvertencia
                              ? 'bg-yellow-50 dark:bg-yellow-950'
                              : ''
                          } ${yaAgregado ? 'opacity-60' : ''}`}
                        >
                          <td className="py-3 px-4">#{producto.id}</td>
                          <td className="py-3 px-4">{producto.nombre}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{producto.sku}</td>
                          <td className="py-3 px-4 text-center">{formatearNumero(producto.stock_minimo_requerido)}</td>
                          <td className="py-3 px-4 text-center font-medium">{formatearNumero(producto.stock_actual)}</td>
                          <td className="py-3 px-4 text-center font-semibold text-green-600 dark:text-green-400">
                            {formatearNumero(producto.stock_principal)}
                          </td>
                          
                          <td className="py-3 px-4 text-center">
                            {producto.es_fraccionado && producto.conversiones && producto.conversiones.length > 0 ? (
                              <select
                                value={unidadesReposicion[producto.id] ?? 'base'}
                                onChange={(e) => {
                                  const nuevoTipo = e.target.value as 'base' | 'conversion';
                                  setUnidadesReposicion({
                                    ...unidadesReposicion,
                                    [producto.id]: nuevoTipo,
                                  });
                                  // Recalcular cantidad
                                  const cantidadActual = cantidadesPorProducto[producto.id] ?? 0;
                                  if (cantidadActual > 0) {
                                    const esConversionActual = unidadesReposicion[producto.id] === 'conversion';
                                    const nuevaCantidad = calcularCantidadEnOtraUnidad(producto, cantidadActual, !esConversionActual);
                                    setCantidadesPorProducto({
                                      ...cantidadesPorProducto,
                                      [producto.id]: nuevaCantidad,
                                    });
                                  }
                                }}
                                disabled={yaAgregado}
                                className="text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded px-2 py-1 disabled:opacity-50"
                              >
                                <option value="base">{obtenerUnidadBase(producto)}</option>
                                <option value="conversion">{obtenerUnidadConversion(producto)}</option>
                              </select>
                            ) : (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {obtenerUnidadBase(producto)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {yaAgregado ? (
                              // Mostrar cantidad agregada si ya está en detalles
                              <input
                                type="number"
                                min="1"
                                value={cantidadAgregada}
                                onChange={(e) => {
                                  const idx = data.detalles.findIndex((d) => d.producto_id === producto.id);
                                  if (idx >= 0) {
                                    actualizarCantidad(idx, Number(e.target.value));
                                  }
                                }}
                                className="w-24 border border-green-500 dark:border-green-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded px-2 py-1 text-right font-semibold"
                              />
                            ) : (
                              // Input para cantidad antes de agregar
                              <input
                                type="number"
                                min="1"
                                placeholder="Cantidad"
                                value={cantidadesPorProducto[producto.id] ?? ''}
                                onChange={(e) =>
                                  setCantidadesPorProducto({
                                    ...cantidadesPorProducto,
                                    [producto.id]: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-24 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded px-2 py-1 text-right"
                              />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {yaAgregado ? (
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {formatearNumero((producto.stock_actual ?? 0) + cantidadAgregada)}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isCritico ? (
                              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-xs">
                                <AlertCircle size={14} />
                                CRÍTICO
                              </span>
                            ) : isAdvertencia ? (
                              <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-semibold text-xs">
                                <AlertTriangle size={14} />
                                ALERTA
                              </span>
                            ) : (
                              <span className="text-green-600 dark:text-green-400 font-semibold text-xs">OK</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {yaAgregado ? (
                              <button
                                type="button"
                                onClick={() => quitarProducto(data.detalles.findIndex((d) => d.producto_id === producto.id))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => agregarProducto(producto.id)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Plus size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Indicador de productos agregados */}
        {data.detalles.length > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
              ✅ {data.detalles.length} producto(s) seleccionado(s) para reabastecer
            </p>
          </div>
        )}
      </div>
    </>
  );
}

ReposicionesCreate.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default ReposicionesCreate;
