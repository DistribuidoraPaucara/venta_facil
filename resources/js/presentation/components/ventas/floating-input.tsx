import React from 'react';

interface FloatingInputProps {
    id: string;
    label: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    title?: string;
    icon?: React.ReactNode;
    step?: string;
    min?: string | number;
    max?: string | number;
}

export default function FloatingInput({
    id,
    label,
    value,
    onChange,
    onKeyPress,
    type = 'text',
    placeholder = '',
    title,
    icon,
    step,
    min,
    max,
}: FloatingInputProps) {
    return (
        <div className="relative">
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                onKeyPress={onKeyPress}
                placeholder={placeholder}
                title={title}
                step={step}
                min={min}
                max={max}
                className={`peer w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all`}
            />
            {icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-colors">
                    {icon}
                </div>
            )}
            {/* Etiqueta siempre sobre el borde, igual que FloatingSelect */}
            <label
                htmlFor={id}
                className={`absolute ${icon ? 'left-10' : 'left-3'} -top-2.5 px-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-900 peer-focus:text-blue-600 dark:peer-focus:text-blue-400 transition-all pointer-events-none`}
            >
                {label}
            </label>
        </div>
    );
}
