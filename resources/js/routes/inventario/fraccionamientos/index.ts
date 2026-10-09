import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\FraccionamientoController::index
 * @see app/Http/Controllers/FraccionamientoController.php:9
 * @route '/inventario/fraccionamientos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventario/fraccionamientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FraccionamientoController::index
 * @see app/Http/Controllers/FraccionamientoController.php:9
 * @route '/inventario/fraccionamientos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FraccionamientoController::index
 * @see app/Http/Controllers/FraccionamientoController.php:9
 * @route '/inventario/fraccionamientos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FraccionamientoController::index
 * @see app/Http/Controllers/FraccionamientoController.php:9
 * @route '/inventario/fraccionamientos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\FraccionamientoController::index
 * @see app/Http/Controllers/FraccionamientoController.php:9
 * @route '/inventario/fraccionamientos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\FraccionamientoController::index
 * @see app/Http/Controllers/FraccionamientoController.php:9
 * @route '/inventario/fraccionamientos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\FraccionamientoController::index
 * @see app/Http/Controllers/FraccionamientoController.php:9
 * @route '/inventario/fraccionamientos'
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
* @see \App\Http\Controllers\FraccionamientoController::create
 * @see app/Http/Controllers/FraccionamientoController.php:14
 * @route '/inventario/fraccionamientos/crear'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/inventario/fraccionamientos/crear',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FraccionamientoController::create
 * @see app/Http/Controllers/FraccionamientoController.php:14
 * @route '/inventario/fraccionamientos/crear'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FraccionamientoController::create
 * @see app/Http/Controllers/FraccionamientoController.php:14
 * @route '/inventario/fraccionamientos/crear'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FraccionamientoController::create
 * @see app/Http/Controllers/FraccionamientoController.php:14
 * @route '/inventario/fraccionamientos/crear'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\FraccionamientoController::create
 * @see app/Http/Controllers/FraccionamientoController.php:14
 * @route '/inventario/fraccionamientos/crear'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\FraccionamientoController::create
 * @see app/Http/Controllers/FraccionamientoController.php:14
 * @route '/inventario/fraccionamientos/crear'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\FraccionamientoController::create
 * @see app/Http/Controllers/FraccionamientoController.php:14
 * @route '/inventario/fraccionamientos/crear'
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
const fraccionamientos = {
    index,
create,
}

export default fraccionamientos