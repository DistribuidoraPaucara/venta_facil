/**
 * Página: Gestión de Precios
 * Permite revisar y actualizar precios de venta según cambios en compras
 * Arquitectura: DDD (Domain-Driven Design)
 */

import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { TablaPreciosComponent } from '@/presentation/components/precios/tabla-precios';
import { ModalActualizarPrecioComponent } from '@/presentation/components/precios/modal-actualizar-precio';
import { ModalComprasDiferenciaCostoComponent } from '@/presentation/components/precios/modal-compras-diferencia-costo';
import { ModalHistorialPrecioComponent } from '@/presentation/components/precios/modal-historial-precio';
import { PaginacionPreciosComponent } from '@/presentation/components/precios/paginacion-precios';
import { usePrecios } from '@/application/hooks/use-precios';
import type { FiltrosPrecio, OrdenTablaPrecios, PrecioProductoDTO, ProductoConPreciosDTO, TipoPrecioEntity } from '@/domain/entities/precios';

interface PreciosIndexProps {
    tipos_precio: TipoPrecioEntity[];
}

export default function PreciosIndex({ tipos_precio }: PreciosIndexProps) {
    console.log('Renderizando PreciosIndex', tipos_precio);
    // Hook personalizado para gestión de precios
    const [estado, acciones] = usePrecios();

    // Estados locales para filtros y UI
    const [filtros, setFiltros] = useState<FiltrosPrecio>({});
    const [showModal, setShowModal] = useState(false);
    const [precioSeleccionado, setPrecioSeleccionado] = useState<PrecioProductoDTO | null>(null);
    const [soloConCambioCosto, setSoloConCambioCosto] = useState(false);
    const [showModalCompras, setShowModalCompras] = useState(false);
    const [historialDe, setHistorialDe] = useState<ProductoConPreciosDTO | null>(null);

    // Cargar precios al montar el componente
    useEffect(() => {
        acciones.obtenerPrecios(filtros);
    }, []);

    // Manejar búsqueda
    const handleBuscar = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        acciones.obtenerPrecios(filtros, 1); // Volver a la página 1 al buscar
        // Dejar el texto seleccionado: el siguiente código escaneado o tecleado lo reemplaza
        (e.currentTarget.querySelector('input[type="text"]') as HTMLInputElement | null)?.select();
    };

    // Manejar limpiar filtros
    const handleLimpiarFiltros = () => {
        setFiltros({});
        acciones.obtenerPrecios({}, 1);
    };

    // Manejar cambio de página
    const handleChangePage = (page: number) => {
        acciones.obtenerPrecios(filtros, page);
    };

    // Ordenar por columna: primer clic asc, el siguiente sobre la misma columna alterna asc/desc
    const handleOrdenar = (columna: OrdenTablaPrecios) => {
        const direccion: 'asc' | 'desc' = filtros.orden === columna && filtros.direccion === 'asc' ? 'desc' : 'asc';
        const nuevos = { ...filtros, orden: columna, direccion };
        setFiltros(nuevos);
        acciones.obtenerPrecios(nuevos, 1);
    };

    // Manejar editar precio
    const handleEditarPrecio = (precio: PrecioProductoDTO) => {
        setPrecioSeleccionado(precio);
        setShowModal(true);
    };

    // Manejar ver historial (el modal carga sus propios datos)
    const handleVerHistorial = (producto: ProductoConPreciosDTO) => {
        setHistorialDe(producto);
    };

    // Manejar guardar precio desde el modal (con motivo): actualiza solo la fila, sin recargar ni perder filtros
    const handleGuardarPrecio = async (precioNuevo: number, motivo: string) => {
        if (!precioSeleccionado) return;
        const producto = estado.precios?.data.find(p => p.precios.some(pr => pr.id === precioSeleccionado.id));
        if (!producto) return;
        await acciones.actualizarPrecioEnLinea(producto.id, precioSeleccionado.id, precioNuevo, motivo);
    };

    // Edición rápida en la celda de la tabla
    const handleGuardarPrecioEnLinea = (producto: ProductoConPreciosDTO, precio: PrecioProductoDTO, precioNuevo: number) =>
        acciones.actualizarPrecioEnLinea(producto.id, precio.id, precioNuevo, 'Edición rápida en tabla de precios');

    const handleEliminarPrecioEnLinea = (producto: ProductoConPreciosDTO, precio: PrecioProductoDTO) =>
        acciones.eliminarPrecioEnLinea(producto.id, precio.id);

    // Manejar búsqueda de compras con diferencia de costo
    const handleBuscarCompras = async (productoId: number) => {
        await acciones.obtenerComprasConDiferenciaCosto(productoId);
        setShowModalCompras(true);
    };

    // Manejar cierre del modal de compras
    const handleCerrarModalCompras = () => {
        setShowModalCompras(false);
        acciones.limpiarComprasSeleccionadas();
    };

    // ✅ NUEVO: Manejar actualización de precios desde el modal
    const handleActualizarPreciosModal = async (precios: Array<{ precio_id: number; precio_nuevo: number; porcentaje_ganancia?: number; motivo: string }>) => {
        try {
            console.log('💾 Página Precios - handleActualizarPreciosModal iniciado con:', precios.length, 'precios');
            await acciones.actualizarLote(precios);
            console.log('💾 Página Precios - Actualización completada, recargar lista');
            // Recargar precios después de actualizar
            await acciones.obtenerPrecios(filtros);
        } catch (error) {
            console.error('❌ Error actualizando precios:', error);
            throw error;
        }
    };

    // Filtrar productos según filtros activos
    const productosFiltered = estado.precios?.data
        ? estado.precios.data.filter(p => {
            let cumpleCambio = true;
            let cumpleDiferencia = true;

            if (soloConCambioCosto) {
                cumpleCambio = p.costo_cambio_reciente || p.precios.some(pr => pr.requiere_revision);
            }

            if (estado.soloConDiferenciaCosto) {
                cumpleDiferencia = p.tiene_diferencia_costo_en_compra;
            }

            return cumpleCambio && cumpleDiferencia;
        })
        : [];

    // Log cuando cambia el filtro de diferencia de costo
    useEffect(() => {
        if (estado.soloConDiferenciaCosto) {
            console.log('🔍 Filtro de diferencia de costo ACTIVADO');
            console.log('📊 Productos con diferencia:', productosFiltered.length);
        } else {
            console.log('🔍 Filtro de diferencia de costo DESACTIVADO');
            console.log('📊 Total de productos:', estado.precios?.data?.length || 0);
        }
    }, [estado.soloConDiferenciaCosto, productosFiltered]);

    return (
        <AppLayout>
            <Head title="Gestionar Precios" />

            <div className="bg-gray-50 dark:bg-slate-950">
                {/* Header */}
                <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-2 py-2">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">Gestionar Precios</h1>
                                <p className="text-gray-600 dark:text-slate-400 mt-2">
                                    Revisa y actualiza precios de venta según cambios en costo de compras aprobadas
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-2 py-2">
                    {/* Formulario de Filtros */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm dark:shadow-slate-900/50 p-2 mb-2 border border-gray-200 dark:border-slate-700">
                        <form onSubmit={handleBuscar} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Búsqueda */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Buscar producto
                                    </label>
                                    <input
                                        type="text"
                                        value={filtros.q || ''}
                                        onChange={(e) =>
                                            setFiltros(prev => ({ ...prev, q: e.target.value }))
                                        }
                                        placeholder="ID, código de barras, SKU o nombre (Enter)"
                                        autoFocus
                                        onFocus={(e) => e.target.select()}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400"
                                    />
                                </div>

                                {/* Filtro por tipo de precio */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Tipo de Precio
                                    </label>
                                    <select
                                        value={filtros.sin_precios ? 'sin_precios' : filtros.tipo_precio_id || ''}
                                        onChange={(e) => {
                                            const valor = e.target.value;
                                            setFiltros(prev => ({
                                                ...prev,
                                                sin_precios: valor === 'sin_precios' ? true : undefined,
                                                tipo_precio_id: valor && valor !== 'sin_precios' ? parseInt(valor) : undefined,
                                            }));
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400"
                                    >
                                        <option value="">Todos los tipos</option>
                                        <option value="sin_precios">⚠ Sin precios registrados</option>
                                        {tipos_precio.map((tipo) => (
                                            <option key={tipo.id} value={tipo.id}>
                                                {tipo.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Botones de acción */}
                                <div className="flex items-end gap-2">
                                    <button
                                        type="submit"
                                        disabled={estado.loading}
                                        className="w-full px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium disabled:opacity-50 transition-colors"
                                    >
                                        Buscar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleLimpiarFiltros}
                                        disabled={estado.loading}
                                        className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 font-medium disabled:opacity-50 transition-colors"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Mensajes de error */}
                    {estado.error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-red-800 dark:text-red-200">
                            {estado.error}
                        </div>
                    )}

                    {/* Tabla de Precios */}
                    {estado.precios && (
                        <>
                            <TablaPreciosComponent
                                productos={productosFiltered}
                                tiposPrecio={tipos_precio}
                                onGuardarPrecio={handleGuardarPrecioEnLinea}
                                onEliminarPrecio={handleEliminarPrecioEnLinea}
                                onEditarPrecio={handleEditarPrecio}
                                onVerHistorial={handleVerHistorial}
                                onBuscarCompras={handleBuscarCompras}
                                orden={filtros.orden}
                                direccion={filtros.direccion}
                                onOrdenar={handleOrdenar}
                                loading={estado.loading}
                            />

                            {/* Paginación */}
                            <PaginacionPreciosComponent
                                currentPage={estado.currentPage}
                                lastPage={estado.lastPage}
                                total={estado.total}
                                perPage={estado.perPage}
                                loading={estado.loading}
                                onPageChange={handleChangePage}
                            />
                        </>
                    )}
                </div>

                {/* Modal de Edición */}
                <ModalActualizarPrecioComponent
                    precio={precioSeleccionado}
                    isOpen={showModal}
                    loading={estado.loading}
                    onClose={() => {
                        setShowModal(false);
                        setPrecioSeleccionado(null);
                    }}
                    onGuardar={handleGuardarPrecio}
                />

                {/* Modal de Historial de Precio */}
                <ModalHistorialPrecioComponent
                    producto={historialDe}
                    isOpen={historialDe !== null}
                    onClose={() => setHistorialDe(null)}
                />

                {/* Modal de Compras con Diferencia de Costo */}
                <ModalComprasDiferenciaCostoComponent
                    isOpen={showModalCompras}
                    onClose={handleCerrarModalCompras}
                    producto={estado.productoComprasSeleccionado}
                    precioActual={estado.precios?.data
                        .find(p => p.id === estado.productoComprasSeleccionado?.id)
                        ?.precios.find(pr => pr.tipo.codigo === 'COSTO')?.precio_actual || null}
                    precioCostoNuevo={estado.precioCostoNuevo} // ✅ NUEVO: Pasar nuevo precio de costo
                    compras={estado.comprasConDiferencia}
                    loading={estado.loadingCompras}
                    onActualizarPrecios={handleActualizarPreciosModal} // ✅ NUEVO: Callback para actualizar precios
                />
            </div>
        </AppLayout>
    );
}
