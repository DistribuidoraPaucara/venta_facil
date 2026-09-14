import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::index
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:69
 * @route '/notificaciones'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/notificaciones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::index
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:69
 * @route '/notificaciones'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::index
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:69
 * @route '/notificaciones'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::index
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:69
 * @route '/notificaciones'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::create
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:148
 * @route '/notificaciones/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/notificaciones/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::create
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:148
 * @route '/notificaciones/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::create
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:148
 * @route '/notificaciones/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::create
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:148
 * @route '/notificaciones/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::store
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:156
 * @route '/notificaciones'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/notificaciones',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::store
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:156
 * @route '/notificaciones'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::store
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:156
 * @route '/notificaciones'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::show
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:191
 * @route '/notificaciones/{notificacione}'
 */
export const show = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/notificaciones/{notificacione}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::show
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:191
 * @route '/notificaciones/{notificacione}'
 */
show.url = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { notificacione: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    notificacione: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        notificacione: args.notificacione,
                }

    return show.definition.url
            .replace('{notificacione}', parsedArgs.notificacione.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::show
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:191
 * @route '/notificaciones/{notificacione}'
 */
show.get = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::show
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:191
 * @route '/notificaciones/{notificacione}'
 */
show.head = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::edit
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:202
 * @route '/notificaciones/{notificacione}/edit'
 */
export const edit = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/notificaciones/{notificacione}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::edit
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:202
 * @route '/notificaciones/{notificacione}/edit'
 */
edit.url = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { notificacione: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    notificacione: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        notificacione: args.notificacione,
                }

    return edit.definition.url
            .replace('{notificacione}', parsedArgs.notificacione.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::edit
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:202
 * @route '/notificaciones/{notificacione}/edit'
 */
edit.get = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::edit
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:202
 * @route '/notificaciones/{notificacione}/edit'
 */
edit.head = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::update
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:212
 * @route '/notificaciones/{notificacione}'
 */
export const update = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/notificaciones/{notificacione}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::update
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:212
 * @route '/notificaciones/{notificacione}'
 */
update.url = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { notificacione: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    notificacione: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        notificacione: args.notificacione,
                }

    return update.definition.url
            .replace('{notificacione}', parsedArgs.notificacione.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::update
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:212
 * @route '/notificaciones/{notificacione}'
 */
update.put = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::update
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:212
 * @route '/notificaciones/{notificacione}'
 */
update.patch = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::destroy
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:260
 * @route '/notificaciones/{notificacione}'
 */
export const destroy = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/notificaciones/{notificacione}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::destroy
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:260
 * @route '/notificaciones/{notificacione}'
 */
destroy.url = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { notificacione: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    notificacione: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        notificacione: args.notificacione,
                }

    return destroy.definition.url
            .replace('{notificacione}', parsedArgs.notificacione.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::destroy
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:260
 * @route '/notificaciones/{notificacione}'
 */
destroy.delete = (args: { notificacione: string | number } | [notificacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::enviar
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:315
 * @route '/notificaciones/{notificacion}/enviar'
 */
export const enviar = (args: { notificacion: number | { id: number } } | [notificacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: enviar.url(args, options),
    method: 'post',
})

enviar.definition = {
    methods: ["post"],
    url: '/notificaciones/{notificacion}/enviar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::enviar
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:315
 * @route '/notificaciones/{notificacion}/enviar'
 */
enviar.url = (args: { notificacion: number | { id: number } } | [notificacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { notificacion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { notificacion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    notificacion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        notificacion: typeof args.notificacion === 'object'
                ? args.notificacion.id
                : args.notificacion,
                }

    return enviar.definition.url
            .replace('{notificacion}', parsedArgs.notificacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\NotificacionRecurrenteController::enviar
 * @see app/Http/Controllers/NotificacionRecurrenteController.php:315
 * @route '/notificaciones/{notificacion}/enviar'
 */
enviar.post = (args: { notificacion: number | { id: number } } | [notificacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: enviar.url(args, options),
    method: 'post',
})
const notificaciones = {
    index,
create,
store,
show,
edit,
update,
destroy,
enviar,
}

export default notificaciones