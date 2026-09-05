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

    const [productoSeleccionado, setProductoSeleccionado] = useState<string>('');
    const [cantidadProducto, setCantidadProducto] = useState<string>('');
    const [loteProducto, setLoteProducto] = useState<string>('');
    const [fechaVencimiento, setFechaVencimiento] = useState<string>('');

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

    // ✅ Agregar producto desde búsqueda
    const agregarProductoDesdeSearch = (producto: any, lote?: any) => {
        setProductoSeleccionado(producto.id.toString());
        setSearchTerm(producto.nombre);
        setCantidadProducto('');
        // Si se selecciona un lote específico, llenar los campos de lote y fecha_vencimiento
        if (lote) {
            setLoteProducto(lote.lote || '');
            setFechaVencimiento(lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento).toISOString().split('T')[0] : '');
        } else {
            setLoteProducto('');
            setFechaVencimiento('');
        }
        setSearchResults([]);
    };

    // ✅ Manejar búsqueda y agregar automáticamente si hay 1 solo lote
    const handleBuscarYCargar = async () => {
        if (!searchTerm.trim() || !data.almacen_origen_id) {
            return;
        }

        setIsSearching(true);
        try {
            const url = `/api/productos/buscar?q=${encodeURIComponent(searchTerm)}&almacen_id=${data.almacen_origen_id}&limite=10`;
            const response = await fetch(url, { headers: { Accept: 'application/json' } });
            const resultado = await response.json();

            if (resultado.success && resultado.data && resultado.data.length > 0) {
                const producto = resultado.data[0]; // Tomar el primer producto encontrado

                // Si el producto tiene solo 1 lote, agregarlo automáticamente
                if (producto.stock && producto.stock.length === 1) {
                    agregarProductoDesdeSearch(producto, producto.stock[0]);
                    // Limpiar búsqueda
                    setSearchTerm('');
                    // Focus en cantidad para que el usuario pueda escribir la cantidad
                    setTimeout(() => {
                        document.getElementById('cantidad')?.focus();
                    }, 100);
                } else if (producto.stock && producto.stock.length > 1) {
                    // Si hay múltiples lotes, mostrar sugerencias
                    setSearchResults([producto]);
                    agregarProductoDesdeSearch(producto); // Seleccionar el producto pero sin lote
                } else {
                    // Sin stock disponible
                    NotificationService.warning('Este producto no tiene stock disponible');
                }
            } else {
                NotificationService.warning('Producto no encontrado');
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            NotificationService.error('Error al buscar producto');
        } finally {
            setIsSearching(false);
        }
    };

    const agregarProducto = () => {
        // Validaciones previas básicas
        if (!productoSeleccionado || !cantidadProducto || parseInt(cantidadProducto) <= 0) {
            NotificationService.warning('Debe seleccionar un producto y una cantidad válida');
            return;
        }

        // Crear detalle provisional
        const nuevoDetalle: DetalleTransferencia = {
            producto_id: parseInt(productoSeleccionado),
            cantidad: parseInt(cantidadProducto),
            lote: loteProducto || undefined,
            fecha_vencimiento: fechaVencimiento || undefined,
        };

        // Validar con el service
        const erroresDetalle = transferenciasService.validarDetalleTransferencia(
            nuevoDetalle,
            productos,
            data.almacen_origen_id as string
        );

        if (erroresDetalle.length > 0) {
            erroresDetalle.forEach(error => NotificationService.error(error));
            return;
        }

        // Verificar si ya existe el producto en la lista
        const existe = data.detalles.find(d => d.producto_id === parseInt(productoSeleccionado));
        if (existe) {
            NotificationService.warning('Este producto ya está agregado a la transferencia');
            return;
        }

        // Agregar el detalle
        setData('detalles', [...data.detalles, nuevoDetalle]);

        // Mostrar notificación de éxito
        const nombreProducto = transferenciasService.obtenerNombreProducto(
            parseInt(productoSeleccionado),
            productos
        );
        NotificationService.success(`✅ ${nombreProducto} agregado a la transferencia`);

        // Limpiar formulario
        setProductoSeleccionado('');
        setCantidadProducto('');
        setLoteProducto('');
        setFechaVencimiento('');
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
                            {/* Agregar Producto */}
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                <div className="md:col-span-3 relative" ref={searchRef}>
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
                                                onClick={() => handleBuscarYCargar()}
                                                disabled={!searchTerm.trim() || !data.almacen_origen_id || isSearching}
                                                variant="outline"
                                                className="mt-6"
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
                                                                    onClick={() => agregarProductoDesdeSearch(producto, lote)}
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

                                <div>
                                    <Label htmlFor="cantidad">Cantidad</Label>
                                    <Input
                                        id="cantidad"
                                        type="number"
                                        min="1"
                                        value={cantidadProducto}
                                        onChange={(e) => setCantidadProducto(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="lote">Lote</Label>
                                    <Input
                                        id="lote"
                                        value={loteProducto}
                                        onChange={(e) => setLoteProducto(e.target.value)}
                                        placeholder="Lote"
                                        maxLength={50}
                                    />
                                </div>

                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        onClick={agregarProducto}
                                        disabled={!productoSeleccionado || !cantidadProducto || parseInt(cantidadProducto) <= 0}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Agregar
                                    </Button>
                                </div>
                            </div>

                            {/* Lista de Productos */}
                            <div className="space-y-2">
                                {data.detalles.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No hay productos agregados
                                    </div>
                                ) : (
                                    data.detalles.map((detalle, index) => {
                                        const producto = productos.find(p => p.id === detalle.producto_id);
                                        if (!producto) return null;

                                        // Calcular stocks
                                        const stockActualOrigen = data.almacen_origen_id
                                            ? (producto.stock_por_almacen?.[data.almacen_origen_id] || 0)
                                            : 0;
                                        const stockPosteriorOrigen = Math.max(0, stockActualOrigen - detalle.cantidad);

                                        const stockActualDestino = data.almacen_destino_id
                                            ? (producto.stock_por_almacen?.[data.almacen_destino_id] || 0)
                                            : 0;
                                        const stockPosteriorDestino = stockActualDestino + detalle.cantidad;

                                        return (
                                            <div key={index} className="p-4 border rounded-lg bg-white dark:bg-gray-900 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {producto.codigo} - {producto.nombre}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            📦 Cantidad a transferir: <span className="font-semibold text-blue-600 dark:text-blue-400">{detalle.cantidad}</span>
                                                            {detalle.lote && ` • Lote: ${detalle.lote}`}
                                                            {detalle.fecha_vencimiento && ` • Vence: ${detalle.fecha_vencimiento}`}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => eliminarProducto(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                {/* Mostrar stocks antes y después */}
                                                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t">
                                                    <div className="space-y-2">
                                                        <div className="font-semibold text-gray-700 dark:text-gray-300">
                                                            📤 {almacenOrigen?.nombre || 'Almacén Origen'}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span>Stock Actual:</span>
                                                            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                                                {stockActualOrigen.toFixed(2)}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span>Stock Posterior:</span>
                                                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                                {stockPosteriorOrigen.toFixed(2)}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="font-semibold text-gray-700 dark:text-gray-300">
                                                            📥 {almacenDestino?.nombre || 'Almacén Destino'}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span>Stock Actual:</span>
                                                            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                                                {stockActualDestino.toFixed(2)}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span>Stock Posterior:</span>
                                                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                                {stockPosteriorDestino.toFixed(2)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
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
