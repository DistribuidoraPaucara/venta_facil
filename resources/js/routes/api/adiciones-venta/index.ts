import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\AdicionVentaController::index
 * @see app/Http/Controllers/AdicionVentaController.php:20
 * @route '/api/adiciones-venta'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/adiciones-venta',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AdicionVentaController::index
 * @see app/Http/Controllers/AdicionVentaController.php:20
 * @route '/api/adiciones-venta'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdicionVentaController::index
 * @see app/Http/Controllers/AdicionVentaController.php:20
 * @route '/api/adiciones-venta'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AdicionVentaController::index
 * @see app/Http/Controllers/AdicionVentaController.php:20
 * @route '/api/adiciones-venta'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AdicionVentaController::index
 * @see app/Http/Controllers/AdicionVentaController.php:20
 * @route '/api/adiciones-venta'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AdicionVentaController::index
 * @see app/Http/Controllers/AdicionVentaController.php:20
 * @route '/api/adiciones-venta'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AdicionVentaController::index
 * @see app/Http/Controllers/AdicionVentaController.php:20
 * @route '/api/adiciones-venta'
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
* @see \App\Http\Controllers\AdicionVentaController::store
 * @see app/Http/Controllers/AdicionVentaController.php:44
 * @route '/api/adiciones-venta'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/adiciones-venta',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AdicionVentaController::store
 * @see app/Http/Controllers/AdicionVentaController.php:44
 * @route '/api/adiciones-venta'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdicionVentaController::store
 * @see app/Http/Controllers/AdicionVentaController.php:44
 * @route '/api/adiciones-venta'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\AdicionVentaController::store
 * @see app/Http/Controllers/AdicionVentaController.php:44
 * @route '/api/adiciones-venta'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AdicionVentaController::store
 * @see app/Http/Controllers/AdicionVentaController.php:44
 * @route '/api/adiciones-venta'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\AdicionVentaController::destroy
 * @see app/Http/Controllers/AdicionVentaController.php:96
 * @route '/api/adiciones-venta/{adicion}'
 */
export const destroy = (args: { adicion: number | { id: number } } | [adicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/adiciones-venta/{adicion}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\AdicionVentaController::destroy
 * @see app/Http/Controllers/AdicionVentaController.php:96
 * @route '/api/adiciones-venta/{adicion}'
 */
destroy.url = (args: { adicion: number | { id: number } } | [adicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { adicion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { adicion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    adicion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        adicion: typeof args.adicion === 'object'
                ? args.adicion.id
                : args.adicion,
                }

    return destroy.definition.url
            .replace('{adicion}', parsedArgs.adicion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdicionVentaController::destroy
 * @see app/Http/Controllers/AdicionVentaController.php:96
 * @route '/api/adiciones-venta/{adicion}'
 */
destroy.delete = (args: { adicion: number | { id: number } } | [adicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\AdicionVentaController::destroy
 * @see app/Http/Controllers/AdicionVentaController.php:96
 * @route '/api/adiciones-venta/{adicion}'
 */
    const destroyForm = (args: { adicion: number | { id: number } } | [adicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AdicionVentaController::destroy
 * @see app/Http/Controllers/AdicionVentaController.php:96
 * @route '/api/adiciones-venta/{adicion}'
 */
        destroyForm.delete = (args: { adicion: number | { id: number } } | [adicion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\AdicionVentaController::productosDisponibles
 * @see app/Http/Controllers/AdicionVentaController.php:111
 * @route '/api/adiciones-venta/productos/disponibles'
 */
export const productosDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(options),
    method: 'get',
})

productosDisponibles.definition = {
    methods: ["get","head"],
    url: '/api/adiciones-venta/productos/disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AdicionVentaController::productosDisponibles
 * @see app/Http/Controllers/AdicionVentaController.php:111
 * @route '/api/adiciones-venta/productos/disponibles'
 */
productosDisponibles.url = (options?: RouteQueryOptions) => {
    return productosDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdicionVentaController::productosDisponibles
 * @see app/Http/Controllers/AdicionVentaController.php:111
 * @route '/api/adiciones-venta/productos/disponibles'
 */
productosDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AdicionVentaController::productosDisponibles
 * @see app/Http/Controllers/AdicionVentaController.php:111
 * @route '/api/adiciones-venta/productos/disponibles'
 */
productosDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: productosDisponibles.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AdicionVentaController::productosDisponibles
 * @see app/Http/Controllers/AdicionVentaController.php:111
 * @route '/api/adiciones-venta/productos/disponibles'
 */
    const productosDisponiblesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: productosDisponibles.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AdicionVentaController::productosDisponibles
 * @see app/Http/Controllers/AdicionVentaController.php:111
 * @route '/api/adiciones-venta/productos/disponibles'
 */
        productosDisponiblesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: productosDisponibles.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AdicionVentaController::productosDisponibles
 * @see app/Http/Controllers/AdicionVentaController.php:111
 * @route '/api/adiciones-venta/productos/disponibles'
 */
        productosDisponiblesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: productosDisponibles.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    productosDisponibles.form = productosDisponiblesForm
const adicionesVenta = {
    index,
store,
destroy,
productosDisponibles,
}

export default adicionesVenta