import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ProductoComponenteController::index
 * @see app/Http/Controllers/ProductoComponenteController.php:15
 * @route '/api/productos/{producto}/componentes'
 */
export const index = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/productos/{producto}/componentes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoComponenteController::index
 * @see app/Http/Controllers/ProductoComponenteController.php:15
 * @route '/api/productos/{producto}/componentes'
 */
index.url = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    producto: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        producto: args.producto,
                }

    return index.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoComponenteController::index
 * @see app/Http/Controllers/ProductoComponenteController.php:15
 * @route '/api/productos/{producto}/componentes'
 */
index.get = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProductoComponenteController::index
 * @see app/Http/Controllers/ProductoComponenteController.php:15
 * @route '/api/productos/{producto}/componentes'
 */
index.head = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductoComponenteController::store
 * @see app/Http/Controllers/ProductoComponenteController.php:42
 * @route '/api/productos/{producto}/componentes'
 */
export const store = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/productos/{producto}/componentes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductoComponenteController::store
 * @see app/Http/Controllers/ProductoComponenteController.php:42
 * @route '/api/productos/{producto}/componentes'
 */
store.url = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    producto: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        producto: args.producto,
                }

    return store.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoComponenteController::store
 * @see app/Http/Controllers/ProductoComponenteController.php:42
 * @route '/api/productos/{producto}/componentes'
 */
store.post = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductoComponenteController::update
 * @see app/Http/Controllers/ProductoComponenteController.php:88
 * @route '/api/productos/{producto}/componentes/{componente}'
 */
export const update = (args: { producto: string | number, componente: string | number } | [producto: string | number, componente: string | number ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/productos/{producto}/componentes/{componente}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ProductoComponenteController::update
 * @see app/Http/Controllers/ProductoComponenteController.php:88
 * @route '/api/productos/{producto}/componentes/{componente}'
 */
update.url = (args: { producto: string | number, componente: string | number } | [producto: string | number, componente: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    producto: args[0],
                    componente: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        producto: args.producto,
                                componente: args.componente,
                }

    return update.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace('{componente}', parsedArgs.componente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoComponenteController::update
 * @see app/Http/Controllers/ProductoComponenteController.php:88
 * @route '/api/productos/{producto}/componentes/{componente}'
 */
update.put = (args: { producto: string | number, componente: string | number } | [producto: string | number, componente: string | number ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\ProductoComponenteController::destroy
 * @see app/Http/Controllers/ProductoComponenteController.php:115
 * @route '/api/productos/{producto}/componentes/{componente}'
 */
export const destroy = (args: { producto: string | number, componente: string | number } | [producto: string | number, componente: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/productos/{producto}/componentes/{componente}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProductoComponenteController::destroy
 * @see app/Http/Controllers/ProductoComponenteController.php:115
 * @route '/api/productos/{producto}/componentes/{componente}'
 */
destroy.url = (args: { producto: string | number, componente: string | number } | [producto: string | number, componente: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    producto: args[0],
                    componente: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        producto: args.producto,
                                componente: args.componente,
                }

    return destroy.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace('{componente}', parsedArgs.componente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoComponenteController::destroy
 * @see app/Http/Controllers/ProductoComponenteController.php:115
 * @route '/api/productos/{producto}/componentes/{componente}'
 */
destroy.delete = (args: { producto: string | number, componente: string | number } | [producto: string | number, componente: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProductoComponenteController::productosDisponibles
 * @see app/Http/Controllers/ProductoComponenteController.php:132
 * @route '/api/productos/{producto}/componentes/disponibles'
 */
export const productosDisponibles = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(args, options),
    method: 'get',
})

productosDisponibles.definition = {
    methods: ["get","head"],
    url: '/api/productos/{producto}/componentes/disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoComponenteController::productosDisponibles
 * @see app/Http/Controllers/ProductoComponenteController.php:132
 * @route '/api/productos/{producto}/componentes/disponibles'
 */
productosDisponibles.url = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { producto: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    producto: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        producto: args.producto,
                }

    return productosDisponibles.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoComponenteController::productosDisponibles
 * @see app/Http/Controllers/ProductoComponenteController.php:132
 * @route '/api/productos/{producto}/componentes/disponibles'
 */
productosDisponibles.get = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProductoComponenteController::productosDisponibles
 * @see app/Http/Controllers/ProductoComponenteController.php:132
 * @route '/api/productos/{producto}/componentes/disponibles'
 */
productosDisponibles.head = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: productosDisponibles.url(args, options),
    method: 'head',
})
const ProductoComponenteController = { index, store, update, destroy, productosDisponibles }

export default ProductoComponenteController