import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import InputSearch from '@/presentation/components/ui/input-search';

interface Producto {
    id: number;
    nombre: string;
    sku: string;
}

interface Venta {
    detalle_id: number;
    numero_venta: string;
    venta_id: number;
    cliente: string;
    vendedor?: string;
    fecha: string;
    cantidad_vendida: number;
    cantidad_devuelta: number;
    cantidad_neta: number;
    precio_unitario: number;
    monto_vendido: number;
    monto_devuelto: number;
    monto_neto: number;
    estado: string;
    // ✅ NUEVO (2026-04-28): Tipo de venta (directa o dentro de combo)
    tipo_venta?: 'DIRECTA' | 'DENTRO DE COMBO';
}

interface PageProps {
    productoSeleccionado?: Producto | null;
    ventas: Venta[];
    filtros: {
        producto_id: number | null;
        fecha_especifica: string | null;
        fecha_inicio: string | null;
        fecha_fin: string | null;
    };
    totalProducto: {
        cantidad_vendida: number;
        cantidad_devuelta: number;
        cantidad_neta: number;
        monto_total: number;
        monto_devuelto: number;
        monto_neto: number;
    };
}

// Muestra solo los decimales necesarios (10 → "10", 2.5 → "2,5"), hasta 6 para productos fraccionados
const formatCantidad = (valor: unknown) =>
    new Intl.NumberFormat('es-BO', { maximumFractionDigits: 6 }).format(Number(valor) || 0);

export default function VentasPorProducto() {
    const { props } = usePage<PageProps>();
    const {
        productoSeleccionado,
        ventas,
        filtros,
        totalProducto,
    } = props;

    const [tipoFecha, setTipoFecha] = useState<'especifica' | 'rango'>('especifica');
    const [productoId, setProductoId] = useState<number | null>(filtros.producto_id);
    const [productoNombre, setProductoNombre] = useState(productoSeleccionado?.nombre ?? '');

    // Sugerencias con prioridad ID > código de barras > SKU > nombre (mismo endpoint que el reporte de productos vendidos)
    const buscarProductos = async (query: string) => {
        const response = await fetch(`/ventas/reporte-productos-vendidos/buscar-productos?q=${encodeURIComponent(query)}`, {
            headers: { Accept: 'application/json' },
        });
        return response.ok ? response.json() : [];
    };
    const [fechaEspecifica, setFechaEspecifica] = useState(filtros.fecha_especifica || '');
    const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || '');
    const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || '');
    const [filtroEstado, setFiltroEstado] = useState<'todas' | 'Aprobado' | 'Anulado'>('todas');
    const [ordenVentas, setOrdenVentas] = useState<'desc' | 'asc'>('desc');

    // Filtrar ventas según el estado seleccionado y ordenar por ID de venta
    const ventasFiltradas = ventas
        .filter(venta => {
            if (filtroEstado === 'todas') return true;
            return venta.estado === filtroEstado;
        })
        .sort((a, b) => (ordenVentas === 'asc' ? a.venta_id - b.venta_id : b.venta_id - a.venta_id));

    // Debug: mostrar estados únicos disponibles
    useEffect(() => {
        const estadosUnicos = [...new Set(ventas.map(v => v.estado))];
        console.log('📊 Estados únicos en ventas:', estadosUnicos);
        console.log('🔍 Filtro actual:', filtroEstado);
        console.log('📈 Ventas filtradas:', ventasFiltradas.length, 'de', ventas.length);
    }, [ventas, filtroEstado]);

    const handleBuscar = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();

        if (productoId) params.append('producto_id', productoId.toString());
        if (tipoFecha === 'especifica' && fechaEspecifica) {
            params.append('fecha_especifica', fechaEspecifica);
        } else if (tipoFecha === 'rango' && fechaInicio && fechaFin) {
            params.append('fecha_inicio', fechaInicio);
            params.append('fecha_fin', fechaFin);
        }

        window.location.href = `${window.location.pathname}?${params.toString()}`;
    };

    const formatCurrency = (valor: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
        }).format(valor);
    };

    return (
        <AppLayout>
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        📊 Reporte de Ventas por Producto
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Visualiza todas las ventas de un producto en una fecha o rango específico
                    </p>
                </div>

                {/* Filtros */}
                <Card className="p-2">
                    <form onSubmit={handleBuscar} className="space-y-6">
                        {/* Producto */}
                        <div>
                            <InputSearch
                                id="producto_search"
                                label="🔍 Seleccionar Producto"
                                value={productoId}
                                displayValue={productoNombre}
                                onSearch={buscarProductos}
                                onChange={(value, option) => {
                                    setProductoId(value ? Number(value) : null);
                                    setProductoNombre(option?.label ?? '');
                                }}
                                placeholder="ID, código de barras, SKU o nombre"
                                emptyText="No se encontraron productos"
                                isSelected={!!productoId}
                                allowScanner={false}
                            />
                        </div>

                        {/* Tipo de Filtro de Fecha */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    📅 Tipo de Fecha
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="tipoFecha"
                                            value="especifica"
                                            checked={tipoFecha === 'especifica'}
                                            onChange={() => setTipoFecha('especifica')}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Fecha Específica</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="tipoFecha"
                                            value="rango"
                                            checked={tipoFecha === 'rango'}
                                            onChange={() => setTipoFecha('rango')}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Rango de Fechas</span>
                                    </label>
                                </div>
                            </div>
                            {/* Fecha Específica */}
                            {tipoFecha === 'especifica' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Fecha
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaEspecifica}
                                        onChange={(e) => setFechaEspecifica(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            )}

                            {/* Rango de Fechas */}
                            {tipoFecha === 'rango' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Fecha Inicio
                                        </label>
                                        <input
                                            type="date"
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Fecha Fin
                                        </label>
                                        <input
                                            type="date"
                                            value={fechaFin}
                                            onChange={(e) => setFechaFin(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* Botones */}
                        <div className="flex gap-3 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setProductoId(null);
                                    setFechaEspecifica('');
                                    setFechaInicio('');
                                    setFechaFin('');
                                    window.location.href = window.location.pathname;
                                }}
                            >
                                🔄 Limpiar Filtros
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                🔍 Buscar Ventas
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Resultado */}
                {productoSeleccionado && (
                    <div className="space-y-2">
                        {/* Información del Producto */}
                        <Card className="p-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        📦 {productoSeleccionado.nombre}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        SKU: {productoSeleccionado.sku}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Resumen Total */}
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <Card className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Cantidad Vendida
                                </div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {formatCantidad(totalProducto.cantidad_vendida)}
                                </div>
                            </Card>

                            <Card className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Cantidad Devuelta
                                </div>
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                    {formatCantidad(totalProducto.cantidad_devuelta)}
                                </div>
                            </Card>

                            <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Cantidad Neta
                                </div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {formatCantidad(totalProducto.cantidad_neta)}
                                </div>
                            </Card>
                            <Card className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Monto Total
                                </div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {formatCurrency(totalProducto.monto_total)}
                                </div>
                            </Card>

                            <Card className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Monto Devuelto
                                </div>
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                    {formatCurrency(totalProducto.monto_devuelto)}
                                </div>
                            </Card>

                            <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Monto Neto
                                </div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {formatCurrency(totalProducto.monto_neto)}
                                </div>
                            </Card>
                        </div>

                        {/* Filtro de Estado */}
                        <Card className="p-2 bg-white dark:bg-slate-800">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                🔔 Filtrar por Estado
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFiltroEstado('todas')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filtroEstado === 'todas'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    Todas ({ventas.length})
                                </button>
                                <button
                                    onClick={() => setFiltroEstado('Aprobado')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filtroEstado === 'Aprobado'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    ✅ Aprobado ({ventas.filter(v => v.estado === 'Aprobado').length})
                                </button>
                                <button
                                    onClick={() => setFiltroEstado('Anulado')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filtroEstado === 'Anulado'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    ❌ Anulado ({ventas.filter(v => v.estado === 'Anulado').length})
                                </button>

                                {/* Orden por ID de venta */}
                                <button
                                    type="button"
                                    onClick={() => setOrdenVentas(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                                    className="ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600"
                                    title="Cambiar el orden por ID de venta"
                                >
                                    {ordenVentas === 'desc' ? '⬇️ ID venta: más reciente primero' : '⬆️ ID venta: más antigua primero'}
                                </button>
                            </div>
                        </Card>

                        {/* Tabla de Ventas */}
                        <Card className="p-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                📝 Detalle de Ventas ({ventasFiltradas.length})
                            </h3>

                            {ventasFiltradas.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <p>No hay ventas registradas para este producto en el período seleccionado</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 dark:bg-slate-700 border-b dark:border-slate-600">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Folio Venta</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Folio</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Fecha</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Cliente</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Vendedor</th>
                                                {/* <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Tipo</th> */}
                                                <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Cantidad</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Devuelta</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Precio Unit.</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">Monto Neto</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-slate-700">
                                            {ventasFiltradas.map((venta, index) => (
                                                <tr
                                                    key={`${venta.venta_id}-${venta.detalle_id}-${index}`}
                                                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                                                >
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                        #{venta.venta_id}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                                                        <a
                                                            href={`/ventas/${venta.venta_id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline dark:text-blue-400"
                                                            title="Abrir venta en otra pestaña"
                                                        >
                                                            {venta.numero_venta || `#${venta.venta_id}`}
                                                        </a>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                        {venta.fecha}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                                                        {venta.cliente}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                        {venta.vendedor}
                                                    </td>
                                                    {/* <td className="px-4 py-3">
                                                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                                                            venta.tipo_venta === 'DENTRO DE COMBO'
                                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                        }`}>
                                                            {venta.tipo_venta === 'DENTRO DE COMBO' ? '📦 Combo' : '✓ Directa'}
                                                        </span>
                                                    </td> */}
                                                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                                        {formatCantidad(venta.cantidad_vendida)}
                                                    </td>
                                                    <td className={`px-4 py-3 text-right ${
                                                        venta.cantidad_devuelta > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'
                                                    }`}>
                                                        {venta.cantidad_devuelta > 0 ? formatCantidad(venta.cantidad_devuelta) : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                        {formatCurrency(venta.precio_unitario)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                                                        {formatCurrency(venta.monto_neto)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                                            venta.estado?.toLowerCase() === 'aprobado'
                                                                ? 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                                : venta.estado?.toLowerCase() === 'anulado'
                                                                ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                                : 'bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200'
                                                        }`}>
                                                            {venta.estado}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        {/* Totales de las filas visibles (respeta el filtro de estado) */}
                                        <tfoot className="bg-gray-50 dark:bg-slate-700/60 border-t-2 dark:border-slate-600 font-semibold">
                                            <tr>
                                                <td colSpan={5} className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                                    Total ({ventasFiltradas.length} {ventasFiltradas.length === 1 ? 'venta' : 'ventas'})
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                                    {formatCantidad(ventasFiltradas.reduce((t, v) => t + (Number(v.cantidad_vendida) || 0), 0))}
                                                </td>
                                                <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400">
                                                    {formatCantidad(ventasFiltradas.reduce((t, v) => t + (Number(v.cantidad_devuelta) || 0), 0))}
                                                </td>
                                                <td />
                                                <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 whitespace-nowrap">
                                                    {formatCurrency(ventasFiltradas.reduce((t, v) => t + (Number(v.monto_neto) || 0), 0))}
                                                </td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {!productoSeleccionado && (
                    <Card className="p-8 text-center">
                        <div className="text-gray-500 dark:text-gray-400">
                            <p className="text-lg">👈 Selecciona un producto para ver sus ventas</p>
                            <p className="text-sm mt-2">
                                Elige un producto y un rango de fechas para comenzar
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
