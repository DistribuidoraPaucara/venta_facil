import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4927
 * @route '/inventario/movimientos/kardex/exportar'
 */
export const exportar = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportar.url(options),
    method: 'get',
})

exportar.definition = {
    methods: ["get","head"],
    url: '/inventario/movimientos/kardex/exportar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4927
 * @route '/inventario/movimientos/kardex/exportar'
 */
exportar.url = (options?: RouteQueryOptions) => {
    return exportar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4927
 * @route '/inventario/movimientos/kardex/exportar'
 */
exportar.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportar.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4927
 * @route '/inventario/movimientos/kardex/exportar'
 */
exportar.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportar.url(options),
    method: 'head',
})
const kardex = {
    exportar,
}

export default kardex