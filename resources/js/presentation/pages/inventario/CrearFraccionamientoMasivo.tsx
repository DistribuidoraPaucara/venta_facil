import { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Trash2 } from 'lucide-react';
import NotificationService from '@/infrastructure/services/notification.service';

interface Almacen {
  id: number;
  nombre: string;
}

interface ProductoBuscado {
  id: number;
  nombre: string;
  sku?: string;
  unidad_nombre?: string;
  codigos?: Array<{ codigo: string }>;
  stocks?: Array<{ almacen_id: number; cantidad_disponible: number }>;
  fraccionable?: boolean;
}

// Un par padre → hijo. Un padre con varios hijos tiene una fila por hijo, cada una con su propia cantidad de padre:
// el padre se descuenta la SUMA de sus filas (antes se mandaba la misma cantidad en cada hijo y se descontaba repetida)
interface FilaHijo {
  key: string;
  producto_hijo_id: number;
  nombre: string;
  unidad: string;
  factor: number;
  cantidad_padre: number;
  cantidad_hijo: number;
}

interface LineaFraccionamiento {
  key: string;
  producto_padre_id: number;
  nombre: string;
  unidad: string;
  hijos: FilaHijo[];
}

const nuevaKey = () => Math.random().toString(36).slice(2);

const formatearNumero = (num: number): string => {
  if (!Number.isFinite(num)) return '0';
  return Number.isInteger(num) ? String(num) : parseFloat(num.toFixed(2)).toString();
};

// Disponible del producto en el almacén, a partir de los registros de stock que trae la búsqueda
const disponibleEn = (p: ProductoBuscado, almacenId: number | null) =>
  (p.stocks ?? []).filter((s) => Number(s.almacen_id) === Number(almacenId)).reduce((t, s) => t + Number(s.cantidad_disponible || 0), 0);

export default function CrearFraccionamientoMasivo() {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [almacenId, setAlmacenId] = useState<number | null>(null);
  const [razon, setRazon] = useState('fraccionamiento_manual');
  const [notas, setNotas] = useState('');

  const [lineas, setLineas] = useState<LineaFraccionamiento[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<ProductoBuscado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  // Producto que coincide exacto con lo buscado pero no se puede fraccionar (sin productos hijo configurados)
  const [noFraccionable, setNoFraccionable] = useState<ProductoBuscado | null>(null);
  const [loading, setLoading] = useState(false);

  // Disponible de cada producto (padres e hijos) en el almacén elegido
  const [stockAlmacen, setStockAlmacen] = useState<Record<number, number>>({});

  // useRef: un "let" en el componente se reiniciaba en cada render y la espera (debounce) nunca se cancelaba
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimaBusquedaRef = useRef(''); // para descartar respuestas de una búsqueda anterior
  const buscadorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/almacenes');
        const data = await res.json();
        const lista: Almacen[] = Array.isArray(data) ? data : data.data || [];
        setAlmacenes(lista);
        // Por defecto el almacén principal (o el único)
        const principal = lista.find((a) => /principal/i.test(a.nombre)) ?? (lista.length === 1 ? lista[0] : null);
        if (principal) setAlmacenId(principal.id);
      } catch (error) {
        console.error('Error cargando almacenes:', error);
      }
    })();
  }, []);

  const cargarStocks = async (ids: number[], almacen = almacenId) => {
    if (!almacen || ids.length === 0) return;
    try {
      const res = await fetch(`/api/productos/stock-total?almacen_id=${almacen}&product_ids=${ids.join(',')}`);
      const data = await res.json();
      if (data.success && data.data) {
        setStockAlmacen((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(data.data).map(([id, v]) => [id, Number(v)])) }));
      }
    } catch (error) {
      console.error('Error cargando stocks:', error);
    }
  };

  // Al cambiar de almacén, el disponible de lo ya agregado es otro
  useEffect(() => {
    if (!almacenId) return;
    setStockAlmacen({});
    setResultados([]);
    const ids = lineas.flatMap((l) => [l.producto_padre_id, ...l.hijos.map((h) => h.producto_hijo_id)]);
    cargarStocks(ids, almacenId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [almacenId]);

  // Mínimo 2 caracteres, salvo un ID (solo dígitos: el producto #7 se busca con "7")
  const terminoValido = (termino: string) => termino.trim().length >= 2 || /^\d+$/.test(termino.trim());

  // Devuelve los resultados (para Enter) además de mostrarlos; [] si quedó obsoleta o falló
  const buscar = async (termino: string): Promise<ProductoBuscado[]> => {
    ultimaBusquedaRef.current = termino;
    if (!terminoValido(termino)) {
      setResultados([]);
      setBuscando(false);
      return [];
    }
    setBuscando(true);
    try {
      const res = await fetch(
        `/api/inventario/fraccionamientos/productos/disponibles?solo_fraccionables=1&search=${encodeURIComponent(termino.trim())}`,
      );
      const data = await res.json();
      if (ultimaBusquedaRef.current !== termino) return []; // llegó tarde: ya se buscó otra cosa
      const lista: ProductoBuscado[] = Array.isArray(data.data) ? data.data : [];
      setResultados(lista);
      return lista;
    } catch (error) {
      console.error('Error buscando productos:', error);
      setResultados([]);
      return [];
    } finally {
      if (ultimaBusquedaRef.current === termino) setBuscando(false);
    }
  };

  // Producto cuyo ID, SKU o código de barras es exactamente lo escrito (sin distinguir mayúsculas).
  // Prioridad como en ventas/compras: primero el ID; si ningún producto tiene ese ID, el SKU; después el código de barras
  const coincidenciaExacta = (lista: ProductoBuscado[], termino: string) => {
    const t = termino.trim().toLowerCase();
    return (
      (/^\d+$/.test(t) ? lista.find((p) => String(p.id) === t) : undefined) ??
      lista.find((p) => (p.sku ?? '').toLowerCase() === t) ??
      lista.find((p) => (p.codigos ?? []).some((c) => String(c.codigo).toLowerCase() === t))
    );
  };

  // Enter (o el escáner, que escribe y da Enter de inmediato): busca YA, sin esperar el debounce, y agrega el
  // producto exacto; si no hay exacto pero solo un resultado, ese; si hay varios, quedan en la lista para elegir
  const confirmarBusqueda = async () => {
    const termino = busqueda;
    if (!terminoValido(termino)) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const lista = await buscar(termino);
    if (ultimaBusquedaRef.current !== termino) return; // se siguió escribiendo

    const elegido = coincidenciaExacta(lista, termino) ?? (lista.length === 1 ? lista[0] : undefined);
    if (elegido) {
      agregarProductoPadre(elegido);
    } else if (lista.length === 0) {
      // ¿Existe pero no es fraccionable? Decir cuál y por qué, en vez de "no se encontró"
      const existente = await buscarExactoSinFiltro(termino);
      if (ultimaBusquedaRef.current !== termino) return;
      setNoFraccionable(existente ?? null);
      setMostrarSugerencias(true);
      NotificationService.warning(
        existente
          ? `#${existente.id} ${existente.nombre} no se puede fraccionar: no tiene productos hijo configurados`
          : `No existe un producto con ID, SKU o código "${termino.trim()}"`,
      );
    } else {
      setMostrarSugerencias(true);
      NotificationService.info(`${lista.length} productos coinciden con "${termino.trim()}": elige uno de la lista`);
    }
  };

  // Misma búsqueda sin el filtro de fraccionables, solo para explicar por qué un código no se puede agregar
  const buscarExactoSinFiltro = async (termino: string): Promise<ProductoBuscado | undefined> => {
    try {
      const res = await fetch(`/api/inventario/fraccionamientos/productos/disponibles?search=${encodeURIComponent(termino.trim())}`);
      const data = await res.json();
      return coincidenciaExacta(Array.isArray(data.data) ? data.data : [], termino);
    } catch {
      return undefined;
    }
  };

  const onCambioBusqueda = (valor: string) => {
    setNoFraccionable(null);
    setBusqueda(valor);
    setMostrarSugerencias(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscar(valor), 300);
  };

  const agregarProductoPadre = async (producto: ProductoBuscado) => {
    if (lineas.some((l) => l.producto_padre_id === producto.id)) {
      NotificationService.warning(`"${producto.nombre}" ya está en la lista: cambie su cantidad allí`);
      return;
    }

    try {
      const res = await fetch(`/api/inventario/fraccionamientos/producto/${producto.id}/conversiones`);
      const data = await res.json();
      const conversiones: any[] = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];

      if (conversiones.length === 0) {
        NotificationService.error(`"${producto.nombre}" no tiene productos hijo configurados (conversiones hacia otro producto).`);
        return;
      }

      const linea: LineaFraccionamiento = {
        key: nuevaKey(),
        producto_padre_id: producto.id,
        nombre: producto.nombre,
        unidad: producto.unidad_nombre || '',
        hijos: conversiones.map((conv) => ({
          key: nuevaKey(),
          producto_hijo_id: conv.producto_hijo_id,
          nombre: conv.producto_hijo?.nombre || `#${conv.producto_hijo_id}`,
          unidad: conv.unidad_destino_nombre || conv.producto_hijo?.unidad_nombre || '',
          factor: Number(conv.factor_conversion) || 0,
          cantidad_padre: 0,
          cantidad_hijo: 0,
        })),
      };

      setLineas((prev) => [...prev, linea]);
      setStockAlmacen((prev) => ({ ...prev, [producto.id]: disponibleEn(producto, almacenId) }));
      cargarStocks([producto.id, ...linea.hijos.map((h) => h.producto_hijo_id)]);

      setBusqueda('');
      setResultados([]);
      setMostrarSugerencias(false);
      setTimeout(() => buscadorRef.current?.focus(), 0); // listo para el siguiente
    } catch (error) {
      console.error('Error cargando conversiones:', error);
      NotificationService.error('Error al cargar los productos hijo');
    }
  };

  const actualizarHijo = (lineaKey: string, hijoKey: string, campo: 'cantidad_padre' | 'cantidad_hijo', valor: string) => {
    const n = valor === '' ? 0 : Number(valor) || 0;
    setLineas((prev) =>
      prev.map((l) =>
        l.key !== lineaKey
          ? l
          : {
              ...l,
              hijos: l.hijos.map((h) => {
                if (h.key !== hijoKey) return h;
                // La cantidad de padre recalcula la del hijo con el factor; la del hijo se puede ajustar a mano
                return campo === 'cantidad_padre' ? { ...h, cantidad_padre: n, cantidad_hijo: n * h.factor } : { ...h, cantidad_hijo: n };
              }),
            },
      ),
    );
  };

  const eliminarLinea = (lineaKey: string) => setLineas((prev) => prev.filter((l) => l.key !== lineaKey));

  // Por padre: cuánto se usa (suma de sus filas) y cuánto queda en el almacén
  const usoPadre = (l: LineaFraccionamiento) => l.hijos.reduce((t, h) => t + h.cantidad_padre, 0);
  const lineasSinStock = lineas.filter((l) => usoPadre(l) > (stockAlmacen[l.producto_padre_id] ?? 0) + 0.000001);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!almacenId) {
      NotificationService.warning('Selecciona un almacén');
      return;
    }
    if (lineasSinStock.length > 0) {
      NotificationService.error(`Stock insuficiente en el almacén: ${lineasSinStock.map((l) => l.nombre).join(', ')}`);
      return;
    }

    const detalles = lineas.flatMap((l) =>
      l.hijos
        .filter((h) => h.cantidad_padre > 0 && h.cantidad_hijo > 0)
        .map((h) => ({
          producto_padre_id: l.producto_padre_id,
          cantidad_padre: h.cantidad_padre,
          producto_hijo_id: h.producto_hijo_id,
          cantidad_hijo: h.cantidad_hijo,
          factor_conversion: h.factor || undefined,
        })),
    );

    if (detalles.length === 0) {
      NotificationService.warning('Ingrese la cantidad a fraccionar de al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/inventario/fraccionamientos-masivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ almacen_id: almacenId, sector_id: 0, razon, notas: notas.trim() || null, detalles }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
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

  const claseStock = (n: number) =>
    n > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  const selectClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white';

  return (
    <AppLayout>
      <Head title="Crear Fraccionamiento Masivo" />

      <div className="p-2 dark:bg-gray-950 min-h-screen">
        <div className="p-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Fraccionamiento Masivo</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Elige el almacén, busca los productos a fraccionar y escribe cuánto fraccionar de cada uno</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Encabezado */}
            <div className="p-2 dark:bg-gray-900 dark:border-gray-800 rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Almacén *</label>
                  <select
                    value={almacenId?.toString() || ''}
                    onChange={(e) => setAlmacenId(Number(e.target.value) || null)}
                    className={selectClass}
                  >
                    <option value="">Selecciona almacén</option>
                    {almacenes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Razón</label>
                  <select value={razon} onChange={(e) => setRazon(e.target.value)} className={selectClass}>
                    <option value="fraccionamiento_manual">Fraccionamiento Manual</option>
                    <option value="fraccionamiento_compra">Por Compra</option>
                    <option value="reagrupamiento">Reagrupamiento</option>
                    <option value="ajuste_inventario">Ajuste de Inventario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-white">Notas</label>
                  <Input type="text" value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={1000} placeholder="Observaciones (opcional)" />
                </div>
              </div>
            </div>

            {/* Búsqueda de productos padre */}
            {almacenId && (
              <div className="p-2 dark:bg-gray-900 dark:border-gray-800 rounded-lg border border-border">
                <label className="block text-sm font-medium dark:text-white mb-2">Agregar producto a fraccionar</label>
                <div className="relative z-20">
                  <Input
                    ref={buscadorRef}
                    type="text"
                    value={busqueda}
                    onChange={(e) => onCambioBusqueda(e.target.value)}
                    onFocus={() => setMostrarSugerencias(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmarBusqueda();
                      } else if (e.key === 'Escape') {
                        setMostrarSugerencias(false);
                      }
                    }}
                    placeholder="ID, SKU o código de barras + Enter para agregarlo directo · o escribe el nombre y elige"
                  />
                  {mostrarSugerencias && terminoValido(busqueda) && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md mt-1 max-h-72 overflow-y-auto shadow-lg">
                      {buscando && resultados.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 dark:text-gray-400">⏳ Buscando productos...</div>
                      ) : resultados.length === 0 && noFraccionable ? (
                        <div className="p-3 text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">
                            #{noFraccionable.id} {noFraccionable.nombre}
                          </span>{' '}
                          no se puede fraccionar: no tiene <b>productos hijo</b> configurados (conversión hacia otro producto).{' '}
                          <a
                            href={`/productos/${noFraccionable.id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Configurarlo en el producto ↗
                          </a>
                        </div>
                      ) : resultados.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                          No hay productos fraccionables que coincidan (solo aparecen los que tienen productos hijo configurados)
                        </div>
                      ) : (
                        resultados.map((p, i) => {
                          const disponible = disponibleEn(p, almacenId);
                          const yaAgregado = lineas.some((l) => l.producto_padre_id === p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => agregarProductoPadre(p)}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-b-0 transition-colors ${
                                i === 0 ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm dark:text-white">
                                  #{p.id} · {p.nombre}
                                  {yaAgregado && <span className="ml-2 text-xs font-normal text-amber-600">(ya agregado)</span>}
                                </span>
                                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${claseStock(disponible)}`} title="Disponible en el almacén elegido">
                                  📦 {formatearNumero(disponible)} {p.unidad_nombre}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                SKU: {p.sku || '-'}
                                {p.codigos && p.codigos.length > 0 && <> · {p.codigos.map((c) => c.codigo).join(', ')}</>}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Productos a fraccionar */}
            {lineas.length > 0 && (
              <div className="dark:bg-gray-900 dark:border-gray-800 overflow-x-auto p-2 rounded-lg border border-border">
                <h2 className="text-lg font-semibold mb-2 dark:text-white">Productos a fraccionar ({lineas.length})</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400">
                      <th className="text-left py-2 px-3">Producto padre</th>
                      <th className="text-center py-2 px-3" title="Disponible en el almacén → lo que queda después de fraccionar">
                        Padre en almacén
                      </th>
                      <th className="text-left py-2 px-3">Producto hijo</th>
                      <th className="text-center py-2 px-3">Fraccionar (padre)</th>
                      <th className="text-center py-2 px-3">Obtiene (hijo)</th>
                      <th className="text-center py-2 px-3" title="Disponible en el almacén → lo que queda después de fraccionar">
                        Hijo en almacén
                      </th>
                      <th className="py-2 px-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {lineas.map((linea) => {
                      const disponiblePadre = stockAlmacen[linea.producto_padre_id] ?? 0;
                      const usado = usoPadre(linea);
                      const quedaPadre = disponiblePadre - usado;
                      const sinStock = quedaPadre < -0.000001;

                      return linea.hijos.map((hijo, idx) => {
                        const disponibleHijo = stockAlmacen[hijo.producto_hijo_id] ?? 0;
                        const esperado = hijo.cantidad_padre * hijo.factor;
                        const difiereDelFactor = hijo.cantidad_padre > 0 && hijo.factor > 0 && Math.abs(hijo.cantidad_hijo - esperado) > 0.000001;

                        return (
                          <tr key={hijo.key} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${sinStock ? 'bg-red-50/60 dark:bg-red-950/20' : ''}`}>
                            {idx === 0 && (
                              <>
                                <td className="py-2 px-3 dark:text-white font-medium align-top" rowSpan={linea.hijos.length}>
                                  {linea.nombre}
                                  <div className="text-xs font-normal text-gray-500">#{linea.producto_padre_id}</div>
                                </td>
                                <td className="py-2 px-3 text-center align-top whitespace-nowrap" rowSpan={linea.hijos.length}>
                                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${claseStock(disponiblePadre)}`}>
                                    {formatearNumero(disponiblePadre)}
                                  </span>
                                  {usado > 0 && (
                                    <span className={`ml-1 text-xs font-semibold ${sinStock ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                                      → {formatearNumero(quedaPadre)}
                                    </span>
                                  )}
                                  <div className="text-xs text-gray-500">{linea.unidad}</div>
                                  {sinStock && <div className="text-xs font-semibold text-red-600 dark:text-red-400">No alcanza</div>}
                                </td>
                              </>
                            )}
                            <td className="py-2 px-3 dark:text-white">
                              {hijo.nombre}
                              {hijo.factor > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  1 {linea.unidad} = {formatearNumero(hijo.factor)} {hijo.unidad}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={hijo.cantidad_padre || ''}
                                onChange={(e) => actualizarHijo(linea.key, hijo.key, 'cantidad_padre', e.target.value)}
                                placeholder="0"
                                className="w-24 text-center mx-auto"
                                title={`Cantidad de ${linea.unidad} a fraccionar en ${hijo.nombre}`}
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={hijo.cantidad_hijo || ''}
                                onChange={(e) => actualizarHijo(linea.key, hijo.key, 'cantidad_hijo', e.target.value)}
                                placeholder="0"
                                className={`w-24 text-center mx-auto ${difiereDelFactor ? 'border-amber-500' : ''}`}
                              />
                              {difiereDelFactor && (
                                <div className="text-xs text-amber-600 dark:text-amber-400" title="La cantidad no coincide con el factor de conversión">
                                  Según factor: {formatearNumero(esperado)}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${claseStock(disponibleHijo)}`}>
                                {formatearNumero(disponibleHijo)}
                              </span>
                              {hijo.cantidad_hijo > 0 && (
                                <span className="ml-1 text-xs font-semibold text-green-700 dark:text-green-400">→ {formatearNumero(disponibleHijo + hijo.cantidad_hijo)}</span>
                              )}
                              <div className="text-xs text-gray-500">{hijo.unidad}</div>
                            </td>
                            {idx === 0 && (
                              <td className="py-2 px-3 text-center align-top" rowSpan={linea.hijos.length}>
                                <button
                                  type="button"
                                  onClick={() => eliminarLinea(linea.key)}
                                  title="Quitar de la lista"
                                  className="text-red-600 dark:text-red-400 hover:text-red-700 inline-flex"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-wrap gap-3 items-center justify-end">
              {lineasSinStock.length > 0 && (
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {lineasSinStock.length} producto(s) sin stock suficiente en el almacén
                </span>
              )}
              <Button type="submit" disabled={loading || lineas.length === 0 || lineasSinStock.length > 0}>
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
