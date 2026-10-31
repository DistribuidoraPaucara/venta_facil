import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ProductoController::destroy
 * @see app/Http/Controllers/ProductoController.php:1229
 * @route '/productos/{producto}/stock-limites/{limite}'
 */
export const destroy = (args: { producto: number | { id: number }, limite: string | number } | [producto: number | { id: number }, limite: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/productos/{producto}/stock-limites/{limite}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProductoController::destroy
 * @see app/Http/Controllers/ProductoController.php:1229
 * @route '/productos/{producto}/stock-limites/{limite}'
 */
destroy.url = (args: { producto: number | { id: number }, limite: string | number } | [producto: number | { id: number }, limite: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    producto: args[0],
                    limite: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        producto: typeof args.producto === 'object'
                ? args.producto.id
                : args.producto,
                                limite: args.limite,
                }

    return destroy.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace('{limite}', parsedArgs.limite.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoController::destroy
 * @see app/Http/Controllers/ProductoController.php:1229
 * @route '/productos/{producto}/stock-limites/{limite}'
 */
destroy.delete = (args: { producto: number | { id: number }, limite: string | number } | [producto: number | { id: number }, limite: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ProductoController::destroy
 * @see app/Http/Controllers/ProductoController.php:1229
 * @route '/productos/{producto}/stock-limites/{limite}'
 */
    const destroyForm = (args: { producto: number | { id: number }, limite: string | number } | [producto: number | { id: number }, limite: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProductoController::destroy
 * @see app/Http/Controllers/ProductoController.php:1229
 * @route '/productos/{producto}/stock-limites/{limite}'
 */
        destroyForm.delete = (args: { producto: number | { id: number }, limite: string | number } | [producto: number | { id: number }, limite: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const stockLimites = {
    destroy,
}

export default stockLimites