import React from 'react';

interface ToggleOption {
    value: string;
    label: string;
    icon?: string | null;
    color?: string | null; // Hex color for styling
}

interface ToggleGroupProps {
    options: ToggleOption[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    label?: string;
    required?: boolean;
    description?: string;
    /** Permite volver a un estado "sin selección" haciendo click sobre la opción activa (útil en filtros) */
    allowDeselect?: boolean;
}

export default function ToggleGroup({
    options,
    value,
    onChange,
    disabled = false,
    label,
    required = false,
    description,
    allowDeselect = false,
}: ToggleGroupProps) {
    // 🔍 DEBUG: Mostrar opciones y cambios en consola
    React.useEffect(() => {
        console.log('🎛️ [ToggleGroup] Opciones renderizadas:', {
            label,
            total_opciones: options.length,
            opciones_detalle: options.map(opt => ({
                value: opt.value,
                label: opt.label,
                icon: opt.icon,
                color: opt.color,
            })),
            valor_seleccionado: value,
        });
    }, [options, value, label]);

    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isSelected = value === option.value;
                    const bgColor = option.color || '#2563eb'; // Fallback a azul

                    const selectedStyle = {
                        backgroundColor: bgColor,
                        borderColor: bgColor,
                        boxShadow: `0 6px 14px -4px ${bgColor}80`,
                    } as React.CSSProperties;

                    const unselectedStyle = {
                        borderColor: `${bgColor}55`,
                        color: bgColor,
                        backgroundColor: `${bgColor}0d`,
                    } as React.CSSProperties;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                if (!disabled) {
                                    console.log('✅ [ToggleGroup] Opción seleccionada:', {
                                        value: option.value,
                                        label: option.label,
                                        color: option.color,
                                        icon: option.icon,
                                    });
                                    onChange(isSelected && allowDeselect ? '' : option.value);
                                }
                            }}
                            disabled={disabled}
                            style={isSelected ? selectedStyle : unselectedStyle}
                            className={`
                                inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5
                                text-sm font-medium whitespace-nowrap
                                transition-all duration-150 ease-out
                                ${isSelected ? 'text-white shadow-sm' : 'hover:shadow-sm hover:brightness-95 dark:hover:brightness-110'}
                                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                            `}
                        >
                            {isSelected && <span className="text-xs leading-none">●</span>}
                            {option.icon && <span className="text-base leading-none">{option.icon}</span>}
                            {option.label}
                        </button>
                    );
                })}
            </div>

            {description && <p className="text-xs text-gray-500 italic dark:text-gray-400">{description}</p>}
        </div>
    );
}
