// Configuration: colores compartidos por Tipos de Merma y Estados de Merma
// Las clases van escritas completas para que Tailwind las incluya en el build.

export const MERMA_COLORES: Record<string, { label: string; clases: string }> = {
  gray: { label: 'Gris', clases: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300' },
  red: { label: 'Rojo', clases: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300' },
  orange: { label: 'Naranja', clases: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' },
  yellow: { label: 'Amarillo', clases: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' },
  green: { label: 'Verde', clases: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' },
  blue: { label: 'Azul', clases: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' },
  purple: { label: 'Morado', clases: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300' },
  pink: { label: 'Rosa', clases: 'bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-300' },
};

export const MERMA_COLOR_OPTIONS = Object.entries(MERMA_COLORES).map(([value, { label }]) => ({ value, label }));

// Muestra el nombre con el color elegido, como se verá en las mermas
export const renderEtiquetaMerma = (label: unknown, color?: string | null) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${MERMA_COLORES[color ?? 'gray']?.clases ?? MERMA_COLORES.gray.clases}`}>
    {String(label ?? '')}
  </span>
);
