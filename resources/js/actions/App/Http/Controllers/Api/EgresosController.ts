import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\EgresosController::store
 * @see app/Http/Controllers/Api/EgresosController.php:69
 * @route '/api/app/egresos'
 */
const storeade30ad2141819bb3cf2a7d3b15c5950 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeade30ad2141819bb3cf2a7d3b15c5950.url(options),
    method: 'post',
})

storeade30ad2141819bb3cf2a7d3b15c5950.definition = {
    methods: ["post"],
    url: '/api/app/egresos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EgresosController::store
 * @see app/Http/Controllers/Api/EgresosController.php:69
 * @route '/api/app/egresos'
 */
storeade30ad2141819bb3cf2a7d3b15c5950.url = (options?: RouteQueryOptions) => {
    return storeade30ad2141819bb3cf2a7d3b15c5950.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EgresosController::store
 * @see app/Http/Controllers/Api/EgresosController.php:69
 * @route '/api/app/egresos'
 */
storeade30ad2141819bb3cf2a7d3b15c5950.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeade30ad2141819bb3cf2a7d3b15c5950.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\EgresosController::store
 * @see app/Http/Controllers/Api/EgresosController.php:69
 * @route '/api/egresos'
 */
const storeaa2be51e4ed52f1b34378d5d9088625b = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeaa2be51e4ed52f1b34378d5d9088625b.url(options),
    method: 'post',
})

storeaa2be51e4ed52f1b34378d5d9088625b.definition = {
    methods: ["post"],
    url: '/api/egresos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EgresosController::store
 * @see app/Http/Controllers/Api/EgresosController.php:69
 * @route '/api/egresos'
 */
storeaa2be51e4ed52f1b34378d5d9088625b.url = (options?: RouteQueryOptions) => {
    return storeaa2be51e4ed52f1b34378d5d9088625b.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EgresosController::store
 * @see app/Http/Controllers/Api/EgresosController.php:69
 * @route '/api/egresos'
 */
storeaa2be51e4ed52f1b34378d5d9088625b.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeaa2be51e4ed52f1b34378d5d9088625b.url(options),
    method: 'post',
})

export const store = {
    '/api/app/egresos': storeade30ad2141819bb3cf2a7d3b15c5950,
    '/api/egresos': storeaa2be51e4ed52f1b34378d5d9088625b,
}

/**
* @see \App\Http\Controllers\Api\EgresosController::index
 * @see app/Http/Controllers/Api/EgresosController.php:24
 * @route '/api/egresos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/egresos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EgresosController::index
 * @see app/Http/Controllers/Api/EgresosController.php:24
 * @route '/api/egresos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EgresosController::index
 * @see app/Http/Controllers/Api/EgresosController.php:24
 * @route '/api/egresos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EgresosController::index
 * @see app/Http/Controllers/Api/EgresosController.php:24
 * @route '/api/egresos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EgresosController::show
 * @see app/Http/Controllers/Api/EgresosController.php:275
 * @route '/api/egresos/{egreso}'
 */
export const show = (args: { egreso: number | { id: number } } | [egreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/egresos/{egreso}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\EgresosController::show
 * @see app/Http/Controllers/Api/EgresosController.php:275
 * @route '/api/egresos/{egreso}'
 */
show.url = (args: { egreso: number | { id: number } } | [egreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { egreso: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { egreso: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    egreso: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        egreso: typeof args.egreso === 'object'
                ? args.egreso.id
                : args.egreso,
                }

    return show.definition.url
            .replace('{egreso}', parsedArgs.egreso.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EgresosController::show
 * @see app/Http/Controllers/Api/EgresosController.php:275
 * @route '/api/egresos/{egreso}'
 */
show.get = (args: { egreso: number | { id: number } } | [egreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\EgresosController::show
 * @see app/Http/Controllers/Api/EgresosController.php:275
 * @route '/api/egresos/{egreso}'
 */
show.head = (args: { egreso: number | { id: number } } | [egreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\EgresosController::anular
 * @see app/Http/Controllers/Api/EgresosController.php:294
 * @route '/api/egresos/{egreso}/anular'
 */
export const anular = (args: { egreso: number | { id: number } } | [egreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: anular.url(args, options),
    method: 'post',
})

anular.definition = {
    methods: ["post"],
    url: '/api/egresos/{egreso}/anular',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\EgresosController::anular
 * @see app/Http/Controllers/Api/EgresosController.php:294
 * @route '/api/egresos/{egreso}/anular'
 */
anular.url = (args: { egreso: number | { id: number } } | [egreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { egreso: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { egreso: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    egreso: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        egreso: typeof args.egreso === 'object'
                ? args.egreso.id
                : args.egreso,
                }

    return anular.definition.url
            .replace('{egreso}', parsedArgs.egreso.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\EgresosController::anular
 * @see app/Http/Controllers/Api/EgresosController.php:294
 * @route '/api/egresos/{egreso}/anular'
 */
anular.post = (args: { egreso: number | { id: number } } | [egreso: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: anular.url(args, options),
    method: 'post',
})
const EgresosController = { store, index, show, anular }

export default EgresosController