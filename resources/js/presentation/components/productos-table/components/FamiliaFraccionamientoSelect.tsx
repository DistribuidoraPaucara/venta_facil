import type { Producto } from '@/domain/entities/ventas';
import { useState } from 'react';

interface FamiliaFraccionamientoSelectProps {
    nombreActual: string; // producto de la línea: se muestra como primera opción del select
    padres: Producto[];
    hijos: Producto[];
    otros: Producto[]; // resto de la familia (ej. la unidad, desde el padre)
    onSeleccionar: (producto: Producto) => void;
}

/**
 * Ventas: select en la columna de nombre con los productos padres (de donde sale), hijos (en lo que se fracciona)
 * y otros de la familia. Con flechas solo se marca la opción; el cambio se aplica al salir del campo
 * (así no se cambia la línea en cada paso ni se pierde el foco).
 */
export default function FamiliaFraccionamientoSelect({ nombreActual, padres, hijos, otros, onSeleccionar }: FamiliaFraccionamientoSelectProps) {
    const [pendiente, setPendiente] = useState('');

    // Iconos por relación: ⬆️ padre (de donde sale), ⬇️ hijo (en lo que se fracciona), 🔄 otros de la familia
    const opciones = (items: Producto[], icono: string) =>
        items.map((p) => (
            <option key={p.id} value={String(p.id)}>
                {icono} {p.nombre} (stock {Number(p.stock ?? 0)})
            </option>
        ));

    const sinRelaciones = padres.length + hijos.length + otros.length === 0;

    const aplicar = () => {
        if (!pendiente) return;
        const producto = [...padres, ...hijos, ...otros].find((p) => String(p.id) === pendiente);
        setPendiente('');
        if (producto) onSeleccionar(producto);
    };

    return (
        <select
            value={pendiente}
            disabled={sinRelaciones}
            onChange={(e) => setPendiente(e.target.value)}
            onBlur={aplicar}
            title="Elige con las flechas; el cambio se aplica al salir del campo (Tab o clic fuera)"
            className="mt-1 block w-full max-w-xs rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-gray-200"
        >
            <option value="">{sinRelaciones ? `${nombreActual} · sin relacionados` : `${nombreActual}`}</option>
            {padres.length > 0 && <optgroup label="⬆️ Padres (de donde sale)">{opciones(padres, '⬆️')}</optgroup>}
            {hijos.length > 0 && <optgroup label="⬇️ Hijos (en lo que se fracciona)">{opciones(hijos, '⬇️')}</optgroup>}
            {otros.length > 0 && <optgroup label="🔄 Otros de la familia">{opciones(otros, '🔄')}</optgroup>}
        </select>
    );
}
