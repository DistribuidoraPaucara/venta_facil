import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults, validateParameters } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ProduccionController::index
 * @see app/Http/Controllers/ProduccionController.php:23
 * @route '/api/producciones'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/producciones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProduccionController::index
 * @see app/Http/Controllers/ProduccionController.php:23
 * @route '/api/producciones'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionController::index
 * @see app/Http/Controllers/ProduccionController.php:23
 * @route '/api/producciones'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProduccionController::index
 * @see app/Http/Controllers/ProduccionController.php:23
 * @route '/api/producciones'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProduccionController::index
 * @see app/Http/Controllers/ProduccionController.php:23
 * @route '/api/producciones'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProduccionController::index
 * @see app/Http/Controllers/ProduccionController.php:23
 * @route '/api/producciones'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProduccionController::index
 * @see app/Http/Controllers/ProduccionController.php:23
 * @route '/api/producciones'
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
* @see \App\Http\Controllers\ProduccionController::store
 * @see app/Http/Controllers/ProduccionController.php:75
 * @route '/api/producciones'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/producciones',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProduccionController::store
 * @see app/Http/Controllers/ProduccionController.php:75
 * @route '/api/producciones'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionController::store
 * @see app/Http/Controllers/ProduccionController.php:75
 * @route '/api/producciones'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ProduccionController::store
 * @see app/Http/Controllers/ProduccionController.php:75
 * @route '/api/producciones'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProduccionController::store
 * @see app/Http/Controllers/ProduccionController.php:75
 * @route '/api/producciones'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\ProduccionController::show
 * @see app/Http/Controllers/ProduccionController.php:53
 * @route '/api/producciones/{produccion}'
 */
export const show = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/producciones/{produccion}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProduccionController::show
 * @see app/Http/Controllers/ProduccionController.php:53
 * @route '/api/producciones/{produccion}'
 */
show.url = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { produccion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { produccion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    produccion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        produccion: typeof args.produccion === 'object'
                ? args.produccion.id
                : args.produccion,
                }

    return show.definition.url
            .replace('{produccion}', parsedArgs.produccion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionController::show
 * @see app/Http/Controllers/ProduccionController.php:53
 * @route '/api/producciones/{produccion}'
 */
show.get = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProduccionController::show
 * @see app/Http/Controllers/ProduccionController.php:53
 * @route '/api/producciones/{produccion}'
 */
show.head = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProduccionController::show
 * @see app/Http/Controllers/ProduccionController.php:53
 * @route '/api/producciones/{produccion}'
 */
    const showForm = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProduccionController::show
 * @see app/Http/Controllers/ProduccionController.php:53
 * @route '/api/producciones/{produccion}'
 */
        showForm.get = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProduccionController::show
 * @see app/Http/Controllers/ProduccionController.php:53
 * @route '/api/producciones/{produccion}'
 */
        showForm.head = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ProduccionController::update
 * @see app/Http/Controllers/ProduccionController.php:163
 * @route '/api/producciones/{produccion}'
 */
export const update = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/producciones/{produccion}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ProduccionController::update
 * @see app/Http/Controllers/ProduccionController.php:163
 * @route '/api/producciones/{produccion}'
 */
update.url = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { produccion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { produccion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    produccion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        produccion: typeof args.produccion === 'object'
                ? args.produccion.id
                : args.produccion,
                }

    return update.definition.url
            .replace('{produccion}', parsedArgs.produccion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionController::update
 * @see app/Http/Controllers/ProduccionController.php:163
 * @route '/api/producciones/{produccion}'
 */
update.put = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\ProduccionController::update
 * @see app/Http/Controllers/ProduccionController.php:163
 * @route '/api/producciones/{produccion}'
 */
    const updateForm = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProduccionController::update
 * @see app/Http/Controllers/ProduccionController.php:163
 * @route '/api/producciones/{produccion}'
 */
        updateForm.put = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\ProduccionController::destroy
 * @see app/Http/Controllers/ProduccionController.php:191
 * @route '/api/producciones/{produccion}'
 */
export const destroy = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/producciones/{produccion}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProduccionController::destroy
 * @see app/Http/Controllers/ProduccionController.php:191
 * @route '/api/producciones/{produccion}'
 */
destroy.url = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { produccion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { produccion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    produccion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        produccion: typeof args.produccion === 'object'
                ? args.produccion.id
                : args.produccion,
                }

    return destroy.definition.url
            .replace('{produccion}', parsedArgs.produccion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionController::destroy
 * @see app/Http/Controllers/ProduccionController.php:191
 * @route '/api/producciones/{produccion}'
 */
destroy.delete = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ProduccionController::destroy
 * @see app/Http/Controllers/ProduccionController.php:191
 * @route '/api/producciones/{produccion}'
 */
    const destroyForm = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProduccionController::destroy
 * @see app/Http/Controllers/ProduccionController.php:191
 * @route '/api/producciones/{produccion}'
 */
        destroyForm.delete = (args: { produccion: number | { id: number } } | [produccion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ProduccionController::delDia
 * @see app/Http/Controllers/ProduccionController.php:317
 * @route '/api/producciones/dia/{fecha?}'
 */
export const delDia = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: delDia.url(args, options),
    method: 'get',
})

delDia.definition = {
    methods: ["get","head"],
    url: '/api/producciones/dia/{fecha?}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProduccionController::delDia
 * @see app/Http/Controllers/ProduccionController.php:317
 * @route '/api/producciones/dia/{fecha?}'
 */
delDia.url = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { fecha: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    fecha: args[0],
                }
    }

    args = applyUrlDefaults(args)

    validateParameters(args, [
            "fecha",
        ])

    const parsedArgs = {
                        fecha: args?.fecha,
                }

    return delDia.definition.url
            .replace('{fecha?}', parsedArgs.fecha?.toString() ?? '')
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionController::delDia
 * @see app/Http/Controllers/ProduccionController.php:317
 * @route '/api/producciones/dia/{fecha?}'
 */
delDia.get = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: delDia.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProduccionController::delDia
 * @see app/Http/Controllers/ProduccionController.php:317
 * @route '/api/producciones/dia/{fecha?}'
 */
delDia.head = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: delDia.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProduccionController::delDia
 * @see app/Http/Controllers/ProduccionController.php:317
 * @route '/api/producciones/dia/{fecha?}'
 */
    const delDiaForm = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: delDia.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProduccionController::delDia
 * @see app/Http/Controllers/ProduccionController.php:317
 * @route '/api/producciones/dia/{fecha?}'
 */
        delDiaForm.get = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: delDia.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProduccionController::delDia
 * @see app/Http/Controllers/ProduccionController.php:317
 * @route '/api/producciones/dia/{fecha?}'
 */
        delDiaForm.head = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: delDia.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    delDia.form = delDiaForm
/**
* @see \App\Http\Controllers\ProduccionController::reporteDia
 * @see app/Http/Controllers/ProduccionController.php:349
 * @route '/api/producciones/reporte/dia/{fecha?}'
 */
export const reporteDia = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteDia.url(args, options),
    method: 'get',
})

reporteDia.definition = {
    methods: ["get","head"],
    url: '/api/producciones/reporte/dia/{fecha?}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProduccionController::reporteDia
 * @see app/Http/Controllers/ProduccionController.php:349
 * @route '/api/producciones/reporte/dia/{fecha?}'
 */
reporteDia.url = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { fecha: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    fecha: args[0],
                }
    }

    args = applyUrlDefaults(args)

    validateParameters(args, [
            "fecha",
        ])

    const parsedArgs = {
                        fecha: args?.fecha,
                }

    return reporteDia.definition.url
            .replace('{fecha?}', parsedArgs.fecha?.toString() ?? '')
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionController::reporteDia
 * @see app/Http/Controllers/ProduccionController.php:349
 * @route '/api/producciones/reporte/dia/{fecha?}'
 */
reporteDia.get = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteDia.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProduccionController::reporteDia
 * @see app/Http/Controllers/ProduccionController.php:349
 * @route '/api/producciones/reporte/dia/{fecha?}'
 */
reporteDia.head = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reporteDia.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProduccionController::reporteDia
 * @see app/Http/Controllers/ProduccionController.php:349
 * @route '/api/producciones/reporte/dia/{fecha?}'
 */
    const reporteDiaForm = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reporteDia.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProduccionController::reporteDia
 * @see app/Http/Controllers/ProduccionController.php:349
 * @route '/api/producciones/reporte/dia/{fecha?}'
 */
        reporteDiaForm.get = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteDia.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProduccionController::reporteDia
 * @see app/Http/Controllers/ProduccionController.php:349
 * @route '/api/producciones/reporte/dia/{fecha?}'
 */
        reporteDiaForm.head = (args?: { fecha?: string | number } | [fecha: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteDia.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    reporteDia.form = reporteDiaForm
/**
* @see \App\Http\Controllers\ProduccionController::productosDisponibles
 * @see app/Http/Controllers/ProduccionController.php:427
 * @route '/api/producciones/productos/disponibles'
 */
export const productosDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(options),
    method: 'get',
})

productosDisponibles.definition = {
    methods: ["get","head"],
    url: '/api/producciones/productos/disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProduccionController::productosDisponibles
 * @see app/Http/Controllers/ProduccionController.php:427
 * @route '/api/producciones/productos/disponibles'
 */
productosDisponibles.url = (options?: RouteQueryOptions) => {
    return productosDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionController::productosDisponibles
 * @see app/Http/Controllers/ProduccionController.php:427
 * @route '/api/producciones/productos/disponibles'
 */
productosDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProduccionController::productosDisponibles
 * @see app/Http/Controllers/ProduccionController.php:427
 * @route '/api/producciones/productos/disponibles'
 */
productosDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: productosDisponibles.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProduccionController::productosDisponibles
 * @see app/Http/Controllers/ProduccionController.php:427
 * @route '/api/producciones/productos/disponibles'
 */
    const productosDisponiblesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: productosDisponibles.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProduccionController::productosDisponibles
 * @see app/Http/Controllers/ProduccionController.php:427
 * @route '/api/producciones/productos/disponibles'
 */
        productosDisponiblesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: productosDisponibles.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProduccionController::productosDisponibles
 * @see app/Http/Controllers/ProduccionController.php:427
 * @route '/api/producciones/productos/disponibles'
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
/**
* @see \App\Http\Controllers\ProduccionController::descargarReporteExcel
 * @see app/Http/Controllers/ProduccionController.php:444
 * @route '/api/produccion/reporte/excel'
 */
export const descargarReporteExcel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: descargarReporteExcel.url(options),
    method: 'get',
})

descargarReporteExcel.definition = {
    methods: ["get","head"],
    url: '/api/produccion/reporte/excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProduccionController::descargarReporteExcel
 * @see app/Http/Controllers/ProduccionController.php:444
 * @route '/api/produccion/reporte/excel'
 */
descargarReporteExcel.url = (options?: RouteQueryOptions) => {
    return descargarReporteExcel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionController::descargarReporteExcel
 * @see app/Http/Controllers/ProduccionController.php:444
 * @route '/api/produccion/reporte/excel'
 */
descargarReporteExcel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: descargarReporteExcel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProduccionController::descargarReporteExcel
 * @see app/Http/Controllers/ProduccionController.php:444
 * @route '/api/produccion/reporte/excel'
 */
descargarReporteExcel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: descargarReporteExcel.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProduccionController::descargarReporteExcel
 * @see app/Http/Controllers/ProduccionController.php:444
 * @route '/api/produccion/reporte/excel'
 */
    const descargarReporteExcelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: descargarReporteExcel.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProduccionController::descargarReporteExcel
 * @see app/Http/Controllers/ProduccionController.php:444
 * @route '/api/produccion/reporte/excel'
 */
        descargarReporteExcelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: descargarReporteExcel.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProduccionController::descargarReporteExcel
 * @see app/Http/Controllers/ProduccionController.php:444
 * @route '/api/produccion/reporte/excel'
 */
        descargarReporteExcelForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: descargarReporteExcel.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    descargarReporteExcel.form = descargarReporteExcelForm
const ProduccionController = { index, store, show, update, destroy, delDia, reporteDia, productosDisponibles, descargarReporteExcel }

export default ProduccionController