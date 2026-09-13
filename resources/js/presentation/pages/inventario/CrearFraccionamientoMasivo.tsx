import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Trash2 } from 'lucide-react';
import NotificationService from '@/infrastructure/services/notification.service';

interface LineaFraccionamiento {
  id: string;
  producto_padre_id: number | null;
  producto_padre_nombre: string;
  cantidad_padre: number;
  unidad_padre: string;
  productos_hijos: Array<{
    id: string;
    producto_hijo_id: number | null;
    producto_hijo_nombre: string;
    cantidad_hijo: number;
    unidad_hijo: string;
    factor_conversion: number;
  }>;
}

export default function CrearFraccionamientoMasivo() {
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [almacenId, setAlmacenId] = useState<number | null>(null);
  const [razon, setRazon] = useState('fraccionamiento_manual');
  const [notas, setNotas] = useState('');

  const [lineas, setLineas] = useState<LineaFraccionamiento[]>([]);
  const [buscaProductoPadre, setBuscaProductoPadre] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✨ NUEVO: Estado para stocks de productos
  const [stockProductos, setStockProductos] = useState<Record<number, number>>({});

  // ✨ NUEVO: Estados para búsqueda en tiempo real
  const [productosFilrados, setProductosFilrados] = useState<any[]>([]);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  let debounceTimer: any = null;

  useEffect(() => {
    cargarAlmacenes();
    // ✨ CAMBIO: No precargar todos los productos, buscar en tiempo real
  }, []);

  const cargarAlmacenes = async () => {
    try {
      const res = await fetch('/api/almacenes');
      const data = await res.json();
      const almacenesArray = Array.isArray(data) ? data : data.data || [];
      setAlmacenes(almacenesArray);
    } catch (error) {
      console.error('Error cargando almacenes:', error);
    }
  };


  // ✨ NUEVO: Cargar stocks de productos
  const cargarStocksProductos = async (productIds: number[]) => {
    if (productIds.length === 0) return;
    try {
      const res = await fetch(`/api/productos/stock-total?product_ids=${productIds.join(',')}`);
      const data = await res.json();
      if (data.success && data.data) {
        setStockProductos(prev => ({ ...prev, ...data.data }));
      }
    } catch (error) {
      console.error('Error cargando stocks:', error);
    }
  };

  // ✨ NUEVO: Función para buscar productos en tiempo real (lazy search)
  const buscarProductosEnTiempoReal = async (termino: string) => {
    if (!termino || termino.length < 2) {
      setProductosFilrados([]);
      setBuscandoProductos(false);
      return;
    }

    setBuscandoProductos(true);
    try {
      const res = await fetch(
        `/api/inventario/fraccionamientos/productos/disponibles?search=${encodeURIComponent(termino)}`
      );
      const data = await res.json();
      const productosArray = Array.isArray(data.data) ? data.data : [];

      // ✨ NUEVO: Cargar stocks de los productos encontrados
      if (productosArray.length > 0) {
        const productIds = productosArray.map((p: any) => p.id);
        await cargarStocksProductos(productIds);
      }

      // ✨ NUEVO: Log de búsqueda
      console.log('🔍 Búsqueda de productos:', {
        termino,
        resultados: productosArray.length,
        productos: productosArray.map(p => ({
          id: p.id,
          nombre: p.nombre,
          sku: p.sku,
          codigos: p.codigos,
          unidad_nombre: p.unidad_nombre,
          stock: stockProductos[p.id] ?? 0, // Ahora debería tener el stock cargado
        }))
      });

      setProductosFilrados(productosArray);
    } catch (error) {
      console.error('Error buscando productos:', error);
      setProductosFilrados([]);
    } finally {
      setBuscandoProductos(false);
    }
  };

  // ✨ NUEVO: Función para formatear números sin decimales innecesarios
  const formatearNumero = (num: number | string): string => {
    const numVal = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numVal)) return String(num);
    if (Number.isInteger(numVal)) return String(Math.floor(numVal));
    const formatted = numVal.toFixed(2);
    return parseFloat(formatted).toString();
  };

  // ✨ CAMBIO: Recibir el producto directamente en lugar de buscarlo
  const agregarProductoPadre = async (productoPadreId: number, productoPadre?: any) => {
    // Si no viene el producto, buscarlo en los filtrados
    if (!productoPadre) {
      productoPadre = productosFilrados.find((p: any) => p.id === productoPadreId);
    }
    if (!productoPadre) return;

    // Obtener conversiones (productos hijos) - mismo endpoint que CrearFraccionamiento
    try {
      const res = await fetch(`/api/inventario/fraccionamientos/producto/${productoPadreId}/conversiones`);
      const data = await res.json();
      console.log('Conversiones cargadas:', data);

      let conversiones: any[] = [];
      if (Array.isArray(data)) {
        conversiones = data;
      } else if (data.data && Array.isArray(data.data)) {
        conversiones = data.data;
      } else {
        conversiones = [];
      }

      console.log('Conversiones procesadas:', conversiones.length);

      if (conversiones.length === 0) {
        NotificationService.error(
          `El producto "${productoPadre.nombre}" no tiene conversiones configuradas. Debe tener al menos una conversión hacia un producto hijo.`
        );
        return;
      }

      const nuevaLinea: LineaFraccionamiento = {
        id: Math.random().toString(),
        producto_padre_id: productoPadreId,
        producto_padre_nombre: productoPadre.nombre,
        cantidad_padre: 0,
        unidad_padre: productoPadre.unidad_nombre,
        productos_hijos: conversiones.map((conv: any) => ({
          id: Math.random().toString(),
          producto_hijo_id: conv.producto_hijo_id,
          producto_hijo_nombre: conv.producto_hijo?.nombre || '',
          cantidad_hijo: 0,
          unidad_hijo: conv.unidad_destino_nombre || '',
          factor_conversion: conv.factor_conversion || 0,
        })),
      };

      setLineas([...lineas, nuevaLinea]);
      setBuscaProductoPadre('');
      setMostrarSugerencias(false);

      // ✨ NUEVO: Cargar stocks del producto padre y hijos
      const productIds = [
        productoPadreId,
        ...conversiones
          .map((conv: any) => conv.producto_hijo_id)
          .filter((id: any) => id),
      ];
      await cargarStocksProductos(productIds);
    } catch (error) {
      console.error('Error cargando conversiones:', error);
      NotificationService.error('Error al cargar los productos hijos');
    }
  };

  const actualizarCantidadPadre = (lineaId: string, cantidad: number | string) => {
    // Permitir que el campo esté vacío para que el usuario pueda borrar
    const cantidadNum = cantidad === '' ? 0 : Number(cantidad) || 0;

    setLineas(lineas.map(linea => {
      if (linea.id === lineaId) {
        return {
          ...linea,
          cantidad_padre: cantidadNum,
          productos_hijos: linea.productos_hijos.map(hijo => ({
            ...hijo,
            cantidad_hijo: cantidadNum * hijo.factor_conversion,
          })),
        };
      }
      return linea;
    }));
  };

  const actualizarCantidadHijo = (lineaId: string, hijoId: string, cantidad: number | string) => {
    // Permitir que el campo esté vacío para que el usuario pueda borrar
    const cantidadNum = cantidad === '' ? 0 : Number(cantidad) || 0;

    setLineas(lineas.map(linea => {
      if (linea.id === lineaId) {
        return {
          ...linea,
          productos_hijos: linea.productos_hijos.map(hijo =>
            hijo.id === hijoId ? { ...hijo, cantidad_hijo: cantidadNum } : hijo
          ),
        };
      }
      return linea;
    }));
  };

  const eliminarLinea = (lineaId: string) => {
    setLineas(lineas.filter(l => l.id !== lineaId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!almacenId) {
      NotificationService.warning('Por favor selecciona un almacén');
      return;
    }

    const detalles = [];
    for (const linea of lineas) {
      for (const hijo of linea.productos_hijos) {
        if (hijo.producto_hijo_id && linea.cantidad_padre > 0 && hijo.cantidad_hijo > 0) {
          detalles.push({
            producto_padre_id: linea.producto_padre_id,
            cantidad_padre: linea.cantidad_padre,
            producto_hijo_id: hijo.producto_hijo_id,
            cantidad_hijo: hijo.cantidad_hijo,
            factor_conversion: hijo.factor_conversion,
          });
        }
      }
    }

    if (detalles.length === 0) {
      NotificationService.warning('Debe tener al menos un fraccionamiento válido');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/inventario/fraccionamientos-masivos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          almacen_id: almacenId,
          sector_id: 0,
          razon,
          notas,
          detalles,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        NotificationService.error(error.message || 'Error al registrar');
        return;
      }

      NotificationService.success('Fraccionamientos registrados exitosamente');
      router.visit('/inventario/fraccionamientos-masivos');
    } catch (error: any) {
      NotificationService.error(error.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Head title="Crear Fraccionamiento Masivo" />

      <div className="p-2 dark:bg-gray-950 min-h-screen">
        <div className="max-w-6xl mx-auto px-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Fraccionamiento Masivo</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Selecciona almacén, busca productos padre y carga sus conversiones</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Encabezado */}
            <div className="p-2 dark:bg-gray-900 dark:border-gray-800 rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Almacén *</label>
                  <select
                    value={almacenId?.toString() || ''}
                    onChange={(e) => setAlmacenId(Number(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecciona almacén</option>
                    {almacenes.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Razón</label>
                  <select
                    value={razon}
                    onChange={(e) => setRazon(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="fraccionamiento_manual">Fraccionamiento Manual</option>
                    <option value="fraccionamiento_compra">Por Compra</option>
                    <option value="reagrupamiento">Reagrupamiento</option>
                    <option value="ajuste_inventario">Ajuste de Inventario</option>
                  </select>
                </div>

                {/* <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-white">Notas</label>
                  <Input
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Observaciones opcionales"
                  />
                </div> */}
              </div>
            </div>

            {/* Búsqueda de productos */}
            {almacenId && (
              <div className="p-2 dark:bg-gray-900 dark:border-gray-800 rounded-lg border border-border">
                <label className="block text-sm font-medium dark:text-white mb-2">Buscar Producto Padre</label>
                <div className="relative z-20">
                  <Input
                    type="text"
                    value={buscaProductoPadre}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setBuscaProductoPadre(valor);
                      setMostrarSugerencias(true);

                      // ✨ NUEVO: Búsqueda con debounce
                      clearTimeout(debounceTimer);
                      debounceTimer = setTimeout(() => {
                        buscarProductosEnTiempoReal(valor);
                      }, 300);
                    }}
                    onFocus={() => {
                      setMostrarSugerencias(true);
                      if (buscaProductoPadre.length >= 2) {
                        buscarProductosEnTiempoReal(buscaProductoPadre);
                      }
                    }}
                    placeholder="Por nombre, SKU o código de barras (mín. 2 caracteres)"
                  />
                  {mostrarSugerencias && buscaProductoPadre && productosFilrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md mt-1 max-h-64 overflow-y-auto shadow-lg">
                      {productosFilrados.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => agregarProductoPadre(p.id, p)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-sm dark:text-white">{p.nombre}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 grid grid-cols-2 gap-2 mt-1">
                            <div>
                              <span className="font-semibold">SKU:</span> {p.sku}
                            </div>
                            <div>
                              <span className="font-semibold">Unidad:</span> {p.unidad_nombre || '-'}
                            </div>
                            {p.codigos && p.codigos.length > 0 && (
                              <div>
                                <span className="font-semibold">Códigos:</span> {p.codigos.map((c: any) => c.codigo).join(', ')}
                              </div>
                            )}
                            <div className={`font-semibold ${
                              (stockProductos[p.id] ?? 0) > 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              📦 Stock: {formatearNumero(stockProductos[p.id] ?? 0)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {mostrarSugerencias && buscaProductoPadre && buscandoProductos && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md mt-1 p-3 text-center text-gray-500 dark:text-gray-400 shadow-lg">
                      ⏳ Buscando productos...
                    </div>
                  )}
                  {mostrarSugerencias && buscaProductoPadre && !buscandoProductos && productosFilrados.length === 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md mt-1 p-3 text-center text-gray-500 dark:text-gray-400 shadow-lg">
                      No se encontraron productos
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tabla de líneas agregadas */}
            {lineas.length > 0 && (
              <div className="dark:bg-gray-900 dark:border-gray-800 overflow-x-auto p-2 rounded-lg border border-border">
                <h2 className="text-lg font-semibold mb-2 dark:text-white">Productos a Fraccionar</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold dark:text-white">Producto Padre</th>
                      <th className="text-center py-3 px-4 font-semibold dark:text-white">📦 Stock Padre</th>
                      <th className="text-center py-3 px-4 font-semibold dark:text-white">Cantidad</th>
                      <th className="text-center py-3 px-4 font-semibold dark:text-white">Unidad</th>
                      <th className="text-left py-3 px-4 font-semibold dark:text-white">Producto Hijo</th>
                      <th className="text-center py-3 px-4 font-semibold dark:text-white">📦 Stock Hijo</th>
                      <th className="text-center py-3 px-4 font-semibold dark:text-white">Cant. Hijo</th>
                      <th className="text-center py-3 px-4 font-semibold dark:text-white">Unidad</th>
                      <th className="text-center py-3 px-4 font-semibold dark:text-white">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {lineas.map((linea) => (
                      linea.productos_hijos.map((hijo, idx) => (
                        <tr key={`${linea.id}-${hijo.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          {idx === 0 && (
                            <>
                              <td className="py-3 px-4 dark:text-white font-medium" rowSpan={linea.productos_hijos.length}>
                                {linea.producto_padre_nombre}
                              </td>
                              <td className="py-3 px-4 dark:text-white text-center font-semibold" rowSpan={linea.productos_hijos.length}>
                                <span className={`inline-block rounded px-2 py-1 ${
                                  (stockProductos[linea.producto_padre_id || 0] ?? 0) > 0
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                  {formatearNumero(stockProductos[linea.producto_padre_id || 0] ?? 0)}
                                </span>
                              </td>
                              <td className="py-3 px-4 dark:text-white text-center" rowSpan={linea.productos_hijos.length}>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={linea.cantidad_padre || ''}
                                  onChange={(e) => actualizarCantidadPadre(linea.id, e.target.value)}
                                  placeholder="0"
                                  className="w-20 text-center"
                                />
                              </td>
                              <td className="py-3 px-4 dark:text-gray-400 text-center" rowSpan={linea.productos_hijos.length}>
                                {linea.unidad_padre}
                              </td>
                            </>
                          )}
                          <td className="py-3 px-4 dark:text-white">{hijo.producto_hijo_nombre}</td>
                          <td className="py-3 px-4 dark:text-white text-center font-semibold">
                            <span className={`inline-block rounded px-2 py-1 ${
                              (stockProductos[hijo.producto_hijo_id || 0] ?? 0) > 0
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {formatearNumero(stockProductos[hijo.producto_hijo_id || 0] ?? 0)}
                            </span>
                          </td>
                          <td className="py-3 px-4 dark:text-white text-center">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={hijo.cantidad_hijo || ''}
                              onChange={(e) => actualizarCantidadHijo(linea.id, hijo.id, e.target.value)}
                              placeholder="0"
                              className="w-20 text-center"
                            />
                          </td>
                          <td className="py-3 px-4 dark:text-gray-400 text-center">{hijo.unidad_hijo}</td>
                          {idx === 0 && (
                            <td className="py-3 px-4 text-center" rowSpan={linea.productos_hijos.length}>
                              <button
                                type="button"
                                onClick={() => eliminarLinea(linea.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 inline-flex"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3 items-end justify-end">
              <Button type="submit" disabled={loading || lineas.length === 0}>
                {loading ? 'Registrando...' : 'Registrar Fraccionamientos'}
              </Button>
              <Button
                type="button"
                onClick={() => router.visit('/inventario/fraccionamientos-masivos')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
