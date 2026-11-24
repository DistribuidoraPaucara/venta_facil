import type { DatosParaFiltrosVentas, FiltrosVentas } from '@/domain/entities/ventas';
import ventasService from '@/infrastructure/services/ventas.service';
import { Calendar, CalendarDays, CreditCard, DollarSign, Filter, Search, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import ToggleGroup from '../ui/toggle-group';
import FloatingInput from './floating-input';
import FloatingSearchSelect from './floating-search-select';
import FloatingSelect from './floating-select';

interface FiltrosVentasProps {
    filtros: FiltrosVentas;
    datosParaFiltros?: DatosParaFiltrosVentas;
    onFiltrosChange?: (filtros: FiltrosVentas) => void;
}

export default function FiltrosVentasComponent({ filtros: filtrosIniciales, datosParaFiltros, onFiltrosChange }: FiltrosVentasProps) {
    const [filtros, setFiltros] = useState<FiltrosVentas>(filtrosIniciales);
    const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

    // 🔍 DEBUG: Mostrar filtros iniciales
    React.useEffect(() => {
        console.log('📝 [FiltrosVentas] Filtros iniciales recibidos:', {
            filtrosIniciales,
            tiene_valores: Object.values(filtrosIniciales).some(v => v !== undefined && v !== null && v !== ''),
            valores_activos: Object.fromEntries(
                Object.entries(filtrosIniciales).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            ),
        });
    }, []);

    // Valores por defecto para datosParaFiltros
    const datosSeguros = {
        clientes: datosParaFiltros?.clientes || [],
        estados_documento: datosParaFiltros?.estados_documento || [],
        monedas: datosParaFiltros?.monedas || [],
        usuarios: datosParaFiltros?.usuarios || [],
        tipos_pago: datosParaFiltros?.tipos_pago || [], // ✅ NUEVO: Tipos de pago
        preventistas: datosParaFiltros?.preventistas || [], // ✅ NUEVO (2026-03-01): Preventistas
    };

    // Detectar si hay filtros activos
    const hayFiltrosActivos = Object.values(filtros).some((value) => value !== undefined && value !== null && value !== '');

    // Sincronizar con los filtros aplicados (p. ej. al ordenar desde la tabla, el orden cambia por URL)
    useEffect(() => {
        setFiltros(filtrosIniciales);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(filtrosIniciales)]);

    // Cambios pendientes: el estado local difiere de lo aplicado en la última búsqueda
    const normalizarFiltros = (f: FiltrosVentas) =>
        JSON.stringify(
            Object.entries(f)
                .filter(([, v]) => v !== undefined && v !== null && v !== '')
                .map(([k, v]) => [k, String(v)])
                .sort(([a], [b]) => a.localeCompare(b)),
        );
    const hayCambiosPendientes = normalizarFiltros(filtros) !== normalizarFiltros(filtrosIniciales);

    // Detectar si hay filtros avanzados activos
    // ⚠️ fecha_desde/fecha_hasta quedan fuera: el backend las precarga con "hoy" por defecto
    // y eso no debe forzar la apertura del panel de filtros avanzados al entrar a la pantalla.
    const hayFiltrosAvanzadosActivos = Boolean(
        filtros.monto_min ||
            filtros.monto_max ||
            filtros.usuario_id ||
            filtros.tipo_pago_id || // ✅ NUEVO: Incluir tipo_pago_id
            filtros.preventista_id, // ✅ NUEVO (2026-03-01): Incluir preventista_id
    );

    useEffect(() => {
        if (hayFiltrosAvanzadosActivos) {
            setMostrarFiltrosAvanzados(true);
        }
    }, [hayFiltrosAvanzadosActivos]);

    // 🔍 DEBUG: Mostrar estados_documento en consola
    useEffect(() => {
        console.log('📋 [FiltrosVentas] Datos que llegan del backend:', {
            todos_los_estados: datosSeguros.estados_documento,
            total_estados: datosSeguros.estados_documento.length,
            estados_con_color: datosSeguros.estados_documento.filter((est) => est.color),
            estados_aprobadas_anuladas: datosSeguros.estados_documento.filter((est) => [3, 5].includes(Number(est.id))),
        });
    }, [datosSeguros.estados_documento]);

    const handleFiltroChange = (campo: keyof FiltrosVentas, valor: string | number | null | undefined) => {
        const nuevosFiltros = { ...filtros, [campo]: valor };
        console.log('🎯 [filtros-ventas] handleFiltroChange (local):', { campo, valor });
        setFiltros(nuevosFiltros);
        // ⚠️ NO llamamos a onFiltrosChange aquí - esperar a que el usuario presione "Buscar"
    };

    // ✅ Handler para el botón Buscar - aplica los filtros
    const handleBuscar = () => {
        console.log('📤 [filtros-ventas] Botón Buscar presionado. Aplicando filtros:', filtros);
        if (onFiltrosChange) {
            onFiltrosChange(filtros);
        }
    };

    // ✅ Handler para el botón Limpiar - limpia todos los filtros
    const handleLimpiarFiltros = () => {
        const filtrosLimpios = {
            cliente_id: undefined,
            estado_documento_id: undefined,
            usuario_id: undefined,
            fecha_desde: undefined,
            fecha_hasta: undefined,
            monto_min: undefined,
            monto_max: undefined,
            moneda_id: undefined,
            numero: null,
            id: null,
            tipo_pago_id: undefined,
            preventista_id: undefined,
        };
        console.log('🗑️ [filtros-ventas] Limpiando filtros');
        setFiltros(filtrosLimpios);
        if (onFiltrosChange) {
            onFiltrosChange(filtrosLimpios);
        }
    };

    // ✅ NUEVO: Cambiar múltiples filtros a la vez
    const handleMultipleFiltros = (cambios: Partial<FiltrosVentas>) => {
        const nuevosFiltros = { ...filtros, ...cambios };
        setFiltros(nuevosFiltros);
        // ⚠️ NO llamamos a onFiltrosChange aquí - esperar a que el usuario presione "Buscar"
    };

    const aplicarFiltros = (filtrosAplicar?: FiltrosVentas) => {
        const filtrosFinales = filtrosAplicar || filtros;
        console.log('🔍 [FiltrosVentas] Aplicando filtros:', filtrosFinales);
        console.log('🔍 [FiltrosVentas] preventista_id:', filtrosFinales.preventista_id);
        ventasService.searchVentas(filtrosFinales);
    };

    // Limpiar = ver TODAS las ventas (el padre agrega todas=1 al no haber fechas). Antes además llamaba a
    // ventasService.clearFilters(): eran dos navegaciones a /ventas, que el backend muestra como "solo hoy"
    const limpiarFiltros = () => {
        setMostrarFiltrosAvanzados(false);
        handleLimpiarFiltros();
    };

    // Fecha de hoy en hora LOCAL (toISOString() es UTC: en Bolivia, después de las 20:00 daba mañana)
    const hoyLocal = () => {
        const d = new Date();
        const dos = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
    };

    // ✅ NUEVO: Función para obtener etiquetas de filtros activos
    const obtenerFiltrosActivos = () => {
        const filtrosActivos: Array<{ etiqueta: string; campo: keyof FiltrosVentas }> = [];

        if (filtros.buscar) {
            filtrosActivos.push({ etiqueta: `Buscar: ${filtros.buscar}`, campo: 'buscar' });
        }
        if (filtros.id) {
            filtrosActivos.push({ etiqueta: `ID #${filtros.id}`, campo: 'id' });
        }
        if (filtros.numero) {
            filtrosActivos.push({ etiqueta: `Número: ${filtros.numero}`, campo: 'numero' });
        }
        if (filtros.cliente_id) {
            filtrosActivos.push({ etiqueta: `Cliente: ${filtros.cliente_id}`, campo: 'cliente_id' });
        }
        if (filtros.estado_documento_id) {
            const estado = datosSeguros.estados_documento.find((e) => e.id === filtros.estado_documento_id);
            if (estado) {
                filtrosActivos.push({ etiqueta: `Estado: ${estado.nombre}`, campo: 'estado_documento_id' });
            }
        }
        if (filtros.tipo_venta) {
            const tipoVentaLabel = filtros.tipo_venta === 'presencial' ? '🏪 Presencial' : '🚚 Delivery';
            filtrosActivos.push({ etiqueta: `Tipo: ${tipoVentaLabel}`, campo: 'tipo_venta' });
        }
        if (filtros.fecha_desde) {
            filtrosActivos.push({ etiqueta: `Desde: ${filtros.fecha_desde}`, campo: 'fecha_desde' });
        }
        if (filtros.fecha_hasta) {
            filtrosActivos.push({ etiqueta: `Hasta: ${filtros.fecha_hasta}`, campo: 'fecha_hasta' });
        }
        if (filtros.usuario_id) {
            const usuario = datosSeguros.usuarios.find((u) => u.id === filtros.usuario_id);
            if (usuario) {
                filtrosActivos.push({ etiqueta: `Usuario: ${usuario.name}`, campo: 'usuario_id' });
            }
        }
        if (filtros.preventista_id) {
            const preventista = datosSeguros.preventistas.find((p) => p.id === filtros.preventista_id);
            if (preventista) {
                filtrosActivos.push({ etiqueta: `Preventista: ${preventista.name}`, campo: 'preventista_id' });
            }
        }
        if (filtros.tipo_pago_id) {
            const tipoPago = datosSeguros.tipos_pago.find((tp) => tp.id === filtros.tipo_pago_id);
            if (tipoPago) {
                filtrosActivos.push({ etiqueta: `Pago: ${tipoPago.nombre}`, campo: 'tipo_pago_id' });
            }
        }
        if (filtros.monto_min) {
            filtrosActivos.push({ etiqueta: `Monto mín: ${filtros.monto_min}`, campo: 'monto_min' });
        }
        if (filtros.monto_max) {
            filtrosActivos.push({ etiqueta: `Monto máx: ${filtros.monto_max}`, campo: 'monto_max' });
        }
        if (filtros.moneda_id) {
            const moneda = datosSeguros.monedas.find((m) => m.id === filtros.moneda_id);
            if (moneda) {
                filtrosActivos.push({ etiqueta: `Moneda: ${moneda.codigo}`, campo: 'moneda_id' });
            }
        }

        return filtrosActivos;
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            aplicarFiltros();
        }
    };

    return (
        <div className="mb-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            {/* Filtros básicos */}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3 justify-between items-end">
                {/* Búsqueda unificada: folio (solo números) o número / cliente (texto) */}
                <div className="md:col-span-2">
                    <FloatingInput
                        id="buscar"
                        label="Folio o Cliente"
                        value={filtros.buscar || ''}
                        onChange={(e) => handleFiltroChange('buscar', e.target.value || null)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleBuscar();
                            }
                        }}
                        placeholder="Folio (58) · Número (VEN2026…) · Cliente (nombre, código, NIT, teléfono)"
                        title="Un número busca por folio. Texto busca por número de venta o por cliente (nombre, código, NIT o teléfono). Enter o Buscar para aplicar"
                        icon={<Search className="h-4 w-4" />}
                    />
                </div>
                <div className="flex flex-col justify-center">
                    <ToggleGroup
                        label=""
                        options={datosSeguros.estados_documento
                            .filter((est) => [3, 5].includes(Number(est.id))) // Solo Aprobadas (3) y Anuladas (5)
                            .map((est) => ({
                                value: est.id.toString(),
                                label: est.nombre,
                                icon: est.icono,
                                color: est.color,
                            }))}
                        value={filtros.estado_documento_id?.toString() || ''}
                        onChange={(value) => handleFiltroChange('estado_documento_id', value ? parseInt(value) : null)}
                        allowDeselect
                    />
                </div>
            </div>

            {/* Filtros avanzados */}
            {mostrarFiltrosAvanzados && (
                <div className="mt-4 border-t border-gray-200 pt-4 dark:border-zinc-700">
                    <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                        {/* Rango de fechas */}
                        <div>
                            <FloatingInput
                                id="fecha_desde"
                                label="Fecha desde"
                                type="date"
                                value={filtros.fecha_desde || ''}
                                onChange={(e) => handleFiltroChange('fecha_desde', e.target.value || undefined)}
                                icon={<Calendar className="h-4 w-4" />}
                            />
                        </div>

                        <div>
                            <FloatingInput
                                id="fecha_hasta"
                                label="Fecha hasta"
                                type="date"
                                value={filtros.fecha_hasta || ''}
                                onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value || undefined)}
                                icon={<Calendar className="h-4 w-4" />}
                            />
                        </div>

                        {/* Tipo de Pago */}
                        <div>
                            <FloatingSelect
                                id="tipo_pago_id"
                                label="Tipo de Pago"
                                value={filtros.tipo_pago_id || ''}
                                onChange={(e) => handleFiltroChange('tipo_pago_id', e.target.value ? Number(e.target.value) : null)}
                                icon={<CreditCard className="h-4 w-4" />}
                            >
                                <option value="">Todos los tipos</option>
                                {datosSeguros.tipos_pago.map((tipo) => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.nombre}
                                    </option>
                                ))}
                            </FloatingSelect>
                        </div>
                        {/* Estado */}
                        {/* <div>
                            <FloatingSelect
                                id="estado_documento_id"
                                label="📋 Estado"
                                value={filtros.estado_documento_id || ''}
                                onChange={(e) => handleFiltroChange('estado_documento_id', e.target.value ? Number(e.target.value) : null)}
                            >
                                <option value="">Todos los estados</option>
                                {datosSeguros.estados_documento.map((estado) => (
                                    <option key={estado.id} value={estado.id}>
                                        {estado.nombre}
                                    </option>
                                ))}
                            </FloatingSelect>
                        </div> */}
                        {/* Rango de montos */}
                        <div>
                            <FloatingInput
                                id="monto_min"
                                label="Monto mínimo"
                                type="number"
                                value={filtros.monto_min || ''}
                                onChange={(e) => handleFiltroChange('monto_min', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                icon={<DollarSign className="h-4 w-4" />}
                            />
                        </div>
                        <div>
                            <FloatingInput
                                id="monto_max"
                                label="Monto máximo"
                                type="number"
                                value={filtros.monto_max || ''}
                                onChange={(e) => handleFiltroChange('monto_max', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                icon={<DollarSign className="h-4 w-4" />}
                            />
                        </div>
                        {/* Tipo de Venta */}
                        {/* <div>
                            <FloatingSelect
                                id="tipo_venta"
                                label="🏪 Tipo de Venta"
                                value={filtros.tipo_venta || ''}
                                onChange={(e) => handleFiltroChange('tipo_venta', e.target.value || null)}
                            >
                                <option value="">Todos los tipos</option>
                                <option value="presencial">🏪 Presencial</option>
                                <option value="delivery">🚚 Delivery</option>
                            </FloatingSelect>
                        </div> */}
                        {/* Usuario */}
                        {/* <div className="w-full">
                            <FloatingSearchSelect
                                id="usuario_id"
                                label="👤 Usuario Creador"
                                placeholder="Seleccionar usuario..."
                                value={filtros.usuario_id || ''}
                                options={datosSeguros.usuarios.map((usuario) => ({
                                    value: usuario.id,
                                    label: usuario.name,
                                }))}
                                onChange={(value) => handleFiltroChange('usuario_id', value ? Number(value) : null)}
                                allowClear={true}
                            />
                        </div> */}
                        {/* ✅ NUEVO (2026-03-01): Preventista */}
                        {/* <div>
                            <FloatingSearchSelect
                                id="preventista_id"
                                label="👤 Preventista"
                                placeholder="Seleccionar preventista..."
                                value={filtros.preventista_id || ''}
                                options={datosSeguros.preventistas.map((preventista) => ({
                                    value: preventista.id,
                                    label: preventista.name,
                                }))}
                                onChange={(value) => handleFiltroChange('preventista_id', value ? Number(value) : null)}
                                allowClear={true}
                            />
                        </div> */}
                    </div>
                </div>
            )}
            {/* Botones de acción */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 p-2 dark:border-zinc-700">
                {/* Atajos de rango: se aplican al instante */}
                {/* Rango de fechas: control segmentado (una sola opción activa) */}
                <div
                    role="group"
                    aria-label="Rango de fechas"
                    className="inline-flex overflow-hidden rounded-md border border-blue-300 dark:border-blue-700"
                >
                    {(() => {
                        const esHoy = filtros.fecha_desde === hoyLocal() && filtros.fecha_hasta === hoyLocal();
                        const esTodas = !filtros.fecha_desde && !filtros.fecha_hasta;
                        const claseSegmento = (activo: boolean) =>
                            `inline-flex items-center gap-1 px-2.5 py-1 text-sm transition-colors ${
                                activo
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
                            }`;
                        return (
                            <>
                                <button
                                    type="button"
                                    aria-pressed={esHoy}
                                    onClick={() => {
                                        const hoy = hoyLocal();
                                        const nuevos = { ...filtros, fecha_desde: hoy, fecha_hasta: hoy };
                                        setFiltros(nuevos);
                                        onFiltrosChange?.(nuevos);
                                    }}
                                    className={claseSegmento(esHoy)}
                                >
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Hoy
                                </button>
                                <button
                                    type="button"
                                    aria-pressed={esTodas}
                                    title="Ver ventas de todas las fechas (mantiene los demás filtros)"
                                    onClick={() => {
                                        const nuevos = { ...filtros, fecha_desde: undefined, fecha_hasta: undefined };
                                        setFiltros(nuevos);
                                        onFiltrosChange?.(nuevos);
                                    }}
                                    className={`${claseSegmento(esTodas)} border-l border-blue-300 dark:border-blue-700`}
                                >
                                    <Calendar className="h-3.5 w-3.5" />
                                    Todas
                                </button>
                            </>
                        );
                    })()}
                </div>

                {/* Acciones: en pantallas chicas "Más filtros" y "Limpiar" son solo íconos con tooltip */}
                <div className="ml-auto flex items-center gap-1 sm:gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                                aria-label={mostrarFiltrosAvanzados ? 'Ocultar filtros' : 'Más filtros'}
                                aria-expanded={mostrarFiltrosAvanzados}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-2 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                            >
                                <Filter className="h-4 w-4 md:mr-1" />
                                <span className="hidden md:inline">{mostrarFiltrosAvanzados ? 'Ocultar filtros' : 'Más filtros'}</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>{mostrarFiltrosAvanzados ? 'Ocultar filtros' : 'Más filtros'}</TooltipContent>
                    </Tooltip>

                    {/* Siempre visible para no mover la fila; deshabilitado (aria-disabled) sin filtros activos */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => {
                                    if (hayFiltrosActivos) limpiarFiltros();
                                }}
                                aria-label="Limpiar filtros"
                                aria-disabled={!hayFiltrosActivos}
                                className={`inline-flex items-center rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                                    hayFiltrosActivos
                                        ? 'text-gray-600 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-gray-200'
                                        : 'cursor-not-allowed text-gray-400 opacity-50 dark:text-gray-600'
                                }`}
                            >
                                <X className="h-4 w-4 md:mr-1" />
                                <span className="hidden md:inline">Limpiar</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>{hayFiltrosActivos ? 'Limpiar filtros' : 'No hay filtros para limpiar'}</TooltipContent>
                    </Tooltip>

                    {/* Acción principal: siempre con texto */}
                    <button
                        type="button"
                        onClick={() => {
                            console.log('🔘 [filtros-ventas] Botón Buscar clickeado');
                            handleBuscar();
                        }}
                        title={hayCambiosPendientes ? 'Hay cambios sin aplicar' : 'Buscar'}
                        className={`relative inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                            hayCambiosPendientes ? 'ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-zinc-900' : ''
                        }`}
                    >
                        <Search className="mr-1 h-4 w-4" />
                        Buscar
                        {hayCambiosPendientes && (
                            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400" aria-label="Cambios sin aplicar" />
                        )}
                    </button>
                </div>
            </div>
            {/* ✅ NUEVO: Mostrar filtros seleccionados activos */}
            {obtenerFiltrosActivos().length > 0 && (
                <div className="border-t border-gray-200 dark:border-zinc-700 mt-2">
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros activos:</span>
                        {obtenerFiltrosActivos().map((filtroActivo) => (
                            <div
                                key={filtroActivo.campo}
                                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                            >
                                <span>{filtroActivo.etiqueta}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Quitar un chip aplica el cambio de inmediato
                                        const nuevos = { ...filtros, [filtroActivo.campo]: null } as FiltrosVentas;
                                        setFiltros(nuevos);
                                        onFiltrosChange?.(nuevos);
                                    }}
                                    className="ml-1 font-semibold text-blue-600 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                                    title="Remover filtro"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
