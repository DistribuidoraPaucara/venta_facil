/**
 * 📦 Helper para validar stock considerando conversiones de unidades
 * Cuando un producto es fraccionado, calcula el stock disponible en la unidad actual de venta
 */

export interface ConversionInfo {
    id?: number;
    unidad_base_id: number;
    unidad_destino_id: number;
    factor_conversion: number;
    activo?: boolean;
}

/**
 * Calcula el stock disponible en la unidad de venta actual
 * Considerando conversiones para productos fraccionados
 *
 * @param stockBaseDisponible - Stock disponible en la unidad base
 * @param unidadVentaId - ID de la unidad de venta actual
 * @param unidadBaseId - ID de la unidad base del producto
 * @param conversiones - Array de conversiones disponibles
 * @returns Stock disponible en la unidad de venta
 *
 * @example
 * // Producto: 100 paquetes en stock
 * // Conversión: 1 paquete = 6 unidades
 * // Si vendes por unidad: 100 * 6 = 600 unidades disponibles
 * calcularStockDisponibleEnUnidadVenta(100, 8, 9, conversiones)
 * // Returns: 600
 */
export function calcularStockDisponibleEnUnidadVenta(
    stockBaseDisponible: number,
    unidadVentaId: number,
    unidadBaseId: number,
    conversiones?: ConversionInfo[] | null
): number {
    // Si la unidad de venta es la base, retornar stock sin conversión
    if (unidadVentaId === unidadBaseId) {
        console.log(
            `📦 [calcularStockDisponible] Unidad de venta es la BASE - Stock sin conversión: ${stockBaseDisponible}`
        );
        return stockBaseDisponible;
    }

    // Si no hay conversiones, retornar el stock base (sin conversión)
    if (!conversiones || conversiones.length === 0) {
        console.log(
            `📦 [calcularStockDisponible] Sin conversiones - Stock base: ${stockBaseDisponible}`
        );
        return stockBaseDisponible;
    }

    // Buscar la conversión correspondiente
    const conversion = conversiones.find(
        (c) => c.unidad_destino_id === unidadVentaId && c.activo !== false
    );

    if (conversion) {
        // Calcular stock disponible multiplicando por factor de conversión
        const stockConvertido = stockBaseDisponible * conversion.factor_conversion;
        console.log(
            `📦 [calcularStockDisponible] Conversión encontrada - Stock base: ${stockBaseDisponible}, Factor: ${conversion.factor_conversion}, Stock convertido: ${stockConvertido}`
        );
        return stockConvertido;
    }

    // Si no encuentra conversión, retornar stock base
    console.log(
        `📦 [calcularStockDisponible] Conversión NO encontrada - Stock base: ${stockBaseDisponible}`
    );
    return stockBaseDisponible;
}

/**
 * Valida si la cantidad solicitada excede el stock disponible
 * Considerando conversiones para productos fraccionados
 *
 * @param cantidadSolicitada - Cantidad que se intenta comprar
 * @param stockBaseDisponible - Stock disponible en la unidad base
 * @param unidadVentaId - ID de la unidad de venta actual
 * @param unidadBaseId - ID de la unidad base del producto
 * @param conversiones - Array de conversiones disponibles
 * @returns {
 *   esValido: boolean,
 *   stockDisponible: number,
 *   mensaje: string
 * }
 */
export function validarStockDisponible(
    cantidadSolicitada: number,
    stockBaseDisponible: number,
    unidadVentaId: number,
    unidadBaseId: number,
    conversiones?: ConversionInfo[] | null,
    nombreProducto?: string
): {
    esValido: boolean;
    stockDisponible: number;
    mensaje: string;
} {
    const stockDisponible = calcularStockDisponibleEnUnidadVenta(
        stockBaseDisponible,
        unidadVentaId,
        unidadBaseId,
        conversiones
    );

    const esValido = cantidadSolicitada <= stockDisponible;

    if (!esValido) {
        const exceso = cantidadSolicitada - stockDisponible;
        const mensaje = `Stock insuficiente. Disponible: ${stockDisponible.toFixed(2)}, Solicitado: ${cantidadSolicitada.toFixed(2)}, Falta: ${exceso.toFixed(2)}`;

        console.warn(
            `⚠️ [validarStockDisponible] ${nombreProducto || 'Producto'}: ${mensaje}`
        );

        return {
            esValido: false,
            stockDisponible,
            mensaje,
        };
    }

    return {
        esValido: true,
        stockDisponible,
        mensaje: `Stock suficiente. Disponible: ${stockDisponible.toFixed(2)}`,
    };
}

/**
 * Versión simplificada para obtener solo el stock disponible
 */
export function obtenerStockDisponibleEnUnidadActual(
    stockBase: number,
    unidadVentaId: number,
    unidadBaseId: number,
    conversiones?: ConversionInfo[] | null
): number {
    return calcularStockDisponibleEnUnidadVenta(stockBase, unidadVentaId, unidadBaseId, conversiones);
}
