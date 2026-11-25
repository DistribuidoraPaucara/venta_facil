import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/app/ingresos'
 */
const store910772838bb8cfde11ded189bcc43b89 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store910772838bb8cfde11ded189bcc43b89.url(options),
    method: 'post',
})

store910772838bb8cfde11ded189bcc43b89.definition = {
    methods: ["post"],
    url: '/api/app/ingresos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/app/ingresos'
 */
store910772838bb8cfde11ded189bcc43b89.url = (options?: RouteQueryOptions) => {
    return store910772838bb8cfde11ded189bcc43b89.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/app/ingresos'
 */
store910772838bb8cfde11ded189bcc43b89.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store910772838bb8cfde11ded189bcc43b89.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/app/ingresos'
 */
    const store910772838bb8cfde11ded189bcc43b89Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store910772838bb8cfde11ded189bcc43b89.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/app/ingresos'
 */
        store910772838bb8cfde11ded189bcc43b89Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store910772838bb8cfde11ded189bcc43b89.url(options),
            method: 'post',
        })
    
    store910772838bb8cfde11ded189bcc43b89.form = store910772838bb8cfde11ded189bcc43b89Form
    /**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/ingresos'
 */
const store29fb8844c925563202cb896901d83eda = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store29fb8844c925563202cb896901d83eda.url(options),
    method: 'post',
})

store29fb8844c925563202cb896901d83eda.definition = {
    methods: ["post"],
    url: '/api/ingresos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/ingresos'
 */
store29fb8844c925563202cb896901d83eda.url = (options?: RouteQueryOptions) => {
    return store29fb8844c925563202cb896901d83eda.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/ingresos'
 */
store29fb8844c925563202cb896901d83eda.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store29fb8844c925563202cb896901d83eda.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/ingresos'
 */
    const store29fb8844c925563202cb896901d83edaForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store29fb8844c925563202cb896901d83eda.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\IngresosController::store
 * @see app/Http/Controllers/Api/IngresosController.php:56
 * @route '/api/ingresos'
 */
        store29fb8844c925563202cb896901d83edaForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store29fb8844c925563202cb896901d83eda.url(options),
            method: 'post',
        })
    
    store29fb8844c925563202cb896901d83eda.form = store29fb8844c925563202cb896901d83edaForm

export const store = {
    '/api/app/ingresos': store910772838bb8cfde11ded189bcc43b89,
    '/api/ingresos': store29fb8844c925563202cb896901d83eda,
}

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
const IngresosController = { store, index, show, anular }

export default IngresosController