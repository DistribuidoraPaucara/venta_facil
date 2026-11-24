import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:37
 * @route '/api/app/ingresos'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/app/ingresos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:37
 * @route '/api/app/ingresos'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:37
 * @route '/api/app/ingresos'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})
const IngresosController = { store }

export default IngresosController