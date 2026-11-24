import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
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

    /**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:37
 * @route '/api/app/ingresos'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:37
 * @route '/api/app/ingresos'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const IngresosController = { store }

export default IngresosController