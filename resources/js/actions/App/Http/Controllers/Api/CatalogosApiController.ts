import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::categorias
 * @see app/Http/Controllers/Api/CatalogosApiController.php:15
 * @route '/api/app/categorias'
 */
export const categorias = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: categorias.url(options),
    method: 'get',
})

categorias.definition = {
    methods: ["get","head"],
    url: '/api/app/categorias',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::categorias
 * @see app/Http/Controllers/Api/CatalogosApiController.php:15
 * @route '/api/app/categorias'
 */
categorias.url = (options?: RouteQueryOptions) => {
    return categorias.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::categorias
 * @see app/Http/Controllers/Api/CatalogosApiController.php:15
 * @route '/api/app/categorias'
 */
categorias.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: categorias.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::categorias
 * @see app/Http/Controllers/Api/CatalogosApiController.php:15
 * @route '/api/app/categorias'
 */
categorias.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: categorias.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::proveedores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:37
 * @route '/api/app/proveedores'
 */
export const proveedores = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proveedores.url(options),
    method: 'get',
})

proveedores.definition = {
    methods: ["get","head"],
    url: '/api/app/proveedores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::proveedores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:37
 * @route '/api/app/proveedores'
 */
proveedores.url = (options?: RouteQueryOptions) => {
    return proveedores.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::proveedores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:37
 * @route '/api/app/proveedores'
 */
proveedores.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proveedores.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::proveedores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:37
 * @route '/api/app/proveedores'
 */
proveedores.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: proveedores.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::almacenes
 * @see app/Http/Controllers/Api/CatalogosApiController.php:59
 * @route '/api/app/almacenes'
 */
export const almacenes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: almacenes.url(options),
    method: 'get',
})

almacenes.definition = {
    methods: ["get","head"],
    url: '/api/app/almacenes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::almacenes
 * @see app/Http/Controllers/Api/CatalogosApiController.php:59
 * @route '/api/app/almacenes'
 */
almacenes.url = (options?: RouteQueryOptions) => {
    return almacenes.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::almacenes
 * @see app/Http/Controllers/Api/CatalogosApiController.php:59
 * @route '/api/app/almacenes'
 */
almacenes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: almacenes.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::almacenes
 * @see app/Http/Controllers/Api/CatalogosApiController.php:59
 * @route '/api/app/almacenes'
 */
almacenes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: almacenes.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:70
 * @route '/api/app/sectores'
 */
export const sectores = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sectores.url(options),
    method: 'get',
})

sectores.definition = {
    methods: ["get","head"],
    url: '/api/app/sectores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:70
 * @route '/api/app/sectores'
 */
sectores.url = (options?: RouteQueryOptions) => {
    return sectores.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:70
 * @route '/api/app/sectores'
 */
sectores.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sectores.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:70
 * @route '/api/app/sectores'
 */
sectores.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: sectores.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectoresPorAlmacen
 * @see app/Http/Controllers/Api/CatalogosApiController.php:80
 * @route '/api/app/almacenes/{almacen_id}/sectores'
 */
export const sectoresPorAlmacen = (args: { almacen_id: string | number } | [almacen_id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sectoresPorAlmacen.url(args, options),
    method: 'get',
})

sectoresPorAlmacen.definition = {
    methods: ["get","head"],
    url: '/api/app/almacenes/{almacen_id}/sectores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectoresPorAlmacen
 * @see app/Http/Controllers/Api/CatalogosApiController.php:80
 * @route '/api/app/almacenes/{almacen_id}/sectores'
 */
sectoresPorAlmacen.url = (args: { almacen_id: string | number } | [almacen_id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { almacen_id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    almacen_id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        almacen_id: args.almacen_id,
                }

    return sectoresPorAlmacen.definition.url
            .replace('{almacen_id}', parsedArgs.almacen_id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectoresPorAlmacen
 * @see app/Http/Controllers/Api/CatalogosApiController.php:80
 * @route '/api/app/almacenes/{almacen_id}/sectores'
 */
sectoresPorAlmacen.get = (args: { almacen_id: string | number } | [almacen_id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sectoresPorAlmacen.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectoresPorAlmacen
 * @see app/Http/Controllers/Api/CatalogosApiController.php:80
 * @route '/api/app/almacenes/{almacen_id}/sectores'
 */
sectoresPorAlmacen.head = (args: { almacen_id: string | number } | [almacen_id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: sectoresPorAlmacen.url(args, options),
    method: 'head',
})
const CatalogosApiController = { categorias, proveedores, almacenes, sectores, sectoresPorAlmacen }

export default CatalogosApiController