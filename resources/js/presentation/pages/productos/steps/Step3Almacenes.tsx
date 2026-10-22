import type { StockAlmacen } from '@/domain/entities/productos';
import { Button } from '@/presentation/components/ui/button';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import SearchSelect from '@/presentation/components/ui/search-select';
import NotificationService from '@/infrastructure/services/notification.service';
import axios from 'axios';
import { Loader2, Plus, Trash2, Warehouse } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Option {
    value: number | string;
    label: string;
}

export interface Step3Props {
    data: { almacenes: StockAlmacen[]; globalSectorId?: number; conversiones?: any[]; es_fraccionado?: boolean; stock_limites?: Record<number | string, any> }; // ✨ NUEVO: Incluir conversiones, es_fraccionado y stock_limites
    setData: (key: string, value: any) => void; // ✨ NUEVO: Para actualizar estado atomicamente
    almacenesOptions: Option[];
    sectores?: Record<number | string, Option[]>; // ✨ NUEVO: Sectores pre-cargados del backend
    addAlmacen: (prefill?: Partial<StockAlmacen>) => void;
    setAlmacen: (i: number, key: keyof StockAlmacen, value: number | string | undefined) => void;
    removeAlmacen: (i: number) => void | Promise<void>;
    canEditStockQuantities?: boolean; // ✨ NUEVO: Permiso para editar cantidades
    setSectorConSincronizacion?: (i: number, sectorId: number | undefined) => void; // ✨ NUEVO: Sincronizar sector en todos los cards del mismo almacén
    handleCantidadTotalChange?: (i: number, newValue: number | undefined) => void; // ✨ NUEVO: Auto-llenar disponible y reservada
    productoId?: number; // Producto en edición (para eliminar límites guardados en el servidor)
    stockLimitesRepetidos?: LimiteRepetido[]; // Límites extra en un mismo almacén (el formulario edita solo uno por almacén)
}

interface LimiteRepetido {
    id: number;
    almacen_id: number;
    almacen: string | null;
    sector_id: number | null;
    sector: string | null;
    stock_minimo: number;
    stock_maximo: number | null;
}

function todayISO(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ✨ NUEVO: Calcular equivalentes en diferentes unidades de conversión
function calcularEquivalentes(cantidad: number, conversiones: any[] = []) {
    if (!conversiones || conversiones.length === 0 || cantidad === 0) {
        return [];
    }

    return conversiones
        .filter((conv) => conv.activo)
        .map((conv) => {
            // ✅ CORRECCIÓN: Multiplicar por factor_conversion, no dividir
            // Si 1 PAQUETE = 200 UNIDADES (factor 200), entonces 27 PAQUETES = 27 × 200 UNIDADES
            const equivalente = cantidad * conv.factor_conversion;
            return {
                unidad: conv.unidad_destino?.nombre || conv.nombre_cuando_se_vende_como || 'Unidad',
                codigo: conv.unidad_destino?.codigo || '',
                cantidad: equivalente,
                nombre_venta: conv.nombre_cuando_se_vende_como,
            };
        });
}

/**
 * ✨ NUEVO: Validar y ajustar almacenes antes de guardar
 * Asegura que: total >= (disponible + reservada)
 * Si no cumple, ajusta disponible = total - reservada
 */
export function validarYAjustarAlmacenes(almacenes: any[], stockLimites?: Record<number | string, any>): { validos: any[]; ajustes: Map<number, any> } {
    const ajustes = new Map<number, any>();

    console.log('🔍 DENTRO DE validarYAjustarAlmacenes:');
    console.log('  stockLimites recibido:', stockLimites);
    console.log('  almacenes recibido:', almacenes);

    const almacenesAjustados = (almacenes || []).map((almacen, idx) => {
        console.log(`  [${idx}] Procesando almacén:`, {
            id: almacen.id,
            almacen_id: almacen.almacen_id,
            tiene_limites: stockLimites?.[almacen.almacen_id] ? 'SÍ' : 'NO',
            limites: stockLimites?.[almacen.almacen_id],
        });
        const total = Number(almacen.stock ?? almacen.cantidad ?? 0);
        const disponible = Number(almacen.cantidad_disponible ?? 0);
        const reservada = Number(almacen.cantidad_reservada ?? 0);
        const suma = disponible + reservada;

        // Validar invariante
        if (suma > total) {
            // Ajustar disponible para cumplir: total = disponible + reservada
            const disponibleAjustado = Math.max(0, total - reservada);

            ajustes.set(idx, {
                original: { disponible, reservada, total },
                ajustado: { disponible: disponibleAjustado, reservada, total },
                mensaje: `Almacén ${idx + 1}: Se ajustó Disponible de ${disponible.toFixed(2)} a ${disponibleAjustado.toFixed(2)} (Reservada: ${reservada.toFixed(2)}, Total: ${total.toFixed(2)})`,
            });

            return {
                ...almacen,
                cantidad_disponible: disponibleAjustado,
                // ✨ NUEVO: Incluir stock_limites si existen
                ...(stockLimites?.[almacen.almacen_id] && {
                    stock_minimo: stockLimites[almacen.almacen_id].stock_minimo,
                    stock_maximo: stockLimites[almacen.almacen_id].stock_maximo,
                }),
            };
        }

        return {
            ...almacen,
            // ✨ NUEVO: Incluir stock_limites (sector_id, stock_minimo, stock_maximo) si existen
            ...(stockLimites?.[almacen.almacen_id] && {
                sector_id: stockLimites[almacen.almacen_id].sector_id ?? almacen.sector_id,
                stock_minimo: stockLimites[almacen.almacen_id].stock_minimo,
                stock_maximo: stockLimites[almacen.almacen_id].stock_maximo,
            }),
        };
    });

    console.log('✅ RESULTADO DE validarYAjustarAlmacenes:', almacenesAjustados);
    return { validos: almacenesAjustados, ajustes };
}

export default function Step3Almacenes({
    data,
    setData,
    almacenesOptions,
    sectores,
    addAlmacen,
    setAlmacen,
    removeAlmacen,
    canEditStockQuantities = false,
    setSectorConSincronizacion,
    handleCantidadTotalChange,
    productoId,
    stockLimitesRepetidos = [],
}: Step3Props) {
    // console.log('🏢 Almacenes Options:', almacenesOptions);
    // console.log('🏭 Sectores Pre-cargados del backend:', sectores);
    // console.log('📋 Data (almacenes del formulario):', data.almacenes);
    // console.log('✏️ canEditStockQuantities:', canEditStockQuantities);
    // console.log('═'.repeat(60));

    // ✨ Inicializar con sectores pre-cargados del backend si están disponibles
    const [sectoresOptions, setSectoresOptions] = useState<Record<number | string, Option[]>>(sectores || {});
    const [loadingSectores, setLoadingSectores] = useState<Record<number | string, boolean>>({});

    const [expandedAlmacenes, setExpandedAlmacenes] = useState<boolean>(true);
    const [eliminandoId, setEliminandoId] = useState<number | null>(null);

    // Eliminar un lote: los nuevos (sin id) solo se quitan del formulario; los guardados se eliminan en el
    // servidor por su stock_productos.id (soft delete, solo si está en 0) para limpiar duplicados.
    const eliminarLote = async (a: StockAlmacen, i: number) => {
        if (!a.id) {
            await removeAlmacen(i);
            return;
        }
        const descripcion = `#${a.id}${a.lote ? ` (${a.lote})` : ' (sin lote)'}`;
        const cantidad = Number(a.stock ?? 0);
        const reservada = Number(a.cantidad_reservada ?? 0);

        // Lo reservado pertenece a proformas/pedidos: el servidor no lo elimina ni forzando
        if (reservada !== 0) {
            NotificationService.error(
                `No se puede eliminar el lote ${descripcion}: tiene ${reservada} unidad(es) reservada(s) para proformas o pedidos. Libera la reserva primero.`,
            );
            return;
        }

        const tieneStock = cantidad !== 0;
        const ok = await NotificationService.confirm(
            tieneStock
                ? `⚠️ El lote ${descripcion} todavía tiene ${cantidad} en stock. Al eliminarlo se registrará una SALIDA DE AJUSTE por ${cantidad} y ese stock dejará de estar disponible. Esta acción no se puede deshacer. ¿Eliminar de todas formas?`
                : `¿Eliminar el lote ${descripcion}? Su historial de movimientos se conserva.`,
            { confirmText: tieneStock ? 'Eliminar con stock' : 'Eliminar', cancelText: 'Cancelar' },
        );
        if (!ok) return;

        setEliminandoId(a.id);
        try {
            // forzar: el servidor deja el lote en 0 con una SALIDA_AJUSTE antes de eliminarlo
            const response = await axios.delete(`/api/productos/stock/${a.id}`, { params: tieneStock ? { forzar: 1 } : {} });
            setData('almacenes', (data.almacenes || []).filter((x: StockAlmacen) => x.id !== a.id));
            NotificationService.success(response.data?.message ?? `Lote #${a.id} eliminado`);
        } catch (error: any) {
            NotificationService.error(error?.response?.data?.message ?? 'Error al eliminar el lote');
        } finally {
            setEliminandoId(null);
        }
    };

    // ✨ Estado local para stock_limites (separado de data)
    const [stockLimites, setStockLimites] = useState<Record<number | string, any>>({});

    // ✨ Inicializar stockLimites SOLO UNA VEZ cuando data.stock_limites llega del backend
    useEffect(() => {
        if (data.stock_limites && Object.keys(stockLimites).length === 0) {
            console.log('📋 Inicializando stockLimites desde backend:', data.stock_limites);
            setStockLimites(data.stock_limites);
        }
    }, [data.stock_limites]);

    // ✨ Sincronizar data con stockLimites cuando cambia stockLimites (DESPUÉS de inicializar)
    useEffect(() => {
        if (Object.keys(stockLimites).length > 0) {
            console.log('💾 Sincronizando stockLimites hacia data:', stockLimites);
            setData('stock_limites', stockLimites);
        }
    }, [stockLimites]);


    // ✨ Eliminar un límite de stock. Los guardados (con id) se borran en el servidor al instante;
    // los nuevos (sin id) solo se quitan del formulario. Se actualiza data.stock_limites directamente:
    // el efecto de sincronización no corre cuando el objeto queda vacío y, si no, al guardar el
    // formulario volvería a crear el límite eliminado.
    const [repetidos, setRepetidos] = useState<LimiteRepetido[]>(stockLimitesRepetidos);
    const [eliminandoLimite, setEliminandoLimite] = useState<number | string | null>(null);

    const eliminarLimite = async (key: string, limite: { id?: number }, nombreAlmacen: string) => {
        const ok = await NotificationService.confirm(
            `¿Eliminar el límite de stock de ${nombreAlmacen}? El stock no cambia; solo se quita el mínimo/máximo de esa ubicación.`,
            { confirmText: 'Eliminar', cancelText: 'Cancelar' },
        );
        if (!ok) return;

        setEliminandoLimite(limite.id ?? key);
        try {
            if (limite.id && productoId) {
                await axios.delete(`/productos/${productoId}/stock-limites/${limite.id}`);
            }
            const nuevos = { ...stockLimites };
            delete nuevos[key];
            setStockLimites(nuevos);
            setData('stock_limites', nuevos);
            NotificationService.success(`Límite de ${nombreAlmacen} eliminado`);
        } catch (error: any) {
            NotificationService.error(error?.response?.data?.message ?? 'Error al eliminar el límite');
        } finally {
            setEliminandoLimite(null);
        }
    };

    const eliminarRepetido = async (limite: LimiteRepetido) => {
        const ubicacion = `${limite.almacen ?? 'almacén'} / ${limite.sector ?? 'sin sector'}`;
        const ok = await NotificationService.confirm(`¿Eliminar el límite repetido de ${ubicacion}?`, {
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
        });
        if (!ok || !productoId) return;

        setEliminandoLimite(limite.id);
        try {
            await axios.delete(`/productos/${productoId}/stock-limites/${limite.id}`);
            setRepetidos((lista) => lista.filter((l) => l.id !== limite.id));
            NotificationService.success(`Límite repetido de ${ubicacion} eliminado`);
        } catch (error: any) {
            NotificationService.error(error?.response?.data?.message ?? 'Error al eliminar el límite');
        } finally {
            setEliminandoLimite(null);
        }
    };

    // Sectores del almacén (pre-cargados del backend o desde la API, con caché)
    const cargarSectores = async (almacenId: number | string) => {
        // ✨ Si ya tenemos los sectores (pre-cargados o en caché), no cargar de nuevo
        if (sectoresOptions[almacenId]) {
            // console.log(`✅ Sectores ya en caché para almacén ${almacenId}:`, sectoresOptions[almacenId]);
            return;
        }

        // Cargar sectores del almacén si no están pre-cargados
        // console.log(`⏳ Cargando sectores desde API para almacén ${almacenId}...`);
        setLoadingSectores((prev) => ({ ...prev, [almacenId]: true }));
        try {
            const response = await fetch(`/api/almacenes/${almacenId}/sectores`);
            if (response.ok) {
                const result = await response.json();
                // console.log(`✅ Sectores cargados del API para almacén ${almacenId}:`, result);
                const options =
                    result.data?.map((s: any) => ({
                        value: s.id,
                        label: s.nombre,
                        descripcion: s.descripcion,
                        es_generico: s.es_generico,
                        stock_minimo: s.stock_minimo,
                        stock_maximo: s.stock_maximo,
                    })) || [];
                // console.log(`📦 Opciones formateadas:`, options);
                setSectoresOptions((prev) => ({ ...prev, [almacenId]: options }));
            }
        } catch (error) {
            console.error('❌ Error cargando sectores:', error);
        } finally {
            setLoadingSectores((prev) => ({ ...prev, [almacenId]: false }));
        }
    };

    // Asignar almacén a uno o varios lotes de una sola vez (lotes nuevos que aún no tienen almacén)
    const asignarAlmacen = (indices: number[], almacenId: number | undefined) => {
        if (indices.length === 0) return;
        const nuevos = [...(data.almacenes || [])];
        indices.forEach((i) => (nuevos[i] = { ...nuevos[i], almacen_id: almacenId as any, sector_id: undefined }));
        setData('almacenes', nuevos);
        if (almacenId) cargarSectores(almacenId);
    };

    // ✨ Un solo lugar para el sector: se guarda en el límite del almacén (stock_limites) y en todos sus lotes
    const cambiarSector = (almacenKey: string, sectorId: number | undefined, limiteActual: any) => {
        setStockLimites({ ...stockLimites, [almacenKey]: { ...limiteActual, sector_id: sectorId } });
        setData(
            'almacenes',
            (data.almacenes || []).map((a: StockAlmacen) => (String(a.almacen_id) === almacenKey ? { ...a, sector_id: sectorId } : a)),
        );
    };

    const cambiarLimite = (almacenKey: string, campo: 'stock_minimo' | 'stock_maximo', valor: string, limiteActual: any) => {
        setStockLimites({
            ...stockLimites,
            [almacenKey]: { ...limiteActual, [campo]: valor === '' ? undefined : Number(valor) },
        });
    };

    const agregarLote = (almacenId: number, sectorId?: number | string | null) => {
        addAlmacen({
            almacen_id: almacenId,
            sector_id: sectorId ?? undefined,
            stock: 0,
            cantidad: 0,
            cantidad_disponible: 0,
            cantidad_reservada: 0,
            lote: '',
            fecha_vencimiento: '',
        } as any);
    };

    // ✨ Grupos por almacén: los que tienen lotes + los que solo tienen límite configurado
    type Grupo = { key: string; almacenId: number; nombre: string; lotes: { a: StockAlmacen; idx: number }[] };
    const grupos = new Map<string, Grupo>();
    const nombreAlmacen = (key: string) => almacenesOptions.find((o) => String(o.value) === key)?.label;
    (data.almacenes || []).forEach((a: StockAlmacen, idx: number) => {
        // Cada lote guarda su índice REAL en data.almacenes: setAlmacen trabaja con ese índice.
        const key = a.almacen_id ? String(a.almacen_id) : '0';
        if (!grupos.has(key)) grupos.set(key, { key, almacenId: Number(key), nombre: nombreAlmacen(key) ?? `Almacén #${key}`, lotes: [] });
        grupos.get(key)!.lotes.push({ a, idx });
    });
    Object.keys(stockLimites || {}).forEach((key) => {
        if (!grupos.has(key) && nombreAlmacen(key)) {
            grupos.set(key, { key, almacenId: Number(key), nombre: nombreAlmacen(key)!, lotes: [] });
        }
    });

    const almacenesDisponibles = almacenesOptions.filter((o) => !grupos.has(String(o.value)));
    const [agregandoAlmacen, setAgregandoAlmacen] = useState(false);

    const totalLotes = (data.almacenes || []).length;
    const fmt = (n: number) => n.toLocaleString('es-BO', { maximumFractionDigits: 2 });

    return (
        <div className="mt-4 space-y-3">
            {/* Encabezado de la sección */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setExpandedAlmacenes(!expandedAlmacenes)}
                    className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-600"
                >
                    {expandedAlmacenes ? '▼' : '▶'} Stock por almacén
                    <span className="text-xs font-normal text-muted-foreground">
                        ({grupos.size} {grupos.size === 1 ? 'almacén' : 'almacenes'} · {totalLotes} {totalLotes === 1 ? 'lote' : 'lotes'})
                    </span>
                </button>
                {agregandoAlmacen ? (
                    <div className="flex w-full items-center gap-2 sm:w-80">
                        <div className="flex-1">
                            <SearchSelect
                                id="nuevo-almacen"
                                placeholder="Elegir almacén…"
                                value=""
                                options={almacenesDisponibles}
                                onChange={(value) => {
                                    if (!value) return;
                                    const id = Number(value);
                                    agregarLote(id, sectoresOptions[id]?.[0]?.value as number | undefined);
                                    cargarSectores(id);
                                    setAgregandoAlmacen(false);
                                }}
                                emptyText="Ya se usan todos los almacenes"
                            />
                        </div>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setAgregandoAlmacen(false)}>
                            Cancelar
                        </Button>
                    </div>
                ) : (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setAgregandoAlmacen(true)}
                        disabled={almacenesDisponibles.length === 0}
                        title={almacenesDisponibles.length === 0 ? 'El producto ya está en todos los almacenes' : undefined}
                    >
                        <Plus className="mr-1 h-4 w-4" /> Añadir almacén
                    </Button>
                )}
            </div>

            {grupos.size === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Sin almacenes. Use «Añadir almacén» si desea controlar el stock de este producto.
                </div>
            )}

            {expandedAlmacenes && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {Array.from(grupos.values()).map((grupo) => {
                        const limite = stockLimites[grupo.key] ?? {};
                        const sectorId = limite.sector_id ?? grupo.lotes.find(({ a }) => a.sector_id)?.a.sector_id ?? data.globalSectorId;
                        const total = grupo.lotes.reduce((s, { a }) => s + Number(a.stock ?? 0), 0);
                        const reservadoTotal = grupo.lotes.reduce((s, { a }) => s + Number(a.cantidad_reservada ?? 0), 0);
                        const minimo = limite.stock_minimo !== undefined && limite.stock_minimo !== null && limite.stock_minimo !== '' ? Number(limite.stock_minimo) : null;
                        const maximo = limite.stock_maximo !== undefined && limite.stock_maximo !== null && limite.stock_maximo !== '' ? Number(limite.stock_maximo) : null;
                        const estadoStock =
                            minimo !== null && total < minimo
                                ? { texto: 'Bajo el mínimo', clase: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' }
                                : maximo !== null && maximo > 0 && total > maximo
                                  ? { texto: 'Sobre el máximo', clase: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' }
                                  : minimo !== null || maximo !== null
                                    ? { texto: 'En rango', clase: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
                                    : null;
                        const repetidosDelAlmacen = repetidos.filter((r) => String(r.almacen_id) === grupo.key);
                        const tieneLimite = !!limite.id || grupo.key in stockLimites;

                        return (
                            <div key={`almacen-${grupo.key}`} className="overflow-visible rounded-lg border bg-card shadow-sm">
                                {/* Cabecera: almacén + sector + límites (un solo lugar) */}
                                <div className="space-y-2 rounded-t-lg border-b bg-amber-50/70 p-3 dark:bg-amber-950/20">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        {grupo.key === '0' ? (
                                            <div className="w-full sm:w-64">
                                                <SearchSelect
                                                    id="almacen-sin-asignar"
                                                    placeholder="Seleccionar almacén*"
                                                    value=""
                                                    options={almacenesDisponibles}
                                                    onChange={(value) => asignarAlmacen(grupo.lotes.map((l) => l.idx), value ? Number(value) : undefined)}
                                                />
                                            </div>
                                        ) : (
                                            <h3 className="flex items-center gap-2 text-sm font-semibold">
                                                <Warehouse className="h-4 w-4 text-amber-600" />
                                                {grupo.nombre}
                                                <span className="text-xs font-normal text-muted-foreground">#{grupo.key}</span>
                                            </h3>
                                        )}
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="tabular-nums">
                                                Total <strong className="text-sm">{fmt(total)}</strong>
                                            </span>
                                            {reservadoTotal > 0 && (
                                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" title="Reservado para proformas o pedidos">
                                                    {fmt(reservadoTotal)} reservado
                                                </span>
                                            )}
                                            {estadoStock && <span className={`rounded px-1.5 py-0.5 font-medium ${estadoStock.clase}`}>{estadoStock.texto}</span>}
                                        </div>
                                    </div>

                                    {grupo.key !== '0' && (
                                        <div className="grid grid-cols-[1fr_5.5rem_5.5rem_auto] items-end gap-2">
                                            <div className="relative focus-within:z-[60]">
                                                <Label className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                    Sector
                                                    {loadingSectores[grupo.almacenId] && <Loader2 className="h-3 w-3 animate-spin" />}
                                                </Label>
                                                <SearchSelect
                                                    id={`sector-${grupo.key}`}
                                                    placeholder="Sin sector"
                                                    value={sectorId ? String(sectorId) : ''}
                                                    options={sectoresOptions[grupo.almacenId] || []}
                                                    onChange={(value) => cambiarSector(grupo.key, value ? Number(value) : undefined, limite)}
                                                    allowClear={true}
                                                />
                                            </div>
                                            <div>
                                                <Label className="mb-1 block text-xs text-muted-foreground" title="Si el total baja de este valor, el producto aparece para reponer">
                                                    Mínimo
                                                </Label>
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    step="0.01"
                                                    value={limite.stock_minimo ?? ''}
                                                    onChange={(e) => cambiarLimite(grupo.key, 'stock_minimo', e.target.value, limite)}
                                                    className="h-9 text-right text-xs tabular-nums"
                                                    placeholder="—"
                                                />
                                            </div>
                                            <div>
                                                <Label className="mb-1 block text-xs text-muted-foreground" title="Cantidad hasta la que se repone">
                                                    Máximo
                                                </Label>
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    step="0.01"
                                                    value={limite.stock_maximo ?? ''}
                                                    onChange={(e) => cambiarLimite(grupo.key, 'stock_maximo', e.target.value, limite)}
                                                    className="h-9 text-right text-xs tabular-nums"
                                                    placeholder="—"
                                                />
                                            </div>
                                            <div className="pb-0.5">
                                                {tieneLimite && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Quitar sector y límites de este almacén (el stock no cambia)"
                                                        disabled={eliminandoLimite !== null}
                                                        onClick={() => eliminarLimite(grupo.key, limite, grupo.nombre)}
                                                        className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                                                    >
                                                        {eliminandoLimite === (limite.id ?? grupo.key) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Límites extra en este almacén: el formulario edita uno solo, los demás se listan para eliminarlos */}
                                    {repetidosDelAlmacen.length > 0 && (
                                        <div className="rounded-md border border-amber-300 bg-amber-100/60 p-2 text-xs dark:border-amber-800 dark:bg-amber-950/40">
                                            <p className="mb-1 font-semibold text-amber-900 dark:text-amber-200">
                                                ⚠️ {repetidosDelAlmacen.length === 1 ? 'Hay otro límite' : `Hay ${repetidosDelAlmacen.length} límites más`} en este almacén
                                                (reposiciones mezcla sus valores). Elimine los que sobren:
                                            </p>
                                            {repetidosDelAlmacen.map((l) => (
                                                <div key={l.id} className="flex items-center justify-between gap-2 border-t border-amber-200 py-1 dark:border-amber-900/40">
                                                    <span>
                                                        {l.sector ?? 'Sin sector'} · Mín {l.stock_minimo} · Máx {l.stock_maximo ?? '—'}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={eliminandoLimite !== null}
                                                        onClick={() => eliminarRepetido(l)}
                                                        className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                                                    >
                                                        {eliminandoLimite === l.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Lotes del almacén */}
                                <div className="p-2">
                                    {grupo.lotes.length > 0 ? (
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="text-left text-muted-foreground">
                                                    <th className="px-1 py-1 font-medium">#</th>
                                                    <th className="px-1 py-1 font-medium">Lote</th>
                                                    <th className="px-1 py-1 font-medium">Vence</th>
                                                    <th className="px-1 py-1 text-right font-medium">Cantidad</th>
                                                    <th className="w-8" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {grupo.lotes.map(({ a, idx: i }) => {
                                                    const cantidad = Number(a.stock ?? 0);
                                                    const reservada = Number(a.cantidad_reservada ?? 0);
                                                    return (
                                                        // key estable: id de stock_productos; los lotes nuevos (sin id) usan su posición
                                                        <tr key={a.id ? `stock-${a.id}` : `nuevo-${i}`} className="border-t align-middle">
                                                            <td className="px-1 py-1.5 whitespace-nowrap text-muted-foreground">
                                                                {a.id ? `#${a.id}` : <span className="rounded bg-blue-100 px-1 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">nuevo</span>}
                                                            </td>
                                                            <td className="px-1 py-1.5">
                                                                <Input
                                                                    value={a.lote || ''}
                                                                    onChange={(e) => setAlmacen(i, 'lote', e.target.value)}
                                                                    placeholder="Sin lote"
                                                                    className="h-8 text-xs"
                                                                    aria-label={`Lote ${i + 1}`}
                                                                />
                                                            </td>
                                                            <td className="px-1 py-1.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Checkbox
                                                                        id={`has-exp-${i}`}
                                                                        checked={!!a.fecha_vencimiento}
                                                                        onCheckedChange={(v) => setAlmacen(i, 'fecha_vencimiento', v ? a.fecha_vencimiento || todayISO() : '')}
                                                                        className="h-4 w-4"
                                                                        title="El lote tiene fecha de vencimiento"
                                                                    />
                                                                    {a.fecha_vencimiento ? (
                                                                        <Input
                                                                            type="date"
                                                                            value={a.fecha_vencimiento || ''}
                                                                            onChange={(e) => setAlmacen(i, 'fecha_vencimiento', e.target.value)}
                                                                            className="h-8 w-[8.5rem] text-xs"
                                                                        />
                                                                    ) : (
                                                                        <label htmlFor={`has-exp-${i}`} className="cursor-pointer text-muted-foreground">
                                                                            No vence
                                                                        </label>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-1 py-1.5 text-right">
                                                                {canEditStockQuantities ? (
                                                                    <Input
                                                                        type="number"
                                                                        inputMode="decimal"
                                                                        step="0.01"
                                                                        value={cantidad || ''}
                                                                        onChange={(e) => handleCantidadTotalChange?.(i, e.target.value === '' ? undefined : Number(e.target.value))}
                                                                        className="ml-auto h-8 w-24 text-right text-xs tabular-nums"
                                                                        placeholder="0"
                                                                    />
                                                                ) : (
                                                                    <span className="text-sm font-medium tabular-nums" title="Sin permiso para editar cantidades: use compras, ajustes o transferencias">
                                                                        {fmt(cantidad)}
                                                                    </span>
                                                                )}
                                                                {reservada > 0 && (
                                                                    <div className="text-[11px] text-amber-700 dark:text-amber-300" title="Reservado para proformas o pedidos">
                                                                        {fmt(reservada)} reservado
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-1 py-1.5 text-right">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => eliminarLote(a, i)}
                                                                    disabled={eliminandoId === a.id}
                                                                    className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-900/30"
                                                                    title={a.id ? `Eliminar lote #${a.id}` : 'Quitar este lote'}
                                                                    aria-label="Eliminar lote"
                                                                >
                                                                    {eliminandoId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="px-1 py-2 text-xs text-muted-foreground">Sin lotes en este almacén (solo tiene límites configurados).</p>
                                    )}
                                    {grupo.key !== '0' && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="mt-1 h-7 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                            onClick={() => agregarLote(grupo.almacenId, sectorId)}
                                        >
                                            <Plus className="mr-1 h-3 w-3" /> Añadir lote
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
