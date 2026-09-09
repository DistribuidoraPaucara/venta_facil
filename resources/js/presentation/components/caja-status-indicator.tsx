'use client';

import React from 'react';
import { useCajaStatus } from '@/application/hooks/use-caja-status';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Badge } from '@/presentation/components/ui/badge';

/**
 * Componente: CajaStatusIndicator
 *
 * Responsabilidades:
 * ✅ Mostrar estado de caja en tiempo real
 * ✅ Indicador visual: Verde (abierta) / Rojo (cerrada)
 * ✅ Link directo a /cajas
 * ✅ Accesible desde cualquier página
 *
 * Ubicación: Header principal de la aplicación
 */
export function CajaStatusIndicator() {
    const { tieneCapaAbierta, cajaActual } = useCajaStatus();

    // Si no hay caja abierta
    if (!tieneCapaAbierta) {
        return (
            <Link
                href="/cajas"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors dark:hover:bg-slate-700"
                title="Abrir caja"
            >
                <AlertCircle className="h-4 w-4 text-red-500" />
                <Badge variant="destructive" className="dark:bg-red-900 dark:text-red-200">Sin Caja</Badge>
            </Link>
        );
    }

    // Caja abierta
    return (
        <Link
            href="/cajas"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-green-50 transition-colors dark:hover:bg-slate-700"
            title="Gestionar cajas"
        >
            <CheckCircle className="h-4 w-4 text-green-600" />
            <Badge variant="outline" className="bg-green-50 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                Caja Abierta
            </Badge>
        </Link>
    );
}
