import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\EstadoMermaController::index
 * @see app/Http/Controllers/EstadoMermaController.php:26
 * @route '/inventario/estados-merma'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventario/estados-merma',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EstadoMermaController::index
 * @see app/Http/Controllers/EstadoMermaController.php:26
 * @route '/inventario/estados-merma'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EstadoMermaController::index
 * @see app/Http/Controllers/EstadoMermaController.php:26
 * @route '/inventario/estados-merma'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EstadoMermaController::index
 * @see app/Http/Controllers/EstadoMermaController.php:26
 * @route '/inventario/estados-merma'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EstadoMermaController::index
 * @see app/Http/Controllers/EstadoMermaController.php:26
 * @route '/inventario/estados-merma'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EstadoMermaController::index
 * @see app/Http/Controllers/EstadoMermaController.php:26
 * @route '/inventario/estados-merma'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EstadoMermaController::index
 * @see app/Http/Controllers/EstadoMermaController.php:26
 * @route '/inventario/estados-merma'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\EstadoMermaController::create
 * @see app/Http/Controllers/EstadoMermaController.php:47
 * @route '/inventario/estados-merma/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/inventario/estados-merma/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EstadoMermaController::create
 * @see app/Http/Controllers/EstadoMermaController.php:47
 * @route '/inventario/estados-merma/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EstadoMermaController::create
 * @see app/Http/Controllers/EstadoMermaController.php:47
 * @route '/inventario/estados-merma/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EstadoMermaController::create
 * @see app/Http/Controllers/EstadoMermaController.php:47
 * @route '/inventario/estados-merma/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EstadoMermaController::create
 * @see app/Http/Controllers/EstadoMermaController.php:47
 * @route '/inventario/estados-merma/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EstadoMermaController::create
 * @see app/Http/Controllers/EstadoMermaController.php:47
 * @route '/inventario/estados-merma/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EstadoMermaController::create
 * @see app/Http/Controllers/EstadoMermaController.php:47
 * @route '/inventario/estados-merma/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\EstadoMermaController::store
 * @see app/Http/Controllers/EstadoMermaController.php:54
 * @route '/inventario/estados-merma'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventario/estados-merma',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EstadoMermaController::store
 * @see app/Http/Controllers/EstadoMermaController.php:54
 * @route '/inventario/estados-merma'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EstadoMermaController::store
 * @see app/Http/Controllers/EstadoMermaController.php:54
 * @route '/inventario/estados-merma'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EstadoMermaController::store
 * @see app/Http/Controllers/EstadoMermaController.php:54
 * @route '/inventario/estados-merma'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EstadoMermaController::store
 * @see app/Http/Controllers/EstadoMermaController.php:54
 * @route '/inventario/estados-merma'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\EstadoMermaController::edit
 * @see app/Http/Controllers/EstadoMermaController.php:65
 * @route '/inventario/estados-merma/{estadoMerma}/edit'
 */
export const edit = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/inventario/estados-merma/{estadoMerma}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EstadoMermaController::edit
 * @see app/Http/Controllers/EstadoMermaController.php:65
 * @route '/inventario/estados-merma/{estadoMerma}/edit'
 */
edit.url = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { estadoMerma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { estadoMerma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    estadoMerma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        estadoMerma: typeof args.estadoMerma === 'object'
                ? args.estadoMerma.id
                : args.estadoMerma,
                }

    return edit.definition.url
            .replace('{estadoMerma}', parsedArgs.estadoMerma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EstadoMermaController::edit
 * @see app/Http/Controllers/EstadoMermaController.php:65
 * @route '/inventario/estados-merma/{estadoMerma}/edit'
 */
edit.get = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EstadoMermaController::edit
 * @see app/Http/Controllers/EstadoMermaController.php:65
 * @route '/inventario/estados-merma/{estadoMerma}/edit'
 */
edit.head = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EstadoMermaController::edit
 * @see app/Http/Controllers/EstadoMermaController.php:65
 * @route '/inventario/estados-merma/{estadoMerma}/edit'
 */
    const editForm = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EstadoMermaController::edit
 * @see app/Http/Controllers/EstadoMermaController.php:65
 * @route '/inventario/estados-merma/{estadoMerma}/edit'
 */
        editForm.get = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EstadoMermaController::edit
 * @see app/Http/Controllers/EstadoMermaController.php:65
 * @route '/inventario/estados-merma/{estadoMerma}/edit'
 */
        editForm.head = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\EstadoMermaController::update
 * @see app/Http/Controllers/EstadoMermaController.php:72
 * @route '/inventario/estados-merma/{estadoMerma}'
 */
export const update = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/inventario/estados-merma/{estadoMerma}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\EstadoMermaController::update
 * @see app/Http/Controllers/EstadoMermaController.php:72
 * @route '/inventario/estados-merma/{estadoMerma}'
 */
update.url = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { estadoMerma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { estadoMerma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    estadoMerma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        estadoMerma: typeof args.estadoMerma === 'object'
                ? args.estadoMerma.id
                : args.estadoMerma,
                }

    return update.definition.url
            .replace('{estadoMerma}', parsedArgs.estadoMerma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EstadoMermaController::update
 * @see app/Http/Controllers/EstadoMermaController.php:72
 * @route '/inventario/estados-merma/{estadoMerma}'
 */
update.put = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\EstadoMermaController::update
 * @see app/Http/Controllers/EstadoMermaController.php:72
 * @route '/inventario/estados-merma/{estadoMerma}'
 */
update.patch = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\EstadoMermaController::update
 * @see app/Http/Controllers/EstadoMermaController.php:72
 * @route '/inventario/estados-merma/{estadoMerma}'
 */
    const updateForm = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EstadoMermaController::update
 * @see app/Http/Controllers/EstadoMermaController.php:72
 * @route '/inventario/estados-merma/{estadoMerma}'
 */
        updateForm.put = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\EstadoMermaController::update
 * @see app/Http/Controllers/EstadoMermaController.php:72
 * @route '/inventario/estados-merma/{estadoMerma}'
 */
        updateForm.patch = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\EstadoMermaController::destroy
 * @see app/Http/Controllers/EstadoMermaController.php:90
 * @route '/inventario/estados-merma/{estadoMerma}'
 */
export const destroy = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/inventario/estados-merma/{estadoMerma}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EstadoMermaController::destroy
 * @see app/Http/Controllers/EstadoMermaController.php:90
 * @route '/inventario/estados-merma/{estadoMerma}'
 */
destroy.url = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { estadoMerma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { estadoMerma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    estadoMerma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        estadoMerma: typeof args.estadoMerma === 'object'
                ? args.estadoMerma.id
                : args.estadoMerma,
                }

    return destroy.definition.url
            .replace('{estadoMerma}', parsedArgs.estadoMerma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EstadoMermaController::destroy
 * @see app/Http/Controllers/EstadoMermaController.php:90
 * @route '/inventario/estados-merma/{estadoMerma}'
 */
destroy.delete = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\EstadoMermaController::destroy
 * @see app/Http/Controllers/EstadoMermaController.php:90
 * @route '/inventario/estados-merma/{estadoMerma}'
 */
    const destroyForm = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EstadoMermaController::destroy
 * @see app/Http/Controllers/EstadoMermaController.php:90
 * @route '/inventario/estados-merma/{estadoMerma}'
 */
        destroyForm.delete = (args: { estadoMerma: number | { id: number } } | [estadoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const estadosMerma = {
    index,
create,
store,
edit,
update,
destroy,
}

export default estadosMerma