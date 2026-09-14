import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\RecetaController::store
 * @see app/Http/Controllers/RecetaController.php:126
 * @route '/api/recetas/{receta}/ingredientes'
 */
export const store = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/recetas/{receta}/ingredientes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RecetaController::store
 * @see app/Http/Controllers/RecetaController.php:126
 * @route '/api/recetas/{receta}/ingredientes'
 */
store.url = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { receta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { receta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    receta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        receta: typeof args.receta === 'object'
                ? args.receta.id
                : args.receta,
                }

    return store.definition.url
            .replace('{receta}', parsedArgs.receta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RecetaController::store
 * @see app/Http/Controllers/RecetaController.php:126
 * @route '/api/recetas/{receta}/ingredientes'
 */
store.post = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RecetaController::destroy
 * @see app/Http/Controllers/RecetaController.php:175
 * @route '/api/recetas/{receta}/ingredientes/{ingrediente}'
 */
export const destroy = (args: { receta: number | { id: number }, ingrediente: number | { id: number } } | [receta: number | { id: number }, ingrediente: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/recetas/{receta}/ingredientes/{ingrediente}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\RecetaController::destroy
 * @see app/Http/Controllers/RecetaController.php:175
 * @route '/api/recetas/{receta}/ingredientes/{ingrediente}'
 */
destroy.url = (args: { receta: number | { id: number }, ingrediente: number | { id: number } } | [receta: number | { id: number }, ingrediente: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    receta: args[0],
                    ingrediente: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        receta: typeof args.receta === 'object'
                ? args.receta.id
                : args.receta,
                                ingrediente: typeof args.ingrediente === 'object'
                ? args.ingrediente.id
                : args.ingrediente,
                }

    return destroy.definition.url
            .replace('{receta}', parsedArgs.receta.toString())
            .replace('{ingrediente}', parsedArgs.ingrediente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RecetaController::destroy
 * @see app/Http/Controllers/RecetaController.php:175
 * @route '/api/recetas/{receta}/ingredientes/{ingrediente}'
 */
destroy.delete = (args: { receta: number | { id: number }, ingrediente: number | { id: number } } | [receta: number | { id: number }, ingrediente: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\RecetaController::update
 * @see app/Http/Controllers/RecetaController.php:195
 * @route '/api/recetas/{receta}/ingredientes/{ingrediente}'
 */
export const update = (args: { receta: number | { id: number }, ingrediente: number | { id: number } } | [receta: number | { id: number }, ingrediente: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/recetas/{receta}/ingredientes/{ingrediente}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\RecetaController::update
 * @see app/Http/Controllers/RecetaController.php:195
 * @route '/api/recetas/{receta}/ingredientes/{ingrediente}'
 */
update.url = (args: { receta: number | { id: number }, ingrediente: number | { id: number } } | [receta: number | { id: number }, ingrediente: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    receta: args[0],
                    ingrediente: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        receta: typeof args.receta === 'object'
                ? args.receta.id
                : args.receta,
                                ingrediente: typeof args.ingrediente === 'object'
                ? args.ingrediente.id
                : args.ingrediente,
                }

    return update.definition.url
            .replace('{receta}', parsedArgs.receta.toString())
            .replace('{ingrediente}', parsedArgs.ingrediente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RecetaController::update
 * @see app/Http/Controllers/RecetaController.php:195
 * @route '/api/recetas/{receta}/ingredientes/{ingrediente}'
 */
update.put = (args: { receta: number | { id: number }, ingrediente: number | { id: number } } | [receta: number | { id: number }, ingrediente: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
const ingredientes = {
    store,
destroy,
update,
}

export default ingredientes