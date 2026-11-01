import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import SearchSelect from '@/presentation/components/ui/search-select';
import { Badge } from '@/presentation/components/ui/badge';
import { Calendar, Filter, X, Search } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/presentation/components/ui/collapsible';
import type { FiltrosMovimientos as IFiltrosMovimientos } from '@/domain/entities/movimientos-inventario';

interface TipoAjuste {
    id: number;
    clave: string;
    label: string;
}

interface FiltrosMovimientosProps {
    filtros: IFiltrosMovimientos;
    onFiltrosChange: (filtros: IFiltrosMovimientos) => void;
    almacenes: Array<{ id: number; nombre: string; }>;
    usuarios?: Array<{ id: number; name: string; }>;
    productos: Array<{ id: number; nombre: string; codigo?: string; }>;
    tiposAjuste?: TipoAjuste[];
    showAdvanced?: boolean;
}

// Grupos primero (abarcan varios tipos reales, ver MovimientoInventario::scopePorTipo) y luego tipos puntuales
export const tiposMovimiento = [
    { value: 'SALIDA_VENTA', label: '🛒 Ventas (incluye desde proforma)' },
    { value: 'ENTRADA_COMPRA', label: '📥 Compras' },
    { value: 'TRANSFERENCIA', label: '🔄 Transferencias (entrada y salida)' },
    { value: 'AJUSTE', label: '🔧 Ajustes (entrada, salida y masivos)' },
    { value: 'MERMA', label: '⚠️ Mermas' },
    { value: 'FRACCIONAMIENTO', label: '✂️ Fraccionamientos' },
    { value: 'DEVOLUCION', label: '↩️ Devoluciones' },
    { value: 'ANULACION', label: '❌ Anulaciones' },
    { value: 'RESERVA', label: '📋 Reservas de proforma' },
    { value: 'ENTRADA', label: '⬆️ Todas las entradas' },
    { value: 'SALIDA', label: '⬇️ Todas las salidas' },
    { value: 'ENTRADA_AJUSTE', label: 'Solo ajuste de entrada' },
    { value: 'SALIDA_AJUSTE', label: 'Solo ajuste de salida' },
    { value: 'AJUSTE_MASIVO', label: 'Solo ajuste masivo' },
];

// Períodos rápidos: [desde, hasta] en fecha local (YYYY-MM-DD)
const fechaLocal = (d: Date) => d.toLocaleDateString('en-CA');
const sumarDias = (d: Date, dias: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + dias);
    return r;
};
export const periodosRapidos: { clave: string; label: string; rango: () => [string, string] }[] = [
    { clave: 'hoy', label: 'Hoy', rango: () => [fechaLocal(new Date()), fechaLocal(new Date())] },
    { clave: 'ayer', label: 'Ayer', rango: () => [fechaLocal(sumarDias(new Date(), -1)), fechaLocal(sumarDias(new Date(), -1))] },
    {
        clave: 'semana',
        label: 'Esta semana',
        rango: () => {
            const hoy = new Date();
            return [fechaLocal(sumarDias(hoy, -((hoy.getDay() + 6) % 7))), fechaLocal(hoy)]; // desde el lunes
        },
    },
    {
        clave: 'mes',
        label: 'Este mes',
        rango: () => {
            const hoy = new Date();
            return [fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), fechaLocal(hoy)];
        },
    },
    {
        clave: 'mes_anterior',
        label: 'Mes anterior',
        rango: () => {
            const hoy = new Date();
            return [fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)), fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 0))];
        },
    },
    { clave: '30dias', label: 'Últimos 30 días', rango: () => [fechaLocal(sumarDias(new Date(), -29)), fechaLocal(new Date())] },
];

// Período rápido que coincide con las fechas dadas (para resaltarlo y recordarlo)
export const periodoDeFechas = (desde?: string, hasta?: string) =>
    periodosRapidos.find((p) => {
        const [d, h] = p.rango();
        return d === (desde || '').slice(0, 10) && h === (hasta || '').slice(0, 10);
    })?.clave;

export default function FiltrosMovimientos({
    filtros,
    onFiltrosChange,
    almacenes,
    usuarios = [],
    productos,
    tiposAjuste = [],
    showAdvanced = false
}: FiltrosMovimientosProps) {
    // ✅ Estado local para los filtros - NO se aplican hasta hacer clic en buscar
    const [filtrosLocal, setFiltrosLocal] = useState<IFiltrosMovimientos>(filtros);
    const [isOpen, setIsOpen] = useState(true);

    // Convertir opciones a formato SearchSelect
    const tiposMovimientoOptions = tiposMovimiento.map(tipo => ({
        value: tipo.value,
        label: tipo.label,
    }));

    const almacenesOptions = almacenes.map(a => ({
        value: a.id.toString(),
        label: a.nombre,
    }));

    const usuariosOptions = usuarios.map(u => ({
        value: u.id.toString(),
        label: u.name,
    }));

    const productosOptions = productos.map(p => ({
        value: p.id.toString(),
        label: p.codigo ? `${p.codigo} - ${p.nombre}` : p.nombre,
    }));

    const tiposAjusteOptions = tiposAjuste.map(ta => ({
        value: ta.id.toString(),
        label: ta.label,
        description: ta.clave,
    }));

    // ✅ Actualizar estado local (sin navegar)
    const updateFiltroLocal = (key: keyof IFiltrosMovimientos, value: string | number | boolean | undefined) => {
        setFiltrosLocal({
            ...filtrosLocal,
            [key]: value
        });
    };

    // ✅ Aplicar filtros - SOLO cuando se hace clic en buscar
    const aplicarFiltros = () => {
        onFiltrosChange(filtrosLocal);
    };

    // ✅ Manejar Enter en inputs
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            aplicarFiltros();
        }
    };

    const clearFiltro = (key: keyof IFiltrosMovimientos) => {
        const newFiltros = { ...filtrosLocal };
        delete newFiltros[key];
        setFiltrosLocal(newFiltros);
    };

    const clearAllFiltros = () => {
        setFiltrosLocal({});
    };

    // Aplica un período rápido junto con el resto de filtros en edición
    const aplicarPeriodo = (rango: [string, string]) => {
        const nuevos = { ...filtrosLocal, fecha_inicio: rango[0], fecha_fin: rango[1] };
        setFiltrosLocal(nuevos);
        onFiltrosChange(nuevos);
    };
    const periodoActivo = periodoDeFechas(filtrosLocal.fecha_inicio, filtrosLocal.fecha_fin);

    // "direccion" es el orden de la tabla, no un filtro: se conserva al buscar pero no se cuenta ni se muestra
    const filtrosConValor = Object.entries(filtrosLocal).filter(([k, v]) => k !== 'direccion' && v !== null && v !== undefined && v !== '');
    const hasActiveFilters = filtrosConValor.length > 0;

    // ✅ NUEVO (2026-03-27): Detectar si está activo el filtro de proformas
    const isProformasFilterActive = (filtrosLocal as any).referencia_tipo === 'proforma';

    return (
        <div>
            <div className="flex items-center justify-between mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                <div className="flex items-center justify-between space-x-4 w-full">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="ml-2">
                                {filtrosConValor.length}
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={aplicarFiltros}
                            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            <Search className="h-4 w-4 mr-1" />
                            Buscar
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFiltros}
                                className="text-muted-foreground"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Limpiar
                            </Button>
                        )}
                        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm">
                                    {isOpen ? 'Ocultar' : 'Mostrar'} filtros
                                </Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    </div>
                </div>
            </div>

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleContent>
                    <div className="space-y-4 p-2 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                        {/* Períodos rápidos: aplican de inmediato */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">Período:</span>
                            {periodosRapidos.map((p) => (
                                <Button
                                    key={p.clave}
                                    type="button"
                                    size="sm"
                                    variant={periodoActivo === p.clave ? 'default' : 'outline'}
                                    onClick={() => aplicarPeriodo(p.rango())}
                                    className="h-7 px-3 text-xs"
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Búsqueda de producto - columna más ancha */}
                            <div className="col-span-1 md:col-span-1 lg:col-span-1 space-y-2">
                                <Label htmlFor="producto_busqueda">🔍 Producto</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="producto_busqueda"
                                        placeholder="ID, SKU, nombre, código..."
                                        value={filtrosLocal.producto_busqueda || ''}
                                        onChange={(e) => updateFiltroLocal('producto_busqueda', e.target.value || undefined)}
                                        onKeyPress={handleKeyPress}
                                        className="pl-9"
                                    />
                                    {filtrosLocal.producto_busqueda && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                            onClick={() => updateFiltroLocal('producto_busqueda', undefined)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Número de documento */}
                            <div className="space-y-2">
                                <Label htmlFor="numero_documento">Número de documento</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="numero_documento"
                                        placeholder="Ej: FAC-001, TRANSF-100..."
                                        value={filtrosLocal.numero_documento || ''}
                                        onChange={(e) => updateFiltroLocal('numero_documento', e.target.value || undefined)}
                                        onKeyPress={handleKeyPress}
                                        className="pl-9"
                                    />
                                    {filtrosLocal.numero_documento && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                            onClick={() => updateFiltroLocal('numero_documento', undefined)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Tipo de movimiento */}
                            <div className="space-y-2">
                                <Label>Tipo de movimientos</Label>
                                <SearchSelect
                                    placeholder="Seleccionar tipo..."
                                    value={filtrosLocal.tipo || ''}
                                    options={tiposMovimientoOptions}
                                    onChange={(value) => updateFiltroLocal('tipo', value || undefined)}
                                    allowClear={true}
                                    emptyText="No se encontraron tipos"
                                />
                            </div>

                            {/* Almacén */}
                            <div className="space-y-2">
                                <Label>Almacén</Label>
                                <SearchSelect
                                    placeholder="Seleccionar almacén..."
                                    value={filtrosLocal.almacen_id?.toString() || ''}
                                    options={almacenesOptions}
                                    onChange={(value) => updateFiltroLocal('almacen_id', value ? parseInt(value) : undefined)}
                                    allowClear={true}
                                    emptyText="No se encontraron almacenes"
                                />
                            </div>

                            {/* Usuario que hizo el movimiento */}
                            <div className="space-y-2">
                                <Label>Usuario</Label>
                                <SearchSelect
                                    placeholder="Todos los usuarios..."
                                    value={filtrosLocal.usuario_id?.toString() || ''}
                                    options={usuariosOptions}
                                    onChange={(value) => updateFiltroLocal('usuario_id', value ? Number(value) : undefined)}
                                    allowClear={true}
                                    emptyText="No se encontraron usuarios"
                                />
                            </div>

                            {/* Fecha desde */}
                            <div className="space-y-2">
                                <Label htmlFor="fecha_inicio">Fecha desde</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fecha_inicio"
                                        type="date"
                                        value={filtrosLocal.fecha_inicio || ''}
                                        onChange={(e) => updateFiltroLocal('fecha_inicio', e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Fecha hasta */}
                            <div className="space-y-2">
                                <Label htmlFor="fecha_fin">Fecha hasta</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fecha_fin"
                                        type="date"
                                        value={filtrosLocal.fecha_fin || ''}
                                        onChange={(e) => updateFiltroLocal('fecha_fin', e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>

                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                                {/* Número de referencia */}
                                <div className="space-y-2">
                                    <Label htmlFor="numero_referencia">Número de referencia</Label>
                                    <Input
                                        id="numero_referencia"
                                        placeholder="Ej: FAC-001, TRANSF-100..."
                                        value={filtrosLocal.numero_referencia || ''}
                                        onChange={(e) => updateFiltroLocal('numero_referencia', e.target.value)}
                                    />
                                </div>

                                {/* Cantidad mínima */}
                                <div className="space-y-2">
                                    <Label htmlFor="cantidad_min">Cantidad mínima</Label>
                                    <Input
                                        id="cantidad_min"
                                        type="number"
                                        placeholder="0"
                                        value={filtrosLocal.cantidad_min || ''}
                                        onChange={(e) => updateFiltroLocal('cantidad_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Filtros activos */}
                        {hasActiveFilters && (
                            <div className="pt-4 border-t">
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-sm text-muted-foreground">Filtros activos:</span>
                                    {Object.entries(filtrosLocal).map(([key, value]) => {
                                        if (!value || key === 'direccion') return null;

                                        let displayValue = value.toString();
                                        let displayKey = key;

                                        // Personalizar la visualización de algunos filtros
                                        if (key === 'fecha_inicio' || key === 'fecha_fin') {
                                            displayKey = key === 'fecha_inicio' ? 'Desde' : 'Hasta';
                                        } else if (key === 'usuario_id') {
                                            displayValue = usuarios.find(u => u.id === Number(value))?.name || value.toString();
                                            displayKey = 'Usuario';
                                        } else if (key === 'almacen_id') {
                                            const almacen = almacenes.find(a => a.id === Number(value));
                                            displayValue = almacen?.nombre || value.toString();
                                            displayKey = 'Almacén';
                                        } else if (key === 'producto_id') {
                                            const producto = productos.find(p => p.id === value);
                                            displayValue = producto?.nombre || value.toString();
                                            displayKey = 'Producto';
                                        } else if (key === 'tipo') {
                                            const tipo = tiposMovimiento.find(t => t.value === value);
                                            displayValue = tipo?.label || value.toString();
                                            displayKey = 'Tipo';
                                        } else if (key === 'tipo_ajuste_id') {
                                            const ajuste = tiposAjuste.find(ta => ta.id === value);
                                            displayValue = ajuste?.label || value.toString();
                                            displayKey = 'Tipo Ajuste';
                                        }

                                        return (
                                            <Badge
                                                key={key}
                                                variant="secondary"
                                                className="flex items-center gap-1"
                                            >
                                                {displayKey}: {displayValue}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-3 w-3 p-0 hover:bg-transparent"
                                                    onClick={() => clearFiltro(key as keyof IFiltrosMovimientos)}
                                                >
                                                    <X className="h-2 w-2" />
                                                </Button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
