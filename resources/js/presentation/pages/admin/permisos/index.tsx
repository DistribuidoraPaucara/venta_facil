// Presentation: Página de administración de Permisos
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, X, Loader2, SearchX } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Permission {
  id: number;
  name: string;
  description?: string;
  guard_name: string;
}

interface Props {
  permissions?: {
    data?: Permission[];
    links?: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    total?: number;
    current_page?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
  };
  modulos?: string[];
  filters?: {
    search?: string;
    modulo?: string;
  };
}

export default function PermisosIndexPage({
  permissions = { data: [], links: [] },
  modulos = [],
  filters = { search: '', modulo: '' }
}: Props) {
  const [searchQuery, setSearchQuery] = useState(filters?.search || '');
  const [selectedModulo, setSelectedModulo] = useState(filters?.modulo || '');
  const [isLoading, setIsLoading] = useState(false);

  const aplicarFiltros = (search: string, modulo: string) => {
    setIsLoading(true);
    router.get(
      '/permisos',
      { search: search || undefined, modulo: modulo || undefined },
      { preserveState: true, preserveScroll: true, replace: true, onFinish: () => setIsLoading(false) }
    );
  };

  // Debounce solo para el texto; el módulo se aplica al instante
  useEffect(() => {
    if (searchQuery === (filters?.search || '')) return;
    const timer = setTimeout(() => aplicarFiltros(searchQuery, selectedModulo), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleModuloChange = (modulo: string) => {
    setSelectedModulo(modulo);
    aplicarFiltros(searchQuery, modulo);
  };

  const limpiarFiltros = () => {
    setSearchQuery('');
    setSelectedModulo('');
    aplicarFiltros('', '');
  };

  const hayFiltros = Boolean(searchQuery || selectedModulo);
  const total = permissions?.total || 0;

  // Resalta la coincidencia de búsqueda dentro del texto
  const resaltar = (texto: string) => {
    const q = (filters?.search || '').trim();
    if (!q) return texto;
    const i = texto.toLowerCase().indexOf(q.toLowerCase());
    if (i === -1) return texto;
    return (
      <>
        {texto.slice(0, i)}
        <mark className="rounded bg-yellow-200 px-0.5 text-gray-900 dark:bg-yellow-500/40 dark:text-white">
          {texto.slice(i, i + q.length)}
        </mark>
        {texto.slice(i + q.length)}
      </>
    );
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este permiso?')) {
      setIsLoading(true);
      router.delete(`/permisos/${id}`, {
        onFinish: () => setIsLoading(false),
      });
    }
  };

  const handlePageChange = (url: string) => {
    setIsLoading(true);
    router.visit(url, {
      preserveState: true,
      onFinish: () => setIsLoading(false),
    });
  };

  return (
    <AppLayout>
      <Head title="Gestión de Permisos" />
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Permisos</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Gestione los permisos del sistema</p>
          </div>
          <Link
            href="/permisos/create"
            className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo</span>
          </Link>
        </div>

        {/* Filtros */}
        <div className="space-y-3 rounded-lg bg-white p-4 shadow dark:bg-gray-800 dark:shadow-lg">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') aplicarFiltros(searchQuery, selectedModulo);
                  if (e.key === 'Escape' && searchQuery) setSearchQuery('');
                }}
                placeholder="Buscar por nombre o descripción..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-9 text-sm text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
              />
              {isLoading ? (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-500" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                  title="Borrar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            {/* Módulo */}
            <select
              value={selectedModulo}
              onChange={(e) => handleModuloChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 md:w-56 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos los módulos</option>
              {modulos.map((modulo) => (
                <option key={modulo} value={modulo}>
                  {modulo}
                </option>
              ))}
            </select>
          </div>

          {/* Filtros activos + resumen de resultados */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-sm dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              {hayFiltros ? (
                <>
                  <span className="text-gray-500 dark:text-gray-400">Filtrando por:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      Texto: “{searchQuery}”
                      <button type="button" onClick={() => setSearchQuery('')} className="hover:text-indigo-900 dark:hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedModulo && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Módulo: {selectedModulo}
                      <button type="button" onClick={() => handleModuloChange('')} className="hover:text-emerald-900 dark:hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    Limpiar todo
                  </button>
                </>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">Sin filtros aplicados</span>
              )}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {total > 0 && permissions?.from ? (
                <>
                  Mostrando <strong>{permissions.from}–{permissions.to}</strong> de <strong>{total}</strong> permisos
                </>
              ) : (
                <>
                  <strong>{total}</strong> permisos
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow dark:shadow-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Descripción</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Guard</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!permissions?.data || permissions.data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {isLoading ? (
                      'Cargando...'
                    ) : hayFiltros ? (
                      <div className="flex flex-col items-center gap-2">
                        <SearchX className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                        <span>No hay permisos que coincidan con los filtros</span>
                        <button
                          type="button"
                          onClick={limpiarFiltros}
                          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    ) : (
                      'No hay permisos registrados'
                    )}
                  </td>
                </tr>
              ) : (
                permissions.data.map((permission) => (
                  <tr key={permission.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleModuloChange(permission.name.split('.')[0])}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300"
                          title="Filtrar por este módulo"
                        >
                          {permission.name.split('.')[0]}
                        </button>
                        <span className="font-mono">{resaltar(permission.name)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {permission.description ? resaltar(permission.description) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-800 dark:text-gray-300">
                        {permission.guard_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link href={`/permisos/${permission.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(permission.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {permissions?.links && permissions.links.length > 1 && (
          <div className="flex items-center justify-center space-x-2 p-4">
            {permissions.links.map((link, index) => {
              const isDisabled = !link.url;
              const isActive = link.active;

              // Reemplazar las etiquetas HTML
              const label = link.label
                .replace('&laquo;', '«')
                .replace('&raquo;', '»')
                .replace('&lt;', '<')
                .replace('&gt;', '>');

              if (isDisabled) {
                return (
                  <button
                    key={index}
                    disabled
                    className="rounded-lg px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  >
                    {label}
                  </button>
                );
              }

              return (
                <button
                  key={index}
                  onClick={() => link.url && handlePageChange(link.url)}
                  disabled={isLoading}
                  className={`rounded-lg px-3 py-1 text-sm transition-colors ${
                    isActive
                      ? 'border border-indigo-500 bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Info de página actual */}
        {permissions?.current_page && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Página <strong>{permissions.current_page}</strong> de <strong>{permissions.last_page ?? 1}</strong>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
