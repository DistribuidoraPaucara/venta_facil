import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Select } from '@/presentation/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface LineaFraccionamiento {
  id: string;
  producto_padre_id: number | null;
  cantidad_padre: number;
  producto_hijo_id: number | null;
  cantidad_hijo: number;
  factor_conversion: number;
}

export default function CrearFraccionamientoMasivo() {
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [sectores, setSectores] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
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
  }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarData();
  }, []);

  const cargarData = async () => {
    try {
      const [almRes, sectRes, prodRes] = await Promise.all([
        fetch('/api/almacenes').then(r => r.json()),
        fetch('/api/sectores').then(r => r.json()),
        fetch('/api/fraccionamientos/productos/disponibles').then(r => r.json()),
      ]);
      setAlmacenes(almRes.data || []);
      setSectores(sectRes.data || []);
      setProductos(prodRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const agregarLinea = () => {
    setLineas([...lineas, {
      id: Math.random().toString(),
      producto_padre_id: null,
      cantidad_padre: 0,
      producto_hijo_id: null,
      cantidad_hijo: 0,
      factor_conversion: 0,
    }]);
  };

  const eliminarLinea = (id: string) => {
    if (lineas.length > 1) {
      setLineas(lineas.filter(l => l.id !== id));
    }
  };

  const actualizarLinea = (id: string, updates: Partial<LineaFraccionamiento>) => {
    setLineas(lineas.map(l => {
      if (l.id === id) {
        const nueva = { ...l, ...updates };
        // Auto-calcular cantidad_hijo si cambió cantidad_padre
        if (updates.cantidad_padre !== undefined && l.factor_conversion > 0) {
          nueva.cantidad_hijo = updates.cantidad_padre * l.factor_conversion;
        }
        return nueva;
      }
      return l;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!almacenId || !sectorId) {
      alert('Selecciona almacén y sector');
      return;
    }

    const detalles = lineas.filter(l => l.producto_padre_id && l.producto_hijo_id && l.cantidad_padre > 0);
    if (detalles.length === 0) {
      alert('Debe haber al menos un fraccionamiento válido');
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
          sector_id: sectorId,
          razon,
          notas,
          detalles: detalles.map(l => ({
            producto_padre_id: l.producto_padre_id,
            cantidad_padre: l.cantidad_padre,
            producto_hijo_id: l.producto_hijo_id,
            cantidad_hijo: l.cantidad_hijo,
            factor_conversion: l.factor_conversion,
          })),
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
          <p className="text-gray-600 dark:text-gray-400 mb-8">Registra múltiples fraccionamientos en una sola operación</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Encabezado */}
            <Card className="p-6 space-y-4 dark:bg-gray-900 dark:border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Almacén *</label>
                  <Select value={almacenId?.toString() || ''} onValueChange={(v) => setAlmacenId(Number(v) || null)}>
                    <option value="">Selecciona almacén</option>
                    {almacenes.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Sector *</label>
                  <Select value={sectorId?.toString() || ''} onValueChange={(v) => setSectorId(Number(v) || null)} disabled={!almacenId}>
                    <option value="">Selecciona sector</option>
                    {sectores.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Razón</label>
                  <Select value={razon} onValueChange={setRazon}>
                    <option value="fraccionamiento_manual">Fraccionamiento Manual</option>
                    <option value="fraccionamiento_compra">Por Compra</option>
                    <option value="reagrupamiento">Reagrupamiento</option>
                    <option value="ajuste_inventario">Ajuste de Inventario</option>
                  </Select>
                </div>

                <div>
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

            {/* Líneas */}
            <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Líneas de Fraccionamiento</h2>
              <div className="space-y-4">
                {lineas.map((linea, idx) => (
                  <div key={linea.id} className="p-4 border rounded-lg space-y-3 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm dark:text-white">Línea {idx + 1}</span>
                      {lineas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarLinea(linea.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 dark:text-gray-300">Producto Padre</label>
                        <select
                          value={linea.producto_padre_id || ''}
                          onChange={(e) => actualizarLinea(linea.id, { producto_padre_id: Number(e.target.value) || null })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          <option value="">Selecciona</option>
                          {productos.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1 dark:text-gray-300">Cantidad Padre</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={linea.cantidad_padre}
                          onChange={(e) => actualizarLinea(linea.id, { cantidad_padre: Number(e.target.value) })}
                          placeholder="0.00"
                          className="h-9"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1 dark:text-gray-300">Factor</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={linea.factor_conversion}
                          onChange={(e) => actualizarLinea(linea.id, { factor_conversion: Number(e.target.value) })}
                          placeholder="0.00"
                          className="h-9"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1 dark:text-gray-300">Cantidad Hijo</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={linea.cantidad_hijo}
                          onChange={(e) => actualizarLinea(linea.id, { cantidad_hijo: Number(e.target.value) })}
                          placeholder="0.00"
                          className="h-9"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1 dark:text-gray-300">Producto Hijo</label>
                        <select
                          value={linea.producto_hijo_id || ''}
                          onChange={(e) => actualizarLinea(linea.id, { producto_hijo_id: Number(e.target.value) || null })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          <option value="">Selecciona</option>
                          {productos.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={agregarLinea}
                className="mt-4 flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Agregar línea
              </button>
            </Card>

            {/* Acciones */}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar Fraccionamientos'}
              </Button>
              <Button
                type="button"
                onClick={() => router.visit('/inventario/fraccionamientos-masivos')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-900"
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
