import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
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

    /**
* @see \App\Http\Controllers\ReporteDiarioVentasController::excel
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:40
 * @route '/reportes/ventas-diario-cajas/excel'
 */
    const excelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: excel.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteDiarioVentasController::excel
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:40
 * @route '/reportes/ventas-diario-cajas/excel'
 */
        excelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: excel.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteDiarioVentasController::excel
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:40
 * @route '/reportes/ventas-diario-cajas/excel'
 */
        excelForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: excel.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    excel.form = excelForm
const ventasDiarioCajas = {
    excel,
}

export default ventasDiarioCajas