import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ReporteDiarioVentasController::index
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:21
 * @route '/reportes/ventas-diario-cajas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/reportes/ventas-diario-cajas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReporteDiarioVentasController::index
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:21
 * @route '/reportes/ventas-diario-cajas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReporteDiarioVentasController::index
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:21
 * @route '/reportes/ventas-diario-cajas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReporteDiarioVentasController::index
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:21
 * @route '/reportes/ventas-diario-cajas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReporteDiarioVentasController::index
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:21
 * @route '/reportes/ventas-diario-cajas'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReporteDiarioVentasController::index
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:21
 * @route '/reportes/ventas-diario-cajas'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReporteDiarioVentasController::index
 * @see app/Http/Controllers/ReporteDiarioVentasController.php:21
 * @route '/reportes/ventas-diario-cajas'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
const ReporteDiarioVentasController = { index }

export default ReporteDiarioVentasController