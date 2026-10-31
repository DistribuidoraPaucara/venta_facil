import { formatCurrency } from '@/lib/reportes.utils';
import type { GananciasEstadisticas } from '@/domain/entities/reportes';

interface EstadisticasCardProps {
  estadisticas: GananciasEstadisticas;
  onVerSinCosto?: () => void;
}

/**
 * Resumen del reporte de ganancias. La ganancia y el margen se calculan solo con las ventas que tienen costo.
 */
export function EstadisticasCard({ estadisticas, onVerSinCosto }: EstadisticasCardProps) {
  const e = estadisticas;
  const porcentajeSinCosto = e.ingresos_totales > 0 ? (e.ingresos_sin_costo / e.ingresos_totales) * 100 : 0;

  return (
    <div className="space-y-3">
      {e.ingresos_sin_costo > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <strong>⚠ {formatCurrency(e.ingresos_sin_costo)}</strong> vendidos ({porcentajeSinCosto.toFixed(1)}% del total) son de{' '}
          <strong>{e.productos_sin_costo}</strong> producto{e.productos_sin_costo !== 1 ? 's' : ''} sin precio de costo registrado
          para la fecha o unidad de la venta. Esas ventas <strong>no se suman a la ganancia</strong>.{' '}
          {onVerSinCosto && (
            <button type="button" onClick={onVerSinCosto} className="font-medium underline">
              Ver productos sin costo
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(e.ingresos_totales)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total vendido</p>
          <p className="text-xs text-gray-500">{e.productos_vendidos} productos</p>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{formatCurrency(e.ingresos_con_costo)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Vendido con costo</p>
        </div>

        <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-center">
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(e.costos_totales)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Costo de lo vendido</p>
        </div>

        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
          <p className={`text-xl font-bold ${e.ganancia_total < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {formatCurrency(e.ganancia_total)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Ganancia</p>
        </div>

        <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-center">
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{e.margen === null ? '—' : `${e.margen.toFixed(1)}%`}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400" title="Ganancia ÷ vendido con costo">
            Margen
          </p>
        </div>

        <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-center">
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{e.productos_con_perdida}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Productos con pérdida</p>
        </div>
      </div>
    </div>
  );
}
