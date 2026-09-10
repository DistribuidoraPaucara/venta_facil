import { Head } from '@inertiajs/react';
import { route } from '@/infrastructure/routing/routes';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { AlertTriangle, AlertCircle, TrendingDown } from 'lucide-react';

interface Sector {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  sku: string;
  unidad?: { nombre: string };
  marca?: { nombre: string };
  stock_actual?: number;
  stock_minimo_requerido?: number;
  stock_maximo_requerido?: number;
  cantidad_sugerida?: number;
  sector?: Sector;
}

interface Almacen {
  id: number;
  nombre: string;
}

interface Props {
  productosParaComprar: Producto[];
  almacenPrincipal: Almacen | null;
}

function ComprasIndex({ productosParaComprar, almacenPrincipal }: Props) {
  const formatearNumero = (num: number | string | undefined): string => {
    if (num === undefined || num === null || num === '') return '0';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '0';
    if (Number.isInteger(n)) return n.toString();
    return parseFloat(n.toFixed(2)).toString();
  };

  const getEstadoColor = (stock: number, minimo: number) => {
    if (stock === 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950';
    if (stock < minimo * 0.5) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950';
    if (stock < minimo) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950';
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
  };

  return (
    <>
      <Head title="Productos para Comprar" />
      <div className="py-6 px-3">
        <div className="flex items-center gap-3 mb-6">
          <TrendingDown size={32} className="text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold">Productos para Comprar</h1>
            <p className="text-gray-600 dark:text-gray-400">Productos que necesitan reorden</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Análisis de Stock - Almacén Principal</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {almacenPrincipal?.nombre}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {productosParaComprar.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">productos por debajo del mínimo</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {productosParaComprar.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <AlertCircle size={48} className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  ✅ Todos los productos tienen stock suficiente
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  No hay necesidad de realizar compras en este momento
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Producto</th>
                      <th className="text-left py-3 px-4">SKU</th>
                      <th className="text-left py-3 px-4">Marca</th>
                      <th className="text-center py-3 px-4">Sector</th>
                      <th className="text-center py-3 px-4">Stock Actual</th>
                      <th className="text-center py-3 px-4">Stock Mínimo</th>
                      <th className="text-center py-3 px-4">Stock Máximo</th>
                      <th className="text-center py-3 px-4">Diferencia</th>
                      <th className="text-center py-3 px-4">Cantidad Sugerida</th>
                      <th className="text-center py-3 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosParaComprar.map((producto) => {
                      const diferencia = (producto.stock_minimo_requerido ?? 0) - (producto.stock_actual ?? 0);
                      const estadoColor = getEstadoColor(producto.stock_actual ?? 0, producto.stock_minimo_requerido ?? 0);

                      return (
                        <tr
                          key={producto.id}
                          className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${estadoColor}`}
                        >
                          <td className="py-3 px-4 font-semibold">#{producto.id}</td>
                          <td className="py-3 px-4 font-medium">{producto.nombre}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{producto.sku}</td>
                          <td className="py-3 px-4 text-sm">{producto.marca?.nombre || '-'}</td>
                          <td className="py-3 px-4 text-center text-sm font-medium text-purple-600 dark:text-purple-400">
                            {producto.sector?.nombre || '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold">
                            {formatearNumero(producto.stock_actual)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {formatearNumero(producto.stock_minimo_requerido)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {formatearNumero(producto.stock_maximo_requerido)}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-red-600 dark:text-red-400">
                            +{formatearNumero(diferencia)}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-blue-600 dark:text-blue-400">
                            {formatearNumero(producto.cantidad_sugerida)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {(producto.stock_actual ?? 0) === 0 ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                                <AlertTriangle size={14} />
                                CRÍTICO
                              </span>
                            ) : (producto.stock_actual ?? 0) < (producto.stock_minimo_requerido ?? 0) * 0.5 ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                                <AlertCircle size={14} />
                                BAJO
                              </span>
                            ) : (
                              <span className="font-semibold text-yellow-600 dark:text-yellow-400">ALERTA</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen */}
        {productosParaComprar.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Resumen de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Productos Críticos (Stock = 0)</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                    {productosParaComprar.filter((p) => (p.stock_actual ?? 0) === 0).length}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Productos en Alerta</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                    {productosParaComprar.length}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cantidad Total a Comprar</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {formatearNumero(
                      productosParaComprar.reduce((sum, p) => sum + (p.cantidad_sugerida ?? 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

ComprasIndex.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default ComprasIndex;
