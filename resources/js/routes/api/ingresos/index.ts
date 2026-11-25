import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\IngresosController::index
 * @see app/Http/Controllers/Api/IngresosController.php:30
 * @route '/api/ingresos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/ingresos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\IngresosController::index
 * @see app/Http/Controllers/Api/IngresosController.php:30
 * @route '/api/ingresos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\IngresosController::index
 * @see app/Http/Controllers/Api/IngresosController.php:30
 * @route '/api/ingresos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\IngresosController::index
 * @see app/Http/Controllers/Api/IngresosController.php:30
 * @route '/api/ingresos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\IngresosController::index
 * @see app/Http/Controllers/Api/IngresosController.php:30
 * @route '/api/ingresos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\IngresosController::index
 * @see app/Http/Controllers/Api/IngresosController.php:30
 * @route '/api/ingresos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\IngresosController::index
 * @see app/Http/Controllers/Api/IngresosController.php:30
 * @route '/api/ingresos'
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
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/ingresos'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/ingresos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/ingresos'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/ingresos'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/ingresos'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/ingresos'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\IngresosController::show
 * @see app/Http/Controllers/Api/IngresosController.php:189
 * @route '/api/ingresos/{ingreso}'
 */
export const show = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/ingresos/{ingreso}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\IngresosController::show
 * @see app/Http/Controllers/Api/IngresosController.php:189
 * @route '/api/ingresos/{ingreso}'
 */
show.url = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { ingreso: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { ingreso: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    ingreso: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        ingreso: typeof args.ingreso === 'object'
                ? args.ingreso.id
                : args.ingreso,
                }

    return show.definition.url
            .replace('{ingreso}', parsedArgs.ingreso.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\IngresosController::show
 * @see app/Http/Controllers/Api/IngresosController.php:189
 * @route '/api/ingresos/{ingreso}'
 */
show.get = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\IngresosController::show
 * @see app/Http/Controllers/Api/IngresosController.php:189
 * @route '/api/ingresos/{ingreso}'
 */
show.head = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\IngresosController::show
 * @see app/Http/Controllers/Api/IngresosController.php:189
 * @route '/api/ingresos/{ingreso}'
 */
    const showForm = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\IngresosController::show
 * @see app/Http/Controllers/Api/IngresosController.php:189
 * @route '/api/ingresos/{ingreso}'
 */
        showForm.get = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\IngresosController::show
 * @see app/Http/Controllers/Api/IngresosController.php:189
 * @route '/api/ingresos/{ingreso}'
 */
        showForm.head = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Api\IngresosController::anular
 * @see app/Http/Controllers/Api/IngresosController.php:202
 * @route '/api/ingresos/{ingreso}/anular'
 */
export const anular = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: anular.url(args, options),
    method: 'post',
})

anular.definition = {
    methods: ["post"],
    url: '/api/ingresos/{ingreso}/anular',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\IngresosController::anular
 * @see app/Http/Controllers/Api/IngresosController.php:202
 * @route '/api/ingresos/{ingreso}/anular'
 */
anular.url = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { ingreso: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { ingreso: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    ingreso: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        ingreso: typeof args.ingreso === 'object'
                ? args.ingreso.id
                : args.ingreso,
                }

    return anular.definition.url
            .replace('{ingreso}', parsedArgs.ingreso.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\IngresosController::anular
 * @see app/Http/Controllers/Api/IngresosController.php:202
 * @route '/api/ingresos/{ingreso}/anular'
 */
anular.post = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: anular.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\IngresosController::anular
 * @see app/Http/Controllers/Api/IngresosController.php:202
 * @route '/api/ingresos/{ingreso}/anular'
 */
    const anularForm = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: anular.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\IngresosController::anular
 * @see app/Http/Controllers/Api/IngresosController.php:202
 * @route '/api/ingresos/{ingreso}/anular'
 */
        anularForm.post = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: anular.url(args, options),
            method: 'post',
        })
    
    anular.form = anularForm
const ingresos = {
    index,
store,
show,
anular,
}

export default ingresos