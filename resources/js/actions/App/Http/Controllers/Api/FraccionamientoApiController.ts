import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::store
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:23
 * @route '/api/inventario/fraccionamientos'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/inventario/fraccionamientos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::store
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:23
 * @route '/api/inventario/fraccionamientos'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::store
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:23
 * @route '/api/inventario/fraccionamientos'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::index
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:76
 * @route '/api/inventario/fraccionamientos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/inventario/fraccionamientos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::index
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:76
 * @route '/api/inventario/fraccionamientos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::index
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:76
 * @route '/api/inventario/fraccionamientos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::index
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:76
 * @route '/api/inventario/fraccionamientos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::productosDisponibles
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:334
 * @route '/api/inventario/fraccionamientos/productos/disponibles'
 */
export const productosDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(options),
    method: 'get',
})

productosDisponibles.definition = {
    methods: ["get","head"],
    url: '/api/inventario/fraccionamientos/productos/disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::productosDisponibles
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:334
 * @route '/api/inventario/fraccionamientos/productos/disponibles'
 */
productosDisponibles.url = (options?: RouteQueryOptions) => {
    return productosDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::productosDisponibles
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:334
 * @route '/api/inventario/fraccionamientos/productos/disponibles'
 */
productosDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::productosDisponibles
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:334
 * @route '/api/inventario/fraccionamientos/productos/disponibles'
 */
productosDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: productosDisponibles.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::conversionesDelProducto
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:287
 * @route '/api/inventario/fraccionamientos/producto/{productoId}/conversiones'
 */
export const conversionesDelProducto = (args: { productoId: string | number } | [productoId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: conversionesDelProducto.url(args, options),
    method: 'get',
})

conversionesDelProducto.definition = {
    methods: ["get","head"],
    url: '/api/inventario/fraccionamientos/producto/{productoId}/conversiones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::conversionesDelProducto
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:287
 * @route '/api/inventario/fraccionamientos/producto/{productoId}/conversiones'
 */
conversionesDelProducto.url = (args: { productoId: string | number } | [productoId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productoId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    productoId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productoId: args.productoId,
                }

    return conversionesDelProducto.definition.url
            .replace('{productoId}', parsedArgs.productoId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::conversionesDelProducto
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:287
 * @route '/api/inventario/fraccionamientos/producto/{productoId}/conversiones'
 */
conversionesDelProducto.get = (args: { productoId: string | number } | [productoId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: conversionesDelProducto.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::conversionesDelProducto
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:287
 * @route '/api/inventario/fraccionamientos/producto/{productoId}/conversiones'
 */
conversionesDelProducto.head = (args: { productoId: string | number } | [productoId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: conversionesDelProducto.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::show
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:163
 * @route '/api/inventario/fraccionamientos/{movimiento}'
 */
export const show = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/inventario/fraccionamientos/{movimiento}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::show
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:163
 * @route '/api/inventario/fraccionamientos/{movimiento}'
 */
show.url = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { movimiento: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { movimiento: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    movimiento: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        movimiento: typeof args.movimiento === 'object'
                ? args.movimiento.id
                : args.movimiento,
                }

    return show.definition.url
            .replace('{movimiento}', parsedArgs.movimiento.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::show
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:163
 * @route '/api/inventario/fraccionamientos/{movimiento}'
 */
show.get = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::show
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:163
 * @route '/api/inventario/fraccionamientos/{movimiento}'
 */
show.head = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::revertir
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:192
 * @route '/api/inventario/fraccionamientos/{movimiento}/revertir'
 */
export const revertir = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: revertir.url(args, options),
    method: 'delete',
})

revertir.definition = {
    methods: ["delete"],
    url: '/api/inventario/fraccionamientos/{movimiento}/revertir',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::revertir
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:192
 * @route '/api/inventario/fraccionamientos/{movimiento}/revertir'
 */
revertir.url = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { movimiento: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { movimiento: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    movimiento: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        movimiento: typeof args.movimiento === 'object'
                ? args.movimiento.id
                : args.movimiento,
                }

    return revertir.definition.url
            .replace('{movimiento}', parsedArgs.movimiento.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::revertir
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:192
 * @route '/api/inventario/fraccionamientos/{movimiento}/revertir'
 */
revertir.delete = (args: { movimiento: number | { id: number } } | [movimiento: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: revertir.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::historialProducto
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:216
 * @route '/api/inventario/fraccionamientos/producto/{productoId}/historial'
 */
export const historialProducto = (args: { productoId: string | number } | [productoId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialProducto.url(args, options),
    method: 'get',
})

historialProducto.definition = {
    methods: ["get","head"],
    url: '/api/inventario/fraccionamientos/producto/{productoId}/historial',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::historialProducto
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:216
 * @route '/api/inventario/fraccionamientos/producto/{productoId}/historial'
 */
historialProducto.url = (args: { productoId: string | number } | [productoId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productoId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    productoId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productoId: args.productoId,
                }

    return historialProducto.definition.url
            .replace('{productoId}', parsedArgs.productoId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::historialProducto
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:216
 * @route '/api/inventario/fraccionamientos/producto/{productoId}/historial'
 */
historialProducto.get = (args: { productoId: string | number } | [productoId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: historialProducto.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::historialProducto
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:216
 * @route '/api/inventario/fraccionamientos/producto/{productoId}/historial'
 */
historialProducto.head = (args: { productoId: string | number } | [productoId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: historialProducto.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::estadisticas
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:266
 * @route '/api/inventario/fraccionamientos/producto/{productoPadreId}/estadisticas'
 */
export const estadisticas = (args: { productoPadreId: string | number } | [productoPadreId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadisticas.url(args, options),
    method: 'get',
})

estadisticas.definition = {
    methods: ["get","head"],
    url: '/api/inventario/fraccionamientos/producto/{productoPadreId}/estadisticas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::estadisticas
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:266
 * @route '/api/inventario/fraccionamientos/producto/{productoPadreId}/estadisticas'
 */
estadisticas.url = (args: { productoPadreId: string | number } | [productoPadreId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productoPadreId: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    productoPadreId: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productoPadreId: args.productoPadreId,
                }

    return estadisticas.definition.url
            .replace('{productoPadreId}', parsedArgs.productoPadreId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::estadisticas
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:266
 * @route '/api/inventario/fraccionamientos/producto/{productoPadreId}/estadisticas'
 */
estadisticas.get = (args: { productoPadreId: string | number } | [productoPadreId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estadisticas.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\FraccionamientoApiController::estadisticas
 * @see app/Http/Controllers/Api/FraccionamientoApiController.php:266
 * @route '/api/inventario/fraccionamientos/producto/{productoPadreId}/estadisticas'
 */
estadisticas.head = (args: { productoPadreId: string | number } | [productoPadreId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: estadisticas.url(args, options),
    method: 'head',
})
const FraccionamientoApiController = { store, index, productosDisponibles, conversionesDelProducto, show, revertir, historialProducto, estadisticas }

export default FraccionamientoApiController