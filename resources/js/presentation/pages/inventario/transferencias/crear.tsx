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


    // ✅ NUEVA: Búsqueda dinámica de productos
    const buscarProductos = useCallback(
        async (term?: string) => {
            const busqueda = term || searchTerm;
            if (!busqueda.trim() || !data.almacen_origen_id) {
                setSearchResults([]);
                return;
            }

            try {
                setIsSearching(true);
                const url = `/api/productos/buscar?q=${encodeURIComponent(busqueda)}&almacen_id=${data.almacen_origen_id}&limite=10`;

                console.log('🔍 [Transferencias] Buscando productos:', {
                    termino: busqueda,
                    almacen_id: data.almacen_origen_id,
                    url: url,
                });

                const response = await fetch(url, { headers: { Accept: 'application/json' } });

                const resultado = await response.json();

                console.log('📥 [Transferencias] Respuesta del backend:', {
                    success: resultado.success,
                    status: response.status,
                    respuesta_completa: resultado,
                    cantidad_productos: resultado.data?.length || 0,
                    productos: resultado.data,
                });

                if (resultado.success) {
                    setSearchResults(resultado.data || []);
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                console.error('❌ [Transferencias] Error en búsqueda:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        },
        [data.almacen_origen_id, searchTerm]
    );

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
        const stockPorAlmacen: any = {};
        if (producto.stock && Array.isArray(producto.stock)) {
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
            stock_por_almacen?: any;
        } = {
            producto_id: producto.id,
            cantidad: 0, // Se editará en la tabla
            lote: lote?.lote || undefined,
            fecha_vencimiento: lote?.fecha_vencimiento || undefined,
            // Guardar también los datos del producto para renderizar en la tabla
            producto_nombre: producto.nombre,
            producto_codigo: producto.codigo,
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

    // ✅ Manejar búsqueda y mostrar opciones
    const handleBuscarProducto = async () => {
        if (!searchTerm.trim() || !data.almacen_origen_id) {
            return;
        }

        setIsSearching(true);
        try {
            const url = `/api/productos/buscar?q=${encodeURIComponent(searchTerm)}&almacen_id=${data.almacen_origen_id}&limite=10`;

            console.log('🔍 [Transferencias] URL de búsqueda:', url);

            const response = await fetch(url, { headers: { Accept: 'application/json' } });
            const resultado = await response.json();

            console.log('📥 [Transferencias] RESPUESTA COMPLETA DEL BACKEND:', resultado);
            console.log('📊 [Transferencias] Primer producto:', resultado.data?.[0]);

            if (resultado.data?.[0]) {
                console.log('📈 [Transferencias] Stock del producto:', resultado.data[0].stock);
                console.log('💾 [Transferencias] Stock por almacén:', resultado.data[0].stock_por_almacen);
                console.log('📦 [Transferencias] Cantidad disponible:', resultado.data[0].cantidad_disponible);
                console.log('💵 [Transferencias] Precios:', resultado.data[0].precios);
            }

            if (resultado.success && resultado.data && resultado.data.length > 0) {
                const producto = resultado.data[0]; // Tomar el primer producto encontrado

                // Si el producto tiene solo 1 lote, agregarlo automáticamente a la tabla
                if (producto.stock && producto.stock.length === 1) {
                    agregarProductoATabla(producto, producto.stock[0]);
                } else if (producto.stock && producto.stock.length > 1) {
                    // Si hay múltiples lotes, mostrar sugerencias para que elija
                    setSearchResults([producto]);
                } else {
                    // Sin stock disponible
                    NotificationService.warning('Este producto no tiene stock disponible');
                }
            } else {
                NotificationService.warning('Producto no encontrado');
            }
        } catch (error) {
            console.error('❌ [Transferencias] Error en búsqueda:', error);
            NotificationService.error('Error al buscar producto');
        } finally {
            setIsSearching(false);
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

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Nueva Transferencia
                    </h2>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        Crear una nueva transferencia de productos entre almacenes.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Información de la Transferencia */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Información de Transferencia
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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

                                <div>
                                    <Label htmlFor="observaciones">Observaciones</Label>
                                    <Textarea
                                        id="observaciones"
                                        value={data.observaciones}
                                        onChange={(e) => setData('observaciones', e.target.value)}
                                        placeholder="Observaciones sobre la transferencia..."
                                        rows={3}
                                        maxLength={500}
                                    />
                                    {errors.observaciones && (
                                        <p className="text-sm text-red-600 mt-1">{errors.observaciones}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Resumen */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen de Transferencia</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Total Productos:</span>
                                        <Badge variant="secondary">{totalProductos}</Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Cantidad Total:</span>
                                        <Badge variant="secondary">{totalCantidad}</Badge>
                                    </div>
                                    {data.almacen_origen_id && data.almacen_destino_id && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                                            <Badge variant={requiereTransporte ? "default" : "outline"}>
                                                {requiereTransporte ? "🚛 Física" : "📋 Virtual"}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {almacenOrigen && almacenDestino && (
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            <strong>Transferencia:</strong><br />
                                            <span className="block">📦 De: {almacenOrigen?.nombre}</span>
                                            {almacenOrigen?.ubicacion_fisica && (
                                                <span className="block text-xs ml-4">📍 {almacenOrigen.ubicacion_fisica}</span>
                                            )}
                                            <span className="block mt-1">📦 A: {almacenDestino?.nombre}</span>
                                            {almacenDestino?.ubicacion_fisica && (
                                                <span className="block text-xs ml-4">📍 {almacenDestino.ubicacion_fisica}</span>
                                            )}

                                        </p>
                                    </div>
                                )}

                                {data.detalles.length === 0 && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            Agregue al menos un producto para continuar.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

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
                                                    placeholder="Código o nombre del producto..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            buscarProductos(searchTerm);
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

                                    {/* Dropdown de sugerencias con lotes */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                            {searchResults.map((producto, idx) => (
                                                <div key={idx} className="border-b dark:border-slate-700 last:border-b-0">
                                                    {/* Header del producto */}
                                                    <div className="p-3 bg-gray-100 dark:bg-slate-700 sticky top-0">
                                                        <p className="font-medium text-sm dark:text-white">
                                                            [{producto.sku || producto.codigo}] {producto.nombre}
                                                        </p>
                                                    </div>

                                                    {/* Lotes */}
                                                    {producto.stock && producto.stock.length > 0 ? (
                                                        <div className="divide-y dark:divide-slate-700">
                                                            {producto.stock.map((lote, loteIdx) => (
                                                                <div
                                                                    key={loteIdx}
                                                                    onClick={() => agregarProductoATabla(producto, lote)}
                                                                    className="p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-600 transition"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-medium dark:text-gray-300">
                                                                                {lote.lote ? `Lote: ${lote.lote}` : '📦 Sin lote'}
                                                                            </p>
                                                                            {lote.fecha_vencimiento && (
                                                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                                    📅 Vence: {new Date(lote.fecha_vencimiento).toLocaleDateString('es-ES')}
                                                                                </p>
                                                                            )}
                                                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                                📦 Disponible: <span className="font-semibold text-blue-600 dark:text-blue-400">{lote.cantidad_disponible}</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
                                                            Sin stock disponible
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
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
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">[{productoCodigo}]</p>
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
