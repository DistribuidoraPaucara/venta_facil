import type { StockAlmacen } from '@/domain/entities/productos';
import { Button } from '@/presentation/components/ui/button';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import SearchSelect from '@/presentation/components/ui/search-select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/presentation/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Option {
    value: number | string;
    label: string;
}

export interface Step3Props {
    data: { almacenes: StockAlmacen[]; globalSectorId?: number; conversiones?: any[]; es_fraccionado?: boolean }; // ✨ NUEVO: Incluir conversiones y es_fraccionado
    setData: (key: string, value: any) => void; // ✨ NUEVO: Para actualizar estado atomicamente
    almacenesOptions: Option[];
    sectores?: Record<number | string, Option[]>; // ✨ NUEVO: Sectores pre-cargados del backend
    addAlmacen: (prefill?: Partial<StockAlmacen>) => void;
    setAlmacen: (i: number, key: keyof StockAlmacen, value: number | string | undefined) => void;
    removeAlmacen: (i: number) => void | Promise<void>;
    canEditStockQuantities?: boolean; // ✨ NUEVO: Permiso para editar cantidades
    setSectorConSincronizacion?: (i: number, sectorId: number | undefined) => void; // ✨ NUEVO: Sincronizar sector en todos los cards del mismo almacén
    handleCantidadTotalChange?: (i: number, newValue: number | undefined) => void; // ✨ NUEVO: Auto-llenar disponible y reservada
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
export function validarYAjustarAlmacenes(almacenes: any[]): { validos: any[]; ajustes: Map<number, any> } {
    const ajustes = new Map<number, any>();

    const almacenesAjustados = (almacenes || []).map((almacen, idx) => {
        const total = Number(almacen.cantidad ?? almacen.stock ?? 0);
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
            };
        }

        return almacen;
    });

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
}: Step3Props) {
    // console.log('🏢 Almacenes Options:', almacenesOptions);
    // console.log('🏭 Sectores Pre-cargados del backend:', sectores);
    // console.log('📋 Data (almacenes del formulario):', data.almacenes);
    // console.log('✏️ canEditStockQuantities:', canEditStockQuantities);
    // console.log('═'.repeat(60));

    // ✨ Inicializar con sectores pre-cargados del backend si están disponibles
    const [sectoresOptions, setSectoresOptions] = useState<Record<number | string, Option[]>>(sectores || {});
    const [setLoadingSectores] = useState<Record<number | string, boolean>>({});

    const [expandedAlmacenes, setExpandedAlmacenes] = useState<boolean>(true);


    // Cargar sectores cuando se selecciona un almacén
    const handleAlmacenChange = async (i: number, almacenId: number | string) => {
        console.log(`🔄 Almacén seleccionado en posición ${i}:`, almacenId);

        // ✨ ACTUALIZADO: Usar newData local en lugar de data.almacenes que puede estar desactualizado
        const newData = [...(data.almacenes || [])];
        const finalAlmacenId = almacenId !== '' ? Number(almacenId) : undefined;
        newData[i] = { ...newData[i], almacen_id: finalAlmacenId };

        if (!almacenId) {
            console.log(`❌ Almacén vacío, limpiando sector`);
            newData[i] = { ...newData[i], sector_id: undefined };
            setData('almacenes', newData);
            return;
        }

        // ✨ NUEVO: Auto-completar sector si otros cards del mismo almacén ya tienen uno
        const almacenesDelMismoAlmacen = newData.filter(
            (a: StockAlmacen, idx: number) => idx !== i && String(a.almacen_id) === String(finalAlmacenId) && a.sector_id,
        );

        if (almacenesDelMismoAlmacen.length > 0) {
            const sectorDelPrimero = almacenesDelMismoAlmacen[0].sector_id;
            const todosTienenMismoSector = almacenesDelMismoAlmacen.every((a: StockAlmacen) => a.sector_id === sectorDelPrimero);

            if (todosTienenMismoSector && sectorDelPrimero) {
                newData[i] = { ...newData[i], sector_id: sectorDelPrimero };
            }
        }

        // ✨ ACTUALIZADO: Actualizar estado de una sola vez
        setData('almacenes', newData);

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

    return (
        <div className="mt-2">
            <div className="w-full items-center justify-between gap-2 mt-4 space-y-6">
                {/* SECCIÓN: ALMACENES Y STOCK (LOTES) */}
                <div className="space-y-4 mt-2">
                    <div>
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setExpandedAlmacenes(!expandedAlmacenes)}
                                className="flex items-center gap-2 text-sm font-medium hover:text-blue-600 transition-colors"
                            >
                                {expandedAlmacenes ? '▼' : '▶'} Gestión de Almacenes y Lotes ({(data.almacenes || []).length})
                            </button>
                            <Button type="button" size="sm" onClick={() => addAlmacen()} variant="outline" aria-label="Agregar almacén">
                                📦Añadir almacén
                            </Button>
                        </div>

                        {(data.almacenes || []).length === 0 && (
                            <div className="text-sm text-muted-foreground">No hay entradas. Añada al menos un almacén si desea controlar stock.</div>
                        )}
                        {expandedAlmacenes && (data.almacenes || []).map((a: StockAlmacen, i: number) => (
                            <div key={i} className="mt-4 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/30 space-y-3 md:space-y-2">
                                {/* Fila 1: Almacén (full width en mobile, 40% en desktop) */}
                                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-3">
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Label className="text-xs font-semibold text-foreground">Almacén* #{a.id}</Label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                        <HelpCircle size={12} />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    Selecciona el almacén donde se guarda este lote
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <SearchSelect
                                            id={`almacen-select-${i}`}
                                            placeholder="Seleccionar almacén"
                                            value={a.almacen_id ? String(a.almacen_id) : ''}
                                            options={almacenesOptions}
                                            onChange={(value) => handleAlmacenChange(i, value ? Number(value) : undefined)}
                                            allowClear={true}
                                        />
                                    </div>

                                    {/* Lote */}
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Label className="text-xs font-semibold text-foreground">Lote</Label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                        <HelpCircle size={12} />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    Identificador del lote para trazabilidad
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <Input
                                            size="sm"
                                            value={a.lote || ''}
                                            onChange={(e) => setAlmacen(i, 'lote', e.target.value)}
                                            placeholder="Lote"
                                            className="h-9 text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                                            aria-label={`Lote ${i + 1}`}
                                        />
                                    </div>

                                    {/* Vencimiento */}
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Checkbox
                                                id={`has-exp-${i}`}
                                                checked={!!a.fecha_vencimiento}
                                                onCheckedChange={(v) => {
                                                    const checked = !!v;
                                                    setAlmacen(i, 'fecha_vencimiento', checked ? (a.fecha_vencimiento || todayISO()) : '');
                                                }}
                                                className="h-4 w-4"
                                            />
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <label htmlFor={`has-exp-${i}`} className="text-xs cursor-pointer flex items-center gap-1 hover:text-blue-600">
                                                        Vto.
                                                        <HelpCircle size={11} className="text-gray-400" />
                                                    </label>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    Fecha de vencimiento del lote (opcional)
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <Input
                                            type="date"
                                            value={a.fecha_vencimiento || ''}
                                            onChange={(e) => setAlmacen(i, 'fecha_vencimiento', e.target.value)}
                                            disabled={!a.fecha_vencimiento}
                                            className="h-9 text-xs w-full dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 disabled:opacity-50 disabled:dark:bg-zinc-900"
                                        />
                                    </div>
                                </div>

                                {/* Fila 1.5: Sector + Stock Límites (Mínimo, Máximo) */}
                                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-3">
                                    {/* Sector */}
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Label className="text-xs font-semibold text-foreground">Sector</Label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                        <HelpCircle size={12} />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    Ubicación física dentro del almacén donde se guarda el lote
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <SearchSelect
                                            id={`sector-select-${i}`}
                                            placeholder="Seleccionar sector"
                                            value={a.sector_id ? String(a.sector_id) : ''}
                                            options={sectoresOptions[a.almacen_id] || []}
                                            onChange={(value) => setAlmacen(i, 'sector_id', value ? Number(value) : undefined)}
                                            allowClear={true}
                                        />
                                    </div>

                                    {/* Stock Mínimo */}
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Label className="text-xs font-semibold text-foreground">Stock Mín.</Label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                        <HelpCircle size={12} />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    Cantidad mínima requerida para reposición
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            step="0.01"
                                            value={a.stock_minimo || ''}
                                            onChange={(e) => {
                                                setAlmacen(
                                                    i,
                                                    'stock_minimo',
                                                    e.target.value === '' ? undefined : Number(e.target.value),
                                                );
                                            }}
                                            className="h-9 text-xs w-full border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-100"
                                            aria-label={`Stock mínimo ${i + 1}`}
                                        />
                                    </div>

                                    {/* Stock Máximo */}
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Label className="text-xs font-semibold text-foreground">Stock Máx.</Label>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                        <HelpCircle size={12} />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    Cantidad máxima permitida en el almacén
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            step="0.01"
                                            value={a.stock_maximo || ''}
                                            onChange={(e) => {
                                                setAlmacen(
                                                    i,
                                                    'stock_maximo',
                                                    e.target.value === '' ? undefined : Number(e.target.value),
                                                );
                                            }}
                                            className="h-9 text-xs w-full border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/40 dark:text-purple-100"
                                            aria-label={`Stock máximo ${i + 1}`}
                                        />
                                    </div>
                                </div>

                                {/* Stock: Cantidad Total, Disponible, Reservada */}
                                {(() => {
                                    const totalStock = Number(a.cantidad ?? a.stock ?? 0);
                                    const disponible = Number(a.cantidad_disponible ?? 0);
                                    const reservada = Number(a.cantidad_reservada ?? 0);
                                    const esValido = totalStock >= disponible + reservada;
                                    const hasError = canEditStockQuantities && !esValido;

                                    return (
                                        <>
                                            {/* Fila 2: Stock (Total, Disponible, Reservada) */}
                                            <div className="grid grid-cols-3 gap-3">
                                                {/* Cantidad Total */}
                                                <div className="relative">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <Label className="text-xs font-semibold text-foreground">Total</Label>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                                    <HelpCircle size={12} />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                Cantidad total del lote en almacén
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        inputMode="decimal"
                                                        step="0.01"
                                                        value={totalStock || ''}
                                                        onChange={(e) => {
                                                            const newValue = e.target.value === '' ? undefined : Number(e.target.value);
                                                            if (handleCantidadTotalChange) {
                                                                handleCantidadTotalChange(i, newValue);
                                                            }
                                                        }}
                                                        readOnly={!canEditStockQuantities}
                                                        className={`h-9 text-xs w-full ${
                                                            canEditStockQuantities
                                                                ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-100'
                                                                : 'opacity-60 bg-blue-50/50 dark:bg-blue-950/20 dark:text-blue-300'
                                                        } ${hasError ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200' : ''}`}
                                                    />
                                                    {hasError && (
                                                        <div className="text-xs text-red-600 mt-1">
                                                            ⚠️ Total ≥ Disp. + Res.
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Disponible */}
                                                <div>
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <Label className="text-xs font-semibold text-foreground">Disp.</Label>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                                    <HelpCircle size={12} />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                Cantidad disponible para vender
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        inputMode="decimal"
                                                        step="0.01"
                                                        value={disponible || ''}
                                                        onChange={(e) => {
                                                            setAlmacen(
                                                                i,
                                                                'cantidad_disponible',
                                                                e.target.value === '' ? undefined : Number(e.target.value),
                                                            );
                                                        }}
                                                        readOnly={!canEditStockQuantities}
                                                        className={`h-9 text-xs w-full ${
                                                            canEditStockQuantities
                                                                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100'
                                                                : 'opacity-60 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-300'
                                                        } ${hasError ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200' : ''}`}
                                                    />
                                                </div>

                                                {/* Reservada */}
                                                <div>
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <Label className="text-xs font-semibold text-foreground">Res.</Label>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                                    <HelpCircle size={12} />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                Cantidad reservada para pedidos pendientes
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        inputMode="decimal"
                                                        step="0.01"
                                                        value={reservada || ''}
                                                        onChange={(e) => {
                                                            setAlmacen(
                                                                i,
                                                                'cantidad_reservada',
                                                                e.target.value === '' ? undefined : Number(e.target.value),
                                                            );
                                                        }}
                                                        readOnly={!canEditStockQuantities}
                                                        className={`h-9 text-xs w-full ${
                                                            canEditStockQuantities
                                                                ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100'
                                                                : 'opacity-60 bg-amber-50/50 dark:bg-amber-950/20 dark:text-amber-300'
                                                        } ${hasError ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200' : ''}`}
                                                    />
                                                </div>
                                            </div>

                                            {/* ✨ NUEVO: Mostrar equivalentes en conversiones si está fraccionado */}
                                            {data.es_fraccionado && data.conversiones && data.conversiones.length > 0 && totalStock > 0 && (
                                                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                        📊 Equivalentes en conversiones:
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                        {calcularEquivalentes(totalStock, data.conversiones).map((eq, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="p-2 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded border border-purple-200 dark:border-purple-700"
                                                            >
                                                                <div className="text-xs font-medium text-purple-900 dark:text-purple-200 truncate">
                                                                    {eq.nombre_venta || eq.unidad}
                                                                </div>
                                                                <div className="text-sm font-bold text-purple-700 dark:text-purple-300">
                                                                    {Math.round(eq.cantidad)} {eq.codigo}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECCIÓN 3: CONFIGURAR LÍMITES DE STOCK POR ALMACÉN (TABLA) */}
                <div className="mt-6 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/30">
                    <h3 className="text-sm font-bold text-purple-900 dark:text-purple-200 mb-4">
                        ⚙️ Configurar Límites de Stock por Almacén
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-purple-100 dark:bg-purple-900/40">
                                <tr>
                                    <th className="px-4 py-2 text-left font-semibold">Almacén</th>
                                    <th className="px-4 py-2 text-left font-semibold">Sector</th>
                                    <th className="px-4 py-2 text-left font-semibold">Stock Mín.</th>
                                    <th className="px-4 py-2 text-left font-semibold">Stock Máx.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {almacenesOptions.map((almacen) => {
                                    // Obtener los límites del almacén actual
                                    const stockLimites = data.stock_limites || {};
                                    const almacenLimites = stockLimites[almacen.value] || {};

                                    return (
                                        <tr key={almacen.value} className="border-b hover:bg-purple-100/50 dark:hover:bg-purple-900/20">
                                            <td className="px-4 py-3 font-medium">{almacen.label}</td>
                                            <td className="px-4 py-3">
                                                <SearchSelect
                                                    id={`sector-limit-${almacen.value}`}
                                                    placeholder="Seleccionar"
                                                    value={almacenLimites.sector_id ? String(almacenLimites.sector_id) : ''}
                                                    options={sectoresOptions[almacen.value] || []}
                                                    onChange={(value) => {
                                                        const newLimites = { ...data.stock_limites, };
                                                        newLimites[almacen.value] = {
                                                            ...almacenLimites,
                                                            sector_id: value ? Number(value) : undefined,
                                                        };
                                                        setData('stock_limites', newLimites);
                                                    }}
                                                    allowClear={true}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    step="0.01"
                                                    value={almacenLimites.stock_minimo || ''}
                                                    onChange={(e) => {
                                                        const newLimites = { ...data.stock_limites };
                                                        newLimites[almacen.value] = {
                                                            ...almacenLimites,
                                                            stock_minimo: e.target.value === '' ? undefined : Number(e.target.value),
                                                        };
                                                        setData('stock_limites', newLimites);
                                                    }}
                                                    className="h-8 text-xs border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-100"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    step="0.01"
                                                    value={almacenLimites.stock_maximo || ''}
                                                    onChange={(e) => {
                                                        const newLimites = { ...data.stock_limites };
                                                        newLimites[almacen.value] = {
                                                            ...almacenLimites,
                                                            stock_maximo: e.target.value === '' ? undefined : Number(e.target.value),
                                                        };
                                                        setData('stock_limites', newLimites);
                                                    }}
                                                    className="h-8 text-xs border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/40 dark:text-purple-100"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
