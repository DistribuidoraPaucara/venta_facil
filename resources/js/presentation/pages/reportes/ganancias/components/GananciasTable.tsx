import type { GananciasPaginatedData, OrdenGanancias } from '@/domain/entities/reportes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import { formatCurrency } from '@/lib/reportes.utils';

interface GananciasTableProps {
  ganancias: GananciasPaginatedData;
  orden: string;
  direccion: string;
  onOrdenar: (columna: OrdenGanancias) => void;
}

const formatCantidad = (n: number) => (Number.isInteger(n) ? n.toString() : n.toFixed(2));

/**
 * Ganancia por producto, unidad y tipo de precio sobre ventas reales
 */
export function GananciasTable({ ganancias, orden, direccion, onOrdenar }: GananciasTableProps) {
  // Encabezado clicable: ordena por la columna y alterna asc/desc
  const encabezado = (columna: OrdenGanancias, texto: string, derecha = true) => (
    <TableHead className={derecha ? 'text-right' : ''}>
      <button
        type="button"
        onClick={() => onOrdenar(columna)}
        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
        title={`Ordenar por ${texto.toLowerCase()}`}
      >
        {texto}
        <span className={orden === columna ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}>
          {orden === columna ? (direccion === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </TableHead>
  );

  return (
    <div className="p-2">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">Ganancia por producto</h3>
        {ganancias.total > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {ganancias.from}–{ganancias.to} de {ganancias.total}
          </span>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {encabezado('producto', 'Producto', false)}
            <TableHead>Tipo de precio</TableHead>
            {encabezado('cantidad', 'Cantidad')}
            <TableHead className="text-right">Precio prom.</TableHead>
            <TableHead className="text-right">Costo prom.</TableHead>
            {encabezado('ingresos', 'Vendido')}
            <TableHead className="text-right">Costo total</TableHead>
            {encabezado('ganancia', 'Ganancia')}
            {encabezado('margen', 'Margen')}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ganancias.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                No hay ventas con los filtros seleccionados
              </TableCell>
            </TableRow>
          ) : (
            ganancias.data.map((g) => {
              const sinCosto = g.estado_costo === 'sin_costo';
              return (
                <TableRow key={g.key} className={sinCosto ? 'bg-amber-50/60 dark:bg-amber-950/10' : ''}>
                  <TableCell>
                    <a
                      href={`/productos/${g.producto.id}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      title="Editar producto en otra pestaña"
                    >
                      {g.producto.nombre}
                    </a>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      #{g.producto.id}
                      {g.producto.sku && <> · {g.producto.sku}</>}
                      {g.unidad_medida && <> · {g.unidad_medida}</>}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: g.tipo_precio.color || '#999999' }} />
                      {g.tipo_precio.nombre}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">{formatCantidad(g.cantidad_vendida)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(g.precio_promedio)}</TableCell>
                  <TableCell className="text-right text-gray-600 dark:text-gray-400">
                    {g.costo_promedio === null ? '—' : formatCurrency(g.costo_promedio)}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(g.ingresos_totales)}</TableCell>

                  {sinCosto ? (
                    <TableCell colSpan={3} className="text-center text-amber-700 dark:text-amber-300">
                      ⚠ Sin costo registrado
                    </TableCell>
                  ) : (
                    <>
                      <TableCell className="text-right text-gray-600 dark:text-gray-400">{formatCurrency(g.costos_totales)}</TableCell>
                      <TableCell
                        className={`text-right font-semibold ${g.ganancia < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                      >
                        {formatCurrency(g.ganancia)}
                        {g.estado_costo === 'parcial' && (
                          <div
                            className="text-xs font-normal text-amber-700 dark:text-amber-300"
                            title="Parte de las ventas no tiene costo para su fecha o unidad y no se suma a la ganancia"
                          >
                            ⚠ {formatCurrency(g.ingresos_sin_costo)} sin costo
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {g.margen === null ? '—' : `${g.margen.toFixed(1)}%`}
                        {g.markup !== null && (
                          <div className="text-xs text-gray-500 dark:text-gray-400" title="Ganancia sobre el costo">
                            {g.markup.toFixed(1)}% s/costo
                          </div>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
