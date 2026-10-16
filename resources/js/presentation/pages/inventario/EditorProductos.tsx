/**
 * Page: Editor de Productos (planilla)
 *
 * Una fila por producto + almacén + sector (ubicaciones de stock_productos y stock_limites).
 * Se editan las celdas haciendo clic; los cambios quedan resaltados y se guardan juntos
 * con el botón Guardar, previo resumen. El stock se guarda como ajuste de inventario.
 */
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import SearchSelect, { type SelectOption } from '@/presentation/components/ui/search-select';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, RotateCcw, Save, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

interface Opcion {
    id: number;
    nombre: string;
    codigo?: string | null;
    ajena?: boolean; // unidad de otra empresa usada por productos de esta (datos importados)
}
interface Sector extends Opcion {
    almacen_id: number;
}
interface Props {
    opciones: {
        almacenes: Opcion[];
        sectores: Sector[];
        categorias: Opcion[];
        marcas: Opcion[];
        unidades: Opcion[];
        tiposPrecio: Opcion[];
    };
}
interface Fila {
    producto_id: number;
    nombre: string;
    sku: string | null;
    codigo_barras: string | null;
    categoria_id: number | null;
    marca_id: number | null;
    unidad_medida_id: number | null;
    es_fraccionado: boolean;
    almacen_id: number | null;
    almacen: string | null;
    sector_id: number | null;
    sector: string | null;
    stock: number;
    disponible: number;
    lotes: number;
    stock_minimo: number | null;
    stock_maximo: number | null;
    precios: Record<string, { id: number; precio: number }>;
}

type CampoProducto = 'nombre' | 'codigo_barras' | 'categoria_id' | 'marca_id' | 'unidad_medida_id';
interface Cambios {
    productos: Record<number, Partial<Record<CampoProducto, string | number | null>>>;
    precios: Record<string, { producto_id: number; tipo_precio_id: number; precio: number; original: number | null }>;
    limites: Record<string, { producto_id: number; almacen_id: number; sector_id: number; stock_minimo: number; stock_maximo: number }>;
    stocks: Record<string, { producto_id: number; almacen_id: number; sector_id: number; cantidad_actual: number; cantidad_nueva: number }>;
}
const SIN_CAMBIOS: Cambios = { productos: {}, precios: {}, limites: {}, stocks: {} };
const SIN_MAXIMO = 999999;

const filtrosIniciales = { q: '', almacen_id: '', sector_id: '', categoria_id: '', marca_id: '', unidad_id: '', stock: '', sin_precio: '' };
const claveUbicacion = (f: { producto_id: number; almacen_id: number | null; sector_id: number | null }) =>
    `${f.producto_id}-${f.almacen_id}-${f.sector_id}`;
const formatear = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(Number(Number(n).toFixed(4))));

// Colores por almacén, iguales a la app (sala = teal, principal = púrpura)
const colorAlmacen = (nombre: string | null) => {
    const n = (nombre ?? '').toLowerCase();
    if (n.includes('principal')) return 'border-l-purple-500 bg-purple-50/60 dark:bg-purple-950/20';
    if (n.includes('sala') || n.includes('venta')) return 'border-l-teal-500 bg-teal-50/60 dark:bg-teal-950/20';
    return 'border-l-slate-400';
};

export default function EditorProductos({ opciones }: Props) {
    const [filtros, setFiltros] = useState(filtrosIniciales);
    const [filas, setFilas] = useState<Fila[]>([]);
    const [pagina, setPagina] = useState(1);
    const [paginas, setPaginas] = useState(1);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [cambios, setCambios] = useState<Cambios>(SIN_CAMBIOS);
    const [editando, setEditando] = useState<string | null>(null);
    const [confirmar, setConfirmar] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [errores, setErrores] = useState<string[]>([]);
    // Valores originales de los productos (para saber si un cambio vuelve al valor inicial)
    const originales = useRef<Record<number, Fila>>({});
    const ultimaCarga = useRef(0);

    const porId = useCallback(<T extends Opcion>(lista: T[]) => Object.fromEntries(lista.map((o) => [o.id, o])), []);
    const categorias = useMemo(() => porId(opciones.categorias), [opciones.categorias, porId]);
    const marcas = useMemo(() => porId(opciones.marcas), [opciones.marcas, porId]);
    const unidades = useMemo(() => porId(opciones.unidades), [opciones.unidades, porId]);

    const cargar = useCallback(
        async (paginaPedida: number, f = filtros) => {
            const id = ++ultimaCarga.current;
            setCargando(true);
            try {
                const params = Object.fromEntries(Object.entries({ ...f, page: paginaPedida }).filter(([, v]) => v !== ''));
                const { data } = await axios.get('/inventario/editor-productos/datos', { params });
                if (id !== ultimaCarga.current) return; // respuesta vieja
                data.filas.forEach((fila: Fila) => {
                    originales.current[fila.producto_id] ??= fila;
                });
                setFilas(data.filas);
                setPagina(data.pagina);
                setPaginas(data.paginas);
                setTotal(data.total);
            } catch {
                toast.error('No se pudieron cargar los productos');
            } finally {
                if (id === ultimaCarga.current) setCargando(false);
            }
        },
        [filtros],
    );

    // Búsqueda y filtros con espera de 400 ms; siempre vuelve a la página 1
    useEffect(() => {
        const t = setTimeout(() => cargar(1, filtros), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtros]);

    const totalCambios =
        Object.values(cambios.productos).reduce((n, c) => n + Object.keys(c).length, 0) +
        Object.keys(cambios.precios).length +
        Object.keys(cambios.limites).length +
        Object.keys(cambios.stocks).length;

    // Avisar antes de salir con cambios sin guardar
    useEffect(() => {
        const aviso = (e: BeforeUnloadEvent) => {
            if (totalCambios > 0) e.preventDefault();
        };
        window.addEventListener('beforeunload', aviso);
        return () => window.removeEventListener('beforeunload', aviso);
    }, [totalCambios]);

    // ── Valores efectivos (original o editado) ──
    const valorProducto = (f: Fila, campo: CampoProducto) =>
        campo in (cambios.productos[f.producto_id] ?? {}) ? cambios.productos[f.producto_id][campo] : f[campo];
    const valorPrecio = (f: Fila, tipoId: number) => cambios.precios[`${f.producto_id}-${tipoId}`]?.precio ?? f.precios[tipoId]?.precio ?? null;
    const valorLimite = (f: Fila) => cambios.limites[claveUbicacion(f)] ?? { stock_minimo: f.stock_minimo, stock_maximo: f.stock_maximo };
    const valorStock = (f: Fila) => cambios.stocks[claveUbicacion(f)]?.cantidad_nueva ?? f.stock;

    // ── Registrar cambios (si vuelve al original, se descarta) ──
    const cambiarProducto = (f: Fila, campo: CampoProducto, valor: string | number | null) =>
        setCambios((c) => {
            const original = originales.current[f.producto_id]?.[campo] ?? null;
            const delProducto = { ...(c.productos[f.producto_id] ?? {}) };
            if (valor === original) delete delProducto[campo];
            else delProducto[campo] = valor;
            const productos = { ...c.productos, [f.producto_id]: delProducto };
            if (Object.keys(delProducto).length === 0) delete productos[f.producto_id];
            return { ...c, productos };
        });

    const cambiarPrecio = (f: Fila, tipoId: number, valor: number | null) =>
        setCambios((c) => {
            const clave = `${f.producto_id}-${tipoId}`;
            const original = c.precios[clave]?.original ?? f.precios[tipoId]?.precio ?? null;
            const precios = { ...c.precios };
            if (valor === null || valor === original) delete precios[clave];
            else precios[clave] = { producto_id: f.producto_id, tipo_precio_id: tipoId, precio: valor, original };
            return { ...c, precios };
        });

    const cambiarLimite = (f: Fila, campo: 'stock_minimo' | 'stock_maximo', valor: number) =>
        setCambios((c) => {
            const clave = claveUbicacion(f);
            const actual = c.limites[clave] ?? {
                producto_id: f.producto_id,
                almacen_id: f.almacen_id!,
                sector_id: f.sector_id!,
                stock_minimo: f.stock_minimo ?? 0,
                stock_maximo: f.stock_maximo ?? 0,
            };
            const nuevo = { ...actual, [campo]: valor };
            const limites = { ...c.limites };
            if (nuevo.stock_minimo === (f.stock_minimo ?? 0) && nuevo.stock_maximo === (f.stock_maximo ?? 0)) delete limites[clave];
            else limites[clave] = nuevo;
            return { ...c, limites };
        });

    const cambiarStock = (f: Fila, valor: number) =>
        setCambios((c) => {
            const clave = claveUbicacion(f);
            const actual = c.stocks[clave]?.cantidad_actual ?? f.stock;
            const stocks = { ...c.stocks };
            if (valor === actual) delete stocks[clave];
            else
                stocks[clave] = {
                    producto_id: f.producto_id,
                    almacen_id: f.almacen_id!,
                    sector_id: f.sector_id!,
                    cantidad_actual: actual,
                    cantidad_nueva: valor,
                };
            return { ...c, stocks };
        });

    const descartar = () => {
        setCambios(SIN_CAMBIOS);
        setEditando(null);
        setErrores([]);
    };

    const guardar = async () => {
        setGuardando(true);
        setErrores([]);
        try {
            const { data } = await axios.post('/inventario/editor-productos/guardar', {
                productos: cambios.productos,
                precios: Object.values(cambios.precios).map(({ original: _o, ...p }) => p),
                limites: Object.values(cambios.limites),
                stocks: Object.values(cambios.stocks),
            });
            const r = data.resumen;
            toast.success(
                `✅ Guardado: ${r.productos} producto(s), ${r.precios} precio(s), ${r.limites} límite(s), ${r.stocks} stock(s) (${r.movimientos} ajuste(s))`,
            );
            originales.current = {};
            setCambios(SIN_CAMBIOS);
            setConfirmar(false);
            cargar(pagina);
        } catch (e: any) {
            const resp = e?.response?.data;
            setErrores(resp?.errores ?? [resp?.message ?? 'Error al guardar']);
        } finally {
            setGuardando(false);
        }
    };

    // Resumen legible de los cambios para el diálogo de confirmación
    const nombreDe = (id: number) => originales.current[id]?.nombre ?? `#${id}`;
    const resumen = useMemo(() => {
        const lineas: string[] = [];
        Object.entries(cambios.productos).forEach(([id, c]) =>
            Object.entries(c).forEach(([campo, v]) => {
                const etiqueta = {
                    nombre: 'Nombre',
                    codigo_barras: 'Código de barras',
                    categoria_id: 'Categoría',
                    marca_id: 'Marca',
                    unidad_medida_id: 'Unidad',
                }[campo];
                const texto =
                    campo === 'categoria_id'
                        ? categorias[v as number]?.nombre
                        : campo === 'marca_id'
                          ? marcas[v as number]?.nombre
                          : campo === 'unidad_medida_id'
                            ? unidades[v as number]?.nombre
                            : v;
                const vacio = campo === 'codigo_barras' ? '(se elimina)' : '(vacío)';
                lineas.push(`#${id} ${nombreDe(+id)} · ${etiqueta}: ${texto ?? vacio}`);
            }),
        );
        Object.values(cambios.precios).forEach((p) => {
            const tipo = opciones.tiposPrecio.find((t) => t.id === p.tipo_precio_id)?.codigo;
            lineas.push(`#${p.producto_id} ${nombreDe(p.producto_id)} · Precio ${tipo}: ${formatear(p.original) || '—'} → ${formatear(p.precio)}`);
        });
        Object.values(cambios.limites).forEach((l) =>
            lineas.push(`#${l.producto_id} ${nombreDe(l.producto_id)} · Límites: mín ${l.stock_minimo} / máx ${l.stock_maximo || 'sin máx'}`),
        );
        Object.values(cambios.stocks).forEach((s) => {
            const dif = s.cantidad_nueva - s.cantidad_actual;
            lineas.push(
                `#${s.producto_id} ${nombreDe(s.producto_id)} · Stock: ${formatear(s.cantidad_actual)} → ${formatear(s.cantidad_nueva)} (ajuste ${dif > 0 ? '+' : ''}${formatear(dif)})`,
            );
        });
        return lineas;
    }, [cambios, categorias, marcas, unidades, opciones.tiposPrecio]);

    // Las filas de un mismo producto vienen seguidas: sus datos (nombre, código, precios…)
    // se muestran una sola vez con rowSpan; cada fila conserva su ubicación, stock y límites.
    const spans = useMemo(
        () =>
            filas.map((f, i) => {
                if (i > 0 && filas[i - 1].producto_id === f.producto_id) return 0;
                let n = 1;
                while (filas[i + n]?.producto_id === f.producto_id) n++;
                return n;
            }),
        [filas],
    );

    const sectoresFiltro = opciones.sectores.filter((s) => !filtros.almacen_id || s.almacen_id === +filtros.almacen_id);
    const setFiltro = (campo: keyof typeof filtrosIniciales, valor: string) =>
        setFiltros((f) => ({ ...f, [campo]: valor, ...(campo === 'almacen_id' ? { sector_id: '' } : {}) }));
    const selectClass = 'h-9 rounded-md border border-gray-300 bg-white px-2 text-sm dark:border-slate-600 dark:bg-slate-900';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Inventario', href: '/inventario' },
                { title: 'Editor de Productos', href: '#' },
            ]}
        >
            <Head title="Editor de Productos" />

            <div className="space-y-4 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">🧮 Editor de Productos</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Haz clic en una celda para editarla. Los cambios se resaltan y se guardan todos juntos; el stock se registra como ajuste de
                        inventario.
                    </p>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-56 flex-1">
                        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
                        <input
                            className={`${selectClass} w-full pl-8`}
                            placeholder="Buscar por ID, nombre, SKU o código de barras"
                            value={filtros.q}
                            onChange={(e) => setFiltro('q', e.target.value)}
                        />
                    </div>
                    <FiltroBuscable
                        placeholder="Todos los almacenes"
                        valor={filtros.almacen_id}
                        onCambiar={(v) => setFiltro('almacen_id', v)}
                        opciones={opciones.almacenes.map((a) => ({ value: a.id, label: a.nombre }))}
                    />
                    <FiltroBuscable
                        placeholder="Todos los sectores"
                        valor={filtros.sector_id}
                        onCambiar={(v) => setFiltro('sector_id', v)}
                        opciones={sectoresFiltro.map((s) => ({
                            value: s.id,
                            label: s.nombre,
                            description: opciones.almacenes.find((a) => a.id === s.almacen_id)?.nombre,
                        }))}
                    />
                    <FiltroBuscable
                        placeholder="Todas las categorías"
                        valor={filtros.categoria_id}
                        onCambiar={(v) => setFiltro('categoria_id', v)}
                        opciones={opciones.categorias.map((c) => ({ value: c.id, label: c.nombre }))}
                    />
                    <FiltroBuscable
                        placeholder="Todas las marcas"
                        valor={filtros.marca_id}
                        onCambiar={(v) => setFiltro('marca_id', v)}
                        opciones={opciones.marcas.map((m) => ({ value: m.id, label: m.nombre }))}
                    />
                    <FiltroBuscable
                        placeholder="Todas las unidades"
                        valor={filtros.unidad_id}
                        onCambiar={(v) => setFiltro('unidad_id', v)}
                        opciones={opciones.unidades.map((u) => ({
                            value: u.id,
                            label: u.codigo ? `${u.nombre} (${u.codigo})` : u.nombre,
                            description: u.ajena ? '⚠️ De otra empresa' : undefined,
                        }))}
                    />
                    <FiltroBuscable
                        placeholder="Cualquier stock"
                        valor={filtros.stock}
                        onCambiar={(v) => setFiltro('stock', v)}
                        opciones={[
                            { value: 'sin_stock', label: 'Sin stock' },
                            { value: 'con_stock', label: 'Con stock' },
                            { value: 'bajo_minimo', label: 'Bajo el mínimo' },
                            { value: 'sobre_maximo', label: 'Sobre el máximo' },
                        ]}
                    />
                    <FiltroBuscable
                        placeholder="Con o sin precio"
                        valor={filtros.sin_precio}
                        onCambiar={(v) => setFiltro('sin_precio', v)}
                        opciones={opciones.tiposPrecio.map((t) => ({ value: t.id, label: `Sin precio ${t.codigo}` }))}
                    />
                    {Object.values(filtros).some(Boolean) && (
                        <Button variant="ghost" size="sm" onClick={() => setFiltros(filtrosIniciales)}>
                            Limpiar
                        </Button>
                    )}
                </div>

                {/* Tabla */}
                <div
                    className="relative overflow-auto rounded-lg border border-gray-200 dark:border-slate-700"
                    style={{ maxHeight: 'calc(100vh - 290px)' }}
                >
                    {cargando && <div className="absolute inset-x-0 top-0 z-30 h-0.5 animate-pulse bg-blue-500" />}
                    <table className="w-full border-collapse text-sm">
                        <thead className="sticky top-0 z-20 bg-gray-100 text-left text-xs text-gray-600 uppercase dark:bg-slate-800 dark:text-gray-300">
                            <tr>
                                <th className="sticky left-0 z-30 bg-gray-100 px-2 py-2 dark:bg-slate-800">Producto</th>
                                <th className="px-2 py-2">Código de barras</th>
                                <th className="px-2 py-2">Categoría</th>
                                <th className="px-2 py-2">Marca</th>
                                <th className="px-2 py-2">Unidad</th>
                                {opciones.tiposPrecio.map((t) => (
                                    <th key={t.id} className="px-2 py-2 text-right">
                                        {t.codigo}
                                    </th>
                                ))}
                                <th className="px-2 py-2">Almacén / Sector</th>
                                <th className="px-2 py-2 text-right">Stock</th>
                                <th className="px-2 py-2 text-right">Mín</th>
                                <th className="px-2 py-2 text-right">Máx</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filas.map((f, i) => {
                                const k = claveUbicacion(f);
                                const span = spans[i]; // 0 = fila adicional del producto de arriba
                                const conUbicacion = !!f.almacen_id && !!f.sector_id;
                                const lim = valorLimite(f);
                                const stock = valorStock(f);
                                const bajoMinimo = lim.stock_minimo !== null && stock < (lim.stock_minimo ?? 0);
                                const celda = (id: string) => ({
                                    editando: editando === id,
                                    onEditar: () => setEditando(id),
                                    onCerrar: () => setEditando(null),
                                });
                                return (
                                    <tr
                                        key={k}
                                        className={`hover:bg-gray-50/70 dark:hover:bg-slate-800/40 ${
                                            span > 0
                                                ? 'border-t-2 border-gray-300 dark:border-slate-600'
                                                : 'border-t border-dashed border-gray-200 dark:border-slate-800'
                                        }`}
                                    >
                                        {span > 0 && (
                                            <>
                                                <td
                                                    rowSpan={span}
                                                    className="sticky left-0 z-10 min-w-64 bg-white px-2 py-1 align-top dark:bg-slate-950"
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        {/* Abre la edición completa en otra pestaña para no perder los cambios sin guardar */}
                                                        <a
                                                            href={`/productos/${f.producto_id}/edit`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Abrir la edición del producto en otra pestaña"
                                                            className="rounded bg-blue-600 px-1.5 text-xs font-bold text-white hover:bg-blue-700 hover:underline"
                                                        >
                                                            #{f.producto_id}
                                                        </a>
                                                        <CeldaTexto
                                                            {...celda(`${f.producto_id}-nombre`)}
                                                            valor={String(valorProducto(f, 'nombre') ?? '')}
                                                            cambiado={'nombre' in (cambios.productos[f.producto_id] ?? {})}
                                                            onCambiar={(v) => v.trim() && cambiarProducto(f, 'nombre', v.trim())}
                                                        />
                                                    </div>
                                                    {f.sku && <div className="pl-1 text-xs text-gray-500">{f.sku}</div>}
                                                    {span > 1 && (
                                                        <div className="pl-1 text-xs text-blue-600 dark:text-blue-400">{span} ubicaciones →</div>
                                                    )}
                                                </td>
                                                <td rowSpan={span} className="px-1 py-1 align-top font-mono text-xs">
                                                    <CeldaTexto
                                                        {...celda(`${f.producto_id}-codigo`)}
                                                        valor={String(valorProducto(f, 'codigo_barras') ?? '')}
                                                        vacio="sin código"
                                                        cambiado={'codigo_barras' in (cambios.productos[f.producto_id] ?? {})}
                                                        onCambiar={(v) => cambiarProducto(f, 'codigo_barras', v.trim() || null)}
                                                    />
                                                </td>
                                                <td rowSpan={span} className="px-1 py-1 align-top">
                                                    <CeldaSelect
                                                        {...celda(`${f.producto_id}-categoria`)}
                                                        opciones={opciones.categorias}
                                                        valor={valorProducto(f, 'categoria_id') as number | null}
                                                        cambiado={'categoria_id' in (cambios.productos[f.producto_id] ?? {})}
                                                        onCambiar={(v) => cambiarProducto(f, 'categoria_id', v)}
                                                    />
                                                </td>
                                                <td rowSpan={span} className="px-1 py-1 align-top">
                                                    <CeldaSelect
                                                        {...celda(`${f.producto_id}-marca`)}
                                                        opciones={opciones.marcas}
                                                        valor={valorProducto(f, 'marca_id') as number | null}
                                                        cambiado={'marca_id' in (cambios.productos[f.producto_id] ?? {})}
                                                        onCambiar={(v) => cambiarProducto(f, 'marca_id', v)}
                                                    />
                                                </td>
                                                <td rowSpan={span} className="px-1 py-1 align-top">
                                                    <CeldaSelect
                                                        {...celda(`${f.producto_id}-unidad`)}
                                                        opciones={opciones.unidades}
                                                        valor={valorProducto(f, 'unidad_medida_id') as number | null}
                                                        cambiado={'unidad_medida_id' in (cambios.productos[f.producto_id] ?? {})}
                                                        onCambiar={(v) => v !== null && cambiarProducto(f, 'unidad_medida_id', v)}
                                                        sinVacio
                                                    />
                                                </td>
                                                {opciones.tiposPrecio.map((t) => (
                                                    <td key={t.id} rowSpan={span} className="px-1 py-1 text-right align-top">
                                                        <CeldaNumero
                                                            {...celda(`${f.producto_id}-precio-${t.id}`)}
                                                            valor={valorPrecio(f, t.id)}
                                                            cambiado={`${f.producto_id}-${t.id}` in cambios.precios}
                                                            decimales
                                                            onCambiar={(v) => cambiarPrecio(f, t.id, v)}
                                                        />
                                                    </td>
                                                ))}
                                            </>
                                        )}
                                        <td className={`border-l-4 px-2 py-1 text-xs whitespace-nowrap ${colorAlmacen(f.almacen)}`}>
                                            {f.almacen ? (
                                                <>
                                                    <div className="font-semibold">{f.almacen}</div>
                                                    <div className="text-gray-500">
                                                        {f.sector ?? 'Sin sector'}
                                                        {f.lotes > 1 ? ` · ${f.lotes} lotes` : ''}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-gray-400 italic">Sin ubicación</span>
                                            )}
                                        </td>
                                        <td className={`px-1 py-1 text-right ${bajoMinimo ? 'text-red-600 dark:text-red-400' : ''}`}>
                                            <CeldaNumero
                                                {...celda(`${k}-stock`)}
                                                valor={stock}
                                                cambiado={k in cambios.stocks}
                                                decimales={f.es_fraccionado}
                                                deshabilitado={!conUbicacion}
                                                onCambiar={(v) => v !== null && cambiarStock(f, v)}
                                            />
                                        </td>
                                        <td className="px-1 py-1 text-right">
                                            <CeldaNumero
                                                {...celda(`${k}-min`)}
                                                valor={lim.stock_minimo}
                                                cambiado={k in cambios.limites && cambios.limites[k].stock_minimo !== (f.stock_minimo ?? 0)}
                                                deshabilitado={!conUbicacion}
                                                onCambiar={(v) => v !== null && cambiarLimite(f, 'stock_minimo', v)}
                                            />
                                        </td>
                                        <td className="px-1 py-1 text-right">
                                            <CeldaNumero
                                                {...celda(`${k}-max`)}
                                                valor={lim.stock_maximo !== null && lim.stock_maximo >= SIN_MAXIMO ? null : lim.stock_maximo}
                                                vacio="sin máx"
                                                cambiado={k in cambios.limites && cambios.limites[k].stock_maximo !== (f.stock_maximo ?? 0)}
                                                deshabilitado={!conUbicacion}
                                                onCambiar={(v) => cambiarLimite(f, 'stock_maximo', v ?? 0)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            {!cargando && filas.length === 0 && (
                                <tr>
                                    <td colSpan={9 + opciones.tiposPrecio.length} className="py-10 text-center text-gray-500">
                                        Sin productos para estos filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación + barra de cambios */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Button variant="outline" size="sm" disabled={pagina <= 1 || cargando} onClick={() => cargar(pagina - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        Página {pagina} de {paginas} · {total} fila(s)
                        <Button variant="outline" size="sm" disabled={pagina >= paginas || cargando} onClick={() => cargar(pagina + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        {totalCambios > 0 && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                {totalCambios} cambio(s) sin guardar
                            </span>
                        )}
                        <Button variant="outline" disabled={totalCambios === 0} onClick={descartar}>
                            <RotateCcw className="mr-1 h-4 w-4" /> Descartar
                        </Button>
                        <Button
                            disabled={totalCambios === 0}
                            onClick={() => {
                                setErrores([]);
                                setConfirmar(true);
                            }}
                        >
                            <Save className="mr-1 h-4 w-4" /> Guardar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Confirmación con resumen */}
            <Dialog open={confirmar} onOpenChange={(o) => !guardando && setConfirmar(o)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Guardar {totalCambios} cambio(s)</DialogTitle>
                        <DialogDescription>
                            {Object.keys(cambios.stocks).length > 0 ? 'Los cambios de stock se registrarán como ajuste de inventario. ' : ''}
                            Se guarda todo o nada: si algo falla, no se aplica ningún cambio.
                        </DialogDescription>
                    </DialogHeader>
                    <ul className="max-h-80 space-y-1 overflow-auto rounded border border-gray-200 p-3 text-sm dark:border-slate-700">
                        {resumen.map((l, i) => (
                            <li key={i}>• {l}</li>
                        ))}
                    </ul>
                    {errores.length > 0 && (
                        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                            <div className="mb-1 flex items-center gap-1 font-semibold">
                                <AlertCircle className="h-4 w-4" /> No se guardó nada
                            </div>
                            {errores.map((e, i) => (
                                <div key={i}>• {e}</div>
                            ))}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" disabled={guardando} onClick={() => setConfirmar(false)}>
                            Volver a editar
                        </Button>
                        <Button disabled={guardando} onClick={guardar}>
                            {guardando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                            Confirmar y guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

/** Filtro de la barra superior: SearchSelect (el mismo de toda la web), vacío = "todos". */
function FiltroBuscable({
    placeholder,
    valor,
    opciones,
    onCambiar,
}: {
    placeholder: string;
    valor: string;
    opciones: SelectOption[];
    onCambiar: (v: string) => void;
}) {
    return (
        <div className="w-52">
            <SearchSelect
                placeholder={placeholder}
                searchPlaceholder="Buscar…"
                value={valor === '' ? '' : (opciones.find((o) => String(o.value) === valor)?.value ?? '')}
                options={opciones}
                onChange={(v) => onCambiar(v === '' ? '' : String(v))}
                emptyText="Sin coincidencias"
                allowClear
            />
        </div>
    );
}

// ── Celdas editables: muestran el valor y se vuelven campo al hacer clic ──

interface CeldaBase {
    editando: boolean;
    cambiado: boolean;
    deshabilitado?: boolean;
    onEditar: () => void;
    onCerrar: () => void;
}
const claseCelda = (cambiado: boolean, deshabilitado?: boolean) =>
    `block w-full min-h-7 rounded px-1.5 py-0.5 text-left ${
        deshabilitado
            ? 'cursor-not-allowed text-gray-400'
            : cambiado
              ? 'cursor-pointer bg-amber-100 font-semibold ring-1 ring-amber-400 dark:bg-amber-900/40'
              : 'cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800'
    }`;
const claseCampo = 'w-full rounded border border-blue-500 bg-white px-1.5 py-0.5 text-sm outline-none dark:bg-slate-900';

function CeldaTexto({ valor, onCambiar, vacio = '—', ...b }: CeldaBase & { valor: string; onCambiar: (v: string) => void; vacio?: string }) {
    if (!b.editando) {
        return (
            <button type="button" className={claseCelda(b.cambiado)} onClick={b.onEditar}>
                {valor || <span className="text-gray-400 italic">{vacio}</span>}
            </button>
        );
    }
    return (
        <input
            autoFocus
            className={claseCampo}
            defaultValue={valor}
            onBlur={(e) => {
                onCambiar(e.target.value);
                b.onCerrar();
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') b.onCerrar();
            }}
        />
    );
}

function CeldaNumero({
    valor,
    onCambiar,
    decimales,
    vacio = '—',
    ...b
}: CeldaBase & { valor: number | null; onCambiar: (v: number | null) => void; decimales?: boolean; vacio?: string }) {
    if (!b.editando || b.deshabilitado) {
        return (
            <button
                type="button"
                disabled={b.deshabilitado}
                className={`${claseCelda(b.cambiado, b.deshabilitado)} text-right tabular-nums`}
                onClick={b.onEditar}
            >
                {valor === null ? <span className="text-gray-400">{vacio}</span> : formatear(valor)}
            </button>
        );
    }
    const confirmarValor = (texto: string) => {
        const t = texto.trim().replace(',', '.');
        if (t === '') return onCambiar(null);
        const n = Number(t);
        if (!Number.isFinite(n) || n < 0) return toast.error('Ingresa un número válido (0 o mayor)');
        if (!decimales && !Number.isInteger(n)) return toast.error('Este valor solo admite enteros');
        onCambiar(n);
    };
    return (
        <input
            autoFocus
            inputMode="decimal"
            className={`${claseCampo} w-24 text-right`}
            defaultValue={valor ?? ''}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => {
                confirmarValor(e.target.value);
                b.onCerrar();
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') b.onCerrar();
            }}
        />
    );
}

function CeldaSelect({
    valor,
    opciones,
    onCambiar,
    sinVacio,
    ...b
}: CeldaBase & { valor: number | null; opciones: Opcion[]; onCambiar: (v: number | null) => void; sinVacio?: boolean }) {
    const anclaRef = useRef<HTMLButtonElement>(null);
    const actual = opciones.find((o) => o.id === valor);
    return (
        <>
            <button ref={anclaRef} type="button" className={`${claseCelda(b.cambiado)} whitespace-nowrap`} onClick={b.onEditar}>
                {actual ? (
                    actual.ajena ? (
                        <span className="text-amber-600 dark:text-amber-400" title="Unidad de otra empresa: elige la de tu empresa">
                            {actual.nombre} ⚠️
                        </span>
                    ) : (
                        actual.nombre
                    )
                ) : (
                    <span className="text-gray-400">—</span>
                )}
            </button>
            {b.editando && (
                <BuscadorFlotante
                    ancla={anclaRef}
                    opciones={opciones}
                    valor={valor}
                    sinVacio={sinVacio}
                    onElegir={(v) => {
                        onCambiar(v);
                        b.onCerrar();
                    }}
                    onCerrar={b.onCerrar}
                />
            )}
        </>
    );
}

/** Quita tildes y pasa a minúsculas para buscar "cafe" y encontrar "Café". */
const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface ItemBuscador {
    id: number | null;
    nombre: string;
    codigo?: string | null;
    ajena?: boolean;
}

/**
 * Lista con buscador que se dibuja flotando sobre la página (portal + posición fija),
 * para que no la recorte el scroll de la tabla. Teclado: ↑ ↓ Enter Esc.
 */
function BuscadorFlotante({
    ancla,
    opciones,
    valor,
    sinVacio,
    onElegir,
    onCerrar,
}: {
    ancla: React.RefObject<HTMLElement | null>;
    opciones: Opcion[];
    valor: number | null;
    sinVacio?: boolean;
    onElegir: (v: number | null) => void;
    onCerrar: () => void;
}) {
    const panelRef = useRef<HTMLDivElement>(null);
    const listaRef = useRef<HTMLUListElement>(null);
    const [texto, setTexto] = useState('');
    const [pos, setPos] = useState<{ top: number; left: number; width: number; arriba: boolean } | null>(null);

    const items: ItemBuscador[] = useMemo(() => {
        const q = normalizar(texto.trim());
        const filtradas = opciones.filter((o) => !q || normalizar(`${o.nombre} ${o.codigo ?? ''}`).includes(q));
        return [...(sinVacio || q ? [] : [{ id: null, nombre: '— Sin asignar' }]), ...filtradas];
    }, [opciones, texto, sinVacio]);
    const [activo, setActivo] = useState(0);

    // Al abrir o al buscar, queda marcado el valor actual (o el primero)
    useEffect(() => {
        const i = items.findIndex((o) => o.id === valor);
        setActivo(i >= 0 ? i : 0);
    }, [items, valor]);

    // Posición junto a la celda; si no entra abajo, se abre hacia arriba
    useEffect(() => {
        const r = ancla.current?.getBoundingClientRect();
        if (!r) return;
        const alto = 300;
        const arriba = window.innerHeight - r.bottom < alto && r.top > alto;
        setPos({
            top: arriba ? r.top - 4 : r.bottom + 4,
            left: Math.max(8, Math.min(r.left, window.innerWidth - 280)),
            width: Math.max(r.width, 260),
            arriba,
        });
    }, [ancla]);

    // Cerrar al hacer clic afuera o al desplazar la tabla (la posición quedaría desfasada)
    useEffect(() => {
        const fuera = (e: MouseEvent) => {
            if (!panelRef.current?.contains(e.target as Node) && !ancla.current?.contains(e.target as Node)) onCerrar();
        };
        const alDesplazar = (e: Event) => {
            if (!panelRef.current?.contains(e.target as Node)) onCerrar();
        };
        document.addEventListener('mousedown', fuera);
        window.addEventListener('scroll', alDesplazar, true);
        window.addEventListener('resize', onCerrar);
        return () => {
            document.removeEventListener('mousedown', fuera);
            window.removeEventListener('scroll', alDesplazar, true);
            window.removeEventListener('resize', onCerrar);
        };
    }, [ancla, onCerrar]);

    // Mantener visible la opción marcada al moverse con el teclado
    useEffect(() => {
        listaRef.current?.children[activo]?.scrollIntoView({ block: 'nearest' });
    }, [activo]);

    if (!pos) return null;
    return createPortal(
        <div
            ref={panelRef}
            className="fixed z-[100] rounded-md border border-gray-300 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-900"
            style={{
                left: pos.left,
                width: pos.width,
                ...(pos.arriba ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
            }}
        >
            <div className="border-b border-gray-200 p-1.5 dark:border-slate-700">
                <input
                    autoFocus
                    className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-950"
                    placeholder="Buscar…"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setActivo((i) => Math.min(i + 1, items.length - 1));
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setActivo((i) => Math.max(i - 1, 0));
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (items[activo]) onElegir(items[activo].id);
                        } else if (e.key === 'Escape') {
                            onCerrar();
                        }
                    }}
                />
            </div>
            <ul ref={listaRef} className="max-h-60 overflow-y-auto py-1 text-sm">
                {items.length === 0 && <li className="px-3 py-2 text-gray-500">Sin coincidencias</li>}
                {items.map((o, i) => (
                    <li
                        key={o.id ?? 'vacio'}
                        onMouseEnter={() => setActivo(i)}
                        onMouseDown={(e) => {
                            e.preventDefault(); // que el buscador no pierda el foco antes de elegir
                            onElegir(o.id);
                        }}
                        className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 ${
                            i === activo ? 'bg-blue-600 text-white' : o.id === valor ? 'bg-blue-50 dark:bg-slate-800' : ''
                        } ${o.id === null ? 'italic' : ''}`}
                    >
                        <span>
                            {o.nombre}
                            {o.codigo ? <span className="opacity-70"> ({o.codigo})</span> : null}
                        </span>
                        {o.ajena && <span className="text-xs text-amber-500">otra empresa</span>}
                    </li>
                ))}
            </ul>
        </div>,
        document.body,
    );
}
