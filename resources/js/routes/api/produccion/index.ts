import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ProduccionController::reporteExcel
 * @see app/Http/Controllers/ProduccionController.php:444
 * @route '/api/produccion/reporte/excel'
 */
export const reporteExcel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteExcel.url(options),
    method: 'get',
})

reporteExcel.definition = {
    methods: ["get","head"],
    url: '/api/produccion/reporte/excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProduccionController::reporteExcel
 * @see app/Http/Controllers/ProduccionController.php:444
 * @route '/api/produccion/reporte/excel'
 */
reporteExcel.url = (options?: RouteQueryOptions) => {
    return reporteExcel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionController::reporteExcel
 * @see app/Http/Controllers/ProduccionController.php:444
 * @route '/api/produccion/reporte/excel'
 */
reporteExcel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteExcel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProduccionController::reporteExcel
 * @see app/Http/Controllers/ProduccionController.php:444
 * @route '/api/produccion/reporte/excel'
 */
reporteExcel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reporteExcel.url(options),
    method: 'head',
})
const produccion = {
    reporteExcel,
}

export default produccion