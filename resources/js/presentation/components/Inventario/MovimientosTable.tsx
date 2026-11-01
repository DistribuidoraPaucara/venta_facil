import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import { TooltipProvider } from '@/presentation/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/presentation/components/ui/dropdown-menu';
import { Calculator, ChevronLeft, ChevronRight, Eye, MoreVertical } from 'lucide-react';
import React, { useState } from 'react';
import MovimientoDetallesModal from './MovimientoDetallesModal';
import StockRecorrectorModal from './StockRecorrectorModal';
import { formatearUnidades, grupoDeTipo, nombreTipo } from './MovimientosStats';

interface MovimientoInventario {
    id: number;
    numero: string;
    numero_documento?: string; // ✅ NUEVO: Referencia a venta/proforma/etc (VEN20260212-0001)
    fecha: string;
    created_at: string; // ✅ NUEVO (2026-02-11): Fecha de creación del registro
    tipo: string;
    producto: {
        id?: number;
        nombre: string;
        codigo: string;
        sku?: string;
    };
    almacen: {
        nombre: string;
    };
    stock_producto_id?: number; // ✅ NUEVO (2026-02-12): ID del stock
    lote?: string; // ✅ NUEVO (2026-02-12): Número de lote
    cantidad: number;
    unidad?: string | null; // Unidad en que se guarda el stock del producto (ej. CJT)
    cantidad_vendida?: number | null; // Si la venta fue en otra unidad: lo vendido en esa unidad (ej. 8)
    unidad_vendida?: string | null; // ...y su unidad (ej. UN)
    motivo_texto?: string | null; // Motivo legible (tipo de ajuste/merma + razón); null en ventas
    stock_minimo?: number | null; // Mínimo del producto en este almacén
    alerta_stock?: 'agotado' | 'bajo_minimo' | null; // Solo en salidas que dejaron el stock así
    cantidad_anterior: number; // ✅ NUEVO: Cantidad antes del movimiento
    cantidad_posterior: number; // ✅ NUEVO: Cantidad después del movimiento
    motivo: string;
    usuario: {
        name: string;
        rol?: string;
    };
    // ✅ NUEVO (2026-02-18): Información de conversiones de unidades
    es_conversion_aplicada?: boolean;
    cantidad_solicitada?: number;
    factor_conversion?: number;
    unidad_venta_nombre?: string;
    unidad_base_nombre?: string; // ✅ NUEVO: Nombre de la unidad base (almacenamiento)
    // ✅ NUEVO (2026-03-26): Información completa de cantidades (LOTE ESPECÍFICO)
    cantidad_total_anterior?: number;
    cantidad_total_posterior?: number;
    cantidad_disponible_anterior?: number;
    cantidad_disponible_posterior?: number;
    cantidad_reservada_anterior?: number;
    cantidad_reservada_posterior?: number;
    // ✅ NUEVO (2026-06-28): TOTALES de todos los lotes (centralizado)
    disponible_total_anterior?: number;
    disponible_total_posterior?: number;
    reservada_total_anterior?: number;
    reservada_total_posterior?: number;
    // ✅ NUEVO (2026-03-26): Observaciones del movimiento
    observaciones?: string;
    referencia?: string;
    referencia_tipo?: string;
    referencia_id?: number;
    documento_url?: string | null; // Enlace al documento de origen (venta, compra, proforma, ajuste...)
    anulado?: boolean;
    motivo_anulacion?: string;
    // ✅ NUEVO (2026-06-02): Detección de inconsistencias
    tiene_inconsistencia?: boolean;
    inconsistencias?: string[];
    // ✅ NUEVO (2026-06-02): Stock esperado correcto
    tiene_error_stock?: boolean;
    total_esperado_anterior?: number;
    total_esperado_posterior?: number;
    disponible_esperado_anterior?: number;
    disponible_esperado_posterior?: number;
    reserva_esperada_anterior?: number;
    reserva_esperada_posterior?: number;
}

interface PaginationInfo {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface MovimientosTableProps {
    movimientos: MovimientoInventario[];
    isLoading?: boolean;
    pagination?: PaginationInfo;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void; // ✅ NUEVO: Callback para cambiar items por página
    mostrarValoresPorLote?: boolean; // ✅ NUEVO (2026-06-28): Prop para mostrar/ocultar valores por lote
    mostrarDisponibleReservado?: boolean; // Mostrar los recuadros de disponible y reservado (oculto por defecto)
    direccionId?: 'asc' | 'desc'; // Orden actual por Id (lo aplica el servidor: la tabla viene paginada)
    onOrdenarId?: (direccion: 'asc' | 'desc') => void;
}

const MovimientosTable: React.FC<MovimientosTableProps> = ({
    movimientos = [],
    isLoading = false,
    pagination,
    onPageChange,
    onPerPageChange, // ✅ NUEVO: Recibir callback para cambiar items por página
    mostrarValoresPorLote = true, // ✅ NUEVO (2026-06-28): Recibir prop del componente padre
    mostrarDisponibleReservado = false, // Oculto por defecto: se activa con el switch de la página
    direccionId = 'desc',
    onOrdenarId,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMovimiento, setSelectedMovimiento] = useState<MovimientoInventario | null>(null);
    const [mostrarStockEsperado, setMostrarStockEsperado] = useState(false); // ✅ NUEVO (2026-06-02): Toggle para stock esperado
    const [isStockRecorrectorOpen, setIsStockRecorrectorOpen] = useState(false); // ✅ NUEVO (2026-06-02): Modal recorredor
    const [movimientoRecorridorId, setMovimientoRecorridorId] = useState<number | undefined>(); // ✅ NUEVO (2026-06-02): ID para recorredor

    // ✅ NUEVO: Verificar si hay movimientos con error
    const hayErrorStock = movimientos.some((m) => m.tiene_error_stock);
    // La mayoría de productos no maneja lotes: "Lote: -" solo ocupaba espacio
    const tieneLote = (m: MovimientoInventario) => !!m.lote && m.lote !== '-';

    const handleOpenDetalles = (movimiento: MovimientoInventario) => {
        setSelectedMovimiento(movimiento);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">Cargando movimientos...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <TooltipProvider>
            <div className="p-0 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                        <TableRow>
                            <TableHead
                                onClick={onOrdenarId ? () => onOrdenarId(direccionId === 'desc' ? 'asc' : 'desc') : undefined}
                                className={onOrdenarId ? 'cursor-pointer select-none whitespace-nowrap hover:text-foreground' : undefined}
                                title={direccionId === 'desc' ? 'Más recientes primero (clic: más antiguos primero)' : 'Más antiguos primero (clic: más recientes primero)'}
                            >
                                Id <span className="ml-0.5">{direccionId === 'desc' ? '▼' : '▲'}</span>
                            </TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo Movimiento</TableHead>
                            <TableHead>Producto</TableHead>
                            {/* ✅ NUEVO (2026-06-28): Columna condicional - Valores por lote anterior */}
                            {mostrarValoresPorLote && (
                                <TableHead className="text-center">
                                    🔹 Lote Anterior
                                    <br />
                                    <span className="text-xs font-normal">(Este lote)</span>
                                </TableHead>
                            )}
                            <TableHead className="text-center">Movimiento</TableHead>
                            {/* ✅ NUEVO (2026-06-28): Columna condicional - Valores por lote posterior */}
                            {mostrarValoresPorLote && (
                                <TableHead className="text-center">
                                    🔹 Lote Posterior
                                    <br />
                                    <span className="text-xs font-normal">(Este lote)</span>
                                </TableHead>
                            )}
                            <TableHead className="text-center">
                                Stock antes → después
                                <br />
                                <span className="text-xs font-normal">(todos los lotes del almacén)</span>
                            </TableHead>
                            {/* ✅ NUEVO (2026-06-02): Columna de stock esperado (solo si hay error) */}
                            {hayErrorStock && mostrarStockEsperado && (
                                <TableHead className="bg-yellow-50 text-center dark:bg-yellow-900/20">Stock Esperado</TableHead>
                            )}
                            {/* ✅ NUEVO (2026-02-12): Columna de detalles */}
                            <TableHead>-</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movimientos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={14} className="py-8 text-center text-muted-foreground">
                                    No hay movimientos para mostrar
                                </TableCell>
                            </TableRow>
                        ) : (
                            movimientos.map((movimiento) => (
                                <TableRow
                                    key={movimiento.id}
                                    title={movimiento.inconsistencias?.length ? 'Inconsistencias: ' + movimiento.inconsistencias.join(', ') : ''}
                                >
                                    <TableCell className="font-medium">
                                        #{movimiento.id}
                                    </TableCell>
                                    {/* ✅ Fecha y Hora */}
                                    <TableCell>
                                        <div>
                                            <div className="text-xs text-muted-foreground">
                                                <div>{new Date(movimiento.created_at).toLocaleDateString('es-ES')}</div>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Hr: {new Date(movimiento.created_at).toLocaleTimeString('es-ES', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </div>
                                            <div>{movimiento.usuario.name}</div>
                                        </div>
                                    </TableCell>
                                    {/* ✅ Tipo de Movimiento */}
                                    <TableCell>
                                        <Badge className={grupoDeTipo(movimiento.tipo).clase} title={movimiento.tipo}>
                                            {grupoDeTipo(movimiento.tipo).icono} {nombreTipo(movimiento.tipo)}
                                        </Badge>
                                        {movimiento.documento_url ? (
                                            <a
                                                href={movimiento.documento_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-md mt-1 block text-blue-600 hover:underline dark:text-blue-400"
                                                title="Abrir documento en otra pestaña"
                                            >
                                                {movimiento.referencia || `#${movimiento.referencia_id}`} ↗
                                            </a>
                                        ) : (
                                            <p className="text-md text-muted-foreground mt-1">{movimiento.referencia}</p>
                                        )}
                                        {movimiento.motivo_texto && (
                                            <p className="mt-1 max-w-[220px] text-xs text-muted-foreground italic line-clamp-2" title={movimiento.motivo_texto}>
                                                {movimiento.motivo_texto}
                                            </p>
                                        )}
                                    </TableCell>
                                    {/* ✅ Producto */}
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{movimiento.producto.nombre}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {movimiento.producto.id ? (
                                                    <a
                                                        href={`/productos/${movimiento.producto.id}/edit`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                        title="Editar producto en otra pestaña"
                                                    >
                                                        #{movimiento.producto.id} ↗
                                                    </a>
                                                ) : (
                                                    '#—'
                                                )}{' '}
                                                | {movimiento.producto.sku}
                                            </div>
                                            <div className="text-xs">{movimiento.almacen.nombre}</div>
                                            {tieneLote(movimiento) && <div className="text-xs text-muted-foreground">Lote: {movimiento.lote}</div>}
                                        </div>
                                    </TableCell>
                                    {/* ✅ Lote Específico: Anterior (3 cajas: Cantidad, Disponible, Reservada) - CONDICIONAL */}
                                    {mostrarValoresPorLote && (
                                        <TableCell className="border-gray-300 text-center text-xs font-medium dark:border-gray-700">
                                            <div className="space-y-1">
                                                <div className="rounded bg-blue-50 dark:bg-blue-900/20">
                                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">💾 Cantidad</p>
                                                    <p className="font-bold text-blue-700 dark:text-blue-400">
                                                        {movimiento.cantidad_anterior ?? 0}
                                                    </p>
                                                    {tieneLote(movimiento) && <p className="text-xs text-gray-500 dark:text-gray-400">Lote: {movimiento.lote}</p>}
                                                </div>
                                                {mostrarDisponibleReservado && (
                                                    <>
                                                        <div className="rounded bg-green-50 dark:bg-green-900/20">
                                                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">✅ Disponible</p>
                                                            <p className="font-bold text-green-700 dark:text-green-400">
                                                                {movimiento.cantidad_disponible_anterior ?? 0}
                                                            </p>
                                                        </div>
                                                        <div className="rounded bg-orange-50 dark:bg-orange-900/20">
                                                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">🔒 Reservada</p>
                                                            <p className="font-bold text-orange-700 dark:text-orange-400">
                                                                {movimiento.cantidad_reservada_anterior ?? 0}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}

                                    {/* Cantidad que movió el stock, con su unidad. Si se vendió en otra unidad (ej. 8 UN de un
                                        producto que se guarda en CJT), se explica de dónde salen los decimales */}
                                    <TableCell className="text-center">
                                        <div className={`text-lg font-bold ${movimiento.cantidad > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {movimiento.cantidad > 0 ? '+' : ''}
                                            {formatearUnidades(movimiento.cantidad)}
                                            {movimiento.unidad && <span className="ml-1 text-xs font-medium">{movimiento.unidad}</span>}
                                        </div>
                                        {movimiento.cantidad_vendida != null && (
                                            <div className="text-xs text-muted-foreground" title="Cantidad vendida en la unidad de la venta">
                                                vendió {formatearUnidades(movimiento.cantidad_vendida)} {movimiento.unidad_vendida}
                                            </div>
                                        )}
                                    </TableCell>

                                    {/* ✅ Lote Específico: Posterior (3 cajas: Cantidad, Disponible, Reservada) - CONDICIONAL */}
                                    {mostrarValoresPorLote && (
                                        <TableCell className="border-gray-300 text-center text-xs font-medium dark:border-gray-700">
                                            <div className="space-y-1">
                                                <div className="rounded bg-blue-50 dark:bg-blue-900/20">
                                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">💾 Cantidad</p>
                                                    <p className="font-bold text-blue-700 dark:text-blue-400">
                                                        {movimiento.cantidad_posterior ?? 0}
                                                    </p>
                                                    {tieneLote(movimiento) && <p className="text-xs text-gray-500 dark:text-gray-400">Lote: {movimiento.lote}</p>}
                                                </div>
                                                {mostrarDisponibleReservado && (
                                                    <>
                                                        <div className="rounded bg-green-50 dark:bg-green-900/20">
                                                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">✅ Disponible</p>
                                                            <p className="font-bold text-green-700 dark:text-green-400">
                                                                {movimiento.cantidad_disponible_posterior ?? 0}
                                                            </p>
                                                        </div>
                                                        <div className="rounded bg-orange-50 dark:bg-orange-900/20">
                                                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">🔒 Reservada</p>
                                                            <p className="font-bold text-orange-700 dark:text-orange-400">
                                                                {movimiento.cantidad_reservada_posterior ?? 0}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}

                                    {/* Stock total del almacén (todos los lotes) antes → después, en una sola celda */}
                                    <TableCell className="text-center text-sm whitespace-nowrap">
                                        <div className="font-semibold">
                                            <span className="text-gray-500 dark:text-gray-400">{formatearUnidades(movimiento.cantidad_total_anterior ?? 0)}</span>
                                            <span className="mx-1.5 text-gray-400">→</span>
                                            <span className="text-blue-700 dark:text-blue-400">{formatearUnidades(movimiento.cantidad_total_posterior ?? 0)}</span>
                                            {movimiento.unidad && <span className="ml-1 text-xs font-normal text-muted-foreground">{movimiento.unidad}</span>}
                                        </div>
                                        {movimiento.alerta_stock === 'agotado' && (
                                            <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
                                                ⛔ Agotado
                                            </span>
                                        )}
                                        {movimiento.alerta_stock === 'bajo_minimo' && (
                                            <span
                                                className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                                                title="Quedó por debajo del stock mínimo de este almacén"
                                            >
                                                ⚠ Bajo mínimo ({formatearUnidades(movimiento.stock_minimo ?? 0)})
                                            </span>
                                        )}
                                        {mostrarDisponibleReservado && (
                                            <div className="mt-1 space-y-0.5 text-xs">
                                                <div className="text-green-700 dark:text-green-400">
                                                    Disp: {formatearUnidades(movimiento.disponible_total_anterior ?? 0)} → {formatearUnidades(movimiento.disponible_total_posterior ?? 0)}
                                                </div>
                                                <div className="text-orange-700 dark:text-orange-400">
                                                    Res: {formatearUnidades(movimiento.reservada_total_anterior ?? 0)} → {formatearUnidades(movimiento.reservada_total_posterior ?? 0)}
                                                </div>
                                            </div>
                                        )}
                                    </TableCell>
                                    {/* ✅ NUEVO (2026-06-02): Columna de Stock Esperado (solo si hay error y está habilitada) */}
                                    {hayErrorStock && mostrarStockEsperado && (
                                        <TableCell className="bg-yellow-50 text-center text-xs font-medium dark:bg-yellow-900/20">
                                            {movimiento.tiene_error_stock ? (
                                                <div className="space-y-1">
                                                    <div className="rounded bg-blue-50 px-2 py-1 dark:bg-blue-900/30">
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                                                        <p className="font-bold text-blue-700 dark:text-blue-400">
                                                            Ant: {movimiento.total_esperado_anterior}
                                                            <br />
                                                            Pos: {movimiento.total_esperado_posterior}
                                                        </p>
                                                    </div>
                                                    <div className="rounded bg-green-50 px-2 py-1 dark:bg-green-900/30">
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">Disponible</p>
                                                        <p className="font-bold text-green-700 dark:text-green-400">
                                                            Ant: {movimiento.disponible_esperado_anterior}
                                                            <br />
                                                            Pos: {movimiento.disponible_esperado_posterior}
                                                        </p>
                                                    </div>
                                                    <div className="rounded bg-orange-50 px-2 py-1 dark:bg-orange-900/30">
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">Reservada</p>
                                                        <p className="font-bold text-orange-700 dark:text-orange-400">
                                                            Ant: {movimiento.reserva_esperada_anterior}
                                                            <br />
                                                            Pos: {movimiento.reserva_esperada_posterior}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400 dark:text-gray-600">Sin error</p>
                                            )}
                                        </TableCell>
                                    )}

                                    {/* ✅ NUEVO (2026-06-28): Popup menu para acciones */}
                                    <TableCell className="text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setMovimientoRecorridorId(movimiento.id);
                                                        setIsStockRecorrectorOpen(true);
                                                    }}
                                                >
                                                    <Calculator className="h-4 w-4 mr-2" />
                                                    Calcular Stock
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleOpenDetalles(movimiento)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Ver Detalles
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Paginación */}
                {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            {/* ✅ NUEVO (2026-06-02): Toggle para mostrar stock esperado */}
                            {hayErrorStock && (
                                <button
                                    onClick={() => setMostrarStockEsperado(!mostrarStockEsperado)}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${mostrarStockEsperado
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {mostrarStockEsperado ? '✓ Stock Esperado' : 'Stock Esperado'}
                                </button>
                            )}
                            <div className="text-sm text-muted-foreground">
                                Mostrando <strong>{pagination.from}</strong> a <strong>{pagination.to}</strong> de{' '}
                                <strong>{pagination.total}</strong> resultados
                            </div>

                            {/* ✅ NUEVO: Selector de items por página */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="per_page" className="text-sm text-muted-foreground">
                                    Items por página:
                                </label>
                                <select
                                    id="per_page"
                                    // El servidor limita "todos" a 1000 por página (InventarioController::MAX_MOVIMIENTOS_PAGINA)
                                    value={pagination.per_page >= 1000 ? 'todos' : pagination.per_page}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        onPerPageChange?.(val === 'todos' ? 999999 : parseInt(val));
                                    }}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                >
                                    <option value="10">10</option>
                                    <option value="15">15</option>
                                    <option value="20">20</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="todos">Todos (máx. 1000)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page === 1}
                                onClick={() => onPageChange?.(pagination.current_page - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => {
                                    // Mostrar solo páginas cercanas a la actual
                                    if (
                                        page === 1 ||
                                        page === pagination.last_page ||
                                        (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
                                    ) {
                                        return (
                                            <Button
                                                key={page}
                                                variant={page === pagination.current_page ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => onPageChange?.(page)}
                                            >
                                                {page}
                                            </Button>
                                        );
                                    }

                                    // Mostrar puntos suspensivos
                                    if (page === pagination.current_page - 2 || page === pagination.current_page + 2) {
                                        return (
                                            <span key={`dots-${page}`} className="px-2 text-muted-foreground">
                                                ...
                                            </span>
                                        );
                                    }

                                    return null;
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page === pagination.last_page}
                                onClick={() => onPageChange?.(pagination.current_page + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ✅ NUEVO (2026-02-12): Modal de detalles del movimiento */}
                <MovimientoDetallesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} movimiento={selectedMovimiento} />

                {/* ✅ NUEVO (2026-06-02): Modal recorredor de stock */}
                <StockRecorrectorModal
                    isOpen={isStockRecorrectorOpen}
                    onClose={() => {
                        setIsStockRecorrectorOpen(false);
                        setMovimientoRecorridorId(undefined);
                    }}
                    movimientoIdInicial={movimientoRecorridorId}
                />
            </div>
        </TooltipProvider>
    );
};

export default MovimientosTable;
