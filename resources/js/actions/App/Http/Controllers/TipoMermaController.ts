import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\TipoMermaController::index
 * @see app/Http/Controllers/TipoMermaController.php:24
 * @route '/inventario/tipos-merma'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventario/tipos-merma',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TipoMermaController::index
 * @see app/Http/Controllers/TipoMermaController.php:24
 * @route '/inventario/tipos-merma'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoMermaController::index
 * @see app/Http/Controllers/TipoMermaController.php:24
 * @route '/inventario/tipos-merma'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\TipoMermaController::index
 * @see app/Http/Controllers/TipoMermaController.php:24
 * @route '/inventario/tipos-merma'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\TipoMermaController::index
 * @see app/Http/Controllers/TipoMermaController.php:24
 * @route '/inventario/tipos-merma'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\TipoMermaController::index
 * @see app/Http/Controllers/TipoMermaController.php:24
 * @route '/inventario/tipos-merma'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\TipoMermaController::index
 * @see app/Http/Controllers/TipoMermaController.php:24
 * @route '/inventario/tipos-merma'
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
* @see \App\Http\Controllers\TipoMermaController::create
 * @see app/Http/Controllers/TipoMermaController.php:46
 * @route '/inventario/tipos-merma/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/inventario/tipos-merma/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TipoMermaController::create
 * @see app/Http/Controllers/TipoMermaController.php:46
 * @route '/inventario/tipos-merma/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoMermaController::create
 * @see app/Http/Controllers/TipoMermaController.php:46
 * @route '/inventario/tipos-merma/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\TipoMermaController::create
 * @see app/Http/Controllers/TipoMermaController.php:46
 * @route '/inventario/tipos-merma/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\TipoMermaController::create
 * @see app/Http/Controllers/TipoMermaController.php:46
 * @route '/inventario/tipos-merma/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\TipoMermaController::create
 * @see app/Http/Controllers/TipoMermaController.php:46
 * @route '/inventario/tipos-merma/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\TipoMermaController::create
 * @see app/Http/Controllers/TipoMermaController.php:46
 * @route '/inventario/tipos-merma/create'
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
* @see \App\Http\Controllers\TipoMermaController::store
 * @see app/Http/Controllers/TipoMermaController.php:53
 * @route '/inventario/tipos-merma'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventario/tipos-merma',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TipoMermaController::store
 * @see app/Http/Controllers/TipoMermaController.php:53
 * @route '/inventario/tipos-merma'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoMermaController::store
 * @see app/Http/Controllers/TipoMermaController.php:53
 * @route '/inventario/tipos-merma'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\TipoMermaController::store
 * @see app/Http/Controllers/TipoMermaController.php:53
 * @route '/inventario/tipos-merma'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\TipoMermaController::store
 * @see app/Http/Controllers/TipoMermaController.php:53
 * @route '/inventario/tipos-merma'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\TipoMermaController::edit
 * @see app/Http/Controllers/TipoMermaController.php:65
 * @route '/inventario/tipos-merma/{tipoMerma}/edit'
 */
export const edit = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/inventario/tipos-merma/{tipoMerma}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\TipoMermaController::edit
 * @see app/Http/Controllers/TipoMermaController.php:65
 * @route '/inventario/tipos-merma/{tipoMerma}/edit'
 */
edit.url = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipoMerma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { tipoMerma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    tipoMerma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipoMerma: typeof args.tipoMerma === 'object'
                ? args.tipoMerma.id
                : args.tipoMerma,
                }

    return edit.definition.url
            .replace('{tipoMerma}', parsedArgs.tipoMerma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoMermaController::edit
 * @see app/Http/Controllers/TipoMermaController.php:65
 * @route '/inventario/tipos-merma/{tipoMerma}/edit'
 */
edit.get = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\TipoMermaController::edit
 * @see app/Http/Controllers/TipoMermaController.php:65
 * @route '/inventario/tipos-merma/{tipoMerma}/edit'
 */
edit.head = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\TipoMermaController::edit
 * @see app/Http/Controllers/TipoMermaController.php:65
 * @route '/inventario/tipos-merma/{tipoMerma}/edit'
 */
    const editForm = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\TipoMermaController::edit
 * @see app/Http/Controllers/TipoMermaController.php:65
 * @route '/inventario/tipos-merma/{tipoMerma}/edit'
 */
        editForm.get = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\TipoMermaController::edit
 * @see app/Http/Controllers/TipoMermaController.php:65
 * @route '/inventario/tipos-merma/{tipoMerma}/edit'
 */
        editForm.head = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\TipoMermaController::update
 * @see app/Http/Controllers/TipoMermaController.php:72
 * @route '/inventario/tipos-merma/{tipoMerma}'
 */
export const update = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/inventario/tipos-merma/{tipoMerma}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\TipoMermaController::update
 * @see app/Http/Controllers/TipoMermaController.php:72
 * @route '/inventario/tipos-merma/{tipoMerma}'
 */
update.url = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipoMerma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { tipoMerma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    tipoMerma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipoMerma: typeof args.tipoMerma === 'object'
                ? args.tipoMerma.id
                : args.tipoMerma,
                }

    return update.definition.url
            .replace('{tipoMerma}', parsedArgs.tipoMerma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoMermaController::update
 * @see app/Http/Controllers/TipoMermaController.php:72
 * @route '/inventario/tipos-merma/{tipoMerma}'
 */
update.put = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\TipoMermaController::update
 * @see app/Http/Controllers/TipoMermaController.php:72
 * @route '/inventario/tipos-merma/{tipoMerma}'
 */
update.patch = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\TipoMermaController::update
 * @see app/Http/Controllers/TipoMermaController.php:72
 * @route '/inventario/tipos-merma/{tipoMerma}'
 */
    const updateForm = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\TipoMermaController::update
 * @see app/Http/Controllers/TipoMermaController.php:72
 * @route '/inventario/tipos-merma/{tipoMerma}'
 */
        updateForm.put = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\TipoMermaController::update
 * @see app/Http/Controllers/TipoMermaController.php:72
 * @route '/inventario/tipos-merma/{tipoMerma}'
 */
        updateForm.patch = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\TipoMermaController::destroy
 * @see app/Http/Controllers/TipoMermaController.php:86
 * @route '/inventario/tipos-merma/{tipoMerma}'
 */
export const destroy = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/inventario/tipos-merma/{tipoMerma}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\TipoMermaController::destroy
 * @see app/Http/Controllers/TipoMermaController.php:86
 * @route '/inventario/tipos-merma/{tipoMerma}'
 */
destroy.url = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tipoMerma: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { tipoMerma: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    tipoMerma: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tipoMerma: typeof args.tipoMerma === 'object'
                ? args.tipoMerma.id
                : args.tipoMerma,
                }

    return destroy.definition.url
            .replace('{tipoMerma}', parsedArgs.tipoMerma.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\TipoMermaController::destroy
 * @see app/Http/Controllers/TipoMermaController.php:86
 * @route '/inventario/tipos-merma/{tipoMerma}'
 */
destroy.delete = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\TipoMermaController::destroy
 * @see app/Http/Controllers/TipoMermaController.php:86
 * @route '/inventario/tipos-merma/{tipoMerma}'
 */
    const destroyForm = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\TipoMermaController::destroy
 * @see app/Http/Controllers/TipoMermaController.php:86
 * @route '/inventario/tipos-merma/{tipoMerma}'
 */
        destroyForm.delete = (args: { tipoMerma: number | { id: number } } | [tipoMerma: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const TipoMermaController = { index, create, store, edit, update, destroy }

export default TipoMermaController