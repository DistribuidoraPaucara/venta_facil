/**
 * Domain Entities: Productos de Comida
 */

export interface Adicional {
    id: number;
    nombre: string;
    descripcion?: string;
    precio_adicional: number;
    orden: number;
    activo: boolean;
}

// ✅ NUEVO (2026-08-23): Adicional editable en el carrito con ID único
export interface AdicionalVentaEditable {
    id: string; // ID único para este adicional en el carrito (ej: "adicional_123_1")
    producto_id: number; // ID del producto adicional
    nombre: string;
    precio_original: number; // Precio inicial
    precio_actual: number; // Precio editable
    cantidad: number; // Cantidad del adicional
    // ✅ NUEVO (2026-08-23): Unidad de medida seleccionable
    unidad_medida_id: number; // ID de la unidad (gramos, ml, unidades, etc)
    unidad_medida_nombre: string; // Nombre de la unidad (g, ml, unidades)
}

// ✅ NUEVO (2026-08-22): Componentes/Adicionales de productos (nuevos)
export interface ComponenteProducto {
    componente_id: number;
    componente_nombre: string;
    cantidad: number;
    cantidad_total_necesaria: number;
    precio_unitario: number;
    subtotal_componente: number;
    es_opcional: boolean;
}

export interface Ingrediente {
    producto_id: number;
    producto_nombre: string;
    cantidad_requerida: number;
    unidad_medida_id: number;
    unidad_nombre: string;
}

export interface ProductoComida {
    id: number;
    nombre: string;
    descripcion?: string;
    precio_venta: number;
    es_producto_comida: boolean;
    // ✅ NUEVO (2026-08-23): Unidad de medida del producto
    unidad_medida_id?: number;
    unidad_medida_nombre?: string; // ej: "gramos", "mililitros", "unidades"
    puede_tener_producto_adicional?: boolean;
    es_producto_adicional?: boolean;
    adicionales?: Adicional[];
    // ✅ NUEVO (2026-08-23): Ingredientes predefinidos como adicionales
    ingredientes?: Ingrediente[];
}

export interface DetalleComidaVenta {
    producto_id: number;
    nombre_producto: string;
    precio_base: number;
    adicionalesSeleccionados: number[]; // IDs de adicionales
    cantidad: number;
    precio_total: number;
    // ✅ ACTUALIZADO (2026-08-23): Adicionales editables con ID único
    adicionales_detalles?: AdicionalVentaEditable[];
    // ✅ NUEVO (2026-08-22): Componentes/adicionales del producto
    componentes?: ComponenteProducto[];
    // ✅ NUEVO (2026-08-23): Formato de adicionales para enviar al backend
    adicionales_formato?: Array<{ producto_id: number; cantidad: number; precio_unitario: number }>;
}

export interface CarritoComida {
    items: DetalleComidaVenta[];
    total: number;
}
