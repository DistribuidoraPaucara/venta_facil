import { Deferred, Head, useForm, Link, router } from '@inertiajs/react';
import { route } from '@/infrastructure/routing/routes';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/presentation/components/ui/tooltip';
import { ArrowLeft, Plus, Trash2, AlertCircle, AlertTriangle, CheckCircle, XCircle, Loader, Search, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Almacen {
  id: number;
  nombre: string;
}

interface CodigoBarra {
  id: number;
  codigo: string;
  es_principal: boolean;
}

interface Sector {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  sku: string;
  stock?: { cantidad_disponible: number };
  stock_actual?: number;
  stock_minimo_requerido?: number;
  stock_maximo_requerido?: number;
  umbral_advertencia?: number;
  stock_principal?: number;
  cantidad_sugerida?: number;
  sector?: Sector;
  codigos_barra?: CodigoBarra[];
}

interface Props {
  almacenes: Almacen[];
  productosStockBajo?: Producto[];
}

interface Detalle {
  producto_id: number;
  cantidad_solicitada: number;
}

function ReposicionesCreate({ almacenes, productosStockBajo: productosStockBajoProp }: Props) {
  // Prop diferida (Inertia::defer): llega undefined mientras el backend calcula
  // el stock bajo de todos los productos en segundo plano.
  const productosStockBajo = productosStockBajoProp ?? [];
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
  const [productosSeleccionados, setProductosSeleccionados] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'criticos' | 'alerta' | 'seleccionados'>('todos');
  const [filtroSector, setFiltroSector] = useState('');

  // Al llegar los productos: cargar la cantidad sugerida de TODOS (así "Seleccionar todos"
  // muestra lo mismo que se envía) y auto-seleccionar los que tienen sugerencia > 0
  useEffect(() => {
    if (!productosStockBajoProp) return;

    const nuevasCantidades: Record<number, number> = {};
    const nuevosSeleccionados = new Set<number>();

    productosStockBajoProp.forEach((p) => {
      const sugerida = Math.floor(Number(p.cantidad_sugerida ?? 0));
      nuevasCantidades[p.id] = sugerida;
      if (sugerida > 0) nuevosSeleccionados.add(p.id);
    });

    setCantidadesPorProducto(nuevasCantidades);
    setProductosSeleccionados(nuevosSeleccionados);
  }, [productosStockBajoProp]);

  const obtenerCantidad = (producto: Producto) => cantidadesPorProducto[producto.id] ?? 0;

  const validarFila = (producto: Producto): string | null => {
    const cantidad = obtenerCantidad(producto);
    if (cantidad <= 0) return 'La cantidad debe ser mayor a 0';
    if (!Number.isInteger(cantidad)) return 'La cantidad debe ser un número entero';
    if (cantidad > Number(producto.stock_principal ?? 0)) return 'Supera el stock disponible en depósito';
    return null;
  };

  // Sincronizar detalles con productos seleccionados
  useEffect(() => {
    setData(
      'detalles',
      productosStockBajo
        .filter((p) => productosSeleccionados.has(p.id))
        .map((p) => ({
          producto_id: p.id,
          cantidad_solicitada: obtenerCantidad(p),
        }))
    );
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

  // Seleccionar/deseleccionar actúan solo sobre las filas visibles con los filtros actuales
  const seleccionarTodos = () => {
    const nuevoSeleccionados = new Set(productosSeleccionados);
    productosFiltrados.forEach((p) => nuevoSeleccionados.add(p.id));
    setProductosSeleccionados(nuevoSeleccionados);
  };

  const deseleccionarTodos = () => {
    const nuevoSeleccionados = new Set(productosSeleccionados);
    productosFiltrados.forEach((p) => nuevoSeleccionados.delete(p.id));
    setProductosSeleccionados(nuevoSeleccionados);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.detalles.length === 0) {
      setToast({ type: 'error', message: 'Debe seleccionar al menos un producto' });
      return;
    }
    if (cantidadErrores > 0) {
      setToast({ type: 'error', message: `Hay ${cantidadErrores} producto(s) con cantidades inválidas` });
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

  const productosElegidos = productosStockBajo.filter((p) => productosSeleccionados.has(p.id));
  const erroresPorProducto: Record<number, string> = {};
  productosElegidos.forEach((p) => {
    const error = validarFila(p);
    if (error) erroresPorProducto[p.id] = error;
  });
  const cantidadErrores = Object.keys(erroresPorProducto).length;

  // ===== Filtros de la tabla =====
  const normalizar = (texto: string) =>
    texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const esCritico = (p: Producto) => Number(p.stock_actual ?? 0) < Number(p.stock_minimo_requerido ?? 0);

  // Qué tan lejos está del mínimo (menor = más urgente)
  const nivelStock = (p: Producto) => {
    const minimo = Number(p.stock_minimo_requerido ?? 0);
    return minimo > 0 ? Number(p.stock_actual ?? 0) / minimo : Infinity;
  };

  const sectores = Array.from(
    new Set(productosStockBajo.map((p) => p.sector?.nombre).filter((s): s is string => !!s))
  ).sort((a, b) => a.localeCompare(b));

  // Búsqueda y sector se aplican primero, para que los contadores de las pestañas los reflejen
  const termino = normalizar(busqueda.trim());
  const productosBuscados = productosStockBajo.filter((p) => {
    if (filtroSector && p.sector?.nombre !== filtroSector) return false;
    if (!termino) return true;
    const codigos = (p.codigos_barra ?? []).map((c) => c.codigo).join(' ');
    return normalizar(`${p.nombre} ${p.sku ?? ''} ${p.id} ${codigos}`).includes(termino);
  });

  const conteos = {
    todos: productosBuscados.length,
    criticos: productosBuscados.filter(esCritico).length,
    alerta: productosBuscados.filter((p) => !esCritico(p)).length,
    seleccionados: productosBuscados.filter((p) => productosSeleccionados.has(p.id)).length,
  };

  const productosFiltrados = productosBuscados
    .filter((p) => {
      if (filtroEstado === 'criticos') return esCritico(p);
      if (filtroEstado === 'alerta') return !esCritico(p);
      if (filtroEstado === 'seleccionados') return productosSeleccionados.has(p.id);
      return true;
    })
    .sort((a, b) => nivelStock(a) - nivelStock(b));

  const hayFiltros = termino !== '' || filtroSector !== '' || filtroEstado !== 'todos';
  const seleccionadosOcultos = productosElegidos.filter((p) => !productosFiltrados.some((f) => f.id === p.id)).length;
  const todosVisiblesSeleccionados =
    productosFiltrados.length > 0 && productosFiltrados.every((p) => productosSeleccionados.has(p.id));

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroSector('');
    setFiltroEstado('todos');
  };

  const pestanas = [
    { valor: 'todos', etiqueta: 'Todos', conteo: conteos.todos },
    { valor: 'criticos', etiqueta: 'Críticos', conteo: conteos.criticos },
    { valor: 'alerta', etiqueta: 'Alerta', conteo: conteos.alerta },
    { valor: 'seleccionados', etiqueta: 'Seleccionados', conteo: conteos.seleccionados },
  ] as const;

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
              <form id="form-reposicion" onSubmit={submit} className="space-y-6">
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
              </form>
            </CardContent>
          </Card>

          {/* Tabla de productos para reposición (carga diferida: se pide aparte, sin bloquear la apertura de la página) */}
          <Deferred
            data="productosStockBajo"
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Productos Cercanos al Límite Mínimo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-8 justify-center">
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Calculando productos con stock bajo...
                  </div>
                </CardContent>
              </Card>
            }
          >
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

              {/* Filtros */}
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
                  <select
                    value={filtroSector}
                    onChange={(e) => setFiltroSector(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm md:w-56"
                  >
                    <option value="">Todos los sectores</option>
                    {sectores.map((s) => (
                      <option key={s} value={s}>
                        {s}
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
                    <button
                      type="button"
                      onClick={limpiarFiltros}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Limpiar filtros
                    </button>
                  )}
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    Ordenado por urgencia (más lejos del mínimo primero)
                  </span>
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
                          checked={todosVisiblesSeleccionados}
                          onChange={(e) => e.target.checked ? seleccionarTodos() : deseleccionarTodos()}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Producto</th>
                      <th className="text-left py-3 px-4">SKU / Código de barra</th>
                      <th className="text-center py-3 px-4">Sector</th>
                      <th className="text-center py-3 px-4">
                        Sala
                        <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">actual → final</span>
                      </th>
                      <th className="text-center py-3 px-4">
                        Mín / Máx
                        <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">límites en sala</span>
                      </th>
                      <th className="text-center py-3 px-4">
                        Depósito
                        <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">actual → final</span>
                      </th>
                      <th className="text-right py-3 px-4">Cantidad a Reponer</th>
                      <th className="text-center py-3 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          {productosStockBajo.length === 0
                            ? 'No hay productos que requieran reposición'
                            : 'Ningún producto coincide con los filtros'}
                        </td>
                      </tr>
                    )}
                    {productosFiltrados.map((producto) => {
                      const isCritico = (producto.stock_actual ?? 0) < (producto.stock_minimo_requerido ?? 0);
                      const isAdvertencia = (producto.stock_actual ?? 0) <= (producto.umbral_advertencia ?? 0);
                      const yaSeleccionado = productosSeleccionados.has(producto.id);
                      const cantidad = yaSeleccionado ? obtenerCantidad(producto) : 0;
                      const mostrarFinal = cantidad > 0;
                      const stockFinalDeposito = Number(producto.stock_principal ?? 0) - cantidad;
                      const stockActual = Number(producto.stock_actual ?? 0);
                      const stockFinalSala = stockActual + cantidad;
                      const minimo = Number(producto.stock_minimo_requerido ?? 0);
                      const maximo = Number(producto.stock_maximo_requerido ?? 0);
                      const superaMaximo = mostrarFinal && maximo > 0 && stockFinalSala > maximo;
                      const porcentaje = (valor: number) => (maximo > 0 ? Math.min(100, Math.max(0, (valor / maximo) * 100)) : 0);

                      return (
                        <tr
                          key={producto.id}
                          className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 ${yaSeleccionado ? '' : 'opacity-50'}`}
                        >
                          {/* El estado se marca con un borde de color a la izquierda, no con el fondo de toda la fila */}
                          <td
                            className={`py-3 px-4 text-center w-12 border-l-4 ${
                              isCritico
                                ? 'border-l-red-400 dark:border-l-red-500/70'
                                : isAdvertencia
                                ? 'border-l-amber-300 dark:border-l-amber-500/60'
                                : 'border-l-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={yaSeleccionado}
                              onChange={() => toggleProductoSeleccionado(producto.id)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <a
                              href={`/productos/${producto.id}/edit`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Editar producto en otra pestaña"
                              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                              #{producto.id}
                              <ExternalLink size={12} />
                            </a>
                          </td>
                          <td className="py-3 px-4">{producto.nombre}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            <div>{producto.sku}</div>
                            {(() => {
                              const codigos = producto.codigos_barra ?? [];
                              if (codigos.length === 0) {
                                return <div className="text-xs text-gray-400 dark:text-gray-500">Sin código de barra</div>;
                              }
                              const [principal, ...otros] = codigos;
                              return (
                                <div className="flex items-center gap-1 text-xs font-mono">
                                  <span>{principal.codigo}</span>
                                  {otros.length > 0 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="cursor-help rounded bg-gray-200 dark:bg-gray-700 px-1 font-sans text-gray-700 dark:text-gray-300">
                                          +{otros.length}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="font-mono text-xs">
                                          {otros.map((c) => (
                                            <div key={c.id}>{c.codigo}</div>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4 text-center text-sm font-medium text-purple-600 dark:text-purple-400">
                            {producto.sector?.nombre || '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-medium whitespace-nowrap">
                            <span>{formatearNumero(producto.stock_actual)}</span>
                            {mostrarFinal && (
                              <>
                                <span className="mx-1 text-gray-400 dark:text-gray-500">→</span>
                                <span
                                  className={`font-semibold ${
                                    superaMaximo ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                                  }`}
                                  title={superaMaximo ? 'Supera el stock máximo de la sala' : undefined}
                                >
                                  {formatearNumero(stockFinalSala)}
                                </span>
                              </>
                            )}
                            {/* Barra: stock actual y lo que se repone, sobre la escala 0 → máximo; la línea marca el mínimo */}
                            {maximo > 0 && (
                              <div className="relative mx-auto mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className={`absolute inset-y-0 left-0 ${isCritico ? 'bg-red-400' : 'bg-amber-400'}`}
                                  style={{ width: `${porcentaje(stockActual)}%` }}
                                />
                                {mostrarFinal && (
                                  <div
                                    className="absolute inset-y-0 bg-blue-500"
                                    style={{
                                      left: `${porcentaje(stockActual)}%`,
                                      width: `${porcentaje(stockFinalSala) - porcentaje(stockActual)}%`,
                                    }}
                                  />
                                )}
                                <div
                                  className="absolute inset-y-0 w-0.5 bg-gray-700 dark:bg-gray-200"
                                  style={{ left: `${porcentaje(minimo)}%` }}
                                />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">
                            <span title="Stock mínimo">{formatearNumero(minimo)}</span>
                            <span className="mx-1 text-gray-400 dark:text-gray-500">/</span>
                            <span title="Stock máximo">{formatearNumero(maximo)}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-medium whitespace-nowrap">
                            <span>{formatearNumero(producto.stock_principal)}</span>
                            {mostrarFinal && (
                              <>
                                <span className="mx-1 text-gray-400 dark:text-gray-500">→</span>
                                <span className={`font-semibold ${stockFinalDeposito >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {formatearNumero(Math.round(stockFinalDeposito * 100) / 100)}
                                </span>
                              </>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={formatearCantidad(cantidadesPorProducto[producto.id] ?? 0)}
                              onChange={(e) =>
                                setCantidadesPorProducto({
                                  ...cantidadesPorProducto,
                                  [producto.id]: Number(e.target.value) || 0,
                                })
                              }
                              disabled={!yaSeleccionado}
                              className={`w-24 border rounded px-2 py-1 text-right font-semibold ${
                                !yaSeleccionado
                                  ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                  : erroresPorProducto[producto.id]
                                  ? 'border-red-500 dark:border-red-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
                                  : 'border-green-500 dark:border-green-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
                              }`}
                            />
                            {yaSeleccionado && erroresPorProducto[producto.id] && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{erroresPorProducto[producto.id]}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isCritico ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
                                <AlertCircle size={12} />
                                Crítico
                              </span>
                            ) : isAdvertencia ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                <AlertTriangle size={12} />
                                Alerta
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/15 dark:text-green-300">
                                OK
                              </span>
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
          </Deferred>
        </div>

        {/* Barra de acciones fija: resumen + botones siempre a la vista mientras se cargan cantidades */}
        <div className="sticky bottom-0 z-10 mx-2 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-lg">
          <div className="text-sm">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {productosElegidos.length} de {productosStockBajo.length} producto(s) seleccionado(s) para reponer
            </p>
            {seleccionadosOcultos > 0 && (
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {seleccionadosOcultos} seleccionado(s) no visible(s) por los filtros: también se van a reponer
              </p>
            )}
            {cantidadErrores > 0 && (
              <p className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400">
                <AlertCircle size={14} />
                {cantidadErrores} producto(s) con problemas: revise las cantidades marcadas en rojo
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={route('reposiciones.index')}>
              <Button variant="outline" disabled={processing}>Cancelar</Button>
            </Link>
            <Button
              type="submit"
              form="form-reposicion"
              disabled={processing || data.detalles.length === 0 || cantidadErrores > 0}
              className="flex items-center gap-2"
            >
              {processing && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {processing ? 'Procesando...' : 'Crear Reposición'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

ReposicionesCreate.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default ReposicionesCreate;
