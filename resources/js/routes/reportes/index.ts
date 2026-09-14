import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
import codigosBarra from './codigos-barra'
import ventasDiarioCajas from './ventas-diario-cajas'
import precios from './precios'
import ganancias from './ganancias'
import credito from './credito'
import visitas from './visitas'
import inventario from './inventario'
import ventas from './ventas'
/**
* @see \App\Http\Controllers\ReporteCargoListController::estadisticas
 * @see app/Http/Controllers/ReporteCargoListController.php:185
 * @route '/api/reportes/estadisticas'
 */
export const estadisticas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadisticas.url(options),
    method: 'get',
})

estadisticas.definition = {
    methods: ["get","head"],
    url: '/api/reportes/estadisticas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteCargoListController::estadisticas
 * @see app/Http/Controllers/ReporteCargoListController.php:185
 * @route '/api/reportes/estadisticas'
 */
estadisticas.url = (options?: RouteQueryOptions) => {
    return estadisticas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteCargoListController::estadisticas
 * @see app/Http/Controllers/ReporteCargoListController.php:185
 * @route '/api/reportes/estadisticas'
 */
estadisticas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadisticas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteCargoListController::estadisticas
 * @see app/Http/Controllers/ReporteCargoListController.php:185
 * @route '/api/reportes/estadisticas'
 */
estadisticas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: estadisticas.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReporteCargoListController::exportarZip
 * @see app/Http/Controllers/ReporteCargoListController.php:202
 * @route '/api/reportes/exportar-zip'
 */
export const exportarZip = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: exportarZip.url(options),
    method: 'post',
})

exportarZip.definition = {
    methods: ["post"],
    url: '/api/reportes/exportar-zip',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReporteCargoListController::exportarZip
 * @see app/Http/Controllers/ReporteCargoListController.php:202
 * @route '/api/reportes/exportar-zip'
 */
exportarZip.url = (options?: RouteQueryOptions) => {
    return exportarZip.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteCargoListController::exportarZip
 * @see app/Http/Controllers/ReporteCargoListController.php:202
 * @route '/api/reportes/exportar-zip'
 */
exportarZip.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: exportarZip.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ReporteController::impresion
 * @see app/Http/Controllers/ReporteController.php:226
 * @route '/reportes/impresion'
 */
export const impresion = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: impresion.url(options),
    method: 'get',
})

impresion.definition = {
    methods: ["get","head"],
    url: '/reportes/impresion',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteController::impresion
 * @see app/Http/Controllers/ReporteController.php:226
 * @route '/reportes/impresion'
 */
impresion.url = (options?: RouteQueryOptions) => {
    return impresion.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteController::impresion
 * @see app/Http/Controllers/ReporteController.php:226
 * @route '/reportes/impresion'
 */
impresion.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: impresion.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteController::impresion
 * @see app/Http/Controllers/ReporteController.php:226
 * @route '/reportes/impresion'
 */
impresion.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: impresion.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReporteDiarioVentasController::ventasDiarioCajas
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:24
 * @route '/reportes/ventas-diario-cajas'
 */
export const ventasDiarioCajas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ventasDiarioCajas.url(options),
    method: 'get',
})

ventasDiarioCajas.definition = {
    methods: ["get","head"],
    url: '/reportes/ventas-diario-cajas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteDiarioVentasController::ventasDiarioCajas
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:24
 * @route '/reportes/ventas-diario-cajas'
 */
ventasDiarioCajas.url = (options?: RouteQueryOptions) => {
    return ventasDiarioCajas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteDiarioVentasController::ventasDiarioCajas
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:24
 * @route '/reportes/ventas-diario-cajas'
 */
ventasDiarioCajas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ventasDiarioCajas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteDiarioVentasController::ventasDiarioCajas
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:24
 * @route '/reportes/ventas-diario-cajas'
 */
ventasDiarioCajas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ventasDiarioCajas.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReporteVisitasController::visitas
 * @see app/Http/Controllers/ReporteVisitasController.php:19
 * @route '/reportes/visitas'
 */
export const visitas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: visitas.url(options),
    method: 'get',
})

visitas.definition = {
    methods: ["get","head"],
    url: '/reportes/visitas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteVisitasController::visitas
 * @see app/Http/Controllers/ReporteVisitasController.php:19
 * @route '/reportes/visitas'
 */
visitas.url = (options?: RouteQueryOptions) => {
    return visitas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteVisitasController::visitas
 * @see app/Http/Controllers/ReporteVisitasController.php:19
 * @route '/reportes/visitas'
 */
visitas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: visitas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteVisitasController::visitas
 * @see app/Http/Controllers/ReporteVisitasController.php:19
 * @route '/reportes/visitas'
 */
visitas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: visitas.url(options),
    method: 'head',
})
const reportes = {
    estadisticas,
exportarZip,
codigosBarra,
impresion,
ventasDiarioCajas,
precios,
ganancias,
credito,
visitas,
inventario,
ventas,
}

export default reportes