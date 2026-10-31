import type { PreciosEstadisticas } from '@/domain/entities/reportes';

interface PreciosEstadisticasCardProps {
  estadisticas: PreciosEstadisticas;
}

export function PreciosEstadisticasCard({ estadisticas }: PreciosEstadisticasCardProps) {
  const promedio = estadisticas.variacion_promedio;

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{estadisticas.total_cambios}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Cambios</p>
      </div>

      <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-center">
        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{estadisticas.productos_afectados}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Productos afectados</p>
      </div>

      <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">▲ {estadisticas.subidas}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Subidas</p>
      </div>

      <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-center">
        <p className="text-2xl font-bold text-red-600 dark:text-red-400">▼ {estadisticas.bajadas}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Bajadas</p>
      </div>

      <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-center">
        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {promedio === null ? '—' : `${promedio > 0 ? '+' : ''}${promedio.toFixed(1)}%`}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400" title="Promedio de la variación % (sin altas ni bajas a 0)">
          Variación promedio
        </p>
      </div>

      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cambios por usuario</p>
        {estadisticas.por_usuario.length === 0 ? (
          <p className="text-sm text-gray-500">—</p>
        ) : (
          estadisticas.por_usuario.map((u) => (
            <div key={u.usuario} className="flex justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="truncate">{u.usuario}</span>
              <span className="font-semibold">{u.cambios}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
