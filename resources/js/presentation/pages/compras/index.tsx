import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { useAuth } from '@/application/hooks/use-auth';
import FiltrosComprasComponent from '@/presentation/components/compras/filtros-compras';
import EstadisticasComprasComponent from '@/presentation/components/compras/estadisticas-compras';
import TablaCompras from '@/presentation/components/compras/tabla-compras';
import { ImprimirComprasButton } from '@/presentation/components/impresion/ImprimirComprasButton';
import comprasService from '@/infrastructure/services/compras.service';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

// Pestañas de estado en este orden; los demás estados solo aparecen si tienen compras
const ESTADOS_PESTANAS = ['BORRADOR', 'PENDIENTE', 'APROBADO', 'FACTURADO', 'ANULADO', 'CANCELADO'];
const ESTADOS_SIEMPRE_VISIBLES = ['BORRADOR', 'APROBADO', 'ANULADO'];

// Importar tipos del domain
import type {
  Compra,
  FiltrosCompras,
  EstadisticasCompras,
  DatosParaFiltrosCompras
} from '@/domain/entities/compras';
import type { Pagination } from '@/domain/entities/shared';

interface PageProps extends InertiaPageProps {
  compras: Pagination<Compra>;
  filtros: FiltrosCompras;
  estadisticas: EstadisticasCompras;
  datosParaFiltros: DatosParaFiltrosCompras;
}

export default function ComprasIndex() {
  const { props } = usePage<PageProps>();
  const { can } = useAuth();

  const compras = props.compras;
  const filtros = props.filtros || {};
  const estadisticas = props.estadisticas;
  const datosParaFiltros = props.datosParaFiltros;

  // Pestañas de estado: contadores con los demás filtros aplicados (los calcula el backend)
  const estadosConConteo = (datosParaFiltros?.estados ?? [])
    .filter((e) => ESTADOS_PESTANAS.includes(e.codigo ?? '') && (ESTADOS_SIEMPRE_VISIBLES.includes(e.codigo ?? '') || (e.cantidad ?? 0) > 0))
    .sort((a, b) => ESTADOS_PESTANAS.indexOf(a.codigo ?? '') - ESTADOS_PESTANAS.indexOf(b.codigo ?? ''));
  const totalTodas = (datosParaFiltros?.estados ?? []).reduce((sum, e) => sum + (e.cantidad ?? 0), 0);
  const estadoActivo = filtros.estado_documento_id ? String(filtros.estado_documento_id) : '';

  // Cambia de pestaña conservando los demás filtros (y volviendo a la página 1)
  const elegirEstado = (estadoId: string) => {
    const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
    delete params.page;
    comprasService.search({ ...params, estado_documento_id: estadoId });
  };

  // Compras por página (el backend acepta de 10 a 100); vuelve a la página 1
  const porPagina = Number(compras.per_page) || 15;
  const cambiarPorPagina = (valor: number) => {
    const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
    delete params.page;
    comprasService.search({ ...params, per_page: String(valor) } as typeof params);
  };

  // Links de Laravel: el primero y el último son "anterior"/"siguiente" (etiquetas en inglés): se usan flechas
  const enlacesPagina = compras.links ?? [];

  return (
    <AppLayout breadcrumbs={[{ title: 'Compras', href: '/compras' }]}>
      <Head title="Compras" />

      <div className="space-y-2 p-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Compras</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {compras.total > 0
                ? `${compras.from}-${compras.to} de ${compras.total} compras`
                : 'No se encontraron compras'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {compras.data && compras.data.length > 0 && (
              <ImprimirComprasButton
                compras={compras.data}
                filtros={filtros}
              />
            )}
            {can('compras.create') && (
              <Link
                href="/compras/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva compra
              </Link>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        {/* {estadisticas && (
          <EstadisticasComprasComponent estadisticas={estadisticas} />
        )} */}

        {/* Filtros */}
        <FiltrosComprasComponent
          filtros={filtros}
          datosParaFiltros={datosParaFiltros}
        />

        {/* Pestañas de estado */}
        {estadosConConteo.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {[{ id: '', nombre: 'Todas', cantidad: totalTodas }, ...estadosConConteo.map((e) => ({ id: String(e.id), nombre: e.nombre, cantidad: e.cantidad ?? 0 }))].map(
              (pestana) => (
                <button
                  key={pestana.id || 'todas'}
                  type="button"
                  onClick={() => elegirEstado(pestana.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    estadoActivo === pestana.id
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {pestana.nombre} ({pestana.cantidad})
                </button>
              ),
            )}
          </div>
        )}

        {/* Tabla de Compras */}
        <TablaCompras
          compras={compras.data}
          sortBy={filtros.sort_by}
          sortDir={filtros.sort_dir}
        />

        {/* Paginación: siempre visible (con 1 sola página muestra el total y el selector por página) */}
        {compras.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-gray-800">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <span>
                Mostrando {compras.from}–{compras.to} de {compras.total} compra{compras.total !== 1 ? 's' : ''}
              </span>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Por página</span>
                <select
                  value={porPagina}
                  onChange={(e) => cambiarPorPagina(Number(e.target.value))}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900"
                >
                  {[10, 15, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {compras.last_page > 1 && (
              <div className="flex items-center gap-1">
                {enlacesPagina.map((link, index) => {
                  const esAnterior = index === 0;
                  const esSiguiente = index === enlacesPagina.length - 1;
                  const contenido = esAnterior ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : esSiguiente ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                  );
                  const clase = `inline-flex min-w-9 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
                    link.active
                      ? 'bg-blue-600 text-white'
                      : link.url
                        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                  }`;

                  // Sin URL ("..." o anterior/siguiente en el borde): no es un enlace
                  return link.url ? (
                    <Link
                      key={index}
                      href={link.url}
                      className={clase}
                      title={esAnterior ? 'Página anterior' : esSiguiente ? 'Página siguiente' : undefined}
                      preserveState
                      preserveScroll
                      replace
                    >
                      {contenido}
                    </Link>
                  ) : (
                    <span key={index} className={clase}>
                      {contenido}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
