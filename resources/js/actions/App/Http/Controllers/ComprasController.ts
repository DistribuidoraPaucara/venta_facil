import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
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
* @see \App\Http\Controllers\ComprasController::crearBorrador
 * @see app/Http/Controllers/ComprasController.php:125
 * @route '/inventario/productos-compra/orden'
 */
export const crearBorrador = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearBorrador.url(options),
    method: 'post',
})

crearBorrador.definition = {
    methods: ["post"],
    url: '/inventario/productos-compra/orden',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ComprasController::crearBorrador
 * @see app/Http/Controllers/ComprasController.php:125
 * @route '/inventario/productos-compra/orden'
 */
crearBorrador.url = (options?: RouteQueryOptions) => {
    return crearBorrador.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ComprasController::crearBorrador
 * @see app/Http/Controllers/ComprasController.php:125
 * @route '/inventario/productos-compra/orden'
 */
crearBorrador.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: crearBorrador.url(options),
    method: 'post',
})
const ComprasController = { index, crearBorrador }

export default ComprasController