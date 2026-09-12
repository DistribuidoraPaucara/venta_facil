import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Trash2 } from 'lucide-react';

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
  const [productos, setProductos] = useState<any[]>([]);
  const [almacenId, setAlmacenId] = useState<number | null>(null);
  const [razon, setRazon] = useState('fraccionamiento_manual');
  const [notas, setNotas] = useState('');

  const [lineas, setLineas] = useState<LineaFraccionamiento[]>([]);
  const [buscaProductoPadre, setBuscaProductoPadre] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarAlmacenes();
    cargarProductos();
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

  const cargarProductos = async () => {
    try {
      const res = await fetch('/api/inventario/fraccionamientos/productos/disponibles');
      const data = await res.json();
      console.log('Productos cargados:', data);

      // El endpoint devuelve un array en data.data
      const productosArray = Array.isArray(data.data) ? data.data : [];
      console.log('Total de productos:', productosArray.length);
      setProductos(productosArray);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProductos([]);
    }
  };

  const productosFilrados = Array.isArray(productos) ? productos.filter(p =>
    p.nombre?.toLowerCase().includes(buscaProductoPadre.toLowerCase()) ||
    p.sku?.toLowerCase().includes(buscaProductoPadre.toLowerCase())
  ) : [];

  const agregarProductoPadre = async (productoPadreId: number) => {
    const productosArray = Array.isArray(productos) ? productos : [];
    const productoPadre = productosArray.find((p: any) => p.id === productoPadreId);
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
    } catch (error) {
      console.error('Error cargando conversiones:', error);
      alert('Error al cargar los productos hijos');
    }
  };

  const actualizarCantidadPadre = (lineaId: string, cantidad: number) => {
    setLineas(lineas.map(linea => {
      if (linea.id === lineaId) {
        return {
          ...linea,
          cantidad_padre: cantidad,
          productos_hijos: linea.productos_hijos.map(hijo => ({
            ...hijo,
            cantidad_hijo: cantidad * hijo.factor_conversion,
          })),
        };
      }
      return linea;
    }));
  };

  const actualizarCantidadHijo = (lineaId: string, hijoId: string, cantidad: number) => {
    setLineas(lineas.map(linea => {
      if (linea.id === lineaId) {
        return {
          ...linea,
          productos_hijos: linea.productos_hijos.map(hijo =>
            hijo.id === hijoId ? { ...hijo, cantidad_hijo: cantidad } : hijo
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
      alert('Selecciona almacén');
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
      alert('Debe tener al menos un fraccionamiento válido');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/fraccionamientos-masivos', {
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
        alert(error.message || 'Error al registrar');
        return;
      }

      alert('Fraccionamientos registrados exitosamente');
      router.visit('/inventario/fraccionamientos-masivos');
    } catch (error: any) {
      alert(error.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Head title="Crear Fraccionamiento Masivo" />

      <div className="py-8 dark:bg-gray-950 min-h-screen">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Fraccionamiento Masivo</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Selecciona almacén, busca productos padre y carga sus conversiones</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Encabezado */}
            <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-white">Notas</label>
                  <Input
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Observaciones opcionales"
                  />
                </div>
              </div>
            </Card>

            {/* Búsqueda de productos */}
            {almacenId && (
              <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
                <label className="block text-sm font-medium mb-2 dark:text-white">Buscar Producto Padre</label>
                <div className="relative z-20">
                  <Input
                    type="text"
                    value={buscaProductoPadre}
                    onChange={(e) => {
                      setBuscaProductoPadre(e.target.value);
                      setMostrarSugerencias(true);
                    }}
                    onFocus={() => setMostrarSugerencias(true)}
                    placeholder="Por nombre o SKU"
                  />
                  {mostrarSugerencias && buscaProductoPadre && productosFilrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md mt-1 max-h-64 overflow-y-auto shadow-lg">
                      {productosFilrados.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => agregarProductoPadre(p.id)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-sm dark:text-white">{p.nombre}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {p.sku}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {mostrarSugerencias && buscaProductoPadre && productosFilrados.length === 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md mt-1 p-3 text-center text-gray-500 dark:text-gray-400 shadow-lg">
                      No se encontraron productos
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Líneas agregadas */}
            {lineas.length > 0 && (
              <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Productos a Fraccionar</h2>
                <div className="space-y-4">
                  {lineas.map((linea) => (
                    <div key={linea.id} className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold dark:text-white">{linea.producto_padre_nombre}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Cantidad Padre ({linea.unidad_padre})</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarLinea(linea.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mb-3">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={linea.cantidad_padre}
                          onChange={(e) => actualizarCantidadPadre(linea.id, Number(e.target.value))}
                          placeholder="0.00"
                        />
                      </div>

                      {linea.productos_hijos.length > 0 && (
                        <div className="space-y-2 border-t dark:border-gray-700 pt-3">
                          <p className="text-sm font-medium dark:text-white">Productos Hijos Generados:</p>
                          {linea.productos_hijos.map(hijo => (
                            <div key={hijo.id} className="flex gap-2 items-center">
                              <span className="text-sm flex-1 dark:text-gray-300">{hijo.producto_hijo_nombre}</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={hijo.cantidad_hijo}
                                onChange={(e) => actualizarCantidadHijo(linea.id, hijo.id, Number(e.target.value))}
                                placeholder="0.00"
                                className="w-24"
                              />
                              <span className="text-sm w-16 dark:text-gray-400">{hijo.unidad_hijo}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Acciones */}
            <div className="flex gap-3">
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
