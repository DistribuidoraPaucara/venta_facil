import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EditorProductosController::baja
 * @see app/Http/Controllers/EditorProductosController.php:494
 * @route '/inventario/editor-productos/lotes/{stock}'
 */
export const baja = (args: { stock: string | number } | [stock: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: baja.url(args, options),
    method: 'delete',
})

baja.definition = {
    methods: ["delete"],
    url: '/inventario/editor-productos/lotes/{stock}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EditorProductosController::baja
 * @see app/Http/Controllers/EditorProductosController.php:494
 * @route '/inventario/editor-productos/lotes/{stock}'
 */
baja.url = (args: { stock: string | number } | [stock: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { stock: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    stock: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        stock: args.stock,
                }

    return baja.definition.url
            .replace('{stock}', parsedArgs.stock.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EditorProductosController::baja
 * @see app/Http/Controllers/EditorProductosController.php:494
 * @route '/inventario/editor-productos/lotes/{stock}'
 */
baja.delete = (args: { stock: string | number } | [stock: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: baja.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\EditorProductosController::baja
 * @see app/Http/Controllers/EditorProductosController.php:494
 * @route '/inventario/editor-productos/lotes/{stock}'
 */
    const bajaForm = (args: { stock: string | number } | [stock: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: baja.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EditorProductosController::baja
 * @see app/Http/Controllers/EditorProductosController.php:494
 * @route '/inventario/editor-productos/lotes/{stock}'
 */
        bajaForm.delete = (args: { stock: string | number } | [stock: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: baja.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    baja.form = bajaForm
const lotes = {
    baja,
}

export default lotes