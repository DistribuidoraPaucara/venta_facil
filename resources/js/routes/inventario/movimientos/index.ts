import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
import kardex from './kardex'
/**
* @see \App\Http\Controllers\ImpresionMovimientosController::imprimir
 * @see app/Http/Controllers/ImpresionMovimientosController.php:16
 * @route '/inventario/movimientos/imprimir'
 */
export const imprimir = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(options),
    method: 'get',
})

imprimir.definition = {
    methods: ["get","head"],
    url: '/inventario/movimientos/imprimir',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ImpresionMovimientosController::imprimir
 * @see app/Http/Controllers/ImpresionMovimientosController.php:16
 * @route '/inventario/movimientos/imprimir'
 */
imprimir.url = (options?: RouteQueryOptions) => {
    return imprimir.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ImpresionMovimientosController::imprimir
 * @see app/Http/Controllers/ImpresionMovimientosController.php:16
 * @route '/inventario/movimientos/imprimir'
 */
imprimir.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ImpresionMovimientosController::imprimir
 * @see app/Http/Controllers/ImpresionMovimientosController.php:16
 * @route '/inventario/movimientos/imprimir'
 */
imprimir.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimir.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4700
 * @route '/inventario/movimientos/exportar'
 */
export const exportar = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportar.url(options),
    method: 'get',
})

exportar.definition = {
    methods: ["get","head"],
    url: '/inventario/movimientos/exportar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4700
 * @route '/inventario/movimientos/exportar'
 */
exportar.url = (options?: RouteQueryOptions) => {
    return exportar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4700
 * @route '/inventario/movimientos/exportar'
 */
exportar.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportar.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4700
 * @route '/inventario/movimientos/exportar'
 */
exportar.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportar.url(options),
    method: 'head',
})
const movimientos = {
    imprimir,
exportar,
kardex,
}

export default movimientos