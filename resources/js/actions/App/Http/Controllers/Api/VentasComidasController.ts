import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\VentasComidasController::store
 * @see app/Http/Controllers/Api/VentasComidasController.php:66
 * @route '/api/ventas-comidas'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/ventas-comidas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\VentasComidasController::store
 * @see app/Http/Controllers/Api/VentasComidasController.php:66
 * @route '/api/ventas-comidas'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\VentasComidasController::store
 * @see app/Http/Controllers/Api/VentasComidasController.php:66
 * @route '/api/ventas-comidas'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\VentasComidasController::store
 * @see app/Http/Controllers/Api/VentasComidasController.php:66
 * @route '/api/ventas-comidas'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\VentasComidasController::store
 * @see app/Http/Controllers/Api/VentasComidasController.php:66
 * @route '/api/ventas-comidas'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\VentasComidasController::show
 * @see app/Http/Controllers/Api/VentasComidasController.php:383
 * @route '/api/ventas-comidas/{venta}'
 */
export const show = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/ventas-comidas/{venta}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\VentasComidasController::show
 * @see app/Http/Controllers/Api/VentasComidasController.php:383
 * @route '/api/ventas-comidas/{venta}'
 */
show.url = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { venta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { venta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    venta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        venta: typeof args.venta === 'object'
                ? args.venta.id
                : args.venta,
                }

    return show.definition.url
            .replace('{venta}', parsedArgs.venta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\VentasComidasController::show
 * @see app/Http/Controllers/Api/VentasComidasController.php:383
 * @route '/api/ventas-comidas/{venta}'
 */
show.get = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\VentasComidasController::show
 * @see app/Http/Controllers/Api/VentasComidasController.php:383
 * @route '/api/ventas-comidas/{venta}'
 */
show.head = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\VentasComidasController::show
 * @see app/Http/Controllers/Api/VentasComidasController.php:383
 * @route '/api/ventas-comidas/{venta}'
 */
    const showForm = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\VentasComidasController::show
 * @see app/Http/Controllers/Api/VentasComidasController.php:383
 * @route '/api/ventas-comidas/{venta}'
 */
        showForm.get = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\VentasComidasController::show
 * @see app/Http/Controllers/Api/VentasComidasController.php:383
 * @route '/api/ventas-comidas/{venta}'
 */
        showForm.head = (args: { venta: number | { id: number } } | [venta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const VentasComidasController = { store, show }

export default VentasComidasController