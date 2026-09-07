/**
 * 🏷️ Helper para obtener nombre dinámico del producto según la unidad de venta
 * Cuando un producto es fraccionado, el nombre debe cambiar según cómo se venda
 * Ejemplo: "Paquete de Coca Cola 6x1" → "Coca Cola 2Lts" (cuando se vende por unidad)
 */

export interface ConversionConNombre {
    id?: number;
    unidad_base_id: number;
    unidad_destino_id: number;
    factor_conversion: number;
    nombre_cuando_se_vende_como?: string | null;
    unidadDestino?: {
        id: number;
        nombre: string;
        codigo: string;
    };
}

export interface UnidadInfo {
    id: number;
    nombre: string;
    codigo: string;
}

/**
 * Patrones comunes para extraer nombre base de un producto con empaquetado
 * Ej: "Paquete de Coca Cola" → "Coca Cola"
 */
const PATRONES_A_REMOVER = [
    /^Paquete de\s+/i,      // "Paquete de X" → "X"
    /^Caja de\s+/i,         // "Caja de X" → "X"
    /^Saco de\s+/i,         // "Saco de X" → "X"
    /^Quintal de\s+/i,      // "Quintal de X" → "X"
    /^Bolsa de\s+/i,        // "Bolsa de X" → "X"
    /^Lata de\s+/i,         // "Lata de X" → "X"
    /^Docena de\s+/i,       // "Docena de X" → "X"
    /^Cartón de\s+/i,       // "Cartón de X" → "X"
    /\s+\(\d+x\d+\)$/,      // "X (6x1)" → "X"
    /\s+\d+x\d+\s*/,        // "X 6x1 Y" → "X Y"
    /\s+\(\d+\s*(?:kg|gr|ml|l)\)$/i,  // "X (50kg)" → "X"
];

/**
 * Extrae el nombre base de un producto removiendo prefijos de empaquetado
 * @param nombreCompleto - Nombre del producto con empaquetado
 * @returns Nombre base sin empaquetado
 */
export function extraerNombreBase(nombreCompleto: string): string {
    if (!nombreCompleto || nombreCompleto.trim() === '') {
        return nombreCompleto;
    }

    let base = nombreCompleto;

    for (const patron of PATRONES_A_REMOVER) {
        base = base.replace(patron, '').trim();
    }

    return base || nombreCompleto; // Si no encuentra patrón, retorna original
}

/**
 * Obtiene el nombre del producto según la unidad de venta actual
 * Prioridad:
 * 1. nombre_cuando_se_vende_como (si está configurado en la conversión)
 * 2. Nombre base extraído automáticamente
 * 3. Nombre original (si no es fraccionado)
 *
 * @param nombreProducto - Nombre original del producto
 * @param unidadVentaId - ID de la unidad actual de venta
 * @param unidadBaseId - ID de la unidad base (por defecto del producto)
 * @param conversiones - Array de conversiones disponibles
 * @param unidadesMap - Mapa de unidades {id: {nombre, codigo}}
 * @returns Nombre dinámico del producto
 */
export function obtenerNombreConUnidad(
    nombreProducto: string,
    unidadVentaId: number,
    unidadBaseId: number,
    conversiones?: ConversionConNombre[] | null,
    unidadesMap: Record<number, UnidadInfo> = {}
): string {
    // Si la unidad de venta es la base, retornar nombre original sin extraer
    // (para mostrar "Paquete de..." cuando es la unidad base)
    if (unidadVentaId === unidadBaseId) {
        console.log(`📦 [Nombre Dinámico] Es unidad BASE, retornando nombre original: "${nombreProducto}"`);
        return nombreProducto;
    }

    // Si hay conversiones y coincide con una, usar su nombre personalizado
    if (conversiones && conversiones.length > 0) {
        const conversion = conversiones.find(
            (c) => c.unidad_destino_id === unidadVentaId && c.activo !== false
        );

        if (conversion) {
            // Si la conversión tiene nombre personalizado, usarlo
            if (conversion.nombre_cuando_se_vende_como) {
                console.log(
                    `📦 [Nombre Dinámico] Usando nombre personalizado: "${conversion.nombre_cuando_se_vende_como}"`
                );
                return conversion.nombre_cuando_se_vende_como;
            }

            // Si no, generar dinámicamente: nombre_base + unidad_destino
            const nombreBase = extraerNombreBase(nombreProducto);
            const unidadDestino = unidadesMap[conversion.unidad_destino_id];

            if (unidadDestino) {
                const nombreGenerado = `${nombreBase} (${unidadDestino.nombre})`;
                console.log(
                    `📦 [Nombre Dinámico] Generado automáticamente: "${nombreGenerado}"`
                );
                return nombreGenerado;
            }
        }
    }

    // Si no encontró conversión, retornar nombre original
    console.log(
        `📦 [Nombre Dinámico] Sin conversión, usando nombre original: "${nombreProducto}"`
    );
    return nombreProducto;
}

/**
 * Versión simplificada para depuración
 */
export function debugNombreDinamico(
    nombreProducto: string,
    unidadVentaId: number,
    unidadBaseId: number,
    conversiones?: ConversionConNombre[] | null
): void {
    console.log('🔍 [DEBUG] Nombre Dinámico:');
    console.log('  Nombre original:', nombreProducto);
    console.log('  Unidad venta ID:', unidadVentaId);
    console.log('  Unidad base ID:', unidadBaseId);
    console.log('  Conversiones:', conversiones);
    console.log('  Nombre base extraído:', extraerNombreBase(nombreProducto));
}
