import React, { useState, useCallback, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@inertiajs/core';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Label } from '@/presentation/components/ui/label';
import { Textarea } from '@/presentation/components/ui/textarea';
import SearchSelect from '@/presentation/components/ui/search-select';
import { Input } from '@/presentation/components/ui/input';
import { Badge } from '@/presentation/components/ui/badge';
import { Trash2, Plus, Package, Search, Loader } from 'lucide-react';
import NotificationService from '@/infrastructure/services/notification.service';
import transferenciasService from '@/infrastructure/services/transferencias.service';
import type {
    Almacen,
    Vehiculo,
    Chofer,
    Producto,
    DetalleTransferencia,
} from '@/domain/entities/transferencias';

interface CrearTransferenciaProps extends PageProps {
    almacenes: Almacen[];
    productos: Producto[];
}

const breadcrumbs = [
    {
        title: 'Inventario',
        href: '/inventario',
    },
    {
        title: 'Transferencias',
        href: '/inventario/transferencias',
    },
    {
        title: 'Nueva Transferencia',
        href: '/inventario/transferencias/crear',
    },
];

export default function CrearTransferencia({ almacenes, productos = [] }: CrearTransferenciaProps) {
    const { data, setData, post, processing, errors } = useForm({
        almacen_origen_id: '',
        almacen_destino_id: '',
        observaciones: '',
        detalles: [] as DetalleTransferencia[],
    });


    // ✅ NUEVOS: Estados para búsqueda dinámica de productos
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Lotes del producto en el almacén origen con stock disponible, AGRUPADOS por número de lote (varios registros
    // "sin lote" en distintos sectores son uno solo para transferir: al enviar se descuenta de todos). Los que vencen antes primero
    const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;
    const lotesOrigen = (producto: any): any[] => {
        const grupos = new Map<string, { id: string; lote: string | null; fecha_vencimiento: string | null; cantidad_disponible: number }>();
        for (const s of producto?.stock ?? []) {
            if (Number(s.almacen_id) !== Number(data.almacen_origen_id) || num(s.cantidad_disponible) <= 0) continue;
            const clave = s.lote || '';
            const g = grupos.get(clave) ?? { id: clave || 'sin-lote', lote: s.lote || null, fecha_vencimiento: s.fecha_vencimiento ?? null, cantidad_disponible: 0 };
            g.cantidad_disponible += num(s.cantidad_disponible);
            if (s.fecha_vencimiento && (!g.fecha_vencimiento || String(s.fecha_vencimiento) < String(g.fecha_vencimiento))) {
                g.fecha_vencimiento = s.fecha_vencimiento;
            }
            grupos.set(clave, g);
        }
        return [...grupos.values()].sort((a, b) => String(a.fecha_vencimiento ?? '9999').localeCompare(String(b.fecha_vencimiento ?? '9999')));
    };
    const disponibleOrigen = (producto: any) => lotesOrigen(producto).reduce((t: number, s: any) => t + num(s.cantidad_disponible), 0);
    const formatearCantidad = (n: number) => (Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(2)).toString());
    const yaAgregado = (productoId: number, lote?: string | null) =>
        data.detalles.some((d) => d.producto_id === productoId && (lote ? d.lote === lote : !d.lote));

    const productosOptions = productos.map(producto => {
        const stockEnOrigen = data.almacen_origen_id ?
            (producto.stock_por_almacen?.[data.almacen_origen_id] || 0) :
            (producto.stock_disponible || 0);

        return {
            value: producto.id,
            label: `${producto.codigo} - ${producto.nombre}`,
            description: stockEnOrigen > 0 ?
                `Stock disponible: ${stockEnOrigen}` :
                'Sin stock disponible',
        };
    });

    const almacenesOptions = almacenes.map(almacen => ({
        value: almacen.id,
        label: almacen.nombre,
        description: almacen.ubicacion_fisica
            ? `📍 ${almacen.ubicacion_fisica}${almacen.direccion ? ` - ${almacen.direccion}` : ''}${almacen.requiere_transporte_externo ? ' 🚛' : ''}`
            : almacen.direccion || 'Sin ubicación definida',
    }));


    // Búsqueda de productos en el almacén origen. Devuelve los resultados (para Enter) además de mostrarlos;
    // las respuestas que llegan después de otra búsqueda se descartan
    const ultimaBusquedaRef = useRef('');
    const buscarProductos = useCallback(
        async (term?: string): Promise<any[]> => {
            const busqueda = (term ?? searchTerm).trim();
            ultimaBusquedaRef.current = busqueda;
            if (!busqueda || !data.almacen_origen_id) {
                setSearchResults([]);
                return [];
            }

            try {
                setIsSearching(true);
                const url = `/api/productos/buscar?q=${encodeURIComponent(busqueda)}&almacen_id=${data.almacen_origen_id}&tipo=compra&limite=20`;
                const response = await fetch(url, { headers: { Accept: 'application/json' } });
                const resultado = await response.json();
                if (ultimaBusquedaRef.current !== busqueda) return [];

                const lista = resultado.success ? resultado.data || [] : [];
                // Primero los que tienen stock en el origen (se pueden transferir)
                const ordenada = [...lista].sort((a, b) => Number(disponibleOrigen(b) > 0) - Number(disponibleOrigen(a) > 0));
                setSearchResults(ordenada);
                return ordenada;
            } catch (error) {
                console.error('❌ [Transferencias] Error en búsqueda:', error);
                setSearchResults([]);
                return [];
            } finally {
                if (ultimaBusquedaRef.current === busqueda) setIsSearching(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [data.almacen_origen_id, searchTerm]
    );

    // Búsqueda mientras se escribe (300 ms después de la última tecla); un ID de un dígito también busca
    useEffect(() => {
        const termino = searchTerm.trim();
        if (termino.length < 2 && !/^\d+$/.test(termino)) {
            setSearchResults([]);
            return;
        }
        const t = setTimeout(() => buscarProductos(termino), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, data.almacen_origen_id]);

    // ✅ Cerrar sugerencias al presionar Escape o hacer click afuera
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSearchResults([]);
                setSearchTerm('');
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchResults([]);
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // ✅ Agregar producto con su lote a la tabla
    const agregarProductoATabla = (producto: any, lote?: any) => {
        // Validar si el producto ya existe en la tabla
        const productoExiste = data.detalles.some(
            d => d.producto_id === producto.id &&
                 (lote ? d.lote === lote.lote : !d.lote)
        );

        if (productoExiste) {
            NotificationService.warning('Este producto con este lote ya está agregado');
            return;
        }

        // Calcular stock por almacén desde el array stock
        // El endpoint retorna un array stock con los lotes, necesitamos sumar la cantidad
        // stock_por_almacen (disponible en cada almacén) viene de la búsqueda; los lotes de "stock" son solo del origen
        const stockPorAlmacen: any = { ...(producto.stock_por_almacen ?? {}) };
        if (!producto.stock_por_almacen && producto.stock && Array.isArray(producto.stock)) {
            producto.stock.forEach((s: any) => {
                if (!stockPorAlmacen[s.almacen_id]) {
                    stockPorAlmacen[s.almacen_id] = 0;
                }
                stockPorAlmacen[s.almacen_id] += parseFloat(s.cantidad || 0);
            });
        }

        console.log('💾 [Agregar] Stock por almacén calculado:', stockPorAlmacen);

        // Crear nuevo detalle con datos del producto
        const nuevoDetalle: DetalleTransferencia & {
            producto_nombre?: string;
            producto_codigo?: string;
            producto_sku?: string;
            codigos_barras?: string[];
            stock_por_almacen?: any;
        } = {
            producto_id: producto.id,
            cantidad: 0, // Se editará en la tabla
            lote: lote?.lote || undefined,
            fecha_vencimiento: lote?.fecha_vencimiento || undefined,
            // Guardar también los datos del producto para renderizar en la tabla
            producto_nombre: producto.nombre,
            producto_codigo: producto.codigo,
            producto_sku: producto.sku,
            codigos_barras: producto.codigos_barras ?? [],
            // Guardar stock por almacén
            stock_por_almacen: stockPorAlmacen,
        };

        // Agregar a la tabla
        setData('detalles', [...data.detalles, nuevoDetalle as any]);

        // Limpiar búsqueda
        setSearchTerm('');
        setSearchResults([]);

        NotificationService.success(`✅ ${producto.nombre} agregado a la tabla`);
    };

    // Enter / botón (o escáner): busca YA y agrega el producto exacto (prioridad como en ventas: ID, SKU, código de barras).
    // Con un solo lote con stock se agrega directo; con varios, quedan sus lotes en la lista para elegir
    const handleBuscarProducto = async () => {
        const termino = searchTerm.trim();
        if (!termino || !data.almacen_origen_id) return;

        const lista = await buscarProductos(termino);
        if (ultimaBusquedaRef.current !== termino) return;

        const t = termino.toLowerCase();
        const exacto =
            (/^\d+$/.test(t) ? lista.find((p) => String(p.id) === t) : undefined) ??
            lista.find((p) => (p.sku ?? '').toLowerCase() === t) ??
            lista.find((p) => (p.codigos_barras ?? []).some((c: string) => String(c).toLowerCase() === t)) ??
            (lista.length === 1 ? lista[0] : undefined);

        if (!exacto) {
            if (lista.length === 0) NotificationService.warning(`No se encontró un producto con "${termino}"`);
            return; // varios: quedan en la lista para elegir
        }

        const lotes = lotesOrigen(exacto);
        if (lotes.length === 0) {
            NotificationService.warning(`#${exacto.id} ${exacto.nombre} no tiene stock en el almacén origen`);
            setSearchResults([exacto]);
            return;
        }
        // Se carga directo; con varios lotes, el que vence primero (o el primero que falte agregar)
        const lote = lotes.find((l) => !yaAgregado(exacto.id, l.lote)) ?? lotes[0];
        agregarProductoATabla(exacto, lote);
        if (lotes.length > 1) {
            NotificationService.info(`${exacto.nombre} tiene ${lotes.length} lotes: se agregó ${lote.lote ? `el lote ${lote.lote}` : 'el sin lote'}. Busque de nuevo para agregar otro.`);
        }
    };

    // ✅ Actualizar cantidad en la tabla
    const actualizarCantidadDetalle = (index: number, cantidad: number) => {
        const nuevosDetalles = [...data.detalles];
        nuevosDetalles[index].cantidad = cantidad;
        setData('detalles', nuevosDetalles);
    }; const eliminarProducto = (index: number) => {
        const nuevosDetalles = data.detalles.filter((_, i) => i !== index);
        setData('detalles', nuevosDetalles);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validar datos completos con el service
        const validationErrors = transferenciasService.validateData(
            data,
            { almacenes, productos }
        );

        if (validationErrors.length > 0) {
            validationErrors.forEach(error => NotificationService.error(error));
            return;
        }

        // Mostrar notificación de carga
        const loadingToast = NotificationService.loading('🔄 Procesando transferencia...');

        post('/inventario/transferencias/crear', {
            onSuccess: () => {
                NotificationService.dismiss(loadingToast);
            },
            onError: (errors) => {
                NotificationService.dismiss(loadingToast);
                const errorMessage = transferenciasService.extractErrorMessage(errors);
                NotificationService.error(`❌ ${errorMessage}`);
            }
        });
    };

    const totalProductos = data.detalles.length;
    const totalCantidad = data.detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0);

    // Determinar si es una transferencia física (requiere transporte)
    const almacenOrigen = almacenes.find(a => a.id === parseInt(data.almacen_origen_id as string));
    const almacenDestino = almacenes.find(a => a.id === parseInt(data.almacen_destino_id as string));
    const requiereTransporte = transferenciasService.esTransferenciaFisica(almacenOrigen, almacenDestino);

    // Limpiar campos de transporte si no se requiere
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nueva Transferencia" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-baseline gap-x-3">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Nueva Transferencia</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Productos de un almacén a otro</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Origen → destino, observaciones y resumen en una sola tarjeta */}
                    <Card>
                        <CardContent className="space-y-3 pt-4">
                            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr] lg:grid-cols-[1fr_auto_1fr_1.2fr]">
                                <div>
                                    <Label htmlFor="almacen_origen_id">Almacén Origen *</Label>
                                    <SearchSelect
                                        id="almacen_origen_id"
                                        value={data.almacen_origen_id}
                                        options={almacenesOptions}
                                        onChange={(value) => setData('almacen_origen_id', value.toString())}
                                        placeholder="Seleccionar almacén origen"
                                        required
                                        error={errors.almacen_origen_id}
                                    />
                                </div>
                                <span className="hidden pb-2 text-xl text-gray-400 md:block" aria-hidden>
                                    →
                                </span>
                                <div>
                                    <Label htmlFor="almacen_destino_id">Almacén Destino *</Label>
                                    <SearchSelect
                                        id="almacen_destino_id"
                                        value={data.almacen_destino_id}
                                        options={almacenesOptions.filter(opt => opt.value.toString() !== data.almacen_origen_id)}
                                        onChange={(value) => setData('almacen_destino_id', value.toString())}
                                        placeholder="Seleccionar almacén destino"
                                        required
                                        error={errors.almacen_destino_id}
                                    />
                                </div>
                                <div className="md:col-span-3 lg:col-span-1">
                                    <Label htmlFor="observaciones">Observaciones</Label>
                                    <Textarea
                                        id="observaciones"
                                        value={data.observaciones}
                                        onChange={(e) => setData('observaciones', e.target.value)}
                                        placeholder="Observaciones (opcional)"
                                        rows={1}
                                        maxLength={500}
                                        className="min-h-[2.5rem] resize-y"
                                    />
                                    {errors.observaciones && <p className="mt-1 text-sm text-red-600">{errors.observaciones}</p>}
                                </div>
                            </div>

                            {/* Resumen en una línea */}
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Badge variant="secondary">
                                    {totalProductos} producto{totalProductos !== 1 ? 's' : ''}
                                </Badge>
                                <Badge variant="secondary">Cantidad total: {totalCantidad}</Badge>
                                {almacenOrigen && almacenDestino && (
                                    <>
                                        <Badge variant={requiereTransporte ? 'default' : 'outline'}>{requiereTransporte ? '🚛 Física' : '📋 Virtual'}</Badge>
                                        <span>
                                            📦 {almacenOrigen.nombre}
                                            {almacenOrigen.ubicacion_fisica && <span className="text-xs"> (📍 {almacenOrigen.ubicacion_fisica})</span>} → {almacenDestino.nombre}
                                            {almacenDestino.ubicacion_fisica && <span className="text-xs"> (📍 {almacenDestino.ubicacion_fisica})</span>}
                                        </span>
                                    </>
                                )}
                                {data.detalles.length === 0 && (
                                    <span className="text-amber-700 dark:text-amber-300">· Agregue al menos un producto para continuar</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Productos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Productos a Transferir</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Buscador de Producto */}
                            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                <div className="md:col-span-4 relative" ref={searchRef}>
                                    <Label htmlFor="producto">Producto</Label>
                                    <div className="space-y-2">
                                        <div className="relative flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                                <Input
                                                    id="producto"
                                                    type="text"
                                                    placeholder="ID, SKU o código de barras + Enter para agregarlo · o escribe el nombre y elige"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault(); // no enviar el formulario
                                                            handleBuscarProducto();
                                                        }
                                                    }}
                                                    className="pl-10"
                                                    disabled={!data.almacen_origen_id}
                                                />
                                                {isSearching && (
                                                    <Loader className="absolute top-3 right-3 h-4 w-4 animate-spin text-blue-500 pointer-events-none" />
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => handleBuscarProducto()}
                                                disabled={!searchTerm.trim() || !data.almacen_origen_id || isSearching}
                                                variant="outline"
                                            >
                                                <Search className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {!data.almacen_origen_id && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                                Selecciona un almacén origen primero
                                            </p>
                                        )}
                                    </div>

                                    {/* Sugerencias: una fila por producto; los lotes solo si hay más de uno con stock */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                            <div className="sticky top-0 z-10 grid grid-cols-[4.5rem_1fr_6rem_7rem] gap-2 border-b bg-gray-50 px-3 py-1.5 text-[11px] font-semibold uppercase text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-400">
                                                <span>ID</span>
                                                <span>Producto</span>
                                                <span className="text-center">Unidad</span>
                                                <span className="text-right" title="Disponible en el almacén origen">Disponible</span>
                                            </div>
                                            {searchResults.map((producto) => {
                                                const lotes = lotesOrigen(producto);
                                                const disponible = disponibleOrigen(producto);
                                                const sinStock = lotes.length === 0;
                                                const unLote = lotes.length === 1;
                                                const termino = searchTerm.trim().toLowerCase();
                                                const codigos: string[] = producto.codigos_barras ?? [];
                                                // El código que coincide con lo buscado (para ver por qué apareció), si no el principal
                                                const codigo = (termino && codigos.find((c) => c.toLowerCase().includes(termino))) || codigos[0];
                                                return (
                                                    <div key={producto.id} className="border-b last:border-b-0 dark:border-slate-700">
                                                        <button
                                                            type="button"
                                                            disabled={sinStock}
                                                            onClick={() => agregarProductoATabla(producto, lotes.find((l) => !yaAgregado(producto.id, l.lote)) ?? lotes[0])}
                                                            title={sinStock ? 'Sin stock en el almacén origen' : unLote ? 'Agregar' : 'Agregar el lote que vence primero (o elija uno abajo)'}
                                                            className={`grid w-full grid-cols-[4.5rem_1fr_6rem_7rem] items-center gap-2 px-3 py-2 text-left text-sm transition ${
                                                                sinStock ? 'cursor-not-allowed opacity-50' : 'hover:bg-blue-50 dark:hover:bg-slate-700'
                                                            }`}
                                                        >
                                                            <span className="font-semibold text-blue-600 dark:text-blue-400">#{producto.id}</span>
                                                            <span className="min-w-0">
                                                                <span className="block truncate font-medium dark:text-white">
                                                                    {producto.nombre}
                                                                    {unLote && yaAgregado(producto.id, lotes[0].lote) && (
                                                                        <span className="ml-2 text-xs font-normal text-amber-600">(ya agregado)</span>
                                                                    )}
                                                                </span>
                                                                <span className="block truncate font-mono text-xs text-gray-500 dark:text-gray-400">
                                                                    {producto.sku}
                                                                    {codigo && <> · ▮▯ {codigo}</>}
                                                                    {codigos.length > 1 && <span className="font-sans"> +{codigos.length - 1}</span>}
                                                                </span>
                                                            </span>
                                                            <span className="text-center text-xs text-gray-600 dark:text-gray-300">
                                                                {producto.unidad?.nombre ?? producto.unidad_medida_nombre ?? '-'}
                                                            </span>
                                                            <span className={`text-right font-semibold ${sinStock ? 'text-red-500' : 'text-green-700 dark:text-green-400'}`}>
                                                                {sinStock ? 'Sin stock' : formatearCantidad(disponible)}
                                                                {lotes.length > 1 && <span className="block text-[11px] font-normal text-gray-500">{lotes.length} lotes</span>}
                                                            </span>
                                                        </button>

                                                        {/* Varios lotes con stock: elegir cuál transferir */}
                                                        {lotes.length > 1 && (
                                                            <div className="flex flex-wrap gap-2 px-3 pb-2 pl-[5.5rem]">
                                                                {lotes.map((lote: any) => {
                                                                    const agregado = yaAgregado(producto.id, lote.lote);
                                                                    return (
                                                                        <button
                                                                            key={lote.id}
                                                                            type="button"
                                                                            disabled={agregado}
                                                                            onClick={() => agregarProductoATabla(producto, lote)}
                                                                            className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800 transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                                                                        >
                                                                            {lote.lote ? `Lote ${lote.lote}` : 'Sin lote'}
                                                                            {lote.fecha_vencimiento && (
                                                                                <> · vence {String(lote.fecha_vencimiento).slice(0, 10).split('-').reverse().join('/')}</>
                                                                            )}
                                                                            {' · '}
                                                                            <b>{formatearCantidad(num(lote.cantidad_disponible))}</b>
                                                                            {agregado && ' (ya agregado)'}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tabla de Productos Agregados */}
                            <div className="space-y-2">
                                {data.detalles.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Busca y agrega productos para comenzar
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
                                                <tr>
                                                    <th className="text-left p-3 font-semibold">Producto</th>
                                                    <th className="text-left p-3 font-semibold">Lote</th>
                                                    <th className="text-center p-3 font-semibold">Stock Origen</th>
                                                    <th className="text-center p-3 font-semibold">Cantidad</th>
                                                    <th className="text-center p-3 font-semibold">Stock Destino</th>
                                                    <th className="text-center p-3 font-semibold">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.detalles.map((detalle, index) => {
                                                    // Usar datos guardados en detalle o buscar en el array productos
                                                    const productoNombre = (detalle as any).producto_nombre || productos.find(p => p.id === detalle.producto_id)?.nombre || 'Producto desconocido';
                                                    const productoCodigo = (detalle as any).producto_codigo || productos.find(p => p.id === detalle.producto_id)?.codigo || '';

                                                    const producto = productos.find(p => p.id === detalle.producto_id);

                                                    // Usar stock guardado en detalle o buscar en productos
                                                    const stockPorAlmacen = (detalle as any).stock_por_almacen || producto?.stock_por_almacen || {};

                                                    console.log(`📋 [Tabla] Detalle ${index}:`, {
                                                        productoId: detalle.producto_id,
                                                        nombre: productoNombre,
                                                        lote: detalle.lote,
                                                        cantidad: detalle.cantidad,
                                                        stockPorAlmacen: stockPorAlmacen,
                                                        almacenOrigen: data.almacen_origen_id,
                                                    });

                                                    const stockActualOrigen = data.almacen_origen_id && stockPorAlmacen
                                                        ? (stockPorAlmacen[data.almacen_origen_id] || 0)
                                                        : 0;
                                                    const stockPosteriorOrigen = Math.max(0, stockActualOrigen - detalle.cantidad);

                                                    const stockActualDestino = data.almacen_destino_id && stockPorAlmacen
                                                        ? (stockPorAlmacen[data.almacen_destino_id] || 0)
                                                        : 0;
                                                    const stockPosteriorDestino = stockActualDestino + detalle.cantidad;

                                                    return (
                                                        <tr key={index} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                                                            <td className="p-3">
                                                                <div>
                                                                    <p className="font-medium">{productoNombre}</p>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                        <a
                                                                            href={`/productos/${detalle.producto_id}/edit`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                                                            title="Ver producto (nueva pestaña)"
                                                                        >
                                                                            #{detalle.producto_id}
                                                                        </a>
                                                                        {((detalle as any).producto_sku || productoCodigo) && (
                                                                            <span className="font-mono"> · {(detalle as any).producto_sku || productoCodigo}</span>
                                                                        )}
                                                                    </p>
                                                                    {((detalle as any).codigos_barras ?? []).length > 0 && (
                                                                        <p className="font-mono text-xs text-gray-500 dark:text-gray-400" title={(detalle as any).codigos_barras.join('\n')}>
                                                                            ▮▯ {(detalle as any).codigos_barras[0]}
                                                                            {(detalle as any).codigos_barras.length > 1 && (
                                                                                <span className="font-sans"> +{(detalle as any).codigos_barras.length - 1}</span>
                                                                            )}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="text-xs">
                                                                    {detalle.lote ? (
                                                                        <>
                                                                            <p className="font-medium">{detalle.lote}</p>
                                                                            {detalle.fecha_vencimiento && (
                                                                                <p className="text-gray-600 dark:text-gray-400">
                                                                                    📅 {new Date(detalle.fecha_vencimiento).toLocaleDateString('es-ES')}
                                                                                </p>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-gray-500 italic">Sin lote</p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <div>
                                                                    <p className="text-green-600 dark:text-green-400 font-semibold">{stockActualOrigen.toFixed(2)}</p>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">→ {stockPosteriorOrigen.toFixed(2)}</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    value={detalle.cantidad || ''}
                                                                    onChange={(e) => actualizarCantidadDetalle(index, parseInt(e.target.value) || 0)}
                                                                    className="text-center w-20"
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <div>
                                                                    <p className="text-blue-600 dark:text-blue-400 font-semibold">{stockActualDestino.toFixed(2)}</p>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">→ {stockPosteriorDestino.toFixed(2)}</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => eliminarProducto(index)}
                                                                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {errors.detalles && (
                                <p className="text-sm text-red-600">{errors.detalles}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Botones de Acción */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || data.detalles.length === 0 || !data.almacen_origen_id || !data.almacen_destino_id}
                        >
                            {processing ? 'Creando...' : 'Crear Transferencia'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
