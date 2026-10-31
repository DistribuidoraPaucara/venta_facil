import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1118
 * @route '/inventario/ajustes/{ajuste}'
 */
export const show = (args: { ajuste: string | number } | [ajuste: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/inventario/ajustes/{ajuste}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1118
 * @route '/inventario/ajustes/{ajuste}'
 */
show.url = (args: { ajuste: string | number } | [ajuste: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { ajuste: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    ajuste: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        ajuste: args.ajuste,
                }

    return show.definition.url
            .replace('{ajuste}', parsedArgs.ajuste.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1118
 * @route '/inventario/ajustes/{ajuste}'
 */
show.get = (args: { ajuste: string | number } | [ajuste: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1118
 * @route '/inventario/ajustes/{ajuste}'
 */
show.head = (args: { ajuste: string | number } | [ajuste: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1118
 * @route '/inventario/ajustes/{ajuste}'
 */
    const showForm = (args: { ajuste: string | number } | [ajuste: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1118
 * @route '/inventario/ajustes/{ajuste}'
 */
        showForm.get = (args: { ajuste: string | number } | [ajuste: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::show
 * @see app/Http/Controllers/InventarioController.php:1118
 * @route '/inventario/ajustes/{ajuste}'
 */
        showForm.head = (args: { ajuste: string | number } | [ajuste: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const ajustes = {
    show,
}

export default ajustes