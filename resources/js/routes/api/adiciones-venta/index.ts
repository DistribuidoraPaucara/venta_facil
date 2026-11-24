import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\AdicionVentaController::index
 * @see app/Http/Controllers/AdicionVentaController.php:20
 * @route '/api/adiciones-venta'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/adiciones-venta',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AdicionVentaController::index
 * @see app/Http/Controllers/AdicionVentaController.php:20
 * @route '/api/adiciones-venta'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdicionVentaController::index
 * @see app/Http/Controllers/AdicionVentaController.php:20
 * @route '/api/adiciones-venta'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AdicionVentaController::index
 * @see app/Http/Controllers/AdicionVentaController.php:20
 * @route '/api/adiciones-venta'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AdicionVentaController::store
 * @see app/Http/Controllers/AdicionVentaController.php:44
 * @route '/api/adiciones-venta'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/adiciones-venta',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AdicionVentaController::store
 * @see app/Http/Controllers/AdicionVentaController.php:44
 * @route '/api/adiciones-venta'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdicionVentaController::store
 * @see app/Http/Controllers/AdicionVentaController.php:44
 * @route '/api/adiciones-venta'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AdicionVentaController::destroy
 * @see app/Http/Controllers/AdicionVentaController.php:96
 * @route '/api/adiciones-venta/{adicion}'
 */
export const destroy = (args: { adicion: number | { id: number } } | [adicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/adiciones-venta/{adicion}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\AdicionVentaController::destroy
 * @see app/Http/Controllers/AdicionVentaController.php:96
 * @route '/api/adiciones-venta/{adicion}'
 */
destroy.url = (args: { adicion: number | { id: number } } | [adicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { adicion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { adicion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    adicion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        adicion: typeof args.adicion === 'object'
                ? args.adicion.id
                : args.adicion,
                }

    return destroy.definition.url
            .replace('{adicion}', parsedArgs.adicion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdicionVentaController::destroy
 * @see app/Http/Controllers/AdicionVentaController.php:96
 * @route '/api/adiciones-venta/{adicion}'
 */
destroy.delete = (args: { adicion: number | { id: number } } | [adicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\AdicionVentaController::productosDisponibles
 * @see app/Http/Controllers/AdicionVentaController.php:111
 * @route '/api/adiciones-venta/productos/disponibles'
 */
export const productosDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(options),
    method: 'get',
})

productosDisponibles.definition = {
    methods: ["get","head"],
    url: '/api/adiciones-venta/productos/disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AdicionVentaController::productosDisponibles
 * @see app/Http/Controllers/AdicionVentaController.php:111
 * @route '/api/adiciones-venta/productos/disponibles'
 */
productosDisponibles.url = (options?: RouteQueryOptions) => {
    return productosDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdicionVentaController::productosDisponibles
 * @see app/Http/Controllers/AdicionVentaController.php:111
 * @route '/api/adiciones-venta/productos/disponibles'
 */
productosDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AdicionVentaController::productosDisponibles
 * @see app/Http/Controllers/AdicionVentaController.php:111
 * @route '/api/adiciones-venta/productos/disponibles'
 */
productosDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: productosDisponibles.url(options),
    method: 'head',
})
const adicionesVenta = {
    index,
store,
destroy,
productosDisponibles,
}

export default adicionesVenta