/**
 * Hook: useCarritoComidas
 *
 * Maneja la lógica del carrito para productos de comida
 * ✅ NUEVO (2026-08-22): Soporte para componentes/adicionales de productos
 */

import { useState, useCallback } from 'react';
import type { DetalleComidaVenta, Adicional, ComponenteProducto, AdicionalVentaEditable } from '@/domain/entities/productos-comida';

interface ProductoComidaConAdicionales {
    producto: {
        id: number;
        nombre: string;
        precio_venta: number;
    };
    adicionalesSeleccionados: number[];
    cantidad: number;
    // Datos de adicionales para mostrar
    adicionales_detalles?: Adicional[];
    // ✅ NUEVO (2026-08-22): Componentes/adicionales del producto
    componentes?: ComponenteProducto[];
}

export function useCarritoComidas() {
    const [items, setItems] = useState<DetalleComidaVenta[]>([]);

    const agregarProducto = useCallback((
        producto: ProductoComidaConAdicionales,
        adicionalesDetalles: any[] // ✅ ACTUALIZADO (2026-08-23): Permitir estructura flexible
    ) => {
        const adicionalesSeleccionados = adicionalesDetalles.filter(a =>
            producto.adicionalesSeleccionados.includes(a.id)
        );

        const precioBase = producto.producto.precio_venta;
        // ✅ ACTUALIZADO (2026-08-23): Usar precio_venta en lugar de precio_adicional
        const sumaAdicionales = adicionalesSeleccionados.reduce((sum, a) => sum + (a.precio_venta || a.precio_adicional || 0), 0);

        // ✅ NUEVO (2026-08-22): Calcular costo de componentes
        const sumaComponentes = (producto.componentes || []).reduce((sum, comp) => sum + (comp.subtotal_componente || 0), 0);

        const precioUnitario = precioBase + sumaAdicionales + (sumaComponentes / producto.cantidad);
        const precioTotal = precioUnitario * producto.cantidad;

        // ✅ ACTUALIZADO (2026-08-23): Crear adicionales editables con cantidad predefinida o del usuario
        const adicionalesEditables: AdicionalVentaEditable[] = adicionalesSeleccionados.map((a, idx) => {
            const precio = a.precio_venta || a.precio_adicional || 0;
            // ✅ ACTUALIZADO (2026-08-23): Usar cantidad predefinida (ingrediente) o cantidad seleccionada por usuario o defecto
            // Prioridad: cantidad_requerida (del ingrediente) > _cantidad_seleccionada (del usuario) > 50 (default)
            const cantidadSeleccionada = (a as any).cantidad_requerida || (a as any)._cantidad_seleccionada || 50;
            const unidadMedidaId = (a as any)._unidad_medida_id || 1; // 1 = gramos por defecto
            const unidadMedidaNombre = a.unidad_medida_nombre || 'g';
            return {
                id: `adicional_${a.id}_${Date.now()}_${idx}`, // ID único
                producto_id: a.id,
                nombre: a.nombre,
                precio_original: precio,
                precio_actual: precio,
                cantidad: cantidadSeleccionada, // ✅ ACTUALIZADO: Usar cantidad predefinida o del usuario
                unidad_medida_id: unidadMedidaId,
                unidad_medida_nombre: unidadMedidaNombre,
            };
        });

        // ✅ NUEVO (2026-08-23): Convertir adicionales a formato para enviar al backend
        const adicionalesFormato = adicionalesEditables.map(a => ({
            producto_id: a.producto_id,
            cantidad: a.cantidad,
            precio_unitario: a.precio_actual || 0,
        }));

        const nuevoItem: DetalleComidaVenta = {
            producto_id: producto.producto.id,
            nombre_producto: producto.producto.nombre,
            precio_base: precioBase,
            adicionalesSeleccionados: producto.adicionalesSeleccionados,
            cantidad: producto.cantidad,
            precio_total: precioTotal,
            adicionales_detalles: adicionalesEditables,
            componentes: producto.componentes || [], // ✅ NUEVO (2026-08-22)
            adicionales_formato: adicionalesFormato, // ✅ NUEVO (2026-08-23): Para enviar al servidor
        };

        setItems(prev => [...prev, nuevoItem]);
    }, []);

    const eliminarProducto = useCallback((index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    }, []);

    const actualizarProducto = useCallback((
        index: number,
        updates: Partial<DetalleComidaVenta>
    ) => {
        setItems(prev =>
            prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
        );
    }, []);

    const incrementarCantidad = useCallback((index: number) => {
        setItems(prev =>
            prev.map((item, i) => {
                if (i === index) {
                    const nuevaCantidad = item.cantidad + 1;
                    const precioUnitario = item.precio_total / item.cantidad;
                    return {
                        ...item,
                        cantidad: nuevaCantidad,
                        precio_total: precioUnitario * nuevaCantidad,
                    };
                }
                return item;
            })
        );
    }, []);

    const decrementarCantidad = useCallback((index: number) => {
        setItems(prev =>
            prev.map((item, i) => {
                if (i === index && item.cantidad > 1) {
                    const nuevaCantidad = item.cantidad - 1;
                    const precioUnitario = item.precio_total / item.cantidad;
                    return {
                        ...item,
                        cantidad: nuevaCantidad,
                        precio_total: precioUnitario * nuevaCantidad,
                    };
                }
                return item;
            })
        );
    }, []);

    const actualizarCantidadPorProductoId = useCallback((productoId: number, nuevaCantidad: number) => {
        setItems(prev =>
            prev.map(item => {
                if (item.producto_id === productoId && nuevaCantidad > 0) {
                    const precioUnitario = item.precio_total / item.cantidad;
                    return {
                        ...item,
                        cantidad: nuevaCantidad,
                        precio_total: precioUnitario * nuevaCantidad,
                    };
                }
                return item;
            })
        );
    }, []);

    const eliminarProductoPorId = useCallback((productoId: number) => {
        setItems(prev => prev.filter(item => item.producto_id !== productoId));
    }, []);

    const actualizarPrecioBasePorProductoId = useCallback((productoId: number, nuevoPrecioBase: number) => {
        setItems(prev =>
            prev.map(item => {
                if (item.producto_id === productoId) {
                    const precioUnitarioAnterior = item.precio_total / item.cantidad;
                    const diferenciaPrecio = nuevoPrecioBase - item.precio_base;
                    return {
                        ...item,
                        precio_base: nuevoPrecioBase,
                        precio_total: item.precio_total + (diferenciaPrecio * item.cantidad),
                    };
                }
                return item;
            })
        );
    }, []);

    const limpiarCarrito = useCallback(() => {
        setItems([]);
    }, []);

    const calcularTotal = useCallback(() => {
        return items.reduce((sum, item) => sum + item.precio_total, 0);
    }, [items]);

    // ✅ NUEVO (2026-08-23): Editar precio de un adicional específico
    const editarPrecioAdicional = useCallback((
        indexProducto: number,
        idAdicional: string,
        nuevoPrecio: number
    ) => {
        setItems(prev =>
            prev.map((item, idx) => {
                if (idx === indexProducto && item.adicionales_detalles) {
                    const nuevosAdicionales = item.adicionales_detalles.map(a =>
                        a.id === idAdicional ? { ...a, precio_actual: nuevoPrecio } : a
                    );

                    // Recalcular precio total del item
                    const sumaAdicionales = nuevosAdicionales.reduce((sum, a) => sum + (a.precio_actual * a.cantidad), 0);
                    const precioUnitario = item.precio_base + sumaAdicionales / item.cantidad;
                    const nuevoPrecioTotal = precioUnitario * item.cantidad;

                    // Actualizar adicionales_formato para el backend
                    const adicionalesFormato = nuevosAdicionales.map(a => ({
                        producto_id: a.producto_id,
                        cantidad: a.cantidad,
                        precio_unitario: a.precio_actual,
                    }));

                    return {
                        ...item,
                        adicionales_detalles: nuevosAdicionales,
                        precio_total: nuevoPrecioTotal,
                        adicionales_formato: adicionalesFormato,
                    };
                }
                return item;
            })
        );
    }, []);

    // ✅ NUEVO (2026-08-23): Eliminar un adicional específico
    const eliminarAdicional = useCallback((
        indexProducto: number,
        idAdicional: string
    ) => {
        setItems(prev =>
            prev.map((item, idx) => {
                if (idx === indexProducto && item.adicionales_detalles) {
                    const nuevosAdicionales = item.adicionales_detalles.filter(a => a.id !== idAdicional);

                    // Si no quedan adicionales, se mantiene el precio base
                    const sumaAdicionales = nuevosAdicionales.reduce((sum, a) => sum + (a.precio_actual * a.cantidad), 0);
                    const precioUnitario = item.precio_base + (sumaAdicionales / item.cantidad);
                    const nuevoPrecioTotal = precioUnitario * item.cantidad;

                    // Actualizar adicionales_formato para el backend
                    const adicionalesFormato = nuevosAdicionales.map(a => ({
                        producto_id: a.producto_id,
                        cantidad: a.cantidad,
                        precio_unitario: a.precio_actual,
                    }));

                    return {
                        ...item,
                        adicionales_detalles: nuevosAdicionales,
                        precio_total: nuevoPrecioTotal,
                        adicionales_formato: adicionalesFormato,
                    };
                }
                return item;
            })
        );
    }, []);

    // ✅ NUEVO (2026-08-23): Editar cantidad de un adicional específico
    const editarCantidadAdicional = useCallback((
        indexProducto: number,
        idAdicional: string,
        nuevaCantidad: number
    ) => {
        setItems(prev =>
            prev.map((item, idx) => {
                if (idx === indexProducto && item.adicionales_detalles) {
                    const nuevosAdicionales = item.adicionales_detalles.map(a =>
                        a.id === idAdicional ? { ...a, cantidad: nuevaCantidad } : a
                    );

                    // Recalcular precio total del item
                    const sumaAdicionales = nuevosAdicionales.reduce((sum, a) => sum + (a.precio_actual * a.cantidad), 0);
                    const precioUnitario = item.precio_base + sumaAdicionales / item.cantidad;
                    const nuevoPrecioTotal = precioUnitario * item.cantidad;

                    // Actualizar adicionales_formato para el backend
                    const adicionalesFormato = nuevosAdicionales.map(a => ({
                        producto_id: a.producto_id,
                        cantidad: a.cantidad,
                        precio_unitario: a.precio_actual,
                    }));

                    return {
                        ...item,
                        adicionales_detalles: nuevosAdicionales,
                        precio_total: nuevoPrecioTotal,
                        adicionales_formato: adicionalesFormato,
                    };
                }
                return item;
            })
        );
    }, []);

    return {
        items,
        agregarProducto,
        eliminarProducto,
        actualizarProducto,
        incrementarCantidad,
        decrementarCantidad,
        actualizarCantidadPorProductoId,
        eliminarProductoPorId,
        actualizarPrecioBasePorProductoId,
        limpiarCarrito,
        calcularTotal,
        totalItems: items.length,
        // ✅ NUEVO (2026-08-23): Métodos para editar/eliminar adicionales
        editarPrecioAdicional,
        eliminarAdicional,
        editarCantidadAdicional, // ✅ NUEVO (2026-08-23): Editar cantidad del adicional
    };
}
