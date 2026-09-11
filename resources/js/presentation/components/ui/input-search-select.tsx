// InputSearchSelect - Input simple de búsqueda con opciones seleccionables
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/presentation/components/ui/input';

export interface SearchOption {
  value: string | number;
  label: string;
  description?: string;
  meta?: Record<string, any>;
}

interface InputSearchSelectProps {
  options: SearchOption[];
  value: string | number | '';
  onChange: (value: string | number | '') => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  loading?: boolean;
  emptyText?: string;
}

export default function InputSearchSelect({
  options = [],
  value,
  onChange,
  onSearch,
  placeholder = 'Buscar...',
  loading = false,
  emptyText = 'No se encontraron resultados',
}: InputSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Encontrar la opción seleccionada
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as EventListener);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, []);

  // Manejar búsqueda con debounce
  useEffect(() => {
    if (onSearch && searchQuery) {
      const timeoutId = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, onSearch]);

  const handleSelect = (option: SearchOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full"
      />

      {/* Dropdown de opciones */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-3 text-muted-foreground">
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs">Buscando...</span>
            </div>
          ) : options.length === 0 ? (
            <div className="py-3 text-center text-muted-foreground text-xs">
              {emptyText}
            </div>
          ) : (
            options.map((option, index) => (
              <div
                key={`${option.value}-${index}`}
                onClick={() => handleSelect(option)}
                className={`
                  px-3 py-2 cursor-pointer transition-colors duration-150
                  border-b border-border last:border-0
                  hover:bg-accent
                  ${String(option.value) === String(value) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                <div className="font-medium text-sm text-foreground">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Mostrar seleccionado debajo si existe */}
      {selectedOption && !isOpen && (
        <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
            ✓ Seleccionado: {selectedOption.label}
          </div>
        </div>
      )}
    </div>
  );
}
