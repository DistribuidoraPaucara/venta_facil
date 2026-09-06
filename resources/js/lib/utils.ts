import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'BOB'): string {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: currency === 'USD' ? 'USD' : 'BOB',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    }).format(amount);
}

export function formatCurrencyWith2Decimals(amount: number, currency = 'BOB'): string {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: currency === 'USD' ? 'USD' : 'BOB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

// ✅ NUEVO: Formatear moneda mostrando solo decimales necesarios
// ✅ MEJORADO: Soportar hasta 6 decimales para productos fraccionados
export function formatCurrencyMinimalDecimals(amount: number, currency = 'BOB'): string {
    // Determinar cuántos decimales son necesarios
    const decimalPart = amount % 1;
    let minDecimals = 0;
    let maxDecimals = 2;

    if (decimalPart !== 0) {
        // Para productos fraccionados, verificar si necesita más de 2 decimales
        const decimalStr = Math.abs(decimalPart).toFixed(6).replace(/0+$/, ''); // Remover ceros al final
        minDecimals = Math.max(2, Math.min(decimalStr.length, 6));
        maxDecimals = 6; // Permitir hasta 6 decimales para fractionales
    }

    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: currency === 'USD' ? 'USD' : 'BOB',
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals,
    }).format(amount);
}

export function formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(dateObj);
}

export function formatDateTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj);
}
