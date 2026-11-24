import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CuentaPorPagarController::index
 * @see app/Http/Controllers/CuentaPorPagarController.php:19
 * @route '/compras/cuentas-por-pagar'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/compras/cuentas-por-pagar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::index
 * @see app/Http/Controllers/CuentaPorPagarController.php:19
 * @route '/compras/cuentas-por-pagar'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::index
 * @see app/Http/Controllers/CuentaPorPagarController.php:19
 * @route '/compras/cuentas-por-pagar'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CuentaPorPagarController::index
 * @see app/Http/Controllers/CuentaPorPagarController.php:19
 * @route '/compras/cuentas-por-pagar'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::exportMethod
 * @see app/Http/Controllers/CuentaPorPagarController.php:274
 * @route '/compras/cuentas-por-pagar/export'
 */
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/compras/cuentas-por-pagar/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::exportMethod
 * @see app/Http/Controllers/CuentaPorPagarController.php:274
 * @route '/compras/cuentas-por-pagar/export'
 */
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::exportMethod
 * @see app/Http/Controllers/CuentaPorPagarController.php:274
 * @route '/compras/cuentas-por-pagar/export'
 */
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CuentaPorPagarController::exportMethod
 * @see app/Http/Controllers/CuentaPorPagarController.php:274
 * @route '/compras/cuentas-por-pagar/export'
 */
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::reporte
 * @see app/Http/Controllers/CuentaPorPagarController.php:74
 * @route '/compras/cuentas-por-pagar/reporte'
 */
export const reporte = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporte.url(options),
    method: 'get',
})

reporte.definition = {
    methods: ["get","head"],
    url: '/compras/cuentas-por-pagar/reporte',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::reporte
 * @see app/Http/Controllers/CuentaPorPagarController.php:74
 * @route '/compras/cuentas-por-pagar/reporte'
 */
reporte.url = (options?: RouteQueryOptions) => {
    return reporte.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::reporte
 * @see app/Http/Controllers/CuentaPorPagarController.php:74
 * @route '/compras/cuentas-por-pagar/reporte'
 */
reporte.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporte.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CuentaPorPagarController::reporte
 * @see app/Http/Controllers/CuentaPorPagarController.php:74
 * @route '/compras/cuentas-por-pagar/reporte'
 */
reporte.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reporte.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::show
 * @see app/Http/Controllers/CuentaPorPagarController.php:161
 * @route '/compras/cuentas-por-pagar/{cuenta}/show'
 */
export const show = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/compras/cuentas-por-pagar/{cuenta}/show',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::show
 * @see app/Http/Controllers/CuentaPorPagarController.php:161
 * @route '/compras/cuentas-por-pagar/{cuenta}/show'
 */
show.url = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuenta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cuenta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cuenta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuenta: typeof args.cuenta === 'object'
                ? args.cuenta.id
                : args.cuenta,
                }

    return show.definition.url
            .replace('{cuenta}', parsedArgs.cuenta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::show
 * @see app/Http/Controllers/CuentaPorPagarController.php:161
 * @route '/compras/cuentas-por-pagar/{cuenta}/show'
 */
show.get = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CuentaPorPagarController::show
 * @see app/Http/Controllers/CuentaPorPagarController.php:161
 * @route '/compras/cuentas-por-pagar/{cuenta}/show'
 */
show.head = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::actualizarEstado
 * @see app/Http/Controllers/CuentaPorPagarController.php:170
 * @route '/compras/cuentas-por-pagar/{cuenta}/estado'
 */
export const actualizarEstado = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarEstado.url(args, options),
    method: 'patch',
})

actualizarEstado.definition = {
    methods: ["patch"],
    url: '/compras/cuentas-por-pagar/{cuenta}/estado',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::actualizarEstado
 * @see app/Http/Controllers/CuentaPorPagarController.php:170
 * @route '/compras/cuentas-por-pagar/{cuenta}/estado'
 */
actualizarEstado.url = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuenta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cuenta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cuenta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuenta: typeof args.cuenta === 'object'
                ? args.cuenta.id
                : args.cuenta,
                }

    return actualizarEstado.definition.url
            .replace('{cuenta}', parsedArgs.cuenta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::actualizarEstado
 * @see app/Http/Controllers/CuentaPorPagarController.php:170
 * @route '/compras/cuentas-por-pagar/{cuenta}/estado'
 */
actualizarEstado.patch = (args: { cuenta: number | { id: number } } | [cuenta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: actualizarEstado.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::registrarPago
 * @see app/Http/Controllers/CuentaPorPagarController.php:183
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/registrar-pago'
 */
export const registrarPago = (args: { cuentaPorPagar: number | { id: number } } | [cuentaPorPagar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarPago.url(args, options),
    method: 'post',
})

registrarPago.definition = {
    methods: ["post"],
    url: '/compras/cuentas-por-pagar/{cuentaPorPagar}/registrar-pago',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::registrarPago
 * @see app/Http/Controllers/CuentaPorPagarController.php:183
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/registrar-pago'
 */
registrarPago.url = (args: { cuentaPorPagar: number | { id: number } } | [cuentaPorPagar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuentaPorPagar: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cuentaPorPagar: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cuentaPorPagar: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuentaPorPagar: typeof args.cuentaPorPagar === 'object'
                ? args.cuentaPorPagar.id
                : args.cuentaPorPagar,
                }

    return registrarPago.definition.url
            .replace('{cuentaPorPagar}', parsedArgs.cuentaPorPagar.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::registrarPago
 * @see app/Http/Controllers/CuentaPorPagarController.php:183
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/registrar-pago'
 */
registrarPago.post = (args: { cuentaPorPagar: number | { id: number } } | [cuentaPorPagar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: registrarPago.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::anularPago
 * @see app/Http/Controllers/CuentaPorPagarController.php:293
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/anular-pago/{pago}'
 */
export const anularPago = (args: { cuentaPorPagar: number | { id: number }, pago: number | { id: number } } | [cuentaPorPagar: number | { id: number }, pago: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: anularPago.url(args, options),
    method: 'post',
})

anularPago.definition = {
    methods: ["post"],
    url: '/compras/cuentas-por-pagar/{cuentaPorPagar}/anular-pago/{pago}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::anularPago
 * @see app/Http/Controllers/CuentaPorPagarController.php:293
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/anular-pago/{pago}'
 */
anularPago.url = (args: { cuentaPorPagar: number | { id: number }, pago: number | { id: number } } | [cuentaPorPagar: number | { id: number }, pago: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    cuentaPorPagar: args[0],
                    pago: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuentaPorPagar: typeof args.cuentaPorPagar === 'object'
                ? args.cuentaPorPagar.id
                : args.cuentaPorPagar,
                                pago: typeof args.pago === 'object'
                ? args.pago.id
                : args.pago,
                }

    return anularPago.definition.url
            .replace('{cuentaPorPagar}', parsedArgs.cuentaPorPagar.toString())
            .replace('{pago}', parsedArgs.pago.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::anularPago
 * @see app/Http/Controllers/CuentaPorPagarController.php:293
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/anular-pago/{pago}'
 */
anularPago.post = (args: { cuentaPorPagar: number | { id: number }, pago: number | { id: number } } | [cuentaPorPagar: number | { id: number }, pago: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: anularPago.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CuentaPorPagarController::imprimirTicket80
 * @see app/Http/Controllers/CuentaPorPagarController.php:378
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/imprimir-ticket-80'
 */
const imprimirTicket80847ffaaf3bf484fec3fbbdb9b7e77368 = (args: { cuentaPorPagar: number | { id: number } } | [cuentaPorPagar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirTicket80847ffaaf3bf484fec3fbbdb9b7e77368.url(args, options),
    method: 'get',
})

imprimirTicket80847ffaaf3bf484fec3fbbdb9b7e77368.definition = {
    methods: ["get","head"],
    url: '/compras/cuentas-por-pagar/{cuentaPorPagar}/imprimir-ticket-80',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::imprimirTicket80
 * @see app/Http/Controllers/CuentaPorPagarController.php:378
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/imprimir-ticket-80'
 */
imprimirTicket80847ffaaf3bf484fec3fbbdb9b7e77368.url = (args: { cuentaPorPagar: number | { id: number } } | [cuentaPorPagar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuentaPorPagar: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cuentaPorPagar: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cuentaPorPagar: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuentaPorPagar: typeof args.cuentaPorPagar === 'object'
                ? args.cuentaPorPagar.id
                : args.cuentaPorPagar,
                }

    return imprimirTicket80847ffaaf3bf484fec3fbbdb9b7e77368.definition.url
            .replace('{cuentaPorPagar}', parsedArgs.cuentaPorPagar.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::imprimirTicket80
 * @see app/Http/Controllers/CuentaPorPagarController.php:378
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/imprimir-ticket-80'
 */
imprimirTicket80847ffaaf3bf484fec3fbbdb9b7e77368.get = (args: { cuentaPorPagar: number | { id: number } } | [cuentaPorPagar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirTicket80847ffaaf3bf484fec3fbbdb9b7e77368.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CuentaPorPagarController::imprimirTicket80
 * @see app/Http/Controllers/CuentaPorPagarController.php:378
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/imprimir-ticket-80'
 */
imprimirTicket80847ffaaf3bf484fec3fbbdb9b7e77368.head = (args: { cuentaPorPagar: number | { id: number } } | [cuentaPorPagar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimirTicket80847ffaaf3bf484fec3fbbdb9b7e77368.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CuentaPorPagarController::imprimirTicket80
 * @see app/Http/Controllers/CuentaPorPagarController.php:378
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/imprimir'
 */
const imprimirTicket80fc468a6cb14757b2bcaa21439847b770 = (args: { cuentaPorPagar: number | { id: number } } | [cuentaPorPagar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirTicket80fc468a6cb14757b2bcaa21439847b770.url(args, options),
    method: 'get',
})

imprimirTicket80fc468a6cb14757b2bcaa21439847b770.definition = {
    methods: ["get","head"],
    url: '/compras/cuentas-por-pagar/{cuentaPorPagar}/imprimir',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorPagarController::imprimirTicket80
 * @see app/Http/Controllers/CuentaPorPagarController.php:378
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/imprimir'
 */
imprimirTicket80fc468a6cb14757b2bcaa21439847b770.url = (args: { cuentaPorPagar: number | { id: number } } | [cuentaPorPagar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuentaPorPagar: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cuentaPorPagar: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cuentaPorPagar: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuentaPorPagar: typeof args.cuentaPorPagar === 'object'
                ? args.cuentaPorPagar.id
                : args.cuentaPorPagar,
                }

    return imprimirTicket80fc468a6cb14757b2bcaa21439847b770.definition.url
            .replace('{cuentaPorPagar}', parsedArgs.cuentaPorPagar.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorPagarController::imprimirTicket80
 * @see app/Http/Controllers/CuentaPorPagarController.php:378
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/imprimir'
 */
imprimirTicket80fc468a6cb14757b2bcaa21439847b770.get = (args: { cuentaPorPagar: number | { id: number } } | [cuentaPorPagar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirTicket80fc468a6cb14757b2bcaa21439847b770.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CuentaPorPagarController::imprimirTicket80
 * @see app/Http/Controllers/CuentaPorPagarController.php:378
 * @route '/compras/cuentas-por-pagar/{cuentaPorPagar}/imprimir'
 */
imprimirTicket80fc468a6cb14757b2bcaa21439847b770.head = (args: { cuentaPorPagar: number | { id: number } } | [cuentaPorPagar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimirTicket80fc468a6cb14757b2bcaa21439847b770.url(args, options),
    method: 'head',
})

export const imprimirTicket80 = {
    '/compras/cuentas-por-pagar/{cuentaPorPagar}/imprimir-ticket-80': imprimirTicket80847ffaaf3bf484fec3fbbdb9b7e77368,
    '/compras/cuentas-por-pagar/{cuentaPorPagar}/imprimir': imprimirTicket80fc468a6cb14757b2bcaa21439847b770,
}

const CuentaPorPagarController = { index, exportMethod, reporte, show, actualizarEstado, registrarPago, anularPago, imprimirTicket80, export: exportMethod }

export default CuentaPorPagarController