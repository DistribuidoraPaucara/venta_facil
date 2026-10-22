import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { AlertTriangle, AlertCircle, ChevronLeft, ChevronRight, ExternalLink, FileText, Loader2, Search, TrendingDown } from 'lucide-react';

interface Sector {
  id: number;
  nombre: string;
}

interface CodigoBarra {
  id: number;
  codigo: string;
  es_principal: boolean;
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
  codigos_barra?: CodigoBarra[];
  proveedor_id?: number | null;
}

interface Almacen {
  id: number;
  nombre: string;
}

interface Proveedor {
  id: number;
  nombre: string;
  razon_social?: string | null;
}

interface Props {
  productosParaComprar: Producto[];
  almacenPrincipal: Almacen | null;
  proveedores: Proveedor[];
  puedeCrearCompra: boolean;
}

// Un solo criterio de estado para la tabla, las pestañas y las tarjetas del resumen
type Estado = 'critico' | 'bajo' | 'alerta';

const estadoDe = (p: Producto): Estado => {
  const stock = Number(p.stock_actual ?? 0);
  const minimo = Number(p.stock_minimo_requerido ?? 0);
  if (stock <= 0) return 'critico';
  if (stock < minimo * 0.5) return 'bajo';
  return 'alerta';
};

// El estado se marca con un borde a la izquierda y un badge suave (no pintando toda la fila)
const bordeEstado: Record<Estado, string> = {
  critico: 'border-l-red-500 dark:border-l-red-500/80',
  bajo: 'border-l-red-300 dark:border-l-red-400/60',
  alerta: 'border-l-amber-300 dark:border-l-amber-500/60',
};

// stock_maximo 999999 = "sin máximo" (así lo guardan los formularios)
const maximoDe = (p: Producto) => {
  const max = Number(p.stock_maximo_requerido ?? 0);
  return max >= 999999 ? null : max;
};

// Qué tan lejos está del mínimo (menor = más urgente)
const nivelStock = (p: Producto) => {
  const minimo = Number(p.stock_minimo_requerido ?? 0);
  return minimo > 0 ? Number(p.stock_actual ?? 0) / minimo : Infinity;
};

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const unicos = (valores: (string | undefined)[]) =>
  Array.from(new Set(valores.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b));

// Cantidad inicial a pedir: la sugerida (hasta el máximo); sin máximo definido, lo que falta para el mínimo
const cantidadInicial = (p: Producto) => {
  const sugerida = Math.ceil(Number(p.cantidad_sugerida ?? 0));
  if (maximoDe(p) !== null && sugerida > 0) return sugerida;
  return Math.max(1, Math.ceil(Number(p.stock_minimo_requerido ?? 0) - Number(p.stock_actual ?? 0)));
};

function ComprasIndex({ productosParaComprar, almacenPrincipal, proveedores = [], puedeCrearCompra = false }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | Estado>('todos');
  const [filtroSector, setFiltroSector] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  // Productos elegidos para la orden de compra: producto_id → cantidad a pedir
  const [seleccion, setSeleccion] = useState<Record<number, number>>({});
  // null = el usuario no eligió (se propone el proveedor común); '' = eligió "Sin proveedor"
  const [proveedorId, setProveedorId] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  // Paginación (en el navegador: la lista llega completa y se filtra aquí)
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);

  // Al cambiar filtros o el tamaño de página, volver a la primera página
  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroEstado, filtroSector, filtroMarca, porPagina]);

  const formatearNumero = (num: number | string | undefined): string => {
    if (num === undefined || num === null || num === '') return '0';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '0';
    if (Number.isInteger(n)) return n.toString();
    return parseFloat(n.toFixed(2)).toString();
  };

  const conteo = productosParaComprar.reduce(
    (acc, p) => ({ ...acc, [estadoDe(p)]: acc[estadoDe(p)] + 1 }),
    { critico: 0, bajo: 0, alerta: 0 } as Record<Estado, number>
  );

  // ===== Filtros =====
  const sectores = unicos(productosParaComprar.map((p) => p.sector?.nombre));
  const marcas = unicos(productosParaComprar.map((p) => p.marca?.nombre));

  // Búsqueda, sector y marca se aplican primero, para que los contadores de las pestañas los reflejen
  const termino = normalizar(busqueda.trim());
  const productosBuscados = productosParaComprar.filter((p) => {
    if (filtroSector && p.sector?.nombre !== filtroSector) return false;
    if (filtroMarca && p.marca?.nombre !== filtroMarca) return false;
    if (!termino) return true;
    const codigos = (p.codigos_barra ?? []).map((c) => c.codigo).join(' ');
    return normalizar(`${p.nombre} ${p.sku ?? ''} ${p.id} ${codigos}`).includes(termino);
  });

  const conteoBuscados = productosBuscados.reduce(
    (acc, p) => ({ ...acc, [estadoDe(p)]: acc[estadoDe(p)] + 1 }),
    { critico: 0, bajo: 0, alerta: 0 } as Record<Estado, number>
  );

  // Orden por urgencia: más lejos del mínimo primero; a igual urgencia, el que más hay que comprar
  const productosFiltrados = productosBuscados
    .filter((p) => filtroEstado === 'todos' || estadoDe(p) === filtroEstado)
    .sort((a, b) => nivelStock(a) - nivelStock(b) || Number(b.cantidad_sugerida ?? 0) - Number(a.cantidad_sugerida ?? 0));

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const desde = (paginaActual - 1) * porPagina;
  const productosPagina = productosFiltrados.slice(desde, desde + porPagina);

  const hayFiltros = termino !== '' || filtroSector !== '' || filtroMarca !== '' || filtroEstado !== 'todos';
  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroSector('');
    setFiltroMarca('');
    setFiltroEstado('todos');
  };

  const pestanas = [
    { valor: 'todos', etiqueta: 'Todos', conteo: productosBuscados.length },
    { valor: 'critico', etiqueta: 'Críticos', conteo: conteoBuscados.critico },
    { valor: 'bajo', etiqueta: 'Bajos', conteo: conteoBuscados.bajo },
    { valor: 'alerta', etiqueta: 'En alerta', conteo: conteoBuscados.alerta },
  ] as const;

  const selectClass =
    'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm md:w-52';

  // ===== Selección para la orden de compra =====
  const idsSeleccionados = Object.keys(seleccion).map(Number);
  const seleccionados = productosParaComprar.filter((p) => p.id in seleccion);
  const ocultosSeleccionados = seleccionados.filter((p) => !productosFiltrados.some((f) => f.id === p.id)).length;
  const todosVisiblesSeleccionados = productosPagina.length > 0 && productosPagina.every((p) => p.id in seleccion);
  const todosFiltradosSeleccionados = productosFiltrados.length > 0 && productosFiltrados.every((p) => p.id in seleccion);

  // Si todos los elegidos tienen el mismo proveedor, se propone ese
  const proveedorComun = (() => {
    const ids = Array.from(new Set(seleccionados.map((p) => p.proveedor_id ?? null)));
    return ids.length === 1 && ids[0] !== null && proveedores.some((pr) => pr.id === ids[0]) ? String(ids[0]) : '';
  })();
  const proveedorElegido = proveedorId ?? proveedorComun;

  const alternarProducto = (p: Producto) =>
    setSeleccion((s) => {
      const nueva = { ...s };
      if (p.id in nueva) delete nueva[p.id];
      else nueva[p.id] = cantidadInicial(p);
      return nueva;
    });

  // Marcar/desmarcar un grupo de filas: la página actual (checkbox del encabezado) o todos los filtrados
  const alternarVisibles = (marcar: boolean, filas: Producto[] = productosPagina) =>
    setSeleccion((s) => {
      const nueva = { ...s };
      filas.forEach((p) => {
        if (marcar) nueva[p.id] ??= cantidadInicial(p);
        else delete nueva[p.id];
      });
      return nueva;
    });

  const crearOrden = async () => {
    const invalidas = seleccionados.filter((p) => !(seleccion[p.id] >= 1));
    if (invalidas.length > 0) {
      toast.error(`Revisa la cantidad de ${invalidas.length} producto(s): debe ser 1 o más`);
      return;
    }

    setCreando(true);
    try {
      const { data } = await axios.post('/inventario/productos-compra/orden', {
        // Sin proveedor se permite: es un borrador, el proveedor se elige antes de aprobar
        proveedor_id: proveedorElegido ? Number(proveedorElegido) : null,
        items: idsSeleccionados.map((id) => ({ producto_id: id, cantidad: seleccion[id] })),
      });
      // Lo que falta completar en el borrador antes de aprobarlo
      const pendientes = [
        data.sin_proveedor ? 'elegir el proveedor' : null,
        data.sin_precio > 0 ? `completar ${data.sin_precio} precio(s)` : null,
      ].filter(Boolean);
      toast.success(
        pendientes.length > 0
          ? `Orden ${data.numero} creada en borrador. Antes de aprobar: ${pendientes.join(' y ')}.`
          : `Orden ${data.numero} creada en borrador`,
        { duration: 6000 }
      );
      router.visit(data.url);
    } catch (e: any) {
      const errores = e?.response?.data?.errors;
      toast.error(errores ? Object.values(errores).flat().join(' ') : e?.response?.data?.message ?? 'No se pudo crear la orden de compra');
      setCreando(false);
    }
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

            {/* Filtros */}
            {productosParaComprar.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex flex-col gap-2 md:flex-row">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar por nombre, SKU, código de barra o ID..."
                      className="pl-9"
                    />
                  </div>
                  <select value={filtroSector} onChange={(e) => setFiltroSector(e.target.value)} className={selectClass}>
                    <option value="">Todos los sectores</option>
                    {sectores.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <select value={filtroMarca} onChange={(e) => setFiltroMarca(e.target.value)} className={selectClass}>
                    <option value="">Todas las marcas</option>
                    {marcas.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {pestanas.map((pestana) => (
                    <button
                      key={pestana.valor}
                      type="button"
                      onClick={() => setFiltroEstado(pestana.valor)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        filtroEstado === pestana.valor
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {pestana.etiqueta} ({pestana.conteo})
                    </button>
                  ))}
                  {hayFiltros && (
                    <button type="button" onClick={limpiarFiltros} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      Limpiar filtros
                    </button>
                  )}
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    Ordenado por urgencia (más lejos del mínimo primero)
                  </span>
                </div>
              </div>
            )}
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
                      {puedeCrearCompra && (
                        <th className="text-center py-3 px-2 w-10">
                          <input
                            type="checkbox"
                            title="Seleccionar los productos de esta página"
                            checked={todosVisiblesSeleccionados}
                            onChange={(e) => alternarVisibles(e.target.checked)}
                            className="h-4 w-4 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Producto</th>
                      <th className="text-left py-3 px-4">SKU / Código de barra</th>
                      <th className="text-left py-3 px-4">Marca</th>
                      <th className="text-center py-3 px-4">Sector</th>
                      <th className="text-center py-3 px-4">Stock Actual</th>
                      <th className="text-center py-3 px-4">
                        Mín / Máx
                        <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">límites del almacén</span>
                      </th>
                      <th className="text-center py-3 px-4">
                        Sugerido comprar
                        <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">hasta llegar al máximo</span>
                      </th>
                      <th className="text-center py-3 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={puedeCrearCompra ? 10 : 9} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          Ningún producto coincide con los filtros
                        </td>
                      </tr>
                    )}
                    {productosPagina.map((producto) => {
                      const estado = estadoDe(producto);
                      const maximo = maximoDe(producto);
                      const [principal, ...otros] = producto.codigos_barra ?? [];
                      const elegido = producto.id in seleccion;

                      return (
                        <tr
                          key={producto.id}
                          className={`border-b transition-colors ${
                            elegido ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          {puedeCrearCompra && (
                            <td className={`py-3 px-2 text-center border-l-4 ${bordeEstado[estado]}`}>
                              <input
                                type="checkbox"
                                checked={elegido}
                                onChange={() => alternarProducto(producto)}
                                className="h-4 w-4 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className={`py-3 px-4 ${puedeCrearCompra ? '' : `border-l-4 ${bordeEstado[estado]}`}`}>
                            {/* Abre la edición del producto en otra pestaña */}
                            <a
                              href={`/productos/${producto.id}/edit`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Editar producto en otra pestaña"
                              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                              #{producto.id}
                              <ExternalLink size={12} />
                            </a>
                          </td>
                          <td className="py-3 px-4 font-medium">{producto.nombre}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            <div>{producto.sku}</div>
                            {principal ? (
                              <div className="flex items-center gap-1 font-mono text-xs">
                                <span>{principal.codigo}</span>
                                {otros.length > 0 && (
                                  <span
                                    title={`Otros códigos de barra:\n${otros.map((c) => c.codigo).join('\n')}`}
                                    className="cursor-help rounded bg-gray-200 px-1 font-sans text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                  >
                                    +{otros.length}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 dark:text-gray-500">Sin código de barra</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">{producto.marca?.nombre || '-'}</td>
                          <td className="py-3 px-4 text-center text-sm font-medium text-purple-600 dark:text-purple-400">
                            {producto.sector?.nombre || '-'}
                          </td>
                          <td
                            className={`py-3 px-4 text-center font-semibold ${
                              estado === 'alerta' ? '' : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {formatearNumero(producto.stock_actual)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {formatearNumero(producto.stock_minimo_requerido)}
                            <span className="mx-1 text-gray-400 dark:text-gray-500">/</span>
                            {maximo === null ? <span className="text-gray-400">sin máx</span> : formatearNumero(maximo)}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                            {elegido ? (
                              // Cantidad a pedir en la orden de compra (empieza con la sugerida)
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={seleccion[producto.id] || ''}
                                onChange={(e) =>
                                  setSeleccion((s) => ({ ...s, [producto.id]: Math.floor(Number(e.target.value)) || 0 }))
                                }
                                className={`w-20 rounded border px-2 py-1 text-right font-semibold text-gray-900 dark:bg-gray-900 dark:text-white ${
                                  seleccion[producto.id] >= 1 ? 'border-blue-500' : 'border-red-500'
                                }`}
                              />
                            ) : maximo === null ? (
                              <span className="font-normal text-gray-400">definir máx.</span>
                            ) : (
                              formatearNumero(producto.cantidad_sugerida)
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {estado === 'critico' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
                                <AlertTriangle size={12} />
                                Crítico
                              </span>
                            ) : estado === 'bajo' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
                                <AlertCircle size={12} />
                                Bajo
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                En alerta
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Paginación */}
                {productosFiltrados.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>
                        Mostrando {desde + 1}–{Math.min(desde + porPagina, productosFiltrados.length)} de {productosFiltrados.length}
                      </span>
                      <select
                        value={porPagina}
                        onChange={(e) => setPorPagina(Number(e.target.value))}
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
                      >
                        {[25, 50, 100].map((n) => (
                          <option key={n} value={n}>
                            {n} por página
                          </option>
                        ))}
                      </select>
                      {puedeCrearCompra && totalPaginas > 1 && (
                        <button
                          type="button"
                          onClick={() => alternarVisibles(!todosFiltradosSeleccionados, productosFiltrados)}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {todosFiltradosSeleccionados
                            ? `Quitar los ${productosFiltrados.length} filtrados`
                            : `Seleccionar los ${productosFiltrados.length} filtrados`}
                        </button>
                      )}
                    </div>
                    {totalPaginas > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={paginaActual <= 1}
                          onClick={() => setPagina(paginaActual - 1)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span>
                          Página {paginaActual} de {totalPaginas}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={paginaActual >= totalPaginas}
                          onClick={() => setPagina(paginaActual + 1)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Críticos (sin stock)</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{conteo.critico}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bajos (menos de la mitad del mínimo)</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{conteo.bajo}</p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">En alerta (debajo del mínimo)</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{conteo.alerta}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Unidades sugeridas a comprar</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {formatearNumero(
                      productosParaComprar
                        .filter((p) => maximoDe(p) !== null)
                        .reduce((sum, p) => sum + Number(p.cantidad_sugerida ?? 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Barra fija para crear la orden de compra (compra en BORRADOR: no mueve stock hasta aprobarla) */}
        {puedeCrearCompra && seleccionados.length > 0 && (
          <div className="sticky bottom-0 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="text-sm">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {seleccionados.length} producto(s) para la orden ·{' '}
                {formatearNumero(seleccionados.reduce((sum, p) => sum + (seleccion[p.id] || 0), 0))} unidades
              </p>
              {ocultosSeleccionados > 0 && (
                <p className="text-gray-600 dark:text-gray-400">
                  {ocultosSeleccionados} elegido(s) no visible(s) por los filtros: también se incluyen
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Se crea como compra en <strong>borrador</strong>: el stock entra recién al aprobarla.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={proveedorElegido}
                onChange={(e) => setProveedorId(e.target.value)}
                className={selectClass}
                title="Opcional en el borrador: es obligatorio recién para aprobar la compra"
              >
                <option value="">Sin proveedor (elegir después)</option>
                {proveedores.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.nombre}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" disabled={creando} onClick={() => setSeleccion({})}>
                Quitar selección
              </Button>
              <Button type="button" disabled={creando} onClick={crearOrden}>
                {creando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileText className="mr-1 h-4 w-4" />}
                Crear orden de compra
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

ComprasIndex.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default ComprasIndex;
