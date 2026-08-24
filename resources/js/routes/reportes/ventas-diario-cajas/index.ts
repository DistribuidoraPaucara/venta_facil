import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ReporteDiarioVentasController::excel
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:40
 * @route '/reportes/ventas-diario-cajas/excel'
 */
export const excel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: excel.url(options),
    method: 'get',
})

excel.definition = {
    methods: ["get","head"],
    url: '/reportes/ventas-diario-cajas/excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteDiarioVentasController::excel
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:40
 * @route '/reportes/ventas-diario-cajas/excel'
 */
excel.url = (options?: RouteQueryOptions) => {
    return excel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteDiarioVentasController::excel
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:40
 * @route '/reportes/ventas-diario-cajas/excel'
 */
excel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: excel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteDiarioVentasController::excel
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:40
 * @route '/reportes/ventas-diario-cajas/excel'
 */
excel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: excel.url(options),
    method: 'head',
})
const ventasDiarioCajas = {
    excel,
}

export default ventasDiarioCajas