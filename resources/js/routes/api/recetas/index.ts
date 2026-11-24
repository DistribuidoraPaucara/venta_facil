import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
import ingredientes from './ingredientes'
/**
* @see \App\Http\Controllers\RecetaController::index
 * @see app/Http/Controllers/RecetaController.php:20
 * @route '/api/recetas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/recetas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RecetaController::index
 * @see app/Http/Controllers/RecetaController.php:20
 * @route '/api/recetas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RecetaController::index
 * @see app/Http/Controllers/RecetaController.php:20
 * @route '/api/recetas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RecetaController::index
 * @see app/Http/Controllers/RecetaController.php:20
 * @route '/api/recetas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RecetaController::store
 * @see app/Http/Controllers/RecetaController.php:53
 * @route '/api/recetas'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/recetas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RecetaController::store
 * @see app/Http/Controllers/RecetaController.php:53
 * @route '/api/recetas'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RecetaController::store
 * @see app/Http/Controllers/RecetaController.php:53
 * @route '/api/recetas'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RecetaController::show
 * @see app/Http/Controllers/RecetaController.php:40
 * @route '/api/recetas/{receta}'
 */
export const show = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/recetas/{receta}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RecetaController::show
 * @see app/Http/Controllers/RecetaController.php:40
 * @route '/api/recetas/{receta}'
 */
show.url = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{receta}', parsedArgs.receta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RecetaController::show
 * @see app/Http/Controllers/RecetaController.php:40
 * @route '/api/recetas/{receta}'
 */
show.get = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RecetaController::show
 * @see app/Http/Controllers/RecetaController.php:40
 * @route '/api/recetas/{receta}'
 */
show.head = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RecetaController::update
 * @see app/Http/Controllers/RecetaController.php:84
 * @route '/api/recetas/{receta}'
 */
export const update = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/recetas/{receta}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\RecetaController::update
 * @see app/Http/Controllers/RecetaController.php:84
 * @route '/api/recetas/{receta}'
 */
update.url = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{receta}', parsedArgs.receta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RecetaController::update
 * @see app/Http/Controllers/RecetaController.php:84
 * @route '/api/recetas/{receta}'
 */
update.put = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\RecetaController::destroy
 * @see app/Http/Controllers/RecetaController.php:105
 * @route '/api/recetas/{receta}'
 */
export const destroy = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/recetas/{receta}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\RecetaController::destroy
 * @see app/Http/Controllers/RecetaController.php:105
 * @route '/api/recetas/{receta}'
 */
destroy.url = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{receta}', parsedArgs.receta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RecetaController::destroy
 * @see app/Http/Controllers/RecetaController.php:105
 * @route '/api/recetas/{receta}'
 */
destroy.delete = (args: { receta: number | { id: number } } | [receta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\RecetaController::productosDisponibles
 * @see app/Http/Controllers/RecetaController.php:220
 * @route '/api/recetas/productos/disponibles'
 */
export const productosDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(options),
    method: 'get',
})

productosDisponibles.definition = {
    methods: ["get","head"],
    url: '/api/recetas/productos/disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RecetaController::productosDisponibles
 * @see app/Http/Controllers/RecetaController.php:220
 * @route '/api/recetas/productos/disponibles'
 */
productosDisponibles.url = (options?: RouteQueryOptions) => {
    return productosDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RecetaController::productosDisponibles
 * @see app/Http/Controllers/RecetaController.php:220
 * @route '/api/recetas/productos/disponibles'
 */
productosDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RecetaController::productosDisponibles
 * @see app/Http/Controllers/RecetaController.php:220
 * @route '/api/recetas/productos/disponibles'
 */
productosDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: productosDisponibles.url(options),
    method: 'head',
})
const recetas = {
    index,
store,
show,
update,
destroy,
ingredientes,
productosDisponibles,
}

export default recetas