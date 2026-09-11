import { useState, useEffect } from 'react';
import Button from '@/presentation/components/ui/Button';
import Card from '@/presentation/components/ui/Card';
import Input from '@/presentation/components/ui/Input';
import Select from '@/presentation/components/ui/Select';
import InputSearchSelect from '@/presentation/components/ui/input-search-select';
import { fetchAlmacenes } from '@/actions/App/Http/Controllers/Api/AlmacenController';
import { fetchSectores } from '@/actions/App/Http/Controllers/Api/SectorController';
import { productosDisponibles } from '@/actions/App/Http/Controllers/Api/FraccionamientoApiController';
import { registrarFraccionamientoMasivo } from '@/actions/App/Http/Controllers/Api/FraccionamientoMasivoApiController';
import toast from 'react-hot-toast';
import { useRouter } from '@inertiajs/react';
import { ChevronDownIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';

interface LineaFraccionamiento {
  id: string;
  producto_padre_id: number | null;
  cantidad_padre: number;
  producto_hijo_id: number | null;
  cantidad_hijo: number;
  factor_conversion: number;
  unidad_padre_nombre: string;
  unidad_hijo_nombre: string;
  producto_padre_nombre: string;
  producto_hijo_nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  sku: string;
  unidad_medida_id: number;
  unidad_nombre: string;
}

export default function CrearFraccionamientoMasivo() {
  const router = useRouter();
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [sectores, setSectores] = useState<any[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [almacenId, setAlmacenId] = useState<number | null>(null);
  const [sectorId, setSectorId] = useState<number | null>(null);
  const [razon, setRazon] = useState('fraccionamiento_manual');
  const [notas, setNotas] = useState('');

  const [lineas, setLineas] = useState<LineaFraccionamiento[]>([{
    id: Math.random().toString(),
    producto_padre_id: null,
    cantidad_padre: 0,
    producto_hijo_id: null,
    cantidad_hijo: 0,
    factor_conversion: 0,
    unidad_padre_nombre: '',
    unidad_hijo_nombre: '',
    producto_padre_nombre: '',
    producto_hijo_nombre: '',
  }]);

  const [loading, setLoading] = useState(false);
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set([lineas[0].id]));

  useEffect(() => {
    cargarAlmacenes();
    cargarProductos();
  }, []);

  useEffect(() => {
    if (almacenId) {
      cargarSectores();
    }
  }, [almacenId]);

  const cargarAlmacenes = async () => {
    try {
      const response = await fetchAlmacenes();
      setAlmacenes(response.data || []);
    } catch (error) {
      toast.error('Error cargando almacenes');
    }
  };

  const cargarSectores = async () => {
    try {
      const response = await fetchSectores();
      setSectores(response.data || []);
    } catch (error) {
      toast.error('Error cargando sectores');
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await productosDisponibles();
      const datos = response.data || [];
      setProductos(
        datos.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          sku: p.sku,
          unidad_medida_id: p.unidad_medida_id,
          unidad_nombre: p.unidad_nombre,
        }))
      );
    } catch (error) {
      toast.error('Error cargando productos');
    }
  };

  const handleProductoPadreChange = (lineaId: string, productoId: number | null) => {
    setLineas(lineas.map(l => {
      if (l.id === lineaId) {
        const producto = productos.find(p => p.id === productoId);
        return {
          ...l,
          producto_padre_id: productoId,
          producto_padre_nombre: producto?.nombre || '',
          unidad_padre_nombre: producto?.unidad_nombre || '',
        };
      }
      return l;
    }));
  };

  const handleProductoHijoChange = (lineaId: string, productoId: number | null) => {
    setLineas(lineas.map(l => {
      if (l.id === lineaId && productoId) {
        const producto = productos.find(p => p.id === productoId);
        return {
          ...l,
          producto_hijo_id: productoId,
          producto_hijo_nombre: producto?.nombre || '',
          unidad_hijo_nombre: producto?.unidad_nombre || '',
        };
      }
      return l;
    }));
  };

  const handleCantidadPadreChange = (lineaId: string, cantidad: number) => {
    setLineas(lineas.map(l => {
      if (l.id === lineaId) {
        return {
          ...l,
          cantidad_padre: cantidad,
          cantidad_hijo: l.factor_conversion > 0 ? cantidad * l.factor_conversion : 0,
        };
      }
      return l;
    }));
  };

  const handleCantidadHijoChange = (lineaId: string, cantidad: number) => {
    setLineas(lineas.map(l => {
      if (l.id === lineaId) {
        return {
          ...l,
          cantidad_hijo: cantidad,
          factor_conversion: l.cantidad_padre > 0 ? cantidad / l.cantidad_padre : 0,
        };
      }
      return l;
    }));
  };

  const handleFactorChange = (lineaId: string, factor: number) => {
    setLineas(lineas.map(l => {
      if (l.id === lineaId) {
        return {
          ...l,
          factor_conversion: factor,
          cantidad_hijo: l.cantidad_padre * factor,
        };
      }
      return l;
    }));
  };

  const agregarLinea = () => {
    setLineas([...lineas, {
      id: Math.random().toString(),
      producto_padre_id: null,
      cantidad_padre: 0,
      producto_hijo_id: null,
      cantidad_hijo: 0,
      factor_conversion: 0,
      unidad_padre_nombre: '',
      unidad_hijo_nombre: '',
      producto_padre_nombre: '',
      producto_hijo_nombre: '',
    }]);
  };

  const eliminarLinea = (lineaId: string) => {
    if (lineas.length > 1) {
      setLineas(lineas.filter(l => l.id !== lineaId));
      const nuevas = new Set(expandedLines);
      nuevas.delete(lineaId);
      setExpandedLines(nuevas);
    } else {
      toast.error('Debe haber al menos una línea de fraccionamiento');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!almacenId || !sectorId) {
      toast.error('Selecciona almacén y sector');
      return;
    }

    const detallesValidos = lineas.filter(
      l => l.producto_padre_id && l.producto_hijo_id && l.cantidad_padre > 0 && l.cantidad_hijo > 0
    );

    if (detallesValidos.length === 0) {
      toast.error('Debe tener al menos un fraccionamiento válido');
      return;
    }

    setLoading(true);
    try {
      await registrarFraccionamientoMasivo({
        almacen_id: almacenId,
        sector_id: sectorId,
        razon: razon as any,
        notas,
        detalles: detallesValidos.map(l => ({
          producto_padre_id: l.producto_padre_id!,
          cantidad_padre: l.cantidad_padre,
          producto_hijo_id: l.producto_hijo_id!,
          cantidad_hijo: l.cantidad_hijo,
          factor_conversion: l.factor_conversion,
        })),
      });

      toast.success('Fraccionamientos registrados exitosamente');
      router.visit(route('inventario.fraccionamientos'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (lineaId: string) => {
    const nuevas = new Set(expandedLines);
    if (nuevas.has(lineaId)) {
      nuevas.delete(lineaId);
    } else {
      nuevas.add(lineaId);
    }
    setExpandedLines(nuevas);
  };

  const isLineaValida = (linea: LineaFraccionamiento) =>
    linea.producto_padre_id && linea.producto_hijo_id && linea.cantidad_padre > 0 && linea.cantidad_hijo > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Fraccionamiento Masivo</h1>
          <p className="text-gray-600 mt-2">Registra múltiples fraccionamientos en una sola operación</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Encabezado */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Almacén *"
                value={almacenId || ''}
                onChange={(e) => setAlmacenId(Number(e.target.value) || null)}
                required
              >
                <option value="">Selecciona almacén</option>
                {almacenes.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </Select>

              <Select
                label="Sector *"
                value={sectorId || ''}
                onChange={(e) => setSectorId(Number(e.target.value) || null)}
                disabled={!almacenId}
                required
              >
                <option value="">Selecciona sector</option>
                {sectores.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </Select>

              <Select
                label="Razón"
                value={razon}
                onChange={(e) => setRazon(e.target.value)}
              >
                <option value="fraccionamiento_manual">Fraccionamiento Manual</option>
                <option value="fraccionamiento_compra">Por Compra</option>
                <option value="reagrupamiento">Reagrupamiento</option>
                <option value="ajuste_inventario">Ajuste de Inventario</option>
              </Select>

              <Input
                label="Notas"
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones opcionales"
              />
            </div>
          </Card>

          {/* Líneas de fraccionamiento */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles de Fraccionamiento</h2>
            <div className="space-y-3">
              {lineas.map((linea, indice) => {
                const valida = isLineaValida(linea);
                return (
                  <div key={linea.id} className={`border rounded-lg ${!valida ? 'bg-amber-50 border-amber-200' : ''}`}>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(linea.id)}
                      className={`w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 ${!valida ? 'hover:bg-amber-100' : ''}`}
                    >
                      <div className="text-left flex-1">
                        <span className="font-semibold">
                          Línea {indice + 1}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          {linea.producto_padre_nombre || '(sin producto padre)'} → {linea.producto_hijo_nombre || '(sin producto hijo)'}
                        </span>
                        {valida && (
                          <span className="text-sm text-green-600 ml-2">✓ Válida</span>
                        )}
                      </div>
                      <ChevronDownIcon
                        className={`w-5 h-5 transition-transform ${
                          expandedLines.has(linea.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {expandedLines.has(linea.id) && (
                      <div className="px-4 pb-4 space-y-4 border-t bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Producto Padre *
                            </label>
                            <InputSearchSelect
                              value={linea.producto_padre_id}
                              onChange={(id) => handleProductoPadreChange(linea.id, id)}
                              options={productos.map(p => ({
                                id: p.id,
                                label: `${p.nombre} (${p.sku})`,
                              }))}
                              placeholder="Busca producto padre"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cantidad Padre ({linea.unidad_padre_nombre || 'Unidad'}) *
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={linea.cantidad_padre || ''}
                              onChange={(e) => handleCantidadPadreChange(linea.id, Number(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Producto Hijo *
                            </label>
                            <InputSearchSelect
                              value={linea.producto_hijo_id}
                              onChange={(id) => handleProductoHijoChange(linea.id, id)}
                              options={productos.map(p => ({
                                id: p.id,
                                label: `${p.nombre} (${p.sku})`,
                              }))}
                              placeholder="Busca producto hijo"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Factor de Conversión
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={linea.factor_conversion || ''}
                              onChange={(e) => handleFactorChange(linea.id, Number(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cantidad Hijo ({linea.unidad_hijo_nombre || 'Unidad'}) *
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={linea.cantidad_hijo || ''}
                              onChange={(e) => handleCantidadHijoChange(linea.id, Number(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {lineas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarLinea(linea.id)}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Eliminar línea
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={agregarLinea}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <PlusIcon className="w-5 h-5" />
              Agregar línea
            </button>
          </Card>

          {/* Resumen */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total líneas</p>
                <p className="text-2xl font-bold text-blue-600">{lineas.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Líneas válidas</p>
                <p className="text-2xl font-bold text-green-600">{lineas.filter(isLineaValida).length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Por registrar</p>
                <p className={`text-2xl font-bold ${lineas.filter(isLineaValida).length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {lineas.filter(isLineaValida).length}
                </p>
              </div>
            </div>
          </Card>

          {/* Acciones */}
          <div className="flex gap-4">
            <Button
              type="submit"
              loading={loading}
              disabled={lineas.filter(isLineaValida).length === 0}
              className="flex-1"
            >
              Registrar {lineas.filter(isLineaValida).length > 0 ? `(${lineas.filter(isLineaValida).length})` : 'Fraccionamientos'}
            </Button>
            <Button
              type="button"
              onClick={() => router.visit(route('inventario.fraccionamientos'))}
              className="bg-gray-300 hover:bg-gray-400 text-gray-900"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
