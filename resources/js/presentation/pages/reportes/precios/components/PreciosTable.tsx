import { router } from '@inertiajs/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import { Button } from '@/presentation/components/ui/button';
import { formatCurrency } from '@/lib/reportes.utils';
import type { PreciosPaginatedData } from '@/domain/entities/reportes';

interface PreciosTableProps {
  cambios: PreciosPaginatedData;
}

const formatFecha = (fecha: string | null) => {
  if (!fecha) return '—';
  const d = new Date(fecha.replace(' ', 'T'));
  return isNaN(d.getTime())
    ? fecha
    : d.toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export function PreciosTable({ cambios }: PreciosTableProps) {
  return (
    <div>
      <div className="p-2">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">Actualizaciones de precios</h3>
          {cambios.total > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {cambios.from}–{cambios.to} de {cambios.total}
            </span>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Tipo de precio</TableHead>
              <TableHead className="text-right">Anterior</TableHead>
              <TableHead className="text-right">Nuevo</TableHead>
              <TableHead className="text-right">Variación</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cambios.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay cambios de precio con los filtros seleccionados
                </TableCell>
              </TableRow>
            ) : (
              cambios.data.map((c) => {
                const sube = c.valor_nuevo > c.valor_anterior;
                const baja = c.valor_nuevo < c.valor_anterior;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap text-gray-600 dark:text-gray-400">{formatFecha(c.fecha_cambio)}</TableCell>

                    <TableCell>
                      {c.producto ? (
                        <>
                          <a
                            href={`/productos/${c.producto.id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {c.producto.nombre}
                          </a>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            #{c.producto.id}
                            {c.producto.sku && <> · {c.producto.sku}</>}
                          </div>
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.tipo_precio?.color || '#999999' }}
                        />
                        {c.tipo_precio?.nombre ?? '—'}
                      </span>
                      {c.unidad_medida && <div className="text-xs text-gray-500 dark:text-gray-400">{c.unidad_medida}</div>}
                      {!c.precio_activo && <div className="text-xs text-gray-400">(precio inactivo)</div>}
                    </TableCell>

                    <TableCell className="text-right text-gray-500 dark:text-gray-400">{formatCurrency(c.valor_anterior)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(c.valor_nuevo)}</TableCell>

                    <TableCell
                      className={`text-right whitespace-nowrap font-medium ${
                        sube ? 'text-green-600 dark:text-green-400' : baja ? 'text-red-600 dark:text-red-400' : 'text-gray-500'
                      }`}
                    >
                      {sube ? '▲ +' : baja ? '▼ ' : ''}
                      {formatCurrency(c.variacion)}
                      {c.porcentaje_cambio !== null && (
                        <div className="text-xs font-normal">
                          {c.porcentaje_cambio > 0 ? '+' : ''}
                          {c.porcentaje_cambio.toFixed(1)}%
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-gray-700 dark:text-gray-300">{c.motivo || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-gray-700 dark:text-gray-300">{c.usuario || '—'}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {cambios.links && cambios.links.length > 3 && (
        <div className="flex flex-wrap justify-center gap-1 p-4">
          {cambios.links.map((link, index) => (
            <Button
              key={index}
              variant={link.active ? 'default' : 'outline'}
              size="sm"
              disabled={!link.url}
              onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
