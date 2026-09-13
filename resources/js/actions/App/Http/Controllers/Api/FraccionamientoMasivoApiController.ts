import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::store
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:23
 * @route '/api/inventario/fraccionamientos-masivos'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/inventario/fraccionamientos-masivos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::store
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:23
 * @route '/api/inventario/fraccionamientos-masivos'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::store
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:23
 * @route '/api/inventario/fraccionamientos-masivos'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::store
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:23
 * @route '/api/inventario/fraccionamientos-masivos'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::store
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:23
 * @route '/api/inventario/fraccionamientos-masivos'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::index
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:67
 * @route '/api/inventario/fraccionamientos-masivos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/inventario/fraccionamientos-masivos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::index
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:67
 * @route '/api/inventario/fraccionamientos-masivos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::index
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:67
 * @route '/api/inventario/fraccionamientos-masivos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::index
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:67
 * @route '/api/inventario/fraccionamientos-masivos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::index
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:67
 * @route '/api/inventario/fraccionamientos-masivos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::index
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:67
 * @route '/api/inventario/fraccionamientos-masivos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::index
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:67
 * @route '/api/inventario/fraccionamientos-masivos'
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
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::show
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:97
 * @route '/api/inventario/fraccionamientos-masivos/{fraccionamientoMasivo}'
 */
export const show = (args: { fraccionamientoMasivo: number | { id: number } } | [fraccionamientoMasivo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/inventario/fraccionamientos-masivos/{fraccionamientoMasivo}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::show
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:97
 * @route '/api/inventario/fraccionamientos-masivos/{fraccionamientoMasivo}'
 */
show.url = (args: { fraccionamientoMasivo: number | { id: number } } | [fraccionamientoMasivo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { fraccionamientoMasivo: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { fraccionamientoMasivo: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    fraccionamientoMasivo: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        fraccionamientoMasivo: typeof args.fraccionamientoMasivo === 'object'
                ? args.fraccionamientoMasivo.id
                : args.fraccionamientoMasivo,
                }

    return show.definition.url
            .replace('{fraccionamientoMasivo}', parsedArgs.fraccionamientoMasivo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::show
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:97
 * @route '/api/inventario/fraccionamientos-masivos/{fraccionamientoMasivo}'
 */
show.get = (args: { fraccionamientoMasivo: number | { id: number } } | [fraccionamientoMasivo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::show
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:97
 * @route '/api/inventario/fraccionamientos-masivos/{fraccionamientoMasivo}'
 */
show.head = (args: { fraccionamientoMasivo: number | { id: number } } | [fraccionamientoMasivo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::show
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:97
 * @route '/api/inventario/fraccionamientos-masivos/{fraccionamientoMasivo}'
 */
    const showForm = (args: { fraccionamientoMasivo: number | { id: number } } | [fraccionamientoMasivo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::show
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:97
 * @route '/api/inventario/fraccionamientos-masivos/{fraccionamientoMasivo}'
 */
        showForm.get = (args: { fraccionamientoMasivo: number | { id: number } } | [fraccionamientoMasivo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\FraccionamientoMasivoApiController::show
 * @see app/Http/Controllers/Api/FraccionamientoMasivoApiController.php:97
 * @route '/api/inventario/fraccionamientos-masivos/{fraccionamientoMasivo}'
 */
        showForm.head = (args: { fraccionamientoMasivo: number | { id: number } } | [fraccionamientoMasivo: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const FraccionamientoMasivoApiController = { store, index, show }

export default FraccionamientoMasivoApiController