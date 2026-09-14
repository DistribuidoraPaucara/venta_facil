import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\TipoPrecioController::index
 * @see app/Http/Controllers/TipoPrecioController.php:12
 * @route '/tipos-precio'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/tipos-precio',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TipoPrecioController::index
 * @see app/Http/Controllers/TipoPrecioController.php:12
 * @route '/tipos-precio'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoPrecioController::index
 * @see app/Http/Controllers/TipoPrecioController.php:12
 * @route '/tipos-precio'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\TipoPrecioController::index
 * @see app/Http/Controllers/TipoPrecioController.php:12
 * @route '/tipos-precio'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TipoPrecioController::create
 * @see app/Http/Controllers/TipoPrecioController.php:40
 * @route '/tipos-precio/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/tipos-precio/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TipoPrecioController::create
 * @see app/Http/Controllers/TipoPrecioController.php:40
 * @route '/tipos-precio/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoPrecioController::create
 * @see app/Http/Controllers/TipoPrecioController.php:40
 * @route '/tipos-precio/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\TipoPrecioController::create
 * @see app/Http/Controllers/TipoPrecioController.php:40
 * @route '/tipos-precio/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TipoPrecioController::store
 * @see app/Http/Controllers/TipoPrecioController.php:54
 * @route '/tipos-precio'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/tipos-precio',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TipoPrecioController::store
 * @see app/Http/Controllers/TipoPrecioController.php:54
 * @route '/tipos-precio'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoPrecioController::store
 * @see app/Http/Controllers/TipoPrecioController.php:54
 * @route '/tipos-precio'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\TipoPrecioController::show
 * @see app/Http/Controllers/TipoPrecioController.php:115
 * @route '/tipos-precio/{tipoPrecio}'
 */
export const show = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/tipos-precio/{tipoPrecio}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TipoPrecioController::show
 * @see app/Http/Controllers/TipoPrecioController.php:115
 * @route '/tipos-precio/{tipoPrecio}'
 */
show.url = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipoPrecio: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    tipoPrecio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipoPrecio: args.tipoPrecio,
                }

    return show.definition.url
            .replace('{tipoPrecio}', parsedArgs.tipoPrecio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoPrecioController::show
 * @see app/Http/Controllers/TipoPrecioController.php:115
 * @route '/tipos-precio/{tipoPrecio}'
 */
show.get = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\TipoPrecioController::show
 * @see app/Http/Controllers/TipoPrecioController.php:115
 * @route '/tipos-precio/{tipoPrecio}'
 */
show.head = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TipoPrecioController::edit
 * @see app/Http/Controllers/TipoPrecioController.php:138
 * @route '/tipos-precio/{tipoPrecio}/edit'
 */
export const edit = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/tipos-precio/{tipoPrecio}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TipoPrecioController::edit
 * @see app/Http/Controllers/TipoPrecioController.php:138
 * @route '/tipos-precio/{tipoPrecio}/edit'
 */
edit.url = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipoPrecio: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    tipoPrecio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipoPrecio: args.tipoPrecio,
                }

    return edit.definition.url
            .replace('{tipoPrecio}', parsedArgs.tipoPrecio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoPrecioController::edit
 * @see app/Http/Controllers/TipoPrecioController.php:138
 * @route '/tipos-precio/{tipoPrecio}/edit'
 */
edit.get = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\TipoPrecioController::edit
 * @see app/Http/Controllers/TipoPrecioController.php:138
 * @route '/tipos-precio/{tipoPrecio}/edit'
 */
edit.head = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\TipoPrecioController::update
 * @see app/Http/Controllers/TipoPrecioController.php:150
 * @route '/tipos-precio/{tipoPrecio}'
 */
export const update = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/tipos-precio/{tipoPrecio}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\TipoPrecioController::update
 * @see app/Http/Controllers/TipoPrecioController.php:150
 * @route '/tipos-precio/{tipoPrecio}'
 */
update.url = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipoPrecio: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    tipoPrecio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipoPrecio: args.tipoPrecio,
                }

    return update.definition.url
            .replace('{tipoPrecio}', parsedArgs.tipoPrecio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoPrecioController::update
 * @see app/Http/Controllers/TipoPrecioController.php:150
 * @route '/tipos-precio/{tipoPrecio}'
 */
update.put = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\TipoPrecioController::update
 * @see app/Http/Controllers/TipoPrecioController.php:150
 * @route '/tipos-precio/{tipoPrecio}'
 */
update.patch = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\TipoPrecioController::destroy
 * @see app/Http/Controllers/TipoPrecioController.php:206
 * @route '/tipos-precio/{tipoPrecio}'
 */
export const destroy = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/tipos-precio/{tipoPrecio}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\TipoPrecioController::destroy
 * @see app/Http/Controllers/TipoPrecioController.php:206
 * @route '/tipos-precio/{tipoPrecio}'
 */
destroy.url = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipoPrecio: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    tipoPrecio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipoPrecio: args.tipoPrecio,
                }

    return destroy.definition.url
            .replace('{tipoPrecio}', parsedArgs.tipoPrecio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoPrecioController::destroy
 * @see app/Http/Controllers/TipoPrecioController.php:206
 * @route '/tipos-precio/{tipoPrecio}'
 */
destroy.delete = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\TipoPrecioController::toggleActivo
 * @see app/Http/Controllers/TipoPrecioController.php:225
 * @route '/tipos-precio/{tipoPrecio}/toggle-activo'
 */
export const toggleActivo = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleActivo.url(args, options),
    method: 'patch',
})

toggleActivo.definition = {
    methods: ["patch"],
    url: '/tipos-precio/{tipoPrecio}/toggle-activo',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\TipoPrecioController::toggleActivo
 * @see app/Http/Controllers/TipoPrecioController.php:225
 * @route '/tipos-precio/{tipoPrecio}/toggle-activo'
 */
toggleActivo.url = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipoPrecio: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    tipoPrecio: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipoPrecio: args.tipoPrecio,
                }

    return toggleActivo.definition.url
            .replace('{tipoPrecio}', parsedArgs.tipoPrecio.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoPrecioController::toggleActivo
 * @see app/Http/Controllers/TipoPrecioController.php:225
 * @route '/tipos-precio/{tipoPrecio}/toggle-activo'
 */
toggleActivo.patch = (args: { tipoPrecio: string | number } | [tipoPrecio: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleActivo.url(args, options),
    method: 'patch',
})
const tiposPrecio = {
    index,
create,
store,
show,
edit,
update,
destroy,
toggleActivo,
}

export default tiposPrecio