import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:21
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
 * @see app/Http/Controllers/ComprasController.php:21
 * @route '/inventario/productos-compra'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:21
 * @route '/inventario/productos-compra'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:21
 * @route '/inventario/productos-compra'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:21
 * @route '/inventario/productos-compra'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:21
 * @route '/inventario/productos-compra'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ComprasController::index
 * @see app/Http/Controllers/ComprasController.php:21
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
/**
* @see \App\Http\Controllers\ComprasController::orden
 * @see app/Http/Controllers/ComprasController.php:109
 * @route '/inventario/productos-compra/orden'
 */
export const orden = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: orden.url(options),
    method: 'post',
})

orden.definition = {
    methods: ["post"],
    url: '/inventario/productos-compra/orden',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ComprasController::orden
 * @see app/Http/Controllers/ComprasController.php:109
 * @route '/inventario/productos-compra/orden'
 */
orden.url = (options?: RouteQueryOptions) => {
    return orden.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ComprasController::orden
 * @see app/Http/Controllers/ComprasController.php:109
 * @route '/inventario/productos-compra/orden'
 */
orden.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: orden.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ComprasController::orden
 * @see app/Http/Controllers/ComprasController.php:109
 * @route '/inventario/productos-compra/orden'
 */
    const ordenForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: orden.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ComprasController::orden
 * @see app/Http/Controllers/ComprasController.php:109
 * @route '/inventario/productos-compra/orden'
 */
        ordenForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: orden.url(options),
            method: 'post',
        })
    
    orden.form = ordenForm
const productosCompra = {
    index,
orden,
}

export default productosCompra