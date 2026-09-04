import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\CategoriaApiController::index
 * @see app/Http/Controllers/Api/CategoriaApiController.php:18
 * @route '/api/app/categorias-crud'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/app/categorias-crud',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CategoriaApiController::index
 * @see app/Http/Controllers/Api/CategoriaApiController.php:18
 * @route '/api/app/categorias-crud'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CategoriaApiController::index
 * @see app/Http/Controllers/Api/CategoriaApiController.php:18
 * @route '/api/app/categorias-crud'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CategoriaApiController::index
 * @see app/Http/Controllers/Api/CategoriaApiController.php:18
 * @route '/api/app/categorias-crud'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CategoriaApiController::index
 * @see app/Http/Controllers/Api/CategoriaApiController.php:18
 * @route '/api/app/categorias-crud'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CategoriaApiController::index
 * @see app/Http/Controllers/Api/CategoriaApiController.php:18
 * @route '/api/app/categorias-crud'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CategoriaApiController::index
 * @see app/Http/Controllers/Api/CategoriaApiController.php:18
 * @route '/api/app/categorias-crud'
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
* @see \App\Http\Controllers\Api\CategoriaApiController::store
 * @see app/Http/Controllers/Api/CategoriaApiController.php:60
 * @route '/api/app/categorias-crud'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/app/categorias-crud',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CategoriaApiController::store
 * @see app/Http/Controllers/Api/CategoriaApiController.php:60
 * @route '/api/app/categorias-crud'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CategoriaApiController::store
 * @see app/Http/Controllers/Api/CategoriaApiController.php:60
 * @route '/api/app/categorias-crud'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CategoriaApiController::store
 * @see app/Http/Controllers/Api/CategoriaApiController.php:60
 * @route '/api/app/categorias-crud'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CategoriaApiController::store
 * @see app/Http/Controllers/Api/CategoriaApiController.php:60
 * @route '/api/app/categorias-crud'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\CategoriaApiController::show
 * @see app/Http/Controllers/Api/CategoriaApiController.php:111
 * @route '/api/app/categorias-crud/{categoria}'
 */
export const show = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/app/categorias-crud/{categoria}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CategoriaApiController::show
 * @see app/Http/Controllers/Api/CategoriaApiController.php:111
 * @route '/api/app/categorias-crud/{categoria}'
 */
show.url = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoria: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    categoria: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        categoria: args.categoria,
                }

    return show.definition.url
            .replace('{categoria}', parsedArgs.categoria.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CategoriaApiController::show
 * @see app/Http/Controllers/Api/CategoriaApiController.php:111
 * @route '/api/app/categorias-crud/{categoria}'
 */
show.get = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CategoriaApiController::show
 * @see app/Http/Controllers/Api/CategoriaApiController.php:111
 * @route '/api/app/categorias-crud/{categoria}'
 */
show.head = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CategoriaApiController::show
 * @see app/Http/Controllers/Api/CategoriaApiController.php:111
 * @route '/api/app/categorias-crud/{categoria}'
 */
    const showForm = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CategoriaApiController::show
 * @see app/Http/Controllers/Api/CategoriaApiController.php:111
 * @route '/api/app/categorias-crud/{categoria}'
 */
        showForm.get = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CategoriaApiController::show
 * @see app/Http/Controllers/Api/CategoriaApiController.php:111
 * @route '/api/app/categorias-crud/{categoria}'
 */
        showForm.head = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Api\CategoriaApiController::update
 * @see app/Http/Controllers/Api/CategoriaApiController.php:139
 * @route '/api/app/categorias-crud/{categoria}'
 */
export const update = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/app/categorias-crud/{categoria}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\CategoriaApiController::update
 * @see app/Http/Controllers/Api/CategoriaApiController.php:139
 * @route '/api/app/categorias-crud/{categoria}'
 */
update.url = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoria: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    categoria: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        categoria: args.categoria,
                }

    return update.definition.url
            .replace('{categoria}', parsedArgs.categoria.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CategoriaApiController::update
 * @see app/Http/Controllers/Api/CategoriaApiController.php:139
 * @route '/api/app/categorias-crud/{categoria}'
 */
update.put = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Api\CategoriaApiController::update
 * @see app/Http/Controllers/Api/CategoriaApiController.php:139
 * @route '/api/app/categorias-crud/{categoria}'
 */
    const updateForm = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CategoriaApiController::update
 * @see app/Http/Controllers/Api/CategoriaApiController.php:139
 * @route '/api/app/categorias-crud/{categoria}'
 */
        updateForm.put = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Api\CategoriaApiController::destroy
 * @see app/Http/Controllers/Api/CategoriaApiController.php:188
 * @route '/api/app/categorias-crud/{categoria}'
 */
export const destroy = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/app/categorias-crud/{categoria}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\CategoriaApiController::destroy
 * @see app/Http/Controllers/Api/CategoriaApiController.php:188
 * @route '/api/app/categorias-crud/{categoria}'
 */
destroy.url = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { categoria: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    categoria: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        categoria: args.categoria,
                }

    return destroy.definition.url
            .replace('{categoria}', parsedArgs.categoria.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CategoriaApiController::destroy
 * @see app/Http/Controllers/Api/CategoriaApiController.php:188
 * @route '/api/app/categorias-crud/{categoria}'
 */
destroy.delete = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Api\CategoriaApiController::destroy
 * @see app/Http/Controllers/Api/CategoriaApiController.php:188
 * @route '/api/app/categorias-crud/{categoria}'
 */
    const destroyForm = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CategoriaApiController::destroy
 * @see app/Http/Controllers/Api/CategoriaApiController.php:188
 * @route '/api/app/categorias-crud/{categoria}'
 */
        destroyForm.delete = (args: { categoria: string | number } | [categoria: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const CategoriaApiController = { index, store, show, update, destroy }

export default CategoriaApiController