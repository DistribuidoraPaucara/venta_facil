import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::index
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:42
 * @route '/inventario/actualizar-stock-masivo'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventario/actualizar-stock-masivo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::index
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:42
 * @route '/inventario/actualizar-stock-masivo'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::index
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:42
 * @route '/inventario/actualizar-stock-masivo'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::index
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:42
 * @route '/inventario/actualizar-stock-masivo'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})
const actualizarStockMasivo = {
    index,
}

export default actualizarStockMasivo