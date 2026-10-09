import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:12
 * @route '/inventario/productos-compra'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventario/productos-compra',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:12
 * @route '/inventario/productos-compra'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:12
 * @route '/inventario/productos-compra'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:12
 * @route '/inventario/productos-compra'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:12
 * @route '/inventario/productos-compra'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:12
 * @route '/inventario/productos-compra'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:12
 * @route '/inventario/productos-compra'
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
const productosCompra = {
    index,
}

export default productosCompra