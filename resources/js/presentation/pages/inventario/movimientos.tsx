// Presentation Layer: Enhanced Movimientos Page
// Página principal de movimientos de inventario con arquitectura de 4 capas

import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import MovimientosTable from '@/presentation/components/Inventario/MovimientosTable';
import MovimientosFilters from '@/presentation/components/Inventario/MovimientosFilters';
import { periodoDeFechas, periodosRapidos } from '@/presentation/components/Inventario/FiltrosMovimientos';
import MovimientosStats, { formatearUnidades } from '@/presentation/components/Inventario/MovimientosStats';
import { ImprimirMovimientosButton } from '@/presentation/components/impresion/ImprimirMovimientosButton';
import { ImprimirProductosVendidosButton } from '@/presentation/components/impresion/ImprimirProductosVendidosButton';
import { Button } from '@/presentation/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
} from '@/presentation/components/ui/dropdown-menu';
import { Plus, BarChart3, MoreVertical, Eye, EyeOff, List, Package, FileSpreadsheet, BookOpen } from 'lucide-react';
import ResumenProductosMovimientos from '@/presentation/components/Inventario/ResumenProductosMovimientos';
import KardexProducto from '@/presentation/components/Inventario/KardexProducto';
import type {
    MovimientoInventario,
    EstadisticasListadoMovimientos,
    ResumenProductoMovimientos,
    KardexProducto as KardexProductoData,
    FiltrosMovimientos
} from '@/domain/entities/movimientos-inventario';
import type { Pagination } from '@/domain/entities/shared';
import { useMovimientosInventario } from '@/application/hooks/use-movimientos-inventario';

interface ProductoVendido {
    id: number;
    nombre: string;
    sku: string;
    cantidad_total: number;
    precio_unitario: number;
    subtotal: number;
}

interface PageProps extends InertiaPageProps {
    movimientos: Pagination<MovimientoInventario>;
    filtros: FiltrosMovimientos;
    stats: EstadisticasListadoMovimientos;
    almacenes: Array<{ id: number; nombre: string }>;
    usuarios?: Array<{ id: number; name: string }>;
    productos: Array<{ id: number; nombre: string }>;
    productosVendidosHoy?: ProductoVendido[];
    resumen_productos?: ResumenProductoMovimientos[]; // Solo al abrir la pestaña "Por producto"
    kardex?: KardexProductoData | null; // Solo al abrir la pestaña "Kardex"; null = producto no encontrado
}

const defaultStats: EstadisticasListadoMovimientos = {
    total_movimientos: 0,
    total_anulados: 0,
    total_entradas: 0,
    unidades_entradas: 0,
    total_salidas: 0,
    unidades_salidas: 0,
    total_ventas: 0,
    unidades_vendidas: 0,
    total_compras: 0,
    unidades_compradas: 0,
    total_transferencias: 0,
    unidades_transferidas: 0,
    total_ajustes: 0,
    total_mermas: 0,
    unidades_mermas: 0,
    productos_afectados: 0,
    almacenes_activos: 0,
    por_tipo: [],
    tendencia: [],
};

// Preferencias del usuario en este navegador: últimos filtros (sin fechas), período rápido y switches de la tabla
const CLAVE_PREFERENCIAS = 'inventario.movimientos.preferencias';
interface PreferenciasMovimientos {
    filtros?: Record<string, unknown>;
    periodo?: string | null;
    disponibleReservado?: boolean;
    valoresPorLote?: boolean;
}
const leerPreferencias = (): PreferenciasMovimientos => {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_PREFERENCIAS) || '{}');
    } catch {
        return {};
    }
};
const guardarPreferencias = (cambios: PreferenciasMovimientos) => {
    try {
        localStorage.setItem(CLAVE_PREFERENCIAS, JSON.stringify({ ...leerPreferencias(), ...cambios }));
    } catch {
        // Sin almacenamiento (modo privado): no se recuerda
    }
};

// Texto corto del período filtrado para las tarjetas ("hoy", "01/10 – 31/10")
const describirPeriodo = (desde?: string, hasta?: string): string => {
    const hoy = new Date().toLocaleDateString('en-CA');
    const d = (desde || hoy).slice(0, 10);
    const h = (hasta || hoy).slice(0, 10);
    const corto = (f: string) => `${f.slice(8, 10)}/${f.slice(5, 7)}`;
    if (d === h) return d === hoy ? 'hoy' : corto(d);
    return `${corto(d)} – ${corto(h)}`;
};

const MovimientosInventarioPage: React.FC<PageProps> = ({
    movimientos,
    filtros,
    stats = defaultStats,
    almacenes = [],
    usuarios = [],
    productos = [],
    productosVendidosHoy = [],
    resumen_productos,
    kardex,
}) => {
    const periodo = describirPeriodo((filtros as any)?.fecha_inicio, (filtros as any)?.fecha_fin);
    // ✅ Estado de UI
    const [activeTab, setActiveTab] = useState<'lista' | 'estadisticas' | 'productos' | 'kardex'>('lista');
    const [cargandoResumen, setCargandoResumen] = useState(false);
    const [kardexProductoId, setKardexProductoId] = useState<number | null>(null);
    const [cargandoKardex, setCargandoKardex] = useState(false);

    // El resumen por producto no viene en la carga normal: se pide al abrir su pestaña
    // (y de nuevo tras cambiar filtros, porque cada búsqueda lo deja sin cargar)
    useEffect(() => {
        if (activeTab !== 'productos' || resumen_productos !== undefined || cargandoResumen) return;
        setCargandoResumen(true);
        router.reload({ only: ['resumen_productos'], onFinish: () => setCargandoResumen(false) });
    }, [activeTab, resumen_productos]);

    // Kardex: igual que el resumen, con el producto elegido y el período/almacén de los filtros
    const cargarKardex = (productoId: number) => {
        setCargandoKardex(true);
        router.reload({ only: ['kardex'], data: { kardex_producto_id: productoId }, onFinish: () => setCargandoKardex(false) });
    };
    useEffect(() => {
        if (activeTab === 'kardex' && kardexProductoId && kardex === undefined && !cargandoKardex) cargarKardex(kardexProductoId);
    }, [activeTab, kardexProductoId, kardex]);

    const elegirProductoKardex = (productoId: number | null) => {
        setKardexProductoId(productoId);
        setActiveTab('kardex');
        if (productoId && kardex?.producto.id !== productoId) cargarKardex(productoId);
    };
    const [mostrarValoresPorLote, setMostrarValoresPorLote] = useState(() => !!leerPreferencias().valoresPorLote); // ✅ NUEVO (2026-06-28): Toggle para valores por lote
    const [mostrarDisponibleReservado, setMostrarDisponibleReservado] = useState(() => !!leerPreferencias().disponibleReservado); // Ocultos salvo que el usuario los haya activado antes

    // ✅ Hook de aplicación para manejo de acciones
    const { handleCreateAjuste, handleGoToReportes } = useMovimientosInventario();

    // Recordar los switches de la tabla
    useEffect(() => {
        guardarPreferencias({ disponibleReservado: mostrarDisponibleReservado, valoresPorLote: mostrarValoresPorLote });
    }, [mostrarDisponibleReservado, mostrarValoresPorLote]);

    // Al entrar sin parámetros en la URL, reabrir con los últimos filtros usados.
    // Las fechas se recuerdan como período rápido ("Este mes") para que se recalculen cada día.
    useEffect(() => {
        if (window.location.search) return;
        const { filtros: guardados = {}, periodo: periodoGuardado } = leerPreferencias();
        const rango = periodosRapidos.find((p) => p.clave === periodoGuardado && p.clave !== 'hoy')?.rango();
        if (Object.keys(guardados).length === 0 && !rango) return;
        router.get(
            '/inventario/movimientos',
            { ...guardados, ...(rango ? { fecha_inicio: rango[0], fecha_fin: rango[1] } : {}) },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, []);

    // ✅ Aplicar filtros cuando el usuario hace clic en "Buscar"
    const handleFiltrosChange = (nuevosFiltros: FiltrosMovimientos) => {
        // ✅ NUEVO (2026-03-27): Limpiar parámetros vacíos
        const filtrosLimpios = limpiarFiltros(nuevosFiltros);

        // Recordar filtros sin las fechas exactas (solo el período rápido, si coincide con uno)
        const { fecha_inicio, fecha_fin, ...sinFechas } = filtrosLimpios;
        guardarPreferencias({ filtros: sinFechas, periodo: periodoDeFechas(fecha_inicio, fecha_fin) ?? null });

        // Convertir filtros a parámetros de query
        const queryParams = {
            ...filtrosLimpios,
            page: 1, // Resetear a página 1 cuando se aplican filtros
        };

        // Navegar con los nuevos filtros
        router.get('/inventario/movimientos', queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // ✅ Función auxiliar para limpiar filtros vacíos (2026-03-27)
    const limpiarFiltros = (filtrosObj: any) => {
        const filtrosLimpios: any = {};
        Object.entries(filtrosObj).forEach(([key, value]) => {
            // Solo incluir parámetros que tengan valor (no vacíos, no null, no undefined)
            if (value !== '' && value !== null && value !== undefined) {
                filtrosLimpios[key] = value;
            }
        });
        return filtrosLimpios;
    };

    // ✅ Breadcrumbs
    const breadcrumbs = [
        {
            title: 'Inventario',
            href: '/inventario',
        },
        {
            title: 'Movimientos',
            href: '/inventario/movimientos',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Movimientos de Inventario" />

            <div className="space-y-2 p-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Movimientos de Inventario
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Consulta y analiza todos los movimientos de tu inventario
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Switch: mostrar/ocultar disponible y reservado en la tabla */}
                        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={mostrarDisponibleReservado}
                                onClick={() => setMostrarDisponibleReservado(!mostrarDisponibleReservado)}
                                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                    mostrarDisponibleReservado ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                        mostrarDisponibleReservado ? 'translate-x-4' : 'translate-x-0.5'
                                    }`}
                                />
                            </button>
                            Disponible / Reservado
                        </label>

                        {/* ✅ Dropdown con acciones flotante */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" title="Acciones">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {/* Mostrar/Ocultar valores por lote */}
                                <DropdownMenuCheckboxItem
                                    checked={mostrarValoresPorLote}
                                    onCheckedChange={() => setMostrarValoresPorLote(!mostrarValoresPorLote)}
                                    className="cursor-pointer"
                                >
                                    {mostrarValoresPorLote ? (
                                        <Eye className="w-4 h-4 mr-2" />
                                    ) : (
                                        <EyeOff className="w-4 h-4 mr-2" />
                                    )}
                                    Valores por Lote
                                </DropdownMenuCheckboxItem>

                                <DropdownMenuSeparator />

                                {/* Imprimir movimientos */}
                                <div onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem asChild>
                                        <div className="cursor-pointer">
                                            <ImprimirMovimientosButton
                                                movimientos={movimientos.data as any}
                                                filtros={filtros}
                                            />
                                        </div>
                                    </DropdownMenuItem>
                                </div>

                                {/* Imprimir productos vendidos */}
                                <div onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem asChild>
                                        <div className="cursor-pointer">
                                            <ImprimirProductosVendidosButton
                                                productosVendidos={productosVendidosHoy}
                                                fecha={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </DropdownMenuItem>
                                </div>

                                {/* Excel con los filtros aplicados: movimientos, resumen por producto y por tipo */}
                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <a href={`/inventario/movimientos/exportar?${new URLSearchParams(limpiarFiltros(filtros ?? {})).toString()}`}>
                                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                                        Exportar a Excel
                                    </a>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {/* Reportes */}
                                <DropdownMenuItem onClick={handleGoToReportes} className="cursor-pointer">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Reportes
                                </DropdownMenuItem>

                                {/* Ajustar Stock */}
                                <DropdownMenuItem onClick={handleCreateAjuste} className="cursor-pointer">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajustar Stock
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Filtros */}
                <MovimientosFilters
                    filtros={filtros}
                    onFiltrosChange={handleFiltrosChange}
                    almacenes={almacenes}
                    usuarios={usuarios}
                    productos={productos}
                />

                {/* Tabs navegación */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('lista')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'lista'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <List className="w-4 h-4" />
                            Lista de Movimientos
                        </button>
                        <button
                            onClick={() => setActiveTab('estadisticas')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'estadisticas'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Estadísticas
                        </button>
                        <button
                            onClick={() => setActiveTab('productos')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'productos'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <Package className="w-4 h-4" />
                            Por producto
                        </button>
                        <button
                            onClick={() => setActiveTab('kardex')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'kardex'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Kardex
                        </button>
                    </nav>
                </div>

                {/* Contenido de las tabs */}
                {activeTab === 'lista' && (
                    <div className="space-y-4">
                        {/* Resumen del período filtrado: unidades y cantidad de movimientos */}
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                            {[
                                {
                                    titulo: 'Movimientos',
                                    valor: stats.total_movimientos.toLocaleString('es-ES'),
                                    detalle: stats.total_anulados > 0 ? `${stats.total_anulados} anulados` : `${stats.productos_afectados} productos`,
                                    color: 'text-gray-900 dark:text-white',
                                    icono: '📦',
                                },
                                {
                                    titulo: 'Vendido',
                                    valor: formatearUnidades(stats.unidades_vendidas),
                                    detalle: `${stats.total_ventas.toLocaleString('es-ES')} movimientos`,
                                    color: 'text-blue-600 dark:text-blue-400',
                                    icono: '🛒',
                                },
                                {
                                    titulo: 'Entradas',
                                    valor: `+${formatearUnidades(stats.unidades_entradas)}`,
                                    detalle: `${stats.total_entradas.toLocaleString('es-ES')} movimientos`,
                                    color: 'text-green-600 dark:text-green-400',
                                    icono: '⬆️',
                                },
                                {
                                    titulo: 'Salidas',
                                    valor: `-${formatearUnidades(stats.unidades_salidas)}`,
                                    detalle: `${stats.total_salidas.toLocaleString('es-ES')} movimientos`,
                                    color: 'text-red-600 dark:text-red-400',
                                    icono: '⬇️',
                                },
                                {
                                    titulo: 'Transferido',
                                    valor: formatearUnidades(stats.unidades_transferidas),
                                    detalle: `${stats.total_transferencias.toLocaleString('es-ES')} movimientos`,
                                    color: 'text-purple-600 dark:text-purple-400',
                                    icono: '🔄',
                                },
                            ].map((t) => (
                                <div key={t.titulo} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {t.titulo} <span className="text-xs font-normal">· {periodo}</span>
                                            </p>
                                            <p className={`text-2xl font-bold ${t.color}`}>{t.valor}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.detalle}</p>
                                        </div>
                                        <div className="text-2xl">{t.icono}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tabla de movimientos */}
                        <MovimientosTable
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            movimientos={movimientos.data as any}
                            mostrarValoresPorLote={mostrarValoresPorLote}
                            mostrarDisponibleReservado={mostrarDisponibleReservado}
                            direccionId={filtros?.direccion === 'asc' ? 'asc' : 'desc'}
                            onOrdenarId={(direccion) => {
                                // Vuelve a la página 1 con el nuevo orden y los mismos filtros
                                router.get(
                                    '/inventario/movimientos',
                                    { ...limpiarFiltros({ ...filtros, direccion: direccion === 'asc' ? 'asc' : undefined }), page: 1 },
                                    { preserveState: true, preserveScroll: true },
                                );
                            }}
                            pagination={{
                                current_page: movimientos.current_page,
                                last_page: movimientos.last_page,
                                per_page: movimientos.per_page,
                                total: movimientos.total,
                                from: movimientos.from,
                                to: movimientos.to,
                            }}
                            onPageChange={(page) => {
                                // Preservar filtros actuales cuando cambias de página
                                // ✅ NUEVO (2026-03-27): Limpiar parámetros vacíos
                                const filtrosLimpios = limpiarFiltros(filtros);
                                const queryParams = {
                                    ...filtrosLimpios,
                                    page,
                                };
                                router.get('/inventario/movimientos', queryParams, {
                                    preserveState: true,
                                    preserveScroll: true,
                                });
                            }}
                            onPerPageChange={(perPage) => {
                                // ✅ NUEVO: Cambiar items por página (volver a página 1)
                                // ✅ NUEVO (2026-03-27): Limpiar parámetros vacíos
                                const filtrosLimpios = limpiarFiltros(filtros);
                                const queryParams = {
                                    ...filtrosLimpios,
                                    per_page: perPage,
                                    page: 1, // Resetear a página 1
                                };
                                router.get('/inventario/movimientos', queryParams, {
                                    preserveState: true,
                                    preserveScroll: true,
                                });
                            }}
                        />
                    </div>
                )}

                {activeTab === 'estadisticas' && (
                    <MovimientosStats
                        stats={stats}
                    />
                )}

                {activeTab === 'productos' && (
                    <ResumenProductosMovimientos
                        filas={resumen_productos}
                        cargando={cargandoResumen}
                        filtrandoAlmacen={!!filtros?.almacen_id}
                        onVerKardex={elegirProductoKardex}
                        urlExportarKardex={`/inventario/movimientos/kardex/exportar?${new URLSearchParams(limpiarFiltros(filtros ?? {})).toString()}`}
                    />
                )}

                {activeTab === 'kardex' && (
                    <KardexProducto
                        kardex={kardex}
                        productoId={kardexProductoId}
                        productos={productos}
                        almacenNombre={almacenes.find((a) => a.id === Number(filtros?.almacen_id))?.nombre}
                        cargando={cargandoKardex}
                        onElegirProducto={elegirProductoKardex}
                        urlExportar={
                            kardexProductoId
                                ? `/inventario/movimientos/kardex/exportar?${new URLSearchParams({
                                      ...limpiarFiltros({ fecha_inicio: filtros?.fecha_inicio, fecha_fin: filtros?.fecha_fin, almacen_id: filtros?.almacen_id }),
                                      kardex_producto_id: String(kardexProductoId),
                                  }).toString()}`
                                : undefined
                        }
                    />
                )}
            </div>
        </AppLayout>
    );
};

export default MovimientosInventarioPage;
