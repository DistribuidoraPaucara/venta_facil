import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\IngresosController::index
 * @see app/Http/Controllers/IngresosController.php:19
 * @route '/ingresos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/ingresos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\IngresosController::index
 * @see app/Http/Controllers/IngresosController.php:19
 * @route '/ingresos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\IngresosController::index
 * @see app/Http/Controllers/IngresosController.php:19
 * @route '/ingresos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\IngresosController::index
 * @see app/Http/Controllers/IngresosController.php:19
 * @route '/ingresos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\IngresosController::index
 * @see app/Http/Controllers/IngresosController.php:19
 * @route '/ingresos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\IngresosController::index
 * @see app/Http/Controllers/IngresosController.php:19
 * @route '/ingresos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\IngresosController::index
 * @see app/Http/Controllers/IngresosController.php:19
 * @route '/ingresos'
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
* @see \App\Http\Controllers\IngresosController::create
 * @see app/Http/Controllers/IngresosController.php:51
 * @route '/ingresos/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/ingresos/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\IngresosController::create
 * @see app/Http/Controllers/IngresosController.php:51
 * @route '/ingresos/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\IngresosController::create
 * @see app/Http/Controllers/IngresosController.php:51
 * @route '/ingresos/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\IngresosController::create
 * @see app/Http/Controllers/IngresosController.php:51
 * @route '/ingresos/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\IngresosController::create
 * @see app/Http/Controllers/IngresosController.php:51
 * @route '/ingresos/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\IngresosController::create
 * @see app/Http/Controllers/IngresosController.php:51
 * @route '/ingresos/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\IngresosController::create
 * @see app/Http/Controllers/IngresosController.php:51
 * @route '/ingresos/create'
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
* @see \App\Http\Controllers\IngresosController::imprimir
 * @see app/Http/Controllers/IngresosController.php:79
 * @route '/ingresos/{ingreso}/imprimir'
 */
export const imprimir = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(args, options),
    method: 'get',
})

imprimir.definition = {
    methods: ["get","head"],
    url: '/ingresos/{ingreso}/imprimir',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\IngresosController::imprimir
 * @see app/Http/Controllers/IngresosController.php:79
 * @route '/ingresos/{ingreso}/imprimir'
 */
imprimir.url = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return imprimir.definition.url
            .replace('{ingreso}', parsedArgs.ingreso.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\IngresosController::imprimir
 * @see app/Http/Controllers/IngresosController.php:79
 * @route '/ingresos/{ingreso}/imprimir'
 */
imprimir.get = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\IngresosController::imprimir
 * @see app/Http/Controllers/IngresosController.php:79
 * @route '/ingresos/{ingreso}/imprimir'
 */
imprimir.head = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimir.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\IngresosController::imprimir
 * @see app/Http/Controllers/IngresosController.php:79
 * @route '/ingresos/{ingreso}/imprimir'
 */
    const imprimirForm = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: imprimir.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\IngresosController::imprimir
 * @see app/Http/Controllers/IngresosController.php:79
 * @route '/ingresos/{ingreso}/imprimir'
 */
        imprimirForm.get = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimir.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\IngresosController::imprimir
 * @see app/Http/Controllers/IngresosController.php:79
 * @route '/ingresos/{ingreso}/imprimir'
 */
        imprimirForm.head = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimir.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    imprimir.form = imprimirForm
/**
* @see \App\Http\Controllers\IngresosController::show
 * @see app/Http/Controllers/IngresosController.php:62
 * @route '/ingresos/{ingreso}'
 */
export const show = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/ingresos/{ingreso}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\IngresosController::show
 * @see app/Http/Controllers/IngresosController.php:62
 * @route '/ingresos/{ingreso}'
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
* @see \App\Http\Controllers\IngresosController::show
 * @see app/Http/Controllers/IngresosController.php:62
 * @route '/ingresos/{ingreso}'
 */
show.get = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\IngresosController::show
 * @see app/Http/Controllers/IngresosController.php:62
 * @route '/ingresos/{ingreso}'
 */
show.head = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\IngresosController::show
 * @see app/Http/Controllers/IngresosController.php:62
 * @route '/ingresos/{ingreso}'
 */
    const showForm = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\IngresosController::show
 * @see app/Http/Controllers/IngresosController.php:62
 * @route '/ingresos/{ingreso}'
 */
        showForm.get = (args: { ingreso: number | { id: number } } | [ingreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\IngresosController::show
 * @see app/Http/Controllers/IngresosController.php:62
 * @route '/ingresos/{ingreso}'
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
const ingresos = {
    index,
create,
imprimir,
show,
}

export default ingresos