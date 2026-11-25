import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EditorProductosController::eliminar
 * @see app/Http/Controllers/EditorProductosController.php:437
 * @route '/inventario/editor-productos/limites/{limite}'
 */
export const eliminar = (args: { limite: string | number } | [limite: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: eliminar.url(args, options),
    method: 'delete',
})

eliminar.definition = {
    methods: ["delete"],
    url: '/inventario/editor-productos/limites/{limite}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EditorProductosController::eliminar
 * @see app/Http/Controllers/EditorProductosController.php:437
 * @route '/inventario/editor-productos/limites/{limite}'
 */
eliminar.url = (args: { limite: string | number } | [limite: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { limite: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    limite: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        limite: args.limite,
                }

    return eliminar.definition.url
            .replace('{limite}', parsedArgs.limite.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EditorProductosController::eliminar
 * @see app/Http/Controllers/EditorProductosController.php:437
 * @route '/inventario/editor-productos/limites/{limite}'
 */
eliminar.delete = (args: { limite: string | number } | [limite: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: eliminar.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\EditorProductosController::eliminar
 * @see app/Http/Controllers/EditorProductosController.php:437
 * @route '/inventario/editor-productos/limites/{limite}'
 */
    const eliminarForm = (args: { limite: string | number } | [limite: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: eliminar.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EditorProductosController::eliminar
 * @see app/Http/Controllers/EditorProductosController.php:437
 * @route '/inventario/editor-productos/limites/{limite}'
 */
        eliminarForm.delete = (args: { limite: string | number } | [limite: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: eliminar.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    eliminar.form = eliminarForm
const limites = {
    eliminar,
}

export default limites