import { Head, router } from '@inertiajs/react';
import { route } from '@/infrastructure/routing/routes';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Settings, Save, AlertCircle, Search, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import axios from 'axios';

interface Sector {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  sku: string;
  unidad?: string;
  marca?: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  sector_id?: number;
  sector_nombre?: string;
  stock_limite_id?: number;
  stock_producto_id?: number;
}

interface Almacen {
  id: number;
  nombre: string;
}

interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

interface Props {
  productos: Producto[];
  pagination: Pagination;
  almacenSeleccionado: Almacen | null;
  sectorSeleccionado: Sector | null;
  almacenes: Almacen[];
  sectores: Sector[];
}

function ConfiguracionStockIndex({ productos, pagination, almacenSeleccionado, sectorSeleccionado, almacenes, sectores }: Props) {
  const [editando, setEditando] = useState<Record<number, Producto>>({});
  const [guardando, setGuardando] = useState<Set<number>>(new Set());
  const [busqueda, setBusqueda] = useState('');

  // Filtrar productos según búsqueda
  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return productos;

    const termino = busqueda.toLowerCase();
    return productos.filter(p =>
      p.id.toString().includes(termino) ||
      p.nombre.toLowerCase().includes(termino) ||
      p.sku.toLowerCase().includes(termino) ||
      p.marca?.toLowerCase().includes(termino) ||
      p.sector_nombre?.toLowerCase().includes(termino)
    );
  }, [productos, busqueda]);

  const handleCambio = (productoId: number, campo: string, valor: any) => {
    const productoActual = editando[productoId] || productos.find(p => p.id === productoId);
    if (productoActual) {
      setEditando({
        ...editando,
        [productoId]: {
          ...productoActual,
          [campo]: valor,
        },
      });
    }
  };

  const guardarCambios = async (productoId: number) => {
    const productoEditado = editando[productoId];
    if (!productoEditado) return;

    setGuardando(new Set([...guardando, productoId]));

    try {
      await axios.post('/inventario/configuracion-stock/actualizar', {
        producto_id: productoId,
        almacen_id: almacenSeleccionado?.id,
        stock_minimo: productoEditado.stock_minimo,
        stock_maximo: productoEditado.stock_maximo,
        stock_actual: productoEditado.stock_actual,
        sector_id: productoEditado.sector_id,
      });

      // Limpiar el estado de edición
      const nuevoEditando = { ...editando };
      delete nuevoEditando[productoId];
      setEditando(nuevoEditando);

      // Recargar la página para mostrar los datos actualizados
      router.get(window.location.href);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setGuardando(prev => {
        const nuevo = new Set(prev);
        nuevo.delete(productoId);
        return nuevo;
      });
    }
  };

  const obtenerProductoActual = (producto: Producto) => {
    return editando[producto.id] || producto;
  };

  const formatearNumero = (num: number | string | undefined): string => {
    if (num === undefined || num === null || num === '') return '0';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '0';
    if (Number.isInteger(n)) return n.toString();
    return parseFloat(n.toFixed(2)).toString();
  };

  return (
    <>
      <Head title="Configuración de Stock" />
      <div className="py-6 px-3">
        <div className="flex items-center gap-3 mb-6">
          <Settings size={32} className="text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold">Configuración de Stock</h1>
            <p className="text-gray-600 dark:text-gray-400">Administra límites y cantidades de productos</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle>Productos - {almacenSeleccionado?.nombre}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {productos.length} productos disponibles
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  value={almacenSeleccionado?.id || ''}
                  onChange={(e) => {
                    const almacenId = e.target.value;
                    const sectorId = sectorSeleccionado?.id;
                    const params = new URLSearchParams({ almacen_id: almacenId });
                    if (sectorId) params.append('sector_id', sectorId.toString());
                    router.visit(`/inventario/configuracion-stock?${params.toString()}`);
                  }}
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded px-3 py-2 text-sm"
                >
                  {almacenes.map((almacen) => (
                    <option key={almacen.id} value={almacen.id}>
                      {almacen.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={sectorSeleccionado?.id || ''}
                  onChange={(e) => {
                    const sectorId = e.target.value;
                    const almacenId = almacenSeleccionado?.id;
                    const params = new URLSearchParams({ almacen_id: almacenId?.toString() || '' });
                    if (sectorId) params.append('sector_id', sectorId);
                    router.visit(`/inventario/configuracion-stock?${params.toString()}`);
                  }}
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded px-3 py-2 text-sm"
                >
                  <option value="">Todos los sectores</option>
                  {sectores.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Buscador */}
            <div className="mb-6 flex gap-2">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por ID, código de barras, SKU, marca, sector..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Indicador de resultados */}
            {busqueda && (
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Mostrando {productosFiltrados.length} de {productos.length} productos
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">Producto</th>
                    <th className="text-left py-3 px-4">SKU</th>
                    <th className="text-center py-3 px-4">Sector</th>
                    <th className="text-center py-3 px-4">Stock Actual</th>
                    <th className="text-center py-3 px-4">Stock Mínimo</th>
                    <th className="text-center py-3 px-4">Stock Máximo</th>
                    <th className="text-center py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        {busqueda ? 'No se encontraron productos que coincidan con la búsqueda' : 'No hay productos disponibles'}
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map((producto) => {
                    const actual = obtenerProductoActual(producto);
                    const estoy_editando = !!editando[producto.id];
                    const estoy_guardando = guardando.has(producto.id);

                    return (
                      <tr key={producto.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="py-3 px-4 font-semibold">#{producto.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{producto.nombre}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {producto.marca && `${producto.marca} •`} {producto.unidad}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{producto.sku}</td>
                        <td className="py-3 px-4 text-center text-sm">
                          {estoy_editando ? (
                            <select
                              value={actual.sector_id || ''}
                              onChange={(e) => handleCambio(producto.id, 'sector_id', e.target.value ? Number(e.target.value) : null)}
                              className="border border-blue-500 dark:border-blue-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded px-2 py-1 text-sm w-full"
                            >
                              <option value="">Sin sector</option>
                              {sectores.map((sector) => (
                                <option key={sector.id} value={sector.id}>
                                  {sector.nombre}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-medium text-purple-600 dark:text-purple-400">
                              {producto.sector_nombre || '-'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {estoy_editando ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formatearNumero(actual.stock_actual)}
                              onChange={(e) => handleCambio(producto.id, 'stock_actual', Number(e.target.value))}
                              className="w-20 border border-blue-500 dark:border-blue-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded px-2 py-1 text-center"
                            />
                          ) : (
                            <span className="font-semibold">{formatearNumero(actual.stock_actual)}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {estoy_editando ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formatearNumero(actual.stock_minimo)}
                              onChange={(e) => handleCambio(producto.id, 'stock_minimo', Number(e.target.value))}
                              className="w-20 border border-blue-500 dark:border-blue-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded px-2 py-1 text-center"
                            />
                          ) : (
                            <span>{formatearNumero(actual.stock_minimo)}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {estoy_editando ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formatearNumero(actual.stock_maximo)}
                              onChange={(e) => handleCambio(producto.id, 'stock_maximo', Number(e.target.value))}
                              className="w-20 border border-blue-500 dark:border-blue-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded px-2 py-1 text-center"
                            />
                          ) : (
                            <span>{formatearNumero(actual.stock_maximo)}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {estoy_editando ? (
                            <div className="flex gap-2 justify-center">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => guardarCambios(producto.id)}
                                disabled={estoy_guardando}
                                className="flex items-center gap-1"
                              >
                                <Save size={14} />
                                {estoy_guardando ? 'Guardando...' : 'Guardar'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const nuevoEditando = { ...editando };
                                  delete nuevoEditando[producto.id];
                                  setEditando(nuevoEditando);
                                }}
                                disabled={estoy_guardando}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditando({ ...editando, [producto.id]: { ...producto } })}
                            >
                              Editar
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.last_page > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm border-t pt-6">
                <div className="text-gray-600 dark:text-gray-400">
                  Mostrando {(pagination.current_page - 1) * pagination.per_page + 1} a{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de{' '}
                  {pagination.total} productos
                </div>
                <div className="flex gap-2">
                  {pagination.current_page > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const params = new URLSearchParams({
                          almacen_id: almacenSeleccionado?.id?.toString() || '',
                          page: (pagination.current_page - 1).toString(),
                        });
                        if (sectorSeleccionado?.id) params.append('sector_id', sectorSeleccionado.id.toString());
                        router.visit(`/inventario/configuracion-stock?${params.toString()}`);
                      }}
                    >
                      ← Anterior
                    </Button>
                  )}
                  <span className="px-3 py-1 text-gray-600 dark:text-gray-400">
                    Página {pagination.current_page} de {pagination.last_page}
                  </span>
                  {pagination.current_page < pagination.last_page && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const params = new URLSearchParams({
                          almacen_id: almacenSeleccionado?.id?.toString() || '',
                          page: (pagination.current_page + 1).toString(),
                        });
                        if (sectorSeleccionado?.id) params.append('sector_id', sectorSeleccionado.id.toString());
                        router.visit(`/inventario/configuracion-stock?${params.toString()}`);
                      }}
                    >
                      Siguiente →
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

ConfiguracionStockIndex.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default ConfiguracionStockIndex;
