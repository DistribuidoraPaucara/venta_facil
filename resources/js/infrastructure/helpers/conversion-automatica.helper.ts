/**
 * 🔄 Helper para detectar y convertir automáticamente unidades
 * Cuando la cantidad escrita es múltiplo exacto de una conversión, convierte automáticamente
 * Ejemplo: 6 sodas → 1 paquete (si factor_conversion=6)
 */

export interface Conversion {
    id?: number;
    unidad_base_id: number;
    unidad_destino_id: number;
    factor_conversion: number;
    activo?: boolean;
    es_conversion_principal?: boolean;
}

export interface UnidadInfo {
    id: number;
    nombre: string;
    codigo: string;
}

export interface ResultadoConversion {
    cantidadFinal: number;
    unidadFinal: number;
    unidadDestino?: UnidadInfo;
    precioFinal: number;
    seConvirtio: boolean;
    mensajeConversion?: string;
}

/**
 * Detecta si la cantidad es múltiplo de alguna conversión y convierte automáticamente
 * @param cantidadEscrita - Cantidad que escribió el usuario
 * @param conversiones - Array de conversiones disponibles
 * @param unidadBase - ID de la unidad base (por defecto)
 * @param precioBase - Precio de la unidad base
 * @param unidadesMap - Mapa de unidades {id: {nombre, codigo}}
 * @returns Objeto con cantidad/unidad/precio finales y si se realizó conversión
 */
export function detectarYConvertirUnidad(
    cantidadEscrita: number,
    conversiones: Conversion[] | undefined,
    unidadBase: number,
    precioBase: number,
    unidadesMap: Record<number, UnidadInfo> = {}
): ResultadoConversion {
    // Si no hay conversiones o cantidad es 0, retornar sin cambios
    if (!conversiones || conversiones.length === 0 || cantidadEscrita <= 0) {
        return {
            cantidadFinal: cantidadEscrita,
            unidadFinal: unidadBase,
            precioFinal: precioBase,
            seConvirtio: false,
        };
    }

    // Filtrar conversiones activas donde la unidad base es la nuestra
    const conversionesValidas = conversiones.filter(
        (c) => c.activo !== false && c.unidad_base_id === unidadBase
    );

    if (conversionesValidas.length === 0) {
        return {
            cantidadFinal: cantidadEscrita,
            unidadFinal: unidadBase,
            precioFinal: precioBase,
            seConvirtio: false,
        };
    }

    // Buscar si hay una conversión cuyo factor es divisor exacto de la cantidad
    for (const conv of conversionesValidas) {
        const factor = Number(conv.factor_conversion);

        if (factor > 0 && cantidadEscrita % factor === 0) {
            const cantidadConvertida = cantidadEscrita / factor;
            const precioConvertido = precioBase * factor;
            const unidadDestino = unidadesMap[conv.unidad_destino_id];

            const mensajeConversion = unidadDestino
                ? `${cantidadEscrita} ${unidadesMap[unidadBase]?.nombre || 'unidades'} = ${cantidadConvertida} ${unidadDestino.nombre}`
                : `${cantidadEscrita} → ${cantidadConvertida} (${factor}:1)`;

            console.log(
                `✨ [CONVERSIÓN AUTOMÁTICA] ${mensajeConversion} | Precio: ${precioBase} → ${precioConvertido} Bs`
            );

            return {
                cantidadFinal: cantidadConvertida,
                unidadFinal: conv.unidad_destino_id,
                unidadDestino,
                precioFinal: precioConvertido,
                seConvirtio: true,
                mensajeConversion,
            };
        }
    }

    // Si no hay conversión que aplique, retornar sin cambios
    return {
        cantidadFinal: cantidadEscrita,
        unidadFinal: unidadBase,
        precioFinal: precioBase,
        seConvirtio: false,
    };
}

/**
 * Versión simplificada: solo detecta si se debe convertir (boolean)
 */
export function debeConvertirseAutomaticamente(
    cantidadEscrita: number,
    conversiones: Conversion[] | undefined,
    unidadBase: number
): boolean {
    if (!conversiones || conversiones.length === 0 || cantidadEscrita <= 0) {
        return false;
    }

    const conversionesValidas = conversiones.filter(
        (c) => c.activo !== false && c.unidad_base_id === unidadBase
    );

    return conversionesValidas.some((conv) => {
        const factor = Number(conv.factor_conversion);
        return factor > 0 && cantidadEscrita % factor === 0;
    });
}
