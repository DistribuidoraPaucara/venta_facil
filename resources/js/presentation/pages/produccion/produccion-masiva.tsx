import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, AlertCircle, Check, Loader } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

interface Ingrediente {
    id: number;
    nombre: string;
    cantidad_requerida: number;
    unidad: string;
    stock_disponible: number;
    capacidad_este_ingrediente: number;
    es_limitante: boolean;
}

interface DetalleProduccion {
    producto_id: number;
    producto_nombre: string;
    cantidad_producida: string;
    observaciones: string;
    capacidad_maxima: number;
    puede_producir: boolean;
    advertencia?: string;
    ingredientes: Ingrediente[];
    expandido: boolean;
}

export default function ProduccionMasiva() {
    console.log('🚀 Componente ProduccionMasiva montado');

    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
    const [detalles, setDetalles] = useState<DetalleProduccion[]>([]);
    const [cargandoCapacidades, setCargandoCapacidades] = useState(false);
    const queryClient = useQueryClient();

    console.log('📅 Fecha seleccionada:', fechaSeleccionada);
    console.log('📋 Detalles en estado:', detalles.length, detalles);

    // Fetch productos disponibles
    const { data: productosDisponibles, isLoading: cargandoProductos } = useQuery({
        queryKey: ['producciones-masiva-productos'],
        queryFn: async () => {
            const response = await axios.get('/api/producciones/masiva/productos-disponibles');
            console.log('✅ PRODUCTOS DISPONIBLES DEL BACKEND:', response.data);
            console.log('📦 Total productos:', response.data.data?.length || 0);
            return response.data.data;
        },
    });

    // Calcular capacidades de todos los productos
    const calcularCapacidades = async () => {
        if (!productosDisponibles || productosDisponibles.length === 0) {
            console.warn('⚠️ No hay productos disponibles para calcular capacidades');
            return;
        }

        setCargandoCapacidades(true);
        console.log('🔄 Iniciando cálculo de capacidades para', productosDisponibles.length, 'productos...');

        try {
            const detallesConCapacidad = await Promise.all(
                productosDisponibles.map(async (producto: any) => {
                    console.log(`📊 Calculando capacidad para: ${producto.nombre} (ID: ${producto.id})`);

                    const response = await axios.post('/api/producciones/masiva/calcular-capacidad', {
                        producto_id: producto.id,
                        cantidad_deseada: 1,
                    });

                    const capacidad = response.data.data;

                    console.log(`✅ Capacidad calculada para ${producto.nombre}:`, {
                        capacidad_maxima: capacidad.capacidad_maxima,
                        puede_producir: capacidad.puede_producir,
                        advertencia: capacidad.advertencia,
                        ingredientes: capacidad.ingredientes?.length || 0,
                    });

                    return {
                        producto_id: producto.id,
                        producto_nombre: producto.nombre,
                        cantidad_producida: capacidad.capacidad_maxima.toString(),
                        observaciones: '',
                        capacidad_maxima: capacidad.capacidad_maxima,
                        puede_producir: true,
                        advertencia: null,
                        ingredientes: capacidad.ingredientes,
                        expandido: false,
                    };
                })
            );

            console.log('✅ TODAS LAS CAPACIDADES CALCULADAS:', detallesConCapacidad);
            setDetalles(detallesConCapacidad);
        } catch (error) {
            console.error('❌ Error calculando capacidades:', error);
        } finally {
            setCargandoCapacidades(false);
        }
    };

    // Cargar capacidades cuando los productos estén listos
    useEffect(() => {
        console.log('🔔 useEffect activado - Verificando si cargar capacidades...');
        console.log('   productosDisponibles:', productosDisponibles?.length || 0);
        console.log('   detalles cargados:', detalles.length);

        if (productosDisponibles && productosDisponibles.length > 0 && detalles.length === 0) {
            console.log('✅ Condiciones met, iniciando calcularCapacidades()');
            calcularCapacidades();
        } else {
            console.log('⏭️ Saltando - ya hay detalles o no hay productos');
        }
    }, [productosDisponibles]);

    // Guardar producción masiva
    const guardarProduccionMasiva = useMutation({
        mutationFn: async () => {
            const payload = {
                fecha_produccion: fechaSeleccionada,
                detalles: detalles
                    .filter(d => detalles.indexOf(d) >= 0)
                    .map(d => ({
                        producto_id: d.producto_id,
                        cantidad_producida: parseFloat(d.cantidad_producida),
                        observaciones: d.observaciones,
                    })),
            };

            console.log('📤 PAYLOAD ENVIADO AL BACKEND:', JSON.stringify(payload, null, 2));
            console.log('📊 Detalles a guardar:', payload.detalles);

            const response = await axios.post('/api/producciones/masiva/guardar', payload);

            console.log('✅ RESPUESTA DEL BACKEND:', response.data);
            console.log('🎉 Producciones creadas:', response.data.producciones_ids);

            return response.data;
        },
        onSuccess: (data) => {
            console.log('✨ Éxito al guardar. Invalidando caché...');
            queryClient.invalidateQueries({ queryKey: ['producciones-masivas'] });
            setDetalles([]);

            toast.success(
                `Producción masiva registrada exitosamente\nLote ID: ${data.produccion_masiva_id}\n${data.detalles.length} producto${data.detalles.length !== 1 ? 's' : ''} registrado${data.detalles.length !== 1 ? 's' : ''}`,
                {
                    position: 'bottom-right',
                    autoClose: 4000,
                    onClose: () => {
                        // Preguntar si desea ver los registros después de que se cierre el toast
                        const ir = confirm('¿Deseas ver los registros de la producción?');
                        if (ir) {
                            window.location.href = '/produccion/registro-produccion';
                        }
                    }
                }
            );
        },
        onError: (error: any) => {
            console.error('❌ Error al guardar:', error.response?.data || error);
            toast.error(error.response?.data?.message || 'Error al registrar la producción masiva', {
                position: 'bottom-right',
                autoClose: 5000,
            });
        },
    });

    const handleEliminarDetalle = (productoId: number) => {
        const productoEliminado = detalles.find(d => d.producto_id === productoId);
        console.log(`🗑️ Eliminando producto: ${productoEliminado?.producto_nombre} (ID: ${productoId})`);
        const updated = detalles.filter(d => d.producto_id !== productoId);
        console.log(`📊 Productos restantes: ${updated.length}`);
        setDetalles(updated);
    };

    const handleActualizarCantidad = (productoId: number, newCantidad: string) => {
        const producto = detalles.find(d => d.producto_id === productoId);
        console.log(`📝 Actualizando cantidad de "${producto?.producto_nombre}": ${producto?.cantidad_producida} → ${newCantidad}`);
        const updated = detalles.map(d =>
            d.producto_id === productoId
                ? { ...d, cantidad_producida: newCantidad }
                : d
        );
        setDetalles(updated);
    };

    const handleActualizarObservaciones = (productoId: number, newObservaciones: string) => {
        const producto = detalles.find(d => d.producto_id === productoId);
        console.log(`💬 Actualizando observaciones de "${producto?.producto_nombre}": "${newObservaciones}"`);
        const updated = detalles.map(d =>
            d.producto_id === productoId
                ? { ...d, observaciones: newObservaciones }
                : d
        );
        setDetalles(updated);
    };

    const toggleExpandido = (productoId: number) => {
        const producto = detalles.find(d => d.producto_id === productoId);
        const estabaExpandido = producto?.expandido;
        console.log(`👁️ Expandiendo "${producto?.producto_nombre}": ${estabaExpandido ? 'cerrar' : 'abrir'}`);
        const updated = detalles.map(d =>
            d.producto_id === productoId
                ? { ...d, expandido: !d.expandido }
                : d
        );
        setDetalles(updated);
    };

    const totalProductos = detalles.length;
    const productosConAdvertencia = detalles.filter(d => d.advertencia).length;

    if (cargandoProductos || cargandoCapacidades) {
        return (
            <AppLayout>
                <Head title="Producción Masiva" />
                <div className="space-y-6 p-6 bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <Loader className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto animate-spin mb-4" />
                        <p className="text-gray-600 dark:text-gray-300 font-medium">Cargando productos y capacidades...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Producción Masiva" />
            <div className="space-y-6 p-6 bg-white dark:bg-gray-900 min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Producción Masiva</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Verifica los productos a producir y descarta los que no desees</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Selector de Fecha */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <input
                            type="date"
                            value={fechaSeleccionada}
                            onChange={(e) => setFechaSeleccionada(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Resumen */}
                    {detalles.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total de Productos</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{totalProductos}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Con Stock Suficiente</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{detalles.filter(d => d.puede_producir).length}</p>
                            </div>
                            {productosConAdvertencia > 0 && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Con Restricción
                                    </p>
                                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{productosConAdvertencia}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>


                {/* Resumen de Ingredientes Compartidos */}
                {detalles.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
                        <h3 className="font-bold text-lg text-blue-900 dark:text-blue-300 mb-4">📊 Resumen de Ingredientes Compartidos</h3>
                        <div className="space-y-4">
                            {(() => {
                                // Agrupar ingredientes por nombre para ver cuáles son compartidos
                                const ingredientesMap: Record<string, any> = {};

                                detalles.forEach(detalle => {
                                    if (detalle.ingredientes) {
                                        detalle.ingredientes.forEach(ing => {
                                            const cantidad = parseFloat(detalle.cantidad_producida) * ing.cantidad_requerida;
                                            if (!ingredientesMap[ing.nombre]) {
                                                ingredientesMap[ing.nombre] = {
                                                    nombre: ing.nombre,
                                                    unidad: ing.unidad,
                                                    stock: ing.stock_disponible,
                                                    usos: [],
                                                    totalUsado: 0
                                                };
                                            }
                                            ingredientesMap[ing.nombre].usos.push({
                                                producto: detalle.producto_nombre,
                                                cantidad: cantidad
                                            });
                                            ingredientesMap[ing.nombre].totalUsado += cantidad;
                                        });
                                    }
                                });

                                const ingredientesCompartidos = Object.values(ingredientesMap).filter((ing: any) => ing.usos.length > 1);
                                const ingredientesNoCompartidos = Object.values(ingredientesMap).filter((ing: any) => ing.usos.length === 1);

                                if (ingredientesCompartidos.length === 0) {
                                    return <p className="text-blue-700 dark:text-blue-300 text-sm">No hay ingredientes compartidos entre productos</p>;
                                }

                                return ingredientesCompartidos.map((ing: any) => {
                                    const porcentajeUsado = (ing.totalUsado / ing.stock) * 100;
                                    const disponible = ing.stock - ing.totalUsado;
                                    const color = disponible < 0 ? 'red' : porcentajeUsado > 90 ? 'yellow' : 'green';
                                    const colorClasses = {
                                        green: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
                                        yellow: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
                                        red: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                                    };

                                    return (
                                        <div key={ing.nombre} className={`border rounded-lg p-4 ${colorClasses[color]}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{ing.nombre}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Stock: {ing.stock.toFixed(2)} {ing.unidad}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold text-lg ${color === 'red' ? 'text-red-600 dark:text-red-400' : color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                                                        {ing.totalUsado.toFixed(2)} {ing.unidad}
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        {porcentajeUsado.toFixed(0)}% utilizado
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Barra de progreso */}
                                            <div className="mb-3">
                                                <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${
                                                            color === 'red' ? 'bg-red-500' : color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                                                        }`}
                                                        style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Desglose por producto */}
                                            <div className="space-y-1 text-sm">
                                                {ing.usos.map((uso: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between text-gray-700 dark:text-gray-300">
                                                        <span>• {uso.producto}:</span>
                                                        <span className="font-medium">{uso.cantidad.toFixed(2)} {ing.unidad}</span>
                                                    </div>
                                                ))}
                                                {disponible >= 0 ? (
                                                    <div className="flex justify-between text-green-700 dark:text-green-300 font-semibold mt-2">
                                                        <span>✓ Disponible:</span>
                                                        <span>{disponible.toFixed(2)} {ing.unidad}</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between text-red-700 dark:text-red-300 font-semibold mt-2">
                                                            <span>✗ Falta:</span>
                                                            <span>{Math.abs(disponible).toFixed(2)} {ing.unidad}</span>
                                                        </div>

                                                        {/* Sugerencia de optimización */}
                                                        <div className="mt-3 pt-3 border-t border-gray-400 dark:border-gray-600">
                                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">💡 SUGERENCIA DE AJUSTE (Números Enteros):</p>
                                                            {(() => {
                                                                const factorReduccion = ing.stock / ing.totalUsado;

                                                                // Calcular cantidades sugeridas con números enteros
                                                                const sugerenciasEnteras = ing.usos.map((uso: any) => {
                                                                    const cantidadActual = parseFloat(
                                                                        detalles.find(d => d.producto_nombre === uso.producto)?.cantidad_producida || 0
                                                                    );
                                                                    const cantidadSugerida = Math.floor(cantidadActual * factorReduccion);
                                                                    return {
                                                                        producto: uso.producto,
                                                                        actual: cantidadActual,
                                                                        sugerida: cantidadSugerida
                                                                    };
                                                                });

                                                                // Calcular consumo real con números enteros
                                                                const consumoReal = sugerenciasEnteras.reduce((total, item) => {
                                                                    const ingrediente = ing.usos.find((u: any) => u.producto === item.producto);
                                                                    return total + (item.sugerida * (ingrediente.cantidad / item.actual));
                                                                }, 0);

                                                                const sobrante = ing.stock - consumoReal;

                                                                return (
                                                                    <div className="space-y-2">
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                            Usa al <span className="font-bold text-green-600 dark:text-green-400">{(consumoReal / ing.stock * 100).toFixed(1)}%</span>, quedan <span className="font-bold text-orange-600 dark:text-orange-400">{sobrante.toFixed(0)} {ing.unidad}</span> sin usar
                                                                        </p>
                                                                        <div className="bg-white dark:bg-gray-800 rounded p-2 space-y-1">
                                                                            {sugerenciasEnteras.map((item, idx) => (
                                                                                <div key={idx} className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                                                                                    <span>{item.producto}:</span>
                                                                                    <span>
                                                                                        {item.actual.toFixed(2)} → <span className="font-bold text-green-600 dark:text-green-400">{item.sugerida}</span>
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                const nuevosDetalles = detalles.map(d => {
                                                                                    const sugerencia = sugerenciasEnteras.find(s => s.producto === d.producto_nombre);
                                                                                    return {
                                                                                        ...d,
                                                                                        cantidad_producida: sugerencia ? sugerencia.sugerida.toString() : d.cantidad_producida
                                                                                    };
                                                                                });
                                                                                setDetalles(nuevosDetalles);
                                                                            }}
                                                                            className="w-full text-xs bg-green-600 hover:bg-green-700 text-white font-semibold py-1 rounded transition"
                                                                        >
                                                                            ✓ Aplicar Ajuste
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                )}

                {/* Tabla de Productos */}
                {detalles.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-bold text-sm text-gray-900 dark:text-white">Producto</th>
                                        <th className="px-6 py-3 text-left font-bold text-sm text-gray-900 dark:text-white">Cantidad</th>
                                        <th className="px-6 py-3 text-left font-bold text-sm text-gray-900 dark:text-white">Capacidad Máx.</th>
                                        <th className="px-6 py-3 text-left font-bold text-sm text-gray-900 dark:text-white">Estado</th>
                                        <th className="px-6 py-3 text-left font-bold text-sm text-gray-900 dark:text-white">Observaciones</th>
                                        <th className="px-6 py-3 text-left font-bold text-sm text-gray-900 dark:text-white">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalles.map((detalle, index) => (
                                        <React.Fragment key={detalle.producto_id}>
                                            <tr className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'} border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition`}>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => toggleExpandido(detalle.producto_id)}
                                                        className="font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400"
                                                    >
                                                        {detalle.expandido ? '▼' : '▶'} {detalle.producto_nombre}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0.1"
                                                        value={detalle.cantidad_producida}
                                                        onChange={(e) => handleActualizarCantidad(detalle.producto_id, e.target.value)}
                                                        className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-green-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900 dark:text-white">{detalle.capacidad_maxima.toFixed(2)}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {detalle.puede_producir ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                                                            <Check className="w-4 h-4" />
                                                            OK
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400">
                                                            <AlertCircle className="w-4 h-4" />
                                                            Limitado
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        value={detalle.observaciones}
                                                        onChange={(e) => handleActualizarObservaciones(detalle.producto_id, e.target.value)}
                                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-green-500"
                                                        placeholder="Opcional..."
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleEliminarDetalle(detalle.producto_id)}
                                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Fila expandible de ingredientes */}
                                            {detalle.expandido && (
                                                <tr className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'} border-b border-gray-200 dark:border-gray-700`}>
                                                    <td colSpan={6} className="px-6 py-4">
                                                        <div className="space-y-3">
                                                            <p className="font-bold text-gray-700 dark:text-gray-300">📋 Desglose de ingredientes para {parseFloat(detalle.cantidad_producida).toFixed(2)} unidades:</p>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {detalle.ingredientes.map((ing) => {
                                                                    const cantidadNecesaria = ing.cantidad_requerida * parseFloat(detalle.cantidad_producida);
                                                                    const sobra = ing.stock_disponible - cantidadNecesaria;
                                                                    return (
                                                                        <div
                                                                            key={ing.id}
                                                                            className={`p-3 rounded border-l-4 ${
                                                                                ing.es_limitante
                                                                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-yellow-500'
                                                                                    : sobra >= 0
                                                                                    ? 'bg-green-50 dark:bg-green-900/20 border-l-green-500'
                                                                                    : 'bg-red-50 dark:bg-red-900/20 border-l-red-500'
                                                                            }`}
                                                                        >
                                                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                                                {ing.nombre}
                                                                                {ing.es_limitante && ' ⚠️ Limitante'}
                                                                                {sobra < 0 && ' ❌ Insuficiente'}
                                                                            </p>
                                                                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                                                                                <div className="border-b border-gray-300 dark:border-gray-600 pb-1">
                                                                                    <p><span className="text-gray-500">Por unidad:</span> <span className="font-bold">{ing.cantidad_requerida.toFixed(2)} {ing.unidad}</span></p>
                                                                                    <p><span className="text-gray-500">Total necesario:</span> <span className="font-bold text-amber-600 dark:text-amber-400">{cantidadNecesaria.toFixed(2)} {ing.unidad}</span></p>
                                                                                </div>
                                                                                <div className="pt-1">
                                                                                    <p><span className="text-gray-500">Stock disponible:</span> <span className="font-bold">{ing.stock_disponible.toFixed(2)} {ing.unidad}</span></p>
                                                                                    <p className={`font-bold ${sobra >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                                        Sobra: {sobra.toFixed(2)} {ing.unidad}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-3 border-t border-gray-200 dark:border-gray-700 p-6">
                            <button
                                onClick={() => setDetalles([])}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                Limpiar Todo
                            </button>
                            <button
                                onClick={() => guardarProduccionMasiva.mutate()}
                                disabled={guardarProduccionMasiva.isPending || detalles.length === 0}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
                            >
                                {guardarProduccionMasiva.isPending ? 'Registrando...' : 'Guardar Producciones'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                        <p className="text-gray-600 dark:text-gray-300 font-medium">No hay productos disponibles</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Asegúrate de que haya productos con recetas activas</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
