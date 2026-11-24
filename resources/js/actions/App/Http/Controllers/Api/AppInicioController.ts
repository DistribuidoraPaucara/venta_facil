import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\AppInicioController::resumen
 * @see app/Http/Controllers/Api/AppInicioController.php:60
 * @route '/api/app/inicio'
 */
export const resumen = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: resumen.url(options),
    method: 'get',
})

resumen.definition = {
    methods: ["get","head"],
    url: '/api/app/inicio',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AppInicioController::resumen
 * @see app/Http/Controllers/Api/AppInicioController.php:60
 * @route '/api/app/inicio'
 */
resumen.url = (options?: RouteQueryOptions) => {
    return resumen.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AppInicioController::resumen
 * @see app/Http/Controllers/Api/AppInicioController.php:60
 * @route '/api/app/inicio'
 */
resumen.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: resumen.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AppInicioController::resumen
 * @see app/Http/Controllers/Api/AppInicioController.php:60
 * @route '/api/app/inicio'
 */
resumen.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: resumen.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\AppInicioController::indicadores
 * @see app/Http/Controllers/Api/AppInicioController.php:35
 * @route '/api/app/indicadores'
 */
export const indicadores = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indicadores.url(options),
    method: 'get',
})

indicadores.definition = {
    methods: ["get","head"],
    url: '/api/app/indicadores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\AppInicioController::indicadores
 * @see app/Http/Controllers/Api/AppInicioController.php:35
 * @route '/api/app/indicadores'
 */
indicadores.url = (options?: RouteQueryOptions) => {
    return indicadores.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\AppInicioController::indicadores
 * @see app/Http/Controllers/Api/AppInicioController.php:35
 * @route '/api/app/indicadores'
 */
indicadores.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indicadores.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\AppInicioController::indicadores
 * @see app/Http/Controllers/Api/AppInicioController.php:35
 * @route '/api/app/indicadores'
 */
indicadores.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indicadores.url(options),
    method: 'head',
})
const AppInicioController = { resumen, indicadores }

export default AppInicioController