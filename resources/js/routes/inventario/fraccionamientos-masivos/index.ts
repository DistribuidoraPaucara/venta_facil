import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
 * @see routes/web.php:868
 * @route '/inventario/fraccionamientos-masivos/crear'
 */
export const crear = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: crear.url(options),
    method: 'get',
})

crear.definition = {
    methods: ["get","head"],
    url: '/inventario/fraccionamientos-masivos/crear',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:868
 * @route '/inventario/fraccionamientos-masivos/crear'
 */
crear.url = (options?: RouteQueryOptions) => {
    return crear.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:868
 * @route '/inventario/fraccionamientos-masivos/crear'
 */
crear.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: crear.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:868
 * @route '/inventario/fraccionamientos-masivos/crear'
 */
crear.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: crear.url(options),
    method: 'head',
})

/**
 * @see routes/web.php:869
 * @route '/inventario/fraccionamientos-masivos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventario/fraccionamientos-masivos',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:869
 * @route '/inventario/fraccionamientos-masivos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:869
 * @route '/inventario/fraccionamientos-masivos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:869
 * @route '/inventario/fraccionamientos-masivos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})
const fraccionamientosMasivos = {
    crear,
index,
}

export default fraccionamientosMasivos