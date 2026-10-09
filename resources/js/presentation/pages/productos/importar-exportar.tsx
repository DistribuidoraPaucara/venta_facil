import { type ReactNode, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Download,
    FileSpreadsheet,
    Loader2,
    PlusCircle,
    RefreshCw,
    Search,
    Upload,
    X,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import type { BreadcrumbItem } from '@/types';

interface EmpresaOpcion {
    id: number;
    nombre: string;
    activo: boolean;
    productos: number;
}

interface Props {
    columnas: Record<string, string>;
    maxFilas: number;
    puedeElegirEmpresa: boolean;
    puedeImportarStock: boolean;
    empresaUsuarioId: number;
    empresas: EmpresaOpcion[];
}

interface ErrorFila {
    hoja: string;
    fila: number;
    sku: string | null;
    nombre: string | null;
    mensaje: string;
}

interface FilaMuestra {
    fila: number;
    accion: 'crear' | 'actualizar';
    sku: string | null;
    nombre: string;
    categoria: string | null;
    marca: string | null;
    precio_costo: number | null;
    precio_venta: number | null;
}

interface FilaStock {
    fila: number;
    accion: 'nuevo' | 'entrada' | 'salida' | 'fecha';
    sku: string | null;
    producto: string | null;
    lote: string | null;
    stock_actual: number;
    stock_nuevo: number;
    delta: number;
    fecha_vencimiento: string | null;
}

interface ResultadoStock {
    resumen: {
        lotes_nuevos: number;
        entradas: number;
        salidas: number;
        solo_fecha: number;
        unidades_entrada: number;
        unidades_salida: number;
        errores: number;
    };
    muestra: FilaStock[];
}

type TipoCatalogo = 'categorias' | 'marcas' | 'unidades' | 'proveedores';

interface ResultadoCatalogos {
    resumen: Record<TipoCatalogo, { crear: number; actualizar: number }>;
    nuevos: Record<TipoCatalogo, string[]>;
    actualizados: { tipo: TipoCatalogo; id: number; fila: number; campos: string[] }[];
    compartidosEditables: boolean;
}

const NOMBRE_CATALOGO: Record<TipoCatalogo, string> = {
    categorias: 'Categorías',
    marcas: 'Marcas',
    unidades: 'Unidades',
    proveedores: 'Proveedores',
};

interface Resultado {
    empresa: { id: number; nombre: string };
    resumen: { total: number; crear: number; actualizar: number; errores: number };
    nuevos: { categorias: string[]; marcas: string[]; unidades: string[]; proveedores: string[]; tipos_precio: string[] };
    stock: ResultadoStock | null;
    catalogos: ResultadoCatalogos | null;
    documento?: string | null;
    errores: ErrorFila[];
    muestra: FilaMuestra[];
    importado?: boolean;
}

const ACCION_STOCK: Record<FilaStock['accion'], { label: string; clase: string }> = {
    nuevo: { label: 'Lote nuevo', clase: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    entrada: { label: 'Entrada', clase: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    salida: { label: 'Salida', clase: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
    fecha: { label: 'Solo vencimiento', clase: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

const formatoCantidad = (valor: number) => valor.toLocaleString('es', { maximumFractionDigits: 4 });

const BASE_URL = '/productos/importar-exportar';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Productos', href: '/productos' },
    { title: 'Importar / Exportar', href: BASE_URL },
];

const formatoPrecio = (valor: number | null) =>
    valor === null ? '—' : valor.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ImportarExportarProductos({
    columnas,
    maxFilas,
    puedeElegirEmpresa,
    puedeImportarStock,
    empresaUsuarioId,
    empresas,
}: Props) {
    const [incluirStock, setIncluirStock] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [empresaId, setEmpresaId] = useState<number>(empresaUsuarioId);
    const empresa = empresas.find((e) => e.id === empresaId);
    const esOtraEmpresa = empresaId !== empresaUsuarioId;
    const [incluirInactivos, setIncluirInactivos] = useState(false);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [resultado, setResultado] = useState<Resultado | null>(null);
    const [procesando, setProcesando] = useState<'validar' | 'importar' | null>(null);
    const [arrastrando, setArrastrando] = useState(false);

    const seleccionarArchivo = (file: File | null) => {
        setArchivo(file);
        setResultado(null);
        if (file) enviar('validar', file);
    };

    const limpiar = () => {
        setArchivo(null);
        setResultado(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const cambiarEmpresa = (id: number) => {
        setEmpresaId(id);
        // El resultado anterior era para otra empresa: se vuelve a revisar el mismo archivo
        setResultado(null);
        if (archivo) enviar('validar', archivo, id);
    };

    const cambiarIncluirStock = (valor: boolean) => {
        setIncluirStock(valor);
        setResultado(null);
        if (archivo) enviar('validar', archivo, empresaId, valor);
    };

    const enviar = async (
        accion: 'validar' | 'importar',
        file: File | null = archivo,
        destinoId: number = empresaId,
        conStock: boolean = incluirStock,
    ) => {
        if (!file) return;

        if (accion === 'importar') {
            const avisos: string[] = [];
            if (destinoId !== empresaUsuarioId) {
                const nombre = empresas.find((e) => e.id === destinoId)?.nombre ?? `#${destinoId}`;
                avisos.push(`Vas a cargar los datos en la empresa "${nombre}", que no es la tuya.`);
            }
            const s = resultado?.stock?.resumen;
            if (conStock && s && s.lotes_nuevos + s.entradas + s.salidas > 0) {
                avisos.push(
                    `Se registrarán movimientos de inventario: +${formatoCantidad(s.unidades_entrada)} / -${formatoCantidad(s.unidades_salida)} unidades.`,
                );
            }
            if (avisos.length && !confirm(`${avisos.join('\n')}\n\n¿Deseas continuar?`)) {
                return;
            }
        }

        setProcesando(accion);

        const datos = new FormData();
        datos.append('archivo', file);
        datos.append('empresa_id', String(destinoId));
        datos.append('incluir_stock', conStock ? '1' : '0');

        try {
            const { data } = await axios.post<Resultado>(`${BASE_URL}/${accion}`, datos, {
                headers: { Accept: 'application/json' },
            });
            setResultado(data);

            if (accion === 'importar' && data.importado) {
                const s = data.stock?.resumen;
                toast.success(
                    `Importación en ${data.empresa.nombre}: ${data.resumen.crear} creados, ${data.resumen.actualizar} actualizados` +
                        (s ? `, ${s.lotes_nuevos + s.entradas + s.salidas + s.solo_fecha} lotes con cambios.` : '.'),
                );
            }
        } catch (error: any) {
            const data = error.response?.data;
            if (data?.resumen) {
                // 422 de importación con errores de filas
                setResultado(data);
                toast.error('La planilla tiene errores. No se guardó ningún cambio.');
            } else {
                const mensaje = data?.errors?.archivo?.[0] ?? data?.message ?? 'Error al procesar el archivo';
                toast.error(mensaje);
            }
        } finally {
            setProcesando(null);
        }
    };

    const importado = resultado?.importado === true;
    const hayErrores = (resultado?.errores.length ?? 0) > 0;
    const cambiosStock = resultado?.stock
        ? resultado.stock.resumen.lotes_nuevos +
          resultado.stock.resumen.entradas +
          resultado.stock.resumen.salidas +
          resultado.stock.resumen.solo_fecha
        : 0;
    const cambiosCatalogos = resultado?.catalogos
        ? Object.values(resultado.catalogos.resumen).reduce((s, r) => s + r.crear + r.actualizar, 0)
        : 0;
    const puedeImportar =
        !!resultado && !hayErrores && !importado && (resultado.resumen.total > 0 || cambiosStock > 0 || cambiosCatalogos > 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Importar / Exportar productos" />

            <div className="space-y-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Importar / Exportar productos
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Descarga la planilla con tus productos, edítala en Excel y vuelve a subirla para crear o
                        actualizar productos de forma masiva.
                    </p>
                </div>

                {/* Empresa destino */}
                <div
                    className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center ${
                        esOtraEmpresa
                            ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Building2 className={`h-5 w-5 ${esOtraEmpresa ? 'text-amber-600' : 'text-indigo-600'}`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Empresa:</span>
                    </div>
                    {puedeElegirEmpresa && empresas.length > 1 ? (
                        <select
                            value={empresaId}
                            onChange={(e) => cambiarEmpresa(Number(e.target.value))}
                            disabled={!!procesando}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-80 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            {empresas.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.nombre}
                                    {e.id === empresaUsuarioId ? ' (mi empresa)' : ''}
                                    {!e.activo ? ' — inactiva' : ''} · {e.productos} productos
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{empresa?.nombre}</span>
                    )}
                    {esOtraEmpresa && (
                        <span className="text-xs text-amber-800 dark:text-amber-300">
                            Estás trabajando sobre otra empresa: la descarga y la carga se harán en <strong>{empresa?.nombre}</strong>.
                        </span>
                    )}
                    {empresa && empresa.productos === 0 && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                            Empresa sin productos: la descarga te dará la planilla vacía para completar.
                        </span>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* 1. Descargar */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">1</span>
                                Descargar planilla
                            </CardTitle>
                            <CardDescription>
                                Excel con las hojas <strong>Productos</strong>, <strong>Stock</strong> (un renglón por lote),{' '}
                                <strong>Almacenes</strong> y los catálogos <strong>Categorías</strong>, <strong>Marcas</strong>,{' '}
                                <strong>Unidades</strong> y <strong>Proveedores</strong>. También sirve como plantilla vacía
                                para una empresa nueva.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={incluirInactivos}
                                    onChange={(e) => setIncluirInactivos(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                Incluir productos inactivos
                            </label>
                            <Button asChild>
                                <a href={`${BASE_URL}/descargar?empresa_id=${empresaId}${incluirInactivos ? '&inactivos=1' : ''}`}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar Excel
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* 2. Subir */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">2</span>
                                Subir planilla editada
                            </CardTitle>
                            <CardDescription>
                                Se revisa primero y no se guarda nada hasta que confirmes. Máximo {maxFilas.toLocaleString('es')} filas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={(e) => seleccionarArchivo(e.target.files?.[0] ?? null)}
                            />
                            {archivo ? (
                                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                    <FileSpreadsheet className="h-8 w-8 shrink-0 text-green-600" />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{archivo.name}</div>
                                        <div className="text-xs text-gray-500">{(archivo.size / 1024).toFixed(0)} KB</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => enviar('validar')}
                                        disabled={!!procesando}
                                        title="Volver a revisar"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={limpiar} disabled={!!procesando} title="Quitar archivo">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setArrastrando(true);
                                    }}
                                    onDragLeave={() => setArrastrando(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setArrastrando(false);
                                        seleccionarArchivo(e.dataTransfer.files?.[0] ?? null);
                                    }}
                                    className={`flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm transition-colors ${
                                        arrastrando
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-gray-300 hover:border-indigo-400 dark:border-gray-600'
                                    }`}
                                >
                                    <Upload className="h-8 w-8 text-gray-400" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Arrastra el archivo aquí o haz clic para elegirlo
                                    </span>
                                    <span className="text-xs text-gray-500">.xlsx, .xls o .csv (máx. 5 MB)</span>
                                </button>
                            )}

                            {puedeImportarStock && (
                                <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={incluirStock}
                                        onChange={(e) => cambiarIncluirStock(e.target.checked)}
                                        disabled={!!procesando}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300"
                                    />
                                    <span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">Importar también el stock</span>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                                            Aplica la hoja "Stock": los cambios en "Stock nuevo" se registran como entradas o
                                            salidas de ajuste en el kardex. Si no la marcas, el stock no se toca.
                                        </span>
                                    </span>
                                </label>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Procesando */}
                {procesando && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {procesando === 'validar' ? 'Revisando planilla...' : 'Importando productos...'}
                    </div>
                )}

                {/* 3. Resultado */}
                {resultado && !procesando && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {importado ? (
                                    <><CheckCircle2 className="h-5 w-5 text-green-600" /> Importación completada</>
                                ) : hayErrores ? (
                                    <><AlertTriangle className="h-5 w-5 text-red-600" /> La planilla tiene errores</>
                                ) : (
                                    <><CheckCircle2 className="h-5 w-5 text-indigo-600" /> Planilla lista para importar</>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Empresa: <strong>{resultado.empresa.nombre}</strong>.{' '}
                                {importado
                                    ? 'Los cambios se guardaron correctamente.'
                                    : hayErrores
                                      ? 'Corrige las filas indicadas en tu Excel y vuelve a subirlo. No se guardó ningún cambio.'
                                      : 'Revisa el resumen y confirma para guardar los cambios.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Resumen */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {[
                                    { label: 'Filas', valor: resultado.resumen.total, color: 'text-gray-900 dark:text-gray-100' },
                                    { label: importado ? 'Creados' : 'Nuevos', valor: resultado.resumen.crear, color: 'text-green-600' },
                                    { label: importado ? 'Actualizados' : 'A actualizar', valor: resultado.resumen.actualizar, color: 'text-blue-600' },
                                    { label: 'Con errores', valor: resultado.resumen.errores, color: 'text-red-600' },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
                                        <div className={`text-2xl font-semibold ${item.color}`}>{item.valor}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Catálogos que se crearán en la empresa destino */}
                            {!hayErrores &&
                                (() => {
                                    const grupos = [
                                        { label: 'Tipos de precio', items: resultado.nuevos.tipos_precio },
                                        { label: 'Unidades', items: resultado.nuevos.unidades },
                                        { label: 'Categorías', items: resultado.nuevos.categorias },
                                        { label: 'Marcas', items: resultado.nuevos.marcas },
                                        { label: 'Proveedores', items: resultado.nuevos.proveedores ?? [] },
                                    ].filter((g) => g.items.length > 0);
                                    if (grupos.length === 0) return null;
                                    return (
                                        <div className="space-y-2 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-900 dark:bg-indigo-900/20">
                                            <div className="flex items-center gap-2 text-sm font-medium text-indigo-900 dark:text-indigo-200">
                                                <PlusCircle className="h-4 w-4" />
                                                {importado ? 'Se crearon' : 'Se crearán'} en {resultado.empresa.nombre}:
                                            </div>
                                            {grupos.map((g) => (
                                                <div key={g.label} className="flex flex-wrap items-center gap-1.5 text-sm">
                                                    <span className="w-28 shrink-0 text-xs text-gray-600 dark:text-gray-400">
                                                        {g.label} ({g.items.length})
                                                    </span>
                                                    {g.items.slice(0, 30).map((item) => (
                                                        <Badge key={item} variant="outline" className="bg-white font-normal dark:bg-gray-900">
                                                            {item}
                                                        </Badge>
                                                    ))}
                                                    {g.items.length > 30 && (
                                                        <span className="text-xs text-gray-500">y {g.items.length - 30} más</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}

                            {/* Errores */}
                            {hayErrores && (
                                <TablaPaginada
                                    items={resultado.errores}
                                    textoBusqueda={(e) => `${e.sku ?? ''} ${e.nombre ?? ''} ${e.mensaje} ${e.fila}`}
                                    filtros={[...new Set(resultado.errores.map((e) => e.hoja))].map((hoja) => ({
                                        valor: hoja,
                                        label: `Hoja ${hoja}`,
                                        aplica: (e: ErrorFila) => e.hoja === hoja,
                                    }))}
                                    placeholder="Buscar por SKU, producto, fila o mensaje..."
                                    className="border-red-200 dark:border-red-900"
                                    encabezado={
                                        <TableRow>
                                            <TableHead className="w-24">Hoja</TableHead>
                                            <TableHead className="w-16">Fila</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Error</TableHead>
                                        </TableRow>
                                    }
                                    fila={(e, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal">{e.hoja}</Badge>
                                            </TableCell>
                                            <TableCell className="font-mono">{e.fila}</TableCell>
                                            <TableCell className="font-mono text-xs">{e.sku ?? '—'}</TableCell>
                                            <TableCell>{e.nombre ?? '—'}</TableCell>
                                            <TableCell className="text-red-700 dark:text-red-400">{e.mensaje}</TableCell>
                                        </TableRow>
                                    )}
                                />
                            )}

                            {/* Vista previa */}
                            {!hayErrores && resultado.muestra.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Hoja Productos</div>
                                    <TablaPaginada
                                        items={resultado.muestra}
                                        textoBusqueda={(f) => `${f.sku ?? ''} ${f.nombre} ${f.categoria ?? ''} ${f.marca ?? ''}`}
                                        filtros={[
                                            { valor: 'crear', label: 'Nuevos', aplica: (f: FilaMuestra) => f.accion === 'crear' },
                                            { valor: 'actualizar', label: 'Actualizar', aplica: (f: FilaMuestra) => f.accion === 'actualizar' },
                                        ]}
                                        placeholder="Buscar por SKU, nombre, categoría o marca..."
                                        encabezado={
                                            <TableRow>
                                                <TableHead className="w-16">Fila</TableHead>
                                                <TableHead>Acción</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Categoría</TableHead>
                                                <TableHead>Marca</TableHead>
                                                <TableHead className="text-right">Costo</TableHead>
                                                <TableHead className="text-right">Venta</TableHead>
                                            </TableRow>
                                        }
                                        fila={(f) => (
                                            <TableRow key={f.fila}>
                                                <TableCell className="font-mono">{f.fila}</TableCell>
                                                <TableCell>
                                                    {f.accion === 'crear' ? (
                                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Nuevo</Badge>
                                                    ) : (
                                                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Actualizar</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{f.sku ?? <span className="text-gray-400">auto</span>}</TableCell>
                                                <TableCell>{f.nombre}</TableCell>
                                                <TableCell>{f.categoria ?? '—'}</TableCell>
                                                <TableCell>{f.marca ?? '—'}</TableCell>
                                                <TableCell className="text-right">{formatoPrecio(f.precio_costo)}</TableCell>
                                                <TableCell className="text-right">{formatoPrecio(f.precio_venta)}</TableCell>
                                            </TableRow>
                                        )}
                                    />
                                </div>
                            )}

                            {/* Catálogos (hojas Categorías, Marcas, Unidades, Proveedores) */}
                            {!hayErrores && resultado.catalogos && cambiosCatalogos > 0 && (
                                <div className="space-y-2 rounded-lg border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-900 dark:bg-violet-900/10">
                                    <div className="text-sm font-medium text-violet-900 dark:text-violet-200">
                                        Hojas de catálogos {importado ? '(aplicadas)' : '(se aplican antes que los productos)'}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {(Object.keys(NOMBRE_CATALOGO) as TipoCatalogo[]).map((tipo) => {
                                            const r = resultado.catalogos!.resumen[tipo];
                                            return (
                                                <div key={tipo} className="rounded-lg bg-white p-2 dark:bg-gray-900">
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{NOMBRE_CATALOGO[tipo]}</div>
                                                    <div className="text-sm">
                                                        <span className="font-semibold text-green-600">{r.crear}</span>{' '}
                                                        <span className="text-xs text-gray-500">nuevos</span> ·{' '}
                                                        <span className="font-semibold text-blue-600">{r.actualizar}</span>{' '}
                                                        <span className="text-xs text-gray-500">modificados</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {(Object.keys(NOMBRE_CATALOGO) as TipoCatalogo[])
                                        .filter((tipo) => resultado.catalogos!.nuevos[tipo].length > 0)
                                        .map((tipo) => (
                                            <div key={tipo} className="flex flex-wrap items-center gap-1.5 text-sm">
                                                <span className="w-28 shrink-0 text-xs text-gray-600 dark:text-gray-400">
                                                    {NOMBRE_CATALOGO[tipo]} nuevos
                                                </span>
                                                {resultado.catalogos!.nuevos[tipo].slice(0, 30).map((n) => (
                                                    <Badge key={n} variant="outline" className="bg-white font-normal dark:bg-gray-900">
                                                        {n}
                                                    </Badge>
                                                ))}
                                                {resultado.catalogos!.nuevos[tipo].length > 30 && (
                                                    <span className="text-xs text-gray-500">y {resultado.catalogos!.nuevos[tipo].length - 30} más</span>
                                                )}
                                            </div>
                                        ))}
                                    {resultado.catalogos.actualizados.length > 0 && (
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            Modificados:{' '}
                                            {resultado.catalogos.actualizados
                                                .slice(0, 20)
                                                .map((a) => `${NOMBRE_CATALOGO[a.tipo]} ID ${a.id} (${a.campos.join(', ')})`)
                                                .join(' · ')}
                                            {resultado.catalogos.actualizados.length > 20 && ` y ${resultado.catalogos.actualizados.length - 20} más`}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Stock */}
                            {!hayErrores && resultado.stock && (
                                <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Hoja Stock{' '}
                                        {cambiosStock === 0 && (
                                            <span className="font-normal text-gray-500">— sin cambios de stock (ninguna fila con "Stock nuevo" distinto)</span>
                                        )}
                                    </div>
                                    {cambiosStock > 0 && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                {[
                                                    { label: 'Lotes nuevos', valor: resultado.stock.resumen.lotes_nuevos, color: 'text-green-600' },
                                                    { label: 'Entradas', valor: resultado.stock.resumen.entradas, color: 'text-blue-600' },
                                                    { label: 'Salidas', valor: resultado.stock.resumen.salidas, color: 'text-orange-600' },
                                                    { label: 'Solo vencimiento', valor: resultado.stock.resumen.solo_fecha, color: 'text-gray-700 dark:text-gray-300' },
                                                ].map((item) => (
                                                    <div key={item.label} className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
                                                        <div className={`text-xl font-semibold ${item.color}`}>{item.valor}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                Unidades: <strong className="text-blue-600">+{formatoCantidad(resultado.stock.resumen.unidades_entrada)}</strong>{' '}
                                                / <strong className="text-orange-600">-{formatoCantidad(resultado.stock.resumen.unidades_salida)}</strong>
                                                {importado && resultado.documento && (
                                                    <> · Documento en el kardex: <span className="font-mono">{resultado.documento}</span></>
                                                )}
                                            </div>
                                            <TablaPaginada
                                                items={resultado.stock.muestra}
                                                textoBusqueda={(f) => `${f.sku ?? ''} ${f.producto ?? ''} ${f.lote ?? ''}`}
                                                filtros={(Object.keys(ACCION_STOCK) as FilaStock['accion'][]).map((accion) => ({
                                                    valor: accion,
                                                    label: ACCION_STOCK[accion].label,
                                                    aplica: (f: FilaStock) => f.accion === accion,
                                                }))}
                                                placeholder="Buscar por SKU, producto o lote..."
                                                encabezado={
                                                    <TableRow>
                                                        <TableHead className="w-16">Fila</TableHead>
                                                        <TableHead>Movimiento</TableHead>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead>Producto</TableHead>
                                                        <TableHead>Lote</TableHead>
                                                        <TableHead className="text-right">Actual</TableHead>
                                                        <TableHead className="text-right">Nuevo</TableHead>
                                                        <TableHead className="text-right">Diferencia</TableHead>
                                                    </TableRow>
                                                }
                                                fila={(f) => (
                                                    <TableRow key={f.fila}>
                                                        <TableCell className="font-mono">{f.fila}</TableCell>
                                                        <TableCell>
                                                            <Badge className={ACCION_STOCK[f.accion].clase}>{ACCION_STOCK[f.accion].label}</Badge>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">{f.sku ?? '—'}</TableCell>
                                                        <TableCell>{f.producto ?? '—'}</TableCell>
                                                        <TableCell className="font-mono text-xs">
                                                            {f.lote ?? '—'}
                                                            {f.fecha_vencimiento && <span className="ml-1 text-gray-500">(vence {f.fecha_vencimiento})</span>}
                                                        </TableCell>
                                                        <TableCell className="text-right">{formatoCantidad(f.stock_actual)}</TableCell>
                                                        <TableCell className="text-right">{formatoCantidad(f.stock_nuevo)}</TableCell>
                                                        <TableCell
                                                            className={`text-right font-medium ${f.delta > 0 ? 'text-blue-600' : f.delta < 0 ? 'text-orange-600' : 'text-gray-500'}`}
                                                        >
                                                            {f.delta > 0 ? '+' : ''}
                                                            {formatoCantidad(f.delta)}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Acciones */}
                            <div className="flex justify-end gap-2">
                                {importado ? (
                                    <Button variant="outline" onClick={limpiar}>
                                        Subir otra planilla
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="outline" onClick={limpiar}>
                                            Cancelar
                                        </Button>
                                        <Button onClick={() => enviar('importar')} disabled={!puedeImportar}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Importar {resultado.resumen.crear + resultado.resumen.actualizar} productos
                                            {cambiosStock > 0 && `, ${cambiosStock} lotes`}
                                            {cambiosCatalogos > 0 && `, ${cambiosCatalogos} catálogos`}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Ayuda */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">¿Cómo funciona?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                <strong>SKU</strong> identifica el producto: si ya existe se <strong>actualiza</strong>; si está
                                vacío o no existe se <strong>crea</strong> uno nuevo (con SKU vacío se genera automáticamente).
                            </li>
                            <li>En productos existentes, una celda vacía <strong>no borra</strong> el dato: se deja como estaba.</li>
                            <li>
                                Las categorías, marcas y unidades que no existan en la empresa se crean automáticamente, igual
                                que los tipos de precio de costo y venta (útil al migrar una empresa nueva).
                            </li>
                            <li>
                                El SKU es único en todo el sistema: si al migrar un SKU ya lo usa otra empresa, deja la celda
                                vacía y se generará uno nuevo.
                            </li>
                            <li>Si alguna fila tiene errores <strong>no se guarda nada</strong>; corrige y vuelve a subir.</li>
                        </ul>
                        <div className="pt-1 font-medium text-gray-900 dark:text-gray-100">
                            Hojas Categorías, Marcas, Unidades y Proveedores
                        </div>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                Fila con <strong>ID</strong>: se actualizan los datos que cambies (celda vacía = sin cambio). Fila{' '}
                                <strong>sin ID</strong>: se crea en la empresa elegida.
                            </li>
                            <li>
                                No se eliminan registros: para dejar de usar uno márcalo con <strong>Activo = NO</strong>. La columna
                                "Productos" indica cuántos productos lo usan.
                            </li>
                            <li>
                                Se aplican <strong>antes</strong> que la hoja Productos: un producto puede usar una categoría, marca,
                                unidad o proveedor que crees o renombres en la misma planilla.
                            </li>
                            <li>
                                Los registros <strong>compartidos</strong> entre empresas solo se pueden modificar si el sistema tiene
                                una sola empresa; si hay varias, crea uno propio.
                            </li>
                        </ul>
                        <div className="pt-1 font-medium text-gray-900 dark:text-gray-100">Hoja Stock (opcional)</div>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                Solo se aplica si marcas <strong>"Importar también el stock"</strong>. Cada fila es un lote; solo
                                se toca si escribes un valor en <strong>Stock nuevo</strong>.
                            </li>
                            <li>
                                Fila con <strong>ID</strong>: lote existente. Se registra una entrada o salida de ajuste por la
                                diferencia (queda en el kardex). No se puede cambiar su almacén ni su código de lote.
                            </li>
                            <li>
                                Fila <strong>sin ID</strong>: lote nuevo. Indica SKU, almacén (ver hoja Almacenes), lote y
                                vencimiento. Sirve también para productos nuevos creados en la hoja Productos (con su SKU).
                            </li>
                            <li>
                                Los lotes <strong>no se eliminan</strong> desde la planilla, y un lote con reservas no se puede
                                bajar.
                            </li>
                        </ul>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {Object.values(columnas).map((col) => (
                                <Badge key={col} variant="outline" className="font-normal">
                                    {col}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

interface FiltroTabla<T> {
    valor: string;
    label: string;
    aplica: (item: T) => boolean;
}

interface TablaPaginadaProps<T> {
    items: T[];
    /** Texto donde busca el buscador (SKU, nombre, etc.) */
    textoBusqueda: (item: T) => string;
    filtros?: FiltroTabla<T>[];
    encabezado: ReactNode;
    fila: (item: T, indice: number) => ReactNode;
    placeholder?: string;
    porPagina?: number;
    className?: string;
}

/**
 * Tabla con búsqueda, filtro y paginación en el navegador (las filas ya vienen todas del servidor).
 */
function TablaPaginada<T>({
    items,
    textoBusqueda,
    filtros = [],
    encabezado,
    fila,
    placeholder = 'Buscar...',
    porPagina = 25,
    className = 'border-gray-200 dark:border-gray-700',
}: TablaPaginadaProps<T>) {
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState('');
    const [pagina, setPagina] = useState(1);

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        const f = filtros.find((x) => x.valor === filtro);
        return items.filter((item) => (!f || f.aplica(item)) && (!q || textoBusqueda(item).toLowerCase().includes(q)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, busqueda, filtro]);

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
    const paginaActual = Math.min(pagina, totalPaginas);
    const desde = (paginaActual - 1) * porPagina;
    const visibles = filtrados.slice(desde, desde + porPagina);

    const cambiarBusqueda = (valor: string) => {
        setBusqueda(valor);
        setPagina(1);
    };
    const cambiarFiltro = (valor: string) => {
        setFiltro(valor);
        setPagina(1);
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => cambiarBusqueda(e.target.value)}
                        placeholder={placeholder}
                        className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </div>
                {filtros.length > 0 && (
                    <select
                        value={filtro}
                        onChange={(e) => cambiarFiltro(e.target.value)}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                        <option value="">Todas ({items.length})</option>
                        {filtros.map((f) => (
                            <option key={f.valor} value={f.valor}>
                                {f.label} ({items.filter(f.aplica).length})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className={`max-h-[28rem] overflow-auto rounded-lg border ${className}`}>
                <Table>
                    <TableHeader>{encabezado}</TableHeader>
                    <TableBody>
                        {visibles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={20} className="py-6 text-center text-sm text-gray-500">
                                    Sin resultados
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibles.map((item, i) => fila(item, desde + i))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>
                    {filtrados.length === 0
                        ? '0 filas'
                        : `${desde + 1}–${Math.min(desde + porPagina, filtrados.length)} de ${filtrados.length.toLocaleString('es')} filas`}
                    {filtrados.length !== items.length && ` (filtradas de ${items.length.toLocaleString('es')})`}
                </span>
                {totalPaginas > 1 && (
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPagina(paginaActual - 1)} disabled={paginaActual <= 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-2">
                            Página {paginaActual} de {totalPaginas}
                        </span>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPagina(paginaActual + 1)} disabled={paginaActual >= totalPaginas}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
