import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\UnidadMedidaController::indexApi
 * @see app/Http/Controllers/UnidadMedidaController.php:93
 * @route '/api/app/unidades-medida'
 */
export const indexApi = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexApi.url(options),
    method: 'get',
})

indexApi.definition = {
    methods: ["get","head"],
    url: '/api/app/unidades-medida',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UnidadMedidaController::indexApi
 * @see app/Http/Controllers/UnidadMedidaController.php:93
 * @route '/api/app/unidades-medida'
 */
indexApi.url = (options?: RouteQueryOptions) => {
    return indexApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnidadMedidaController::indexApi
 * @see app/Http/Controllers/UnidadMedidaController.php:93
 * @route '/api/app/unidades-medida'
 */
indexApi.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexApi.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UnidadMedidaController::indexApi
 * @see app/Http/Controllers/UnidadMedidaController.php:93
 * @route '/api/app/unidades-medida'
 */
indexApi.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexApi.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UnidadMedidaController::indexApi
 * @see app/Http/Controllers/UnidadMedidaController.php:93
 * @route '/api/app/unidades-medida'
 */
    const indexApiForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: indexApi.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UnidadMedidaController::indexApi
 * @see app/Http/Controllers/UnidadMedidaController.php:93
 * @route '/api/app/unidades-medida'
 */
        indexApiForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexApi.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UnidadMedidaController::indexApi
 * @see app/Http/Controllers/UnidadMedidaController.php:93
 * @route '/api/app/unidades-medida'
 */
        indexApiForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: indexApi.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    indexApi.form = indexApiForm
/**
* @see \App\Http\Controllers\UnidadMedidaController::storeApi
 * @see app/Http/Controllers/UnidadMedidaController.php:126
 * @route '/api/app/unidades-medida'
 */
export const storeApi = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeApi.url(options),
    method: 'post',
})

storeApi.definition = {
    methods: ["post"],
    url: '/api/app/unidades-medida',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UnidadMedidaController::storeApi
 * @see app/Http/Controllers/UnidadMedidaController.php:126
 * @route '/api/app/unidades-medida'
 */
storeApi.url = (options?: RouteQueryOptions) => {
    return storeApi.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnidadMedidaController::storeApi
 * @see app/Http/Controllers/UnidadMedidaController.php:126
 * @route '/api/app/unidades-medida'
 */
storeApi.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeApi.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UnidadMedidaController::storeApi
 * @see app/Http/Controllers/UnidadMedidaController.php:126
 * @route '/api/app/unidades-medida'
 */
    const storeApiForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeApi.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UnidadMedidaController::storeApi
 * @see app/Http/Controllers/UnidadMedidaController.php:126
 * @route '/api/app/unidades-medida'
 */
        storeApiForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeApi.url(options),
            method: 'post',
        })
    
    storeApi.form = storeApiForm
/**
* @see \App\Http\Controllers\UnidadMedidaController::updateApi
 * @see app/Http/Controllers/UnidadMedidaController.php:167
 * @route '/api/app/unidades-medida/{id}'
 */
export const updateApi = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateApi.url(args, options),
    method: 'put',
})

updateApi.definition = {
    methods: ["put"],
    url: '/api/app/unidades-medida/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\UnidadMedidaController::updateApi
 * @see app/Http/Controllers/UnidadMedidaController.php:167
 * @route '/api/app/unidades-medida/{id}'
 */
updateApi.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return updateApi.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnidadMedidaController::updateApi
 * @see app/Http/Controllers/UnidadMedidaController.php:167
 * @route '/api/app/unidades-medida/{id}'
 */
updateApi.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateApi.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\UnidadMedidaController::updateApi
 * @see app/Http/Controllers/UnidadMedidaController.php:167
 * @route '/api/app/unidades-medida/{id}'
 */
    const updateApiForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateApi.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UnidadMedidaController::updateApi
 * @see app/Http/Controllers/UnidadMedidaController.php:167
 * @route '/api/app/unidades-medida/{id}'
 */
        updateApiForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateApi.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateApi.form = updateApiForm
/**
* @see \App\Http\Controllers\UnidadMedidaController::destroyApi
 * @see app/Http/Controllers/UnidadMedidaController.php:213
 * @route '/api/app/unidades-medida/{id}'
 */
export const destroyApi = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyApi.url(args, options),
    method: 'delete',
})

destroyApi.definition = {
    methods: ["delete"],
    url: '/api/app/unidades-medida/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\UnidadMedidaController::destroyApi
 * @see app/Http/Controllers/UnidadMedidaController.php:213
 * @route '/api/app/unidades-medida/{id}'
 */
destroyApi.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return destroyApi.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnidadMedidaController::destroyApi
 * @see app/Http/Controllers/UnidadMedidaController.php:213
 * @route '/api/app/unidades-medida/{id}'
 */
destroyApi.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyApi.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\UnidadMedidaController::destroyApi
 * @see app/Http/Controllers/UnidadMedidaController.php:213
 * @route '/api/app/unidades-medida/{id}'
 */
    const destroyApiForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroyApi.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UnidadMedidaController::destroyApi
 * @see app/Http/Controllers/UnidadMedidaController.php:213
 * @route '/api/app/unidades-medida/{id}'
 */
        destroyApiForm.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroyApi.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroyApi.form = destroyApiForm
/**
* @see \App\Http\Controllers\UnidadMedidaController::index
 * @see app/Http/Controllers/UnidadMedidaController.php:64
 * @route '/unidades'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/unidades',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UnidadMedidaController::index
 * @see app/Http/Controllers/UnidadMedidaController.php:64
 * @route '/unidades'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnidadMedidaController::index
 * @see app/Http/Controllers/UnidadMedidaController.php:64
 * @route '/unidades'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UnidadMedidaController::index
 * @see app/Http/Controllers/UnidadMedidaController.php:64
 * @route '/unidades'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UnidadMedidaController::index
 * @see app/Http/Controllers/UnidadMedidaController.php:64
 * @route '/unidades'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UnidadMedidaController::index
 * @see app/Http/Controllers/UnidadMedidaController.php:64
 * @route '/unidades'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UnidadMedidaController::index
 * @see app/Http/Controllers/UnidadMedidaController.php:64
 * @route '/unidades'
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
* @see \App\Http\Controllers\UnidadMedidaController::create
 * @see app/Http/Controllers/UnidadMedidaController.php:167
 * @route '/unidades/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/unidades/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UnidadMedidaController::create
 * @see app/Http/Controllers/UnidadMedidaController.php:167
 * @route '/unidades/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnidadMedidaController::create
 * @see app/Http/Controllers/UnidadMedidaController.php:167
 * @route '/unidades/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UnidadMedidaController::create
 * @see app/Http/Controllers/UnidadMedidaController.php:167
 * @route '/unidades/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UnidadMedidaController::create
 * @see app/Http/Controllers/UnidadMedidaController.php:167
 * @route '/unidades/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UnidadMedidaController::create
 * @see app/Http/Controllers/UnidadMedidaController.php:167
 * @route '/unidades/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UnidadMedidaController::create
 * @see app/Http/Controllers/UnidadMedidaController.php:167
 * @route '/unidades/create'
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
* @see \App\Http\Controllers\UnidadMedidaController::store
 * @see app/Http/Controllers/UnidadMedidaController.php:182
 * @route '/unidades'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/unidades',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UnidadMedidaController::store
 * @see app/Http/Controllers/UnidadMedidaController.php:182
 * @route '/unidades'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnidadMedidaController::store
 * @see app/Http/Controllers/UnidadMedidaController.php:182
 * @route '/unidades'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UnidadMedidaController::store
 * @see app/Http/Controllers/UnidadMedidaController.php:182
 * @route '/unidades'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UnidadMedidaController::store
 * @see app/Http/Controllers/UnidadMedidaController.php:182
 * @route '/unidades'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\UnidadMedidaController::show
 * @see app/Http/Controllers/UnidadMedidaController.php:0
 * @route '/unidades/{unidad}'
 */
export const show = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/unidades/{unidad}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UnidadMedidaController::show
 * @see app/Http/Controllers/UnidadMedidaController.php:0
 * @route '/unidades/{unidad}'
 */
show.url = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { unidad: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    unidad: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        unidad: args.unidad,
                }

    return show.definition.url
            .replace('{unidad}', parsedArgs.unidad.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnidadMedidaController::show
 * @see app/Http/Controllers/UnidadMedidaController.php:0
 * @route '/unidades/{unidad}'
 */
show.get = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UnidadMedidaController::show
 * @see app/Http/Controllers/UnidadMedidaController.php:0
 * @route '/unidades/{unidad}'
 */
show.head = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UnidadMedidaController::show
 * @see app/Http/Controllers/UnidadMedidaController.php:0
 * @route '/unidades/{unidad}'
 */
    const showForm = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UnidadMedidaController::show
 * @see app/Http/Controllers/UnidadMedidaController.php:0
 * @route '/unidades/{unidad}'
 */
        showForm.get = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UnidadMedidaController::show
 * @see app/Http/Controllers/UnidadMedidaController.php:0
 * @route '/unidades/{unidad}'
 */
        showForm.head = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\UnidadMedidaController::edit
 * @see app/Http/Controllers/UnidadMedidaController.php:213
 * @route '/unidades/{unidad}/edit'
 */
export const edit = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/unidades/{unidad}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UnidadMedidaController::edit
 * @see app/Http/Controllers/UnidadMedidaController.php:213
 * @route '/unidades/{unidad}/edit'
 */
edit.url = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { unidad: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    unidad: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        unidad: args.unidad,
                }

    return edit.definition.url
            .replace('{unidad}', parsedArgs.unidad.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnidadMedidaController::edit
 * @see app/Http/Controllers/UnidadMedidaController.php:213
 * @route '/unidades/{unidad}/edit'
 */
edit.get = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UnidadMedidaController::edit
 * @see app/Http/Controllers/UnidadMedidaController.php:213
 * @route '/unidades/{unidad}/edit'
 */
edit.head = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UnidadMedidaController::edit
 * @see app/Http/Controllers/UnidadMedidaController.php:213
 * @route '/unidades/{unidad}/edit'
 */
    const editForm = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UnidadMedidaController::edit
 * @see app/Http/Controllers/UnidadMedidaController.php:213
 * @route '/unidades/{unidad}/edit'
 */
        editForm.get = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UnidadMedidaController::edit
 * @see app/Http/Controllers/UnidadMedidaController.php:213
 * @route '/unidades/{unidad}/edit'
 */
        editForm.head = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\UnidadMedidaController::update
 * @see app/Http/Controllers/UnidadMedidaController.php:232
 * @route '/unidades/{unidad}'
 */
export const update = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/unidades/{unidad}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\UnidadMedidaController::update
 * @see app/Http/Controllers/UnidadMedidaController.php:232
 * @route '/unidades/{unidad}'
 */
update.url = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { unidad: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    unidad: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        unidad: args.unidad,
                }

    return update.definition.url
            .replace('{unidad}', parsedArgs.unidad.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnidadMedidaController::update
 * @see app/Http/Controllers/UnidadMedidaController.php:232
 * @route '/unidades/{unidad}'
 */
update.put = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\UnidadMedidaController::update
 * @see app/Http/Controllers/UnidadMedidaController.php:232
 * @route '/unidades/{unidad}'
 */
update.patch = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\UnidadMedidaController::update
 * @see app/Http/Controllers/UnidadMedidaController.php:232
 * @route '/unidades/{unidad}'
 */
    const updateForm = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UnidadMedidaController::update
 * @see app/Http/Controllers/UnidadMedidaController.php:232
 * @route '/unidades/{unidad}'
 */
        updateForm.put = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\UnidadMedidaController::update
 * @see app/Http/Controllers/UnidadMedidaController.php:232
 * @route '/unidades/{unidad}'
 */
        updateForm.patch = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\UnidadMedidaController::destroy
 * @see app/Http/Controllers/UnidadMedidaController.php:254
 * @route '/unidades/{unidad}'
 */
export const destroy = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/unidades/{unidad}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\UnidadMedidaController::destroy
 * @see app/Http/Controllers/UnidadMedidaController.php:254
 * @route '/unidades/{unidad}'
 */
destroy.url = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { unidad: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    unidad: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        unidad: args.unidad,
                }

    return destroy.definition.url
            .replace('{unidad}', parsedArgs.unidad.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\UnidadMedidaController::destroy
 * @see app/Http/Controllers/UnidadMedidaController.php:254
 * @route '/unidades/{unidad}'
 */
destroy.delete = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\UnidadMedidaController::destroy
 * @see app/Http/Controllers/UnidadMedidaController.php:254
 * @route '/unidades/{unidad}'
 */
    const destroyForm = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UnidadMedidaController::destroy
 * @see app/Http/Controllers/UnidadMedidaController.php:254
 * @route '/unidades/{unidad}'
 */
        destroyForm.delete = (args: { unidad: string | number } | [unidad: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const UnidadMedidaController = { indexApi, storeApi, updateApi, destroyApi, index, create, store, show, edit, update, destroy }

export default UnidadMedidaController