import { Head, useForm, Link, router } from '@inertiajs/react';
import { route } from '@/infrastructure/routing/routes';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Textarea } from '@/presentation/components/ui/textarea';
import { ArrowLeft, Plus, Trash2, AlertCircle, AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react';
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

interface Sector {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  sku: string;
  unidad?: { nombre: string };
  stock?: { cantidad_disponible: number };
  stock_actual?: number;
  stock_minimo_requerido?: number;
  stock_maximo_requerido?: number;
  umbral_advertencia?: number;
  stock_principal?: number;
  cantidad_sugerida?: number;
  sector?: Sector;
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
  const [productosSeleccionados, setProductosSeleccionados] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-seleccionar productos con cantidad sugerida > 0 (solo una vez)
  useEffect(() => {
    const productosParaSeleccionar = productosStockBajo.filter(
      (producto) =>
        producto.cantidad_sugerida &&
        producto.cantidad_sugerida > 0
    );

    if (productosParaSeleccionar.length > 0 && productosSeleccionados.size === 0) {
      const nuevosSeleccionados = new Set<number>();
      const nuevasCantidades: Record<number, number> = {};

      productosParaSeleccionar.forEach((p) => {
        nuevosSeleccionados.add(p.id);
        nuevasCantidades[p.id] = Math.floor(p.cantidad_sugerida || 0);
      });

      setProductosSeleccionados(nuevosSeleccionados);
      setCantidadesPorProducto(nuevasCantidades);
    }
  }, [productosStockBajo]);

  // Sincronizar detalles con productos seleccionados
  useEffect(() => {
    const nuevosDetalles = Array.from(productosSeleccionados).map((productoId) => {
      const producto = productosStockBajo.find((p) => p.id === productoId);
      const cantidad = cantidadesPorProducto[productoId] || producto?.cantidad_sugerida || 1;
      return {
        producto_id: productoId,
        cantidad_solicitada: Math.floor(Number(cantidad)),
      };
    });
    setData('detalles', nuevosDetalles);
  }, [productosSeleccionados, cantidadesPorProducto]);

  const toggleProductoSeleccionado = (productoId: number) => {
    const nuevoSeleccionados = new Set(productosSeleccionados);
    if (nuevoSeleccionados.has(productoId)) {
      nuevoSeleccionados.delete(productoId);
    } else {
      nuevoSeleccionados.add(productoId);
    }
    setProductosSeleccionados(nuevoSeleccionados);
  };

  const seleccionarTodos = () => {
    const todosLosIds = new Set(productosStockBajo.map((p) => p.id));
    setProductosSeleccionados(todosLosIds);
  };

  const deseleccionarTodos = () => {
    setProductosSeleccionados(new Set());
  };

  const actualizarCantidad = (index: number, cantidad: number) => {
    const nuevoDetalles = [...data.detalles];
    nuevoDetalles[index].cantidad_solicitada = cantidad;
    setData('detalles', nuevoDetalles);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.detalles.length === 0) {
      setToast({ type: 'error', message: 'Debe seleccionar al menos un producto' });
      return;
    }

    setToast({ type: 'success', message: 'Procesando reposición...' });

    post(route('reposiciones.store'), {
      onSuccess: () => {
        setToast({ type: 'success', message: '✅ Reposición procesada correctamente' });
        setTimeout(() => {
          router.visit(route('reposiciones.index'));
        }, 2000);
      },
      onError: (errors) => {
        const mensaje = Object.values(errors).join(', ') || 'Error al procesar la reposición';
        setToast({ type: 'error', message: `❌ ${mensaje}` });
      },
    });
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

  const formatearNumero = (num: number | string | undefined): string => {
    if (num === undefined || num === null || num === '') return '0';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '0';
    // Si es entero, muestra sin decimales
    if (Number.isInteger(n)) return n.toString();
    // Si tiene decimales, muestra solo los necesarios (máximo 2)
    return parseFloat(n.toFixed(2)).toString();
  };

  const formatearCantidad = (cantidad: number | string | undefined): number | string => {
    if (cantidad === undefined || cantidad === null || cantidad === '') return '';
    const n = typeof cantidad === 'string' ? parseFloat(cantidad) : cantidad;
    if (isNaN(n)) return '';
    // Si es entero, devuelve número sin decimales
    if (Number.isInteger(n)) return n;
    // Si tiene decimales, redondea a 2 decimales máximo
    return parseFloat(n.toFixed(2));
  };

  return (
    <>
      <Head title="Nueva Reposición" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white transition-all ${
          toast.type === 'success'
            ? 'bg-green-500'
            : 'bg-red-500'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-4 text-white hover:opacity-80"
          >
            ✕
          </button>
        </div>
      )}

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
                    <Button variant="outline" disabled={processing}>Cancelar</Button>
                  </Link>
                  <Button type="submit" disabled={processing || data.detalles.length === 0} className="flex items-center gap-2">
                    {processing && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                    {processing ? 'Procesando...' : 'Crear Reposición'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Tabla de productos para reposición */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Productos Cercanos al Límite Mínimo</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {productosStockBajo.length} productos requieren reposición
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={seleccionarTodos}
                  >
                    Seleccionar todos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deseleccionarTodos}
                  >
                    Deseleccionar todos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-center py-3 px-4 w-12">
                        <input
                          type="checkbox"
                          checked={productosSeleccionados.size === productosStockBajo.length && productosStockBajo.length > 0}
                          onChange={(e) => e.target.checked ? seleccionarTodos() : deseleccionarTodos()}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Producto</th>
                      <th className="text-left py-3 px-4">SKU</th>
                      <th className="text-center py-3 px-4">Sector</th>
                      <th className="text-center py-3 px-4">Mín/Máx Sala</th>
                      <th className="text-center py-3 px-4">Stock en Sala</th>
                      <th className="text-center py-3 px-4">Stock en Dep.</th>
                      <th className="text-center py-3 px-4">Unidad Reposición</th>
                      <th className="text-right py-3 px-4">Cantidad a Reponer</th>
                      <th className="text-center py-3 px-4">Stock Final Sala</th>
                      <th className="text-center py-3 px-4">Stock Final Dep.</th>
                      <th className="text-center py-3 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosStockBajo.map((producto) => {
                      const isCritico = (producto.stock_actual ?? 0) < (producto.stock_minimo_requerido ?? 0);
                      const isAdvertencia = (producto.stock_actual ?? 0) <= (producto.umbral_advertencia ?? 0);
                      const yaSeleccionado = productosSeleccionados.has(producto.id);
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
                          } ${yaSeleccionado ? '' : 'opacity-50'}`}
                        >
                          <td className="py-3 px-4 text-center w-12">
                            <input
                              type="checkbox"
                              checked={yaSeleccionado}
                              onChange={() => toggleProductoSeleccionado(producto.id)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">#{producto.id}</td>
                          <td className="py-3 px-4">{producto.nombre}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{producto.sku}</td>
                          <td className="py-3 px-4 text-center text-sm font-medium text-purple-600 dark:text-purple-400">
                            {producto.sector?.nombre || '-'}
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            <div>{formatearNumero(producto.stock_minimo_requerido)}</div>
                            <div className="text-gray-500 dark:text-gray-400">{formatearNumero(producto.stock_maximo_requerido)}</div>
                          </td>
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
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formatearCantidad(cantidadesPorProducto[producto.id] ?? producto.cantidad_sugerida ?? 0)}
                              onChange={(e) =>
                                setCantidadesPorProducto({
                                  ...cantidadesPorProducto,
                                  [producto.id]: Number(e.target.value) || 0,
                                })
                              }
                              disabled={!yaSeleccionado}
                              className={`w-24 border rounded px-2 py-1 text-right font-semibold ${
                                yaSeleccionado
                                  ? 'border-green-500 dark:border-green-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
                                  : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              }`}
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            {yaSeleccionado && (cantidadesPorProducto[producto.id] ?? 0) > 0 ? (
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {formatearNumero(Number(producto.stock_actual ?? 0) + (cantidadesPorProducto[producto.id] ?? 0))}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {(() => {
                              const cantidadActual = yaSeleccionado ? (cantidadesPorProducto[producto.id] ?? 0) : 0;
                              const stockFinal = Number(producto.stock_principal ?? 0) - cantidadActual;
                              return cantidadActual > 0 && yaSeleccionado ? (
                                <span className={`font-semibold ${stockFinal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {formatearNumero(Math.round(stockFinal * 100) / 100)}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">-</span>
                              );
                            })()}
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
