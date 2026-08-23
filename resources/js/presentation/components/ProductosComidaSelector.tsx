/**
 * ProductosComidaSelector Component
 *
 * Responsabilidades:
 * ✅ Mostrar productos de comida/helados en grid
 * ✅ Permitir seleccionar adicionales
 * ✅ Calcular precio dinámico (base + extras)
 * ✅ Agregar al carrito con detalles
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Loader2, Plus, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Adicional {
    id: number;
    nombre: string;
    precio_adicional: number;
    activo: boolean;
}

interface ProductoComida {
    id: number;
    nombre: string;
    sku: string;
    descripcion: string;
    precio_venta: number;
    es_producto_comida: boolean;
    imagen_url?: string | null;
    permite_venta_sin_stock?: boolean;
    disponibilidad?: number;
    // ✅ NUEVO (2026-08-23): Campos de adicionales
    puede_tener_producto_adicional?: boolean;
    es_producto_adicional?: boolean;
    adicionales?: Adicional[];
}

interface ProductoComidaConAdicionales {
    producto: ProductoComida;
    adicionalesSeleccionados: number[];
    cantidad: number;
    // ✅ NUEVO (2026-08-23): Detalles de los adicionales seleccionados
    adicionales_detalles?: ProductoComida[];
}

interface UnidadMedida {
    id: number;
    nombre: string;
    abreviatura: string;
    tipo: string;
}

interface AdicionalConCantidad {
    id: number;
    cantidad: number;
    unidad_medida_id: number;
}

interface ProductosComidaSelectorProps {
    onAgregar: (detalle: ProductoComidaConAdicionales) => void;
    onActualizar?: (productoId: number, nuevaCantidad: number) => void;
    onActualizarPrecio?: (productoId: number, nuevoPrecioBase: number) => void;
    onEliminar?: (productoId: number) => void;
    productosEnCarrito?: Array<{
        producto_id: number;
        cantidad: number;
    }>;
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export function ProductosComidaSelector({ onAgregar, onActualizar, onActualizarPrecio, onEliminar, productosEnCarrito = [] }: ProductosComidaSelectorProps) {
    const [productos, setProductos] = useState<ProductoComida[]>([]);
    const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]); // ✅ NUEVO (2026-08-23): Unidades de medida
    const [cargando, setCargando] = useState(true);
    const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoComida | null>(null);
    const [adicionalesSeleccionados, setAdicionalesSeleccionados] = useState<number[]>([]);
    const [adicionalesConCantidad, setAdicionalesConCantidad] = useState<Map<number, AdicionalConCantidad>>(new Map()); // ✅ NUEVO (2026-08-23): Cantidad y unidad por adicional
    const [cantidad, setCantidad] = useState(1);
    const [precioBaseEditable, setPrecioBaseEditable] = useState(0);
    const [busqueda, setBusqueda] = useState<string>('');
    const [busquedaAdicionales, setBusquedaAdicionales] = useState<string>(''); // ✅ NUEVO (2026-08-23): Búsqueda en adicionales

    // Obtener cantidad de un producto en el carrito
    const getCantidadEnCarrito = (productoId: number): number => {
        return productosEnCarrito.find(p => p.producto_id === productoId)?.cantidad || 0;
    };

    // Filtrar productos según el término de búsqueda (nombre, SKU, descripción)
    const productosFiltrados = useMemo(() => {
        if (!busqueda.trim()) return productos;

        const termino = busqueda.toLowerCase();
        return productos.filter(producto =>
            producto.nombre.toLowerCase().includes(termino) ||
            producto.sku.toLowerCase().includes(termino) || // ✅ NUEVO: Buscar por SKU
            (producto.descripcion && producto.descripcion.toLowerCase().includes(termino))
        );
    }, [productos, busqueda]);

    // Actualizar carrito cuando cambia precio base o adicionales si el producto ya está en carrito
    useEffect(() => {
        if (productoSeleccionado && getCantidadEnCarrito(productoSeleccionado.id) > 0 && onActualizarPrecio) {
            // Actualizar el precio base en el carrito
            onActualizarPrecio(productoSeleccionado.id, precioBaseEditable);
        }
    }, [precioBaseEditable, onActualizarPrecio, productoSeleccionado]);

    // Cargar productos de comida y unidades de medida
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // ✅ NUEVO (2026-08-23): Cargar unidades de medida en paralelo
                const [respProductos, respUnidades] = await Promise.all([
                    fetch('/api/productos-comida/'),
                    fetch('/api/productos-comida/unidades-medida')
                ]);

                const dataProductos = await respProductos.json();
                const dataUnidades = await respUnidades.json();

                console.log('🍦 DATOS DEL BACKEND - /api/productos-comida/', {
                    success: dataProductos.success,
                    cantidad: dataProductos.data?.length || 0,
                    datos_completos: dataProductos.data,
                });

                console.log('📏 UNIDADES DE MEDIDA CARGADAS:', {
                    success: dataUnidades.success,
                    unidades: dataUnidades.data,
                });

                if (dataProductos.success && dataProductos.data) {
                    setProductos(dataProductos.data);
                    console.log('✅ Productos cargados:', dataProductos.data);
                } else {
                    toast.error('Error al cargar productos de comida');
                    console.error('❌ Error en respuesta:', dataProductos);
                }

                if (dataUnidades.success && dataUnidades.data) {
                    setUnidadesMedida(dataUnidades.data);
                    console.log('✅ Unidades cargadas:', dataUnidades.data);
                }
            } catch (error) {
                console.error('Error cargando datos:', error);
                toast.error('Error al cargar datos');
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, []);

    // Seleccionar producto
    const handleSeleccionarProducto = (producto: ProductoComida) => {
        setProductoSeleccionado(producto);
        setAdicionalesSeleccionados([]);
        setAdicionalesConCantidad(new Map()); // ✅ NUEVO (2026-08-23): Limpiar cantidades de adicionales
        setBusquedaAdicionales(''); // ✅ NUEVO (2026-08-23): Limpiar búsqueda de adicionales

        // Si el producto ya está en el carrito, mostrar su cantidad actual
        const cantidadEnCarrito = getCantidadEnCarrito(producto.id);
        setCantidad(cantidadEnCarrito > 0 ? cantidadEnCarrito : 1);
        setPrecioBaseEditable(producto.precio_venta);
    };

    // ✅ ACTUALIZADO (2026-08-23): Toggle adicional con cantidad y unidad
    const toggleAdicional = (adicionalId: number) => {
        if (adicionalesSeleccionados.includes(adicionalId)) {
            // Deseleccionar
            setAdicionalesSeleccionados(prev => prev.filter(id => id !== adicionalId));
            setAdicionalesConCantidad(prev => {
                const newMap = new Map(prev);
                newMap.delete(adicionalId);
                return newMap;
            });
        } else {
            // Seleccionar con cantidad y unidad por defecto
            setAdicionalesSeleccionados(prev => [...prev, adicionalId]);
            setAdicionalesConCantidad(prev => new Map(prev).set(adicionalId, {
                id: adicionalId,
                cantidad: 50, // 50 gramos por defecto
                unidad_medida_id: 1, // Gramos por defecto
            }));
        }
    };

    // Calcular precio total
    const calcularPrecioTotal = (): number => {
        if (!productoSeleccionado) return 0;

        const precioBase = precioBaseEditable;
        // ✅ ACTUALIZADO (2026-08-23): Buscar precio en productos disponibles, no en array de adicionales
        const precioAdicionales = adicionalesSeleccionados.reduce((sum, id) => {
            const adicional = productos.find(p => p.id === id);
            return sum + (adicional?.precio_venta || 0);
        }, 0);

        return (precioBase + precioAdicionales) * cantidad;
    };

    // ✅ ACTUALIZADO (2026-08-23): Agregar al carrito con cantidades y unidades de adicionales
    const handleAgregar = () => {
        if (!productoSeleccionado) {
            toast.error('Selecciona un producto');
            return;
        }

        if (cantidad <= 0) {
            toast.error('La cantidad debe ser mayor a 0');
            return;
        }

        // ✅ ACTUALIZADO (2026-08-23): Pasar detalles de adicionales con cantidad y unidad
        const adicionalesDetalles = adicionalesSeleccionados
            .map(id => {
                const producto = productos.find(p => p.id === id);
                const cantidadInfo = adicionalesConCantidad.get(id);
                if (producto && cantidadInfo) {
                    return {
                        ...producto,
                        // Guardar cantidad y unidad en el producto
                        _cantidad_seleccionada: cantidadInfo.cantidad,
                        _unidad_medida_id: cantidadInfo.unidad_medida_id,
                    };
                }
                return producto;
            })
            .filter(Boolean) as ProductoComida[];

        onAgregar({
            producto: productoSeleccionado,
            adicionalesSeleccionados,
            cantidad,
            // ✅ NUEVO: Pasar también los detalles de los adicionales
            adicionales_detalles: adicionalesDetalles,
        });

        // Limpiar selección
        setProductoSeleccionado(null);
        setAdicionalesSeleccionados([]);
        setAdicionalesConCantidad(new Map());
        setCantidad(1);
        setPrecioBaseEditable(0);
        toast.success('Producto agregado al carrito');
    };

    if (cargando) {
        return (
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">🍦 Venta de Comidas/Helados</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando productos...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent>
                {/* <CardTitle className="text-gray-900 dark:text-white">🍦 Venta de Comidas/Helados</CardTitle> */}
                <div>
                    Selecciona un producto y agrega tus adicionales favoritos
                </div>
                <div className="space-y-6 mt-2">
                    {/* Grid de productos */}
                    {!productoSeleccionado ? (
                        <>
                            {/* Buscador de productos */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                />
                                {busqueda && (
                                    <button
                                        onClick={() => setBusqueda('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            {/* Grid de productos */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {productos.length === 0 ? (
                                    <div className="col-span-full text-center py-8">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            No hay productos de comida disponibles
                                        </p>
                                    </div>
                                ) : productosFiltrados.length === 0 ? (
                                    <div className="col-span-full text-center py-8">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            No se encontraron productos que coincidan con "{busqueda}"
                                        </p>
                                    </div>
                                ) : (
                                    productosFiltrados.map(producto => {
                                    const cantidadEnCarrito = getCantidadEnCarrito(producto.id);
                                    return (
                                        <div
                                            key={producto.id}
                                            onClick={() => handleSeleccionarProducto(producto)}
                                            className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg dark:hover:shadow-blue-900/30 transition-all relative cursor-pointer"
                                        >
                                            {/* Badge con cantidad en carrito */}
                                            {cantidadEnCarrito > 0 && (
                                                <div className="absolute -top-2 -right-2 z-20 flex gap-1">
                                                    <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg border-2 border-white dark:border-gray-800">
                                                        {cantidadEnCarrito}
                                                    </div>
                                                    {onEliminar && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEliminar(producto.id);
                                                                toast.success('Producto eliminado del carrito');
                                                            }}
                                                            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800 transition"
                                                            title="Eliminar del carrito"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Imagen del producto */}
                                            {producto.imagen_url ? (
                                                <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                                    <img
                                                        src={producto.imagen_url}
                                                        alt={producto.nombre}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                                    <span className="text-4xl">🛖</span>
                                                </div>
                                            )}

                                            {/* Contenido */}
                                            <div className="p-4 text-left">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                        {producto.nombre}
                                                    </h3>
                                                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-mono">
                                                        {producto.sku}
                                                    </span>
                                                </div>
                                                {producto.descripcion && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                        {producto.descripcion}
                                                    </p>
                                                )}
                                                <div className="mt-3 flex justify-between items-center gap-2">
                                                    <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                                                        {formatCurrency(producto.precio_venta)}
                                                    </span>
                                                    {producto.adicionales && producto.adicionales.length > 0 && (
                                                        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded whitespace-nowrap">
                                                            +{producto.adicionales.length} extras
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Tipo de Producto */}
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {producto.es_producto_comida && (
                                                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-medium">
                                                            🍦 Comida
                                                        </span>
                                                    )}
                                                    {producto.puede_tener_producto_adicional && (
                                                        <span className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded font-medium">
                                                            🎁 Con Adicionales
                                                        </span>
                                                    )}
                                                    {producto.es_producto_adicional && (
                                                        <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-1 rounded font-medium">
                                                            ➕ Adicional
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Stock availability */}
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {producto.permite_venta_sin_stock ? (
                                                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded font-medium">
                                                            ✅ Venta sin stock
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-medium">
                                                                📦 Stock disponible
                                                            </span>
                                                            {producto.disponibilidad !== undefined && (
                                                                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                                                    {producto.disponibilidad} unid.
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                    })
                                )}
                            </div>
                        </>
                    ) : (
                        /* Vista de detalle del producto seleccionado */
                        <div className="space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                            {/* Imagen del producto en grande */}
                            {productoSeleccionado.imagen_url ? (
                                <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    <img
                                        src={productoSeleccionado.imagen_url}
                                        alt={productoSeleccionado.nombre}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                    <span className="text-8xl">🍦</span>
                                </div>
                            )}

                            {/* Encabezado con producto seleccionado */}
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {productoSeleccionado.nombre}
                                            </h3>
                                            <span className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded font-mono">
                                                SKU: {productoSeleccionado.sku}
                                            </span>
                                        </div>
                                        {productoSeleccionado.descripcion && (
                                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                                {productoSeleccionado.descripcion}
                                            </p>
                                        )}

                                        {/* Tipo de Producto Info */}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {productoSeleccionado.es_producto_comida && (
                                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-full font-medium">
                                                    🍦 Producto de Comida
                                                </span>
                                            )}
                                            {productoSeleccionado.puede_tener_producto_adicional && (
                                                <span className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-3 py-1.5 rounded-full font-medium">
                                                    🎁 Acepta Adicionales
                                                </span>
                                            )}
                                            {productoSeleccionado.es_producto_adicional && (
                                                <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-3 py-1.5 rounded-full font-medium">
                                                    ➕ Este es un Adicional
                                                </span>
                                            )}
                                        </div>

                                        {/* Stock availability info */}
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {productoSeleccionado.permite_venta_sin_stock ? (
                                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full font-medium">
                                                    ✅ Se puede vender sin stock
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full font-medium">
                                                        📦 Se requiere stock disponible
                                                    </span>
                                                    {productoSeleccionado.disponibilidad !== undefined && (
                                                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                                                            productoSeleccionado.disponibilidad > 0
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                        }`}>
                                                            {productoSeleccionado.disponibilidad > 0
                                                                ? `✓ ${productoSeleccionado.disponibilidad} unid. disponibles`
                                                                : '⚠️ Sin stock'}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setProductoSeleccionado(null)}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                                    >
                                        <X className="text-gray-600 dark:text-gray-400" size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                                    {/* Cantidad */}
                                    <div className="space-y-3 h-full">
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                                            Cantidad:
                                        </label>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <button
                                                onClick={() => {
                                                    const newVal = Math.max(1, cantidad - 1);
                                                    setCantidad(newVal);
                                                    // Si el producto ya está en carrito, actualizar directamente
                                                    if (getCantidadEnCarrito(productoSeleccionado.id) > 0 && onActualizar) {
                                                        onActualizar(productoSeleccionado.id, newVal);
                                                    }
                                                }}
                                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={cantidad}
                                                onChange={(e) => {
                                                    const newVal = Math.max(1, parseInt(e.target.value) || 1);
                                                    setCantidad(newVal);
                                                    // Si el producto ya está en carrito, actualizar directamente
                                                    if (getCantidadEnCarrito(productoSeleccionado.id) > 0 && onActualizar) {
                                                        onActualizar(productoSeleccionado.id, newVal);
                                                    }
                                                }}
                                                className="w-20 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newVal = cantidad + 1;
                                                    setCantidad(newVal);
                                                    // Si el producto ya está en carrito, actualizar directamente
                                                    if (getCantidadEnCarrito(productoSeleccionado.id) > 0 && onActualizar) {
                                                        onActualizar(productoSeleccionado.id, newVal);
                                                    }
                                                }}
                                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    {/* Precio base */}
                                    <div className="space-y-3 h-full">
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                                            Precio base:
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={precioBaseEditable}
                                            onChange={(e) => {
                                                const newPrice = Number(e.target.value) || 0;
                                                setPrecioBaseEditable(newPrice);
                                                // Si el producto ya está en carrito, actualizar el precio directamente
                                                if (getCantidadEnCarrito(productoSeleccionado!.id) > 0 && onActualizarPrecio) {
                                                    onActualizarPrecio(productoSeleccionado!.id, newPrice);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>                                   

                                    {/* Precio total */}
                                    <div className="h-full rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 p-4 flex flex-col justify-center">
                                        <span className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                            Precio total:
                                        </span>
                                        <div className="flex items-end justify-between gap-3 flex-wrap">
                                            {/* <span className="text-xs text-gray-600 dark:text-gray-400">
                                                Se recalcula automáticamente
                                            </span> */}
                                            <span className="text-green-600 dark:text-green-400 font-bold text-2xl leading-none">
                                                {formatCurrency(calcularPrecioTotal())}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Adicionales - Mostrar todos los productos disponibles si el producto acepta adicionales */}
                                {productoSeleccionado.puede_tener_producto_adicional && (
                                    <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            🎁 Agregar Productos Adicionales:
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Selecciona los productos que deseas agregar a este pedido
                                        </p>

                                        {/* ✅ NUEVO (2026-08-23): Buscador de adicionales */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="🔍 Buscar adicionales..."
                                                value={busquedaAdicionales}
                                                onChange={(e) => setBusquedaAdicionales(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {productos
                                                .filter(p =>
                                                    p.es_producto_adicional &&
                                                    p.id !== productoSeleccionado.id &&
                                                    (p.nombre.toLowerCase().includes(busquedaAdicionales.toLowerCase()) ||
                                                     p.sku.toLowerCase().includes(busquedaAdicionales.toLowerCase()))
                                                )
                                                .map(adicional => {
                                                    const isSelected = adicionalesSeleccionados.includes(adicional.id);
                                                    const cantidadInfo = adicionalesConCantidad.get(adicional.id);
                                                    return (
                                                        <div
                                                            key={adicional.id}
                                                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                                                        >
                                                            {/* Header con checkbox */}
                                                            <label className="flex items-center gap-3 mb-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleAdicional(adicional.id)}
                                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="text-gray-900 dark:text-white font-medium block">
                                                                        {adicional.nombre}
                                                                    </span>
                                                                    {adicional.descripcion && (
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                            {adicional.descripcion}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <span className="text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
                                                                    +{formatCurrency(adicional.precio_venta)}
                                                                </span>
                                                            </label>

                                                            {/* ✅ NUEVO (2026-08-23): Campos de cantidad y unidad si está seleccionado */}
                                                            {isSelected && cantidadInfo && (
                                                                <div className="flex gap-2 mt-2 pl-7">
                                                                    {/* Cantidad */}
                                                                    <div className="flex-1">
                                                                        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                                                                            Cantidad
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={cantidadInfo.cantidad}
                                                                            onChange={(e) => {
                                                                                const newCantidad = Math.max(1, parseInt(e.target.value) || 1);
                                                                                setAdicionalesConCantidad(prev => {
                                                                                    const newMap = new Map(prev);
                                                                                    newMap.set(adicional.id, {
                                                                                        ...cantidadInfo,
                                                                                        cantidad: newCantidad,
                                                                                    });
                                                                                    return newMap;
                                                                                });
                                                                            }}
                                                                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                                                        />
                                                                    </div>

                                                                    {/* Unidad de medida */}
                                                                    <div className="flex-1">
                                                                        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                                                                            Unidad
                                                                        </label>
                                                                        <select
                                                                            value={cantidadInfo.unidad_medida_id}
                                                                            onChange={(e) => {
                                                                                const newUnidadId = parseInt(e.target.value);
                                                                                setAdicionalesConCantidad(prev => {
                                                                                    const newMap = new Map(prev);
                                                                                    newMap.set(adicional.id, {
                                                                                        ...cantidadInfo,
                                                                                        unidad_medida_id: newUnidadId,
                                                                                    });
                                                                                    return newMap;
                                                                                });
                                                                            }}
                                                                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                                                        >
                                                                            {unidadesMedida.map(unidad => (
                                                                                <option key={unidad.id} value={unidad.id}>
                                                                                    {unidad.abreviatura}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            {productos.filter(p => p.es_producto_adicional && p.id !== productoSeleccionado.id).length === 0 && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                    No hay productos disponibles para agregar como adicionales
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Botones de acción */}
                                <div className="flex gap-3">
                                    {getCantidadEnCarrito(productoSeleccionado.id) === 0 ? (
                                        <button
                                            onClick={handleAgregar}
                                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            <Plus size={20} />
                                            Agregar al Carrito
                                        </button>
                                    ) : (
                                        onEliminar && (
                                            <button
                                                onClick={() => {
                                                    onEliminar(productoSeleccionado.id);
                                                    setProductoSeleccionado(null);
                                                    toast.success('Producto eliminado del carrito');
                                                }}
                                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                                            >
                                                <X size={20} />
                                                Eliminar del Carrito
                                            </button>
                                        )
                                    )}
                                    <button
                                        onClick={() => setProductoSeleccionado(null)}
                                        className="px-4 py-3 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
