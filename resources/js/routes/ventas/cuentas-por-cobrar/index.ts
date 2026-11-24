import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\CuentaPorCobrarController::index
 * @see app/Http/Controllers/CuentaPorCobrarController.php:37
 * @route '/ventas/cuentas-por-cobrar'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/ventas/cuentas-por-cobrar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::index
 * @see app/Http/Controllers/CuentaPorCobrarController.php:37
 * @route '/ventas/cuentas-por-cobrar'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::index
 * @see app/Http/Controllers/CuentaPorCobrarController.php:37
 * @route '/ventas/cuentas-por-cobrar'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CuentaPorCobrarController::index
 * @see app/Http/Controllers/CuentaPorCobrarController.php:37
 * @route '/ventas/cuentas-por-cobrar'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::reporte
 * @see app/Http/Controllers/CuentaPorCobrarController.php:177
 * @route '/ventas/cuentas-por-cobrar/reporte'
 */
export const reporte = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporte.url(options),
    method: 'get',
})

reporte.definition = {
    methods: ["get","head"],
    url: '/ventas/cuentas-por-cobrar/reporte',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::reporte
 * @see app/Http/Controllers/CuentaPorCobrarController.php:177
 * @route '/ventas/cuentas-por-cobrar/reporte'
 */
reporte.url = (options?: RouteQueryOptions) => {
    return reporte.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::reporte
 * @see app/Http/Controllers/CuentaPorCobrarController.php:177
 * @route '/ventas/cuentas-por-cobrar/reporte'
 */
reporte.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporte.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CuentaPorCobrarController::reporte
 * @see app/Http/Controllers/CuentaPorCobrarController.php:177
 * @route '/ventas/cuentas-por-cobrar/reporte'
 */
reporte.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reporte.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::exportarExcel
 * @see app/Http/Controllers/CuentaPorCobrarController.php:130
 * @route '/ventas/cuentas-por-cobrar/exportar-excel'
 */
export const exportarExcel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportarExcel.url(options),
    method: 'get',
})

exportarExcel.definition = {
    methods: ["get","head"],
    url: '/ventas/cuentas-por-cobrar/exportar-excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::exportarExcel
 * @see app/Http/Controllers/CuentaPorCobrarController.php:130
 * @route '/ventas/cuentas-por-cobrar/exportar-excel'
 */
exportarExcel.url = (options?: RouteQueryOptions) => {
    return exportarExcel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::exportarExcel
 * @see app/Http/Controllers/CuentaPorCobrarController.php:130
 * @route '/ventas/cuentas-por-cobrar/exportar-excel'
 */
exportarExcel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportarExcel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CuentaPorCobrarController::exportarExcel
 * @see app/Http/Controllers/CuentaPorCobrarController.php:130
 * @route '/ventas/cuentas-por-cobrar/exportar-excel'
 */
exportarExcel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportarExcel.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::show
 * @see app/Http/Controllers/CuentaPorCobrarController.php:290
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/show'
 */
export const show = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/show',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::show
 * @see app/Http/Controllers/CuentaPorCobrarController.php:290
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/show'
 */
show.url = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuentaPorCobrar: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cuentaPorCobrar: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cuentaPorCobrar: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuentaPorCobrar: typeof args.cuentaPorCobrar === 'object'
                ? args.cuentaPorCobrar.id
                : args.cuentaPorCobrar,
                }

    return show.definition.url
            .replace('{cuentaPorCobrar}', parsedArgs.cuentaPorCobrar.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::show
 * @see app/Http/Controllers/CuentaPorCobrarController.php:290
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/show'
 */
show.get = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CuentaPorCobrarController::show
 * @see app/Http/Controllers/CuentaPorCobrarController.php:290
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/show'
 */
show.head = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::imprimir
 * @see app/Http/Controllers/CuentaPorCobrarController.php:307
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/imprimir'
 */
export const imprimir = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(args, options),
    method: 'get',
})

imprimir.definition = {
    methods: ["get","head"],
    url: '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/imprimir',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::imprimir
 * @see app/Http/Controllers/CuentaPorCobrarController.php:307
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/imprimir'
 */
imprimir.url = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuentaPorCobrar: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cuentaPorCobrar: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cuentaPorCobrar: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuentaPorCobrar: typeof args.cuentaPorCobrar === 'object'
                ? args.cuentaPorCobrar.id
                : args.cuentaPorCobrar,
                }

    return imprimir.definition.url
            .replace('{cuentaPorCobrar}', parsedArgs.cuentaPorCobrar.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::imprimir
 * @see app/Http/Controllers/CuentaPorCobrarController.php:307
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/imprimir'
 */
imprimir.get = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimir.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CuentaPorCobrarController::imprimir
 * @see app/Http/Controllers/CuentaPorCobrarController.php:307
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/imprimir'
 */
imprimir.head = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimir.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::imprimirTicket80
 * @see app/Http/Controllers/CuentaPorCobrarController.php:373
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/imprimir-ticket-80'
 */
export const imprimirTicket80 = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirTicket80.url(args, options),
    method: 'get',
})

imprimirTicket80.definition = {
    methods: ["get","head"],
    url: '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/imprimir-ticket-80',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::imprimirTicket80
 * @see app/Http/Controllers/CuentaPorCobrarController.php:373
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/imprimir-ticket-80'
 */
imprimirTicket80.url = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuentaPorCobrar: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cuentaPorCobrar: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cuentaPorCobrar: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuentaPorCobrar: typeof args.cuentaPorCobrar === 'object'
                ? args.cuentaPorCobrar.id
                : args.cuentaPorCobrar,
                }

    return imprimirTicket80.definition.url
            .replace('{cuentaPorCobrar}', parsedArgs.cuentaPorCobrar.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::imprimirTicket80
 * @see app/Http/Controllers/CuentaPorCobrarController.php:373
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/imprimir-ticket-80'
 */
imprimirTicket80.get = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirTicket80.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CuentaPorCobrarController::imprimirTicket80
 * @see app/Http/Controllers/CuentaPorCobrarController.php:373
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/imprimir-ticket-80'
 */
imprimirTicket80.head = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimirTicket80.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::actualizarFechaVencimiento
 * @see app/Http/Controllers/CuentaPorCobrarController.php:942
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/actualizar-fecha-vencimiento'
 */
export const actualizarFechaVencimiento = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: actualizarFechaVencimiento.url(args, options),
    method: 'put',
})

actualizarFechaVencimiento.definition = {
    methods: ["put"],
    url: '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/actualizar-fecha-vencimiento',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::actualizarFechaVencimiento
 * @see app/Http/Controllers/CuentaPorCobrarController.php:942
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/actualizar-fecha-vencimiento'
 */
actualizarFechaVencimiento.url = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuentaPorCobrar: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cuentaPorCobrar: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cuentaPorCobrar: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuentaPorCobrar: typeof args.cuentaPorCobrar === 'object'
                ? args.cuentaPorCobrar.id
                : args.cuentaPorCobrar,
                }

    return actualizarFechaVencimiento.definition.url
            .replace('{cuentaPorCobrar}', parsedArgs.cuentaPorCobrar.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::actualizarFechaVencimiento
 * @see app/Http/Controllers/CuentaPorCobrarController.php:942
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/actualizar-fecha-vencimiento'
 */
actualizarFechaVencimiento.put = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: actualizarFechaVencimiento.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::anular
 * @see app/Http/Controllers/CuentaPorCobrarController.php:793
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/anular'
 */
export const anular = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: anular.url(args, options),
    method: 'post',
})

anular.definition = {
    methods: ["post"],
    url: '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/anular',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::anular
 * @see app/Http/Controllers/CuentaPorCobrarController.php:793
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/anular'
 */
anular.url = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuentaPorCobrar: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cuentaPorCobrar: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cuentaPorCobrar: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuentaPorCobrar: typeof args.cuentaPorCobrar === 'object'
                ? args.cuentaPorCobrar.id
                : args.cuentaPorCobrar,
                }

    return anular.definition.url
            .replace('{cuentaPorCobrar}', parsedArgs.cuentaPorCobrar.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CuentaPorCobrarController::anular
 * @see app/Http/Controllers/CuentaPorCobrarController.php:793
 * @route '/ventas/cuentas-por-cobrar/{cuentaPorCobrar}/anular'
 */
anular.post = (args: { cuentaPorCobrar: number | { id: number } } | [cuentaPorCobrar: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: anular.url(args, options),
    method: 'post',
})
const cuentasPorCobrar = {
    index,
reporte,
exportarExcel,
show,
imprimir,
imprimirTicket80,
actualizarFechaVencimiento,
anular,
}

export default cuentasPorCobrar