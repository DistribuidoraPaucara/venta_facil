import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ReposicionController::index
 * @see app/Http/Controllers/ReposicionController.php:17
 * @route '/inventario/reposiciones'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventario/reposiciones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReposicionController::index
 * @see app/Http/Controllers/ReposicionController.php:17
 * @route '/inventario/reposiciones'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReposicionController::index
 * @see app/Http/Controllers/ReposicionController.php:17
 * @route '/inventario/reposiciones'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReposicionController::index
 * @see app/Http/Controllers/ReposicionController.php:17
 * @route '/inventario/reposiciones'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReposicionController::index
 * @see app/Http/Controllers/ReposicionController.php:17
 * @route '/inventario/reposiciones'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReposicionController::index
 * @see app/Http/Controllers/ReposicionController.php:17
 * @route '/inventario/reposiciones'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReposicionController::index
 * @see app/Http/Controllers/ReposicionController.php:17
 * @route '/inventario/reposiciones'
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
* @see \App\Http\Controllers\ReposicionController::create
 * @see app/Http/Controllers/ReposicionController.php:31
 * @route '/inventario/reposiciones/crear'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/inventario/reposiciones/crear',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReposicionController::create
 * @see app/Http/Controllers/ReposicionController.php:31
 * @route '/inventario/reposiciones/crear'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReposicionController::create
 * @see app/Http/Controllers/ReposicionController.php:31
 * @route '/inventario/reposiciones/crear'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReposicionController::create
 * @see app/Http/Controllers/ReposicionController.php:31
 * @route '/inventario/reposiciones/crear'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReposicionController::create
 * @see app/Http/Controllers/ReposicionController.php:31
 * @route '/inventario/reposiciones/crear'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReposicionController::create
 * @see app/Http/Controllers/ReposicionController.php:31
 * @route '/inventario/reposiciones/crear'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReposicionController::create
 * @see app/Http/Controllers/ReposicionController.php:31
 * @route '/inventario/reposiciones/crear'
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
* @see \App\Http\Controllers\ReposicionController::store
 * @see app/Http/Controllers/ReposicionController.php:111
 * @route '/inventario/reposiciones/crear'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/inventario/reposiciones/crear',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReposicionController::store
 * @see app/Http/Controllers/ReposicionController.php:111
 * @route '/inventario/reposiciones/crear'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReposicionController::store
 * @see app/Http/Controllers/ReposicionController.php:111
 * @route '/inventario/reposiciones/crear'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ReposicionController::store
 * @see app/Http/Controllers/ReposicionController.php:111
 * @route '/inventario/reposiciones/crear'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ReposicionController::store
 * @see app/Http/Controllers/ReposicionController.php:111
 * @route '/inventario/reposiciones/crear'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\ReposicionController::show
 * @see app/Http/Controllers/ReposicionController.php:288
 * @route '/inventario/reposiciones/{reposicion}'
 */
export const show = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/inventario/reposiciones/{reposicion}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReposicionController::show
 * @see app/Http/Controllers/ReposicionController.php:288
 * @route '/inventario/reposiciones/{reposicion}'
 */
show.url = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reposicion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { reposicion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    reposicion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reposicion: typeof args.reposicion === 'object'
                ? args.reposicion.id
                : args.reposicion,
                }

    return show.definition.url
            .replace('{reposicion}', parsedArgs.reposicion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReposicionController::show
 * @see app/Http/Controllers/ReposicionController.php:288
 * @route '/inventario/reposiciones/{reposicion}'
 */
show.get = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReposicionController::show
 * @see app/Http/Controllers/ReposicionController.php:288
 * @route '/inventario/reposiciones/{reposicion}'
 */
show.head = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReposicionController::show
 * @see app/Http/Controllers/ReposicionController.php:288
 * @route '/inventario/reposiciones/{reposicion}'
 */
    const showForm = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReposicionController::show
 * @see app/Http/Controllers/ReposicionController.php:288
 * @route '/inventario/reposiciones/{reposicion}'
 */
        showForm.get = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReposicionController::show
 * @see app/Http/Controllers/ReposicionController.php:288
 * @route '/inventario/reposiciones/{reposicion}'
 */
        showForm.head = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\ReposicionController::edit
 * @see app/Http/Controllers/ReposicionController.php:299
 * @route '/inventario/reposiciones/{reposicion}/edit'
 */
export const edit = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/inventario/reposiciones/{reposicion}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReposicionController::edit
 * @see app/Http/Controllers/ReposicionController.php:299
 * @route '/inventario/reposiciones/{reposicion}/edit'
 */
edit.url = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reposicion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { reposicion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    reposicion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reposicion: typeof args.reposicion === 'object'
                ? args.reposicion.id
                : args.reposicion,
                }

    return edit.definition.url
            .replace('{reposicion}', parsedArgs.reposicion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReposicionController::edit
 * @see app/Http/Controllers/ReposicionController.php:299
 * @route '/inventario/reposiciones/{reposicion}/edit'
 */
edit.get = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReposicionController::edit
 * @see app/Http/Controllers/ReposicionController.php:299
 * @route '/inventario/reposiciones/{reposicion}/edit'
 */
edit.head = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReposicionController::edit
 * @see app/Http/Controllers/ReposicionController.php:299
 * @route '/inventario/reposiciones/{reposicion}/edit'
 */
    const editForm = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReposicionController::edit
 * @see app/Http/Controllers/ReposicionController.php:299
 * @route '/inventario/reposiciones/{reposicion}/edit'
 */
        editForm.get = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReposicionController::edit
 * @see app/Http/Controllers/ReposicionController.php:299
 * @route '/inventario/reposiciones/{reposicion}/edit'
 */
        editForm.head = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ReposicionController::update
 * @see app/Http/Controllers/ReposicionController.php:318
 * @route '/inventario/reposiciones/{reposicion}'
 */
export const update = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/inventario/reposiciones/{reposicion}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ReposicionController::update
 * @see app/Http/Controllers/ReposicionController.php:318
 * @route '/inventario/reposiciones/{reposicion}'
 */
update.url = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reposicion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { reposicion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    reposicion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reposicion: typeof args.reposicion === 'object'
                ? args.reposicion.id
                : args.reposicion,
                }

    return update.definition.url
            .replace('{reposicion}', parsedArgs.reposicion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReposicionController::update
 * @see app/Http/Controllers/ReposicionController.php:318
 * @route '/inventario/reposiciones/{reposicion}'
 */
update.put = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\ReposicionController::update
 * @see app/Http/Controllers/ReposicionController.php:318
 * @route '/inventario/reposiciones/{reposicion}'
 */
    const updateForm = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ReposicionController::update
 * @see app/Http/Controllers/ReposicionController.php:318
 * @route '/inventario/reposiciones/{reposicion}'
 */
        updateForm.put = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\ReposicionController::enviar
 * @see app/Http/Controllers/ReposicionController.php:373
 * @route '/inventario/reposiciones/{reposicion}/enviar'
 */
export const enviar = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: enviar.url(args, options),
    method: 'post',
})

enviar.definition = {
    methods: ["post"],
    url: '/inventario/reposiciones/{reposicion}/enviar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReposicionController::enviar
 * @see app/Http/Controllers/ReposicionController.php:373
 * @route '/inventario/reposiciones/{reposicion}/enviar'
 */
enviar.url = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reposicion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { reposicion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    reposicion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reposicion: typeof args.reposicion === 'object'
                ? args.reposicion.id
                : args.reposicion,
                }

    return enviar.definition.url
            .replace('{reposicion}', parsedArgs.reposicion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReposicionController::enviar
 * @see app/Http/Controllers/ReposicionController.php:373
 * @route '/inventario/reposiciones/{reposicion}/enviar'
 */
enviar.post = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: enviar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ReposicionController::enviar
 * @see app/Http/Controllers/ReposicionController.php:373
 * @route '/inventario/reposiciones/{reposicion}/enviar'
 */
    const enviarForm = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: enviar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ReposicionController::enviar
 * @see app/Http/Controllers/ReposicionController.php:373
 * @route '/inventario/reposiciones/{reposicion}/enviar'
 */
        enviarForm.post = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: enviar.url(args, options),
            method: 'post',
        })
    
    enviar.form = enviarForm
/**
* @see \App\Http\Controllers\ReposicionController::recibir
 * @see app/Http/Controllers/ReposicionController.php:389
 * @route '/inventario/reposiciones/{reposicion}/recibir'
 */
export const recibir = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recibir.url(args, options),
    method: 'post',
})

recibir.definition = {
    methods: ["post"],
    url: '/inventario/reposiciones/{reposicion}/recibir',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReposicionController::recibir
 * @see app/Http/Controllers/ReposicionController.php:389
 * @route '/inventario/reposiciones/{reposicion}/recibir'
 */
recibir.url = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reposicion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { reposicion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    reposicion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reposicion: typeof args.reposicion === 'object'
                ? args.reposicion.id
                : args.reposicion,
                }

    return recibir.definition.url
            .replace('{reposicion}', parsedArgs.reposicion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReposicionController::recibir
 * @see app/Http/Controllers/ReposicionController.php:389
 * @route '/inventario/reposiciones/{reposicion}/recibir'
 */
recibir.post = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: recibir.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ReposicionController::recibir
 * @see app/Http/Controllers/ReposicionController.php:389
 * @route '/inventario/reposiciones/{reposicion}/recibir'
 */
    const recibirForm = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: recibir.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ReposicionController::recibir
 * @see app/Http/Controllers/ReposicionController.php:389
 * @route '/inventario/reposiciones/{reposicion}/recibir'
 */
        recibirForm.post = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: recibir.url(args, options),
            method: 'post',
        })
    
    recibir.form = recibirForm
/**
* @see \App\Http\Controllers\ReposicionController::destroy
 * @see app/Http/Controllers/ReposicionController.php:361
 * @route '/inventario/reposiciones/{reposicion}'
 */
export const destroy = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/inventario/reposiciones/{reposicion}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ReposicionController::destroy
 * @see app/Http/Controllers/ReposicionController.php:361
 * @route '/inventario/reposiciones/{reposicion}'
 */
destroy.url = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reposicion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { reposicion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    reposicion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reposicion: typeof args.reposicion === 'object'
                ? args.reposicion.id
                : args.reposicion,
                }

    return destroy.definition.url
            .replace('{reposicion}', parsedArgs.reposicion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReposicionController::destroy
 * @see app/Http/Controllers/ReposicionController.php:361
 * @route '/inventario/reposiciones/{reposicion}'
 */
destroy.delete = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ReposicionController::destroy
 * @see app/Http/Controllers/ReposicionController.php:361
 * @route '/inventario/reposiciones/{reposicion}'
 */
    const destroyForm = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ReposicionController::destroy
 * @see app/Http/Controllers/ReposicionController.php:361
 * @route '/inventario/reposiciones/{reposicion}'
 */
        destroyForm.delete = (args: { reposicion: number | { id: number } } | [reposicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const ReposicionController = { index, create, store, show, edit, update, enviar, recibir, destroy }

export default ReposicionController