import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ConfiguracionStockController::index
 * @see app/Http/Controllers/ConfiguracionStockController.php:16
 * @route '/inventario/configuracion-stock'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventario/configuracion-stock',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ConfiguracionStockController::index
 * @see app/Http/Controllers/ConfiguracionStockController.php:16
 * @route '/inventario/configuracion-stock'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ConfiguracionStockController::index
 * @see app/Http/Controllers/ConfiguracionStockController.php:16
 * @route '/inventario/configuracion-stock'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ConfiguracionStockController::index
 * @see app/Http/Controllers/ConfiguracionStockController.php:16
 * @route '/inventario/configuracion-stock'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ConfiguracionStockController::actualizar
 * @see app/Http/Controllers/ConfiguracionStockController.php:93
 * @route '/inventario/configuracion-stock/actualizar'
 */
export const actualizar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizar.url(options),
    method: 'post',
})

actualizar.definition = {
    methods: ["post"],
    url: '/inventario/configuracion-stock/actualizar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ConfiguracionStockController::actualizar
 * @see app/Http/Controllers/ConfiguracionStockController.php:93
 * @route '/inventario/configuracion-stock/actualizar'
 */
actualizar.url = (options?: RouteQueryOptions) => {
    return actualizar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ConfiguracionStockController::actualizar
 * @see app/Http/Controllers/ConfiguracionStockController.php:93
 * @route '/inventario/configuracion-stock/actualizar'
 */
actualizar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizar.url(options),
    method: 'post',
})
const configuracionStock = {
    index,
actualizar,
}

export default configuracionStock