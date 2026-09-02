import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::categorias
 * @see app/Http/Controllers/Api/CatalogosApiController.php:15
 * @route '/api/app/categorias'
 */
export const categorias = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: categorias.url(options),
    method: 'get',
})

categorias.definition = {
    methods: ["get","head"],
    url: '/api/app/categorias',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::categorias
 * @see app/Http/Controllers/Api/CatalogosApiController.php:15
 * @route '/api/app/categorias'
 */
categorias.url = (options?: RouteQueryOptions) => {
    return categorias.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::categorias
 * @see app/Http/Controllers/Api/CatalogosApiController.php:15
 * @route '/api/app/categorias'
 */
categorias.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: categorias.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::categorias
 * @see app/Http/Controllers/Api/CatalogosApiController.php:15
 * @route '/api/app/categorias'
 */
categorias.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: categorias.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CatalogosApiController::categorias
 * @see app/Http/Controllers/Api/CatalogosApiController.php:15
 * @route '/api/app/categorias'
 */
    const categoriasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: categorias.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::categorias
 * @see app/Http/Controllers/Api/CatalogosApiController.php:15
 * @route '/api/app/categorias'
 */
        categoriasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: categorias.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::categorias
 * @see app/Http/Controllers/Api/CatalogosApiController.php:15
 * @route '/api/app/categorias'
 */
        categoriasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: categorias.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    categorias.form = categoriasForm
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::marcas
 * @see app/Http/Controllers/Api/CatalogosApiController.php:25
 * @route '/api/app/marcas'
 */
export const marcas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: marcas.url(options),
    method: 'get',
})

marcas.definition = {
    methods: ["get","head"],
    url: '/api/app/marcas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::marcas
 * @see app/Http/Controllers/Api/CatalogosApiController.php:25
 * @route '/api/app/marcas'
 */
marcas.url = (options?: RouteQueryOptions) => {
    return marcas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::marcas
 * @see app/Http/Controllers/Api/CatalogosApiController.php:25
 * @route '/api/app/marcas'
 */
marcas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: marcas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::marcas
 * @see app/Http/Controllers/Api/CatalogosApiController.php:25
 * @route '/api/app/marcas'
 */
marcas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: marcas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CatalogosApiController::marcas
 * @see app/Http/Controllers/Api/CatalogosApiController.php:25
 * @route '/api/app/marcas'
 */
    const marcasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: marcas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::marcas
 * @see app/Http/Controllers/Api/CatalogosApiController.php:25
 * @route '/api/app/marcas'
 */
        marcasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: marcas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::marcas
 * @see app/Http/Controllers/Api/CatalogosApiController.php:25
 * @route '/api/app/marcas'
 */
        marcasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: marcas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    marcas.form = marcasForm
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::proveedores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:35
 * @route '/api/app/proveedores'
 */
export const proveedores = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proveedores.url(options),
    method: 'get',
})

proveedores.definition = {
    methods: ["get","head"],
    url: '/api/app/proveedores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::proveedores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:35
 * @route '/api/app/proveedores'
 */
proveedores.url = (options?: RouteQueryOptions) => {
    return proveedores.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::proveedores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:35
 * @route '/api/app/proveedores'
 */
proveedores.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: proveedores.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::proveedores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:35
 * @route '/api/app/proveedores'
 */
proveedores.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: proveedores.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CatalogosApiController::proveedores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:35
 * @route '/api/app/proveedores'
 */
    const proveedoresForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: proveedores.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::proveedores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:35
 * @route '/api/app/proveedores'
 */
        proveedoresForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: proveedores.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::proveedores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:35
 * @route '/api/app/proveedores'
 */
        proveedoresForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: proveedores.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    proveedores.form = proveedoresForm
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::unidadesMedida
 * @see app/Http/Controllers/Api/CatalogosApiController.php:45
 * @route '/api/app/unidades-medida'
 */
export const unidadesMedida = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: unidadesMedida.url(options),
    method: 'get',
})

unidadesMedida.definition = {
    methods: ["get","head"],
    url: '/api/app/unidades-medida',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::unidadesMedida
 * @see app/Http/Controllers/Api/CatalogosApiController.php:45
 * @route '/api/app/unidades-medida'
 */
unidadesMedida.url = (options?: RouteQueryOptions) => {
    return unidadesMedida.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::unidadesMedida
 * @see app/Http/Controllers/Api/CatalogosApiController.php:45
 * @route '/api/app/unidades-medida'
 */
unidadesMedida.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: unidadesMedida.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::unidadesMedida
 * @see app/Http/Controllers/Api/CatalogosApiController.php:45
 * @route '/api/app/unidades-medida'
 */
unidadesMedida.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: unidadesMedida.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CatalogosApiController::unidadesMedida
 * @see app/Http/Controllers/Api/CatalogosApiController.php:45
 * @route '/api/app/unidades-medida'
 */
    const unidadesMedidaForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: unidadesMedida.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::unidadesMedida
 * @see app/Http/Controllers/Api/CatalogosApiController.php:45
 * @route '/api/app/unidades-medida'
 */
        unidadesMedidaForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: unidadesMedida.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::unidadesMedida
 * @see app/Http/Controllers/Api/CatalogosApiController.php:45
 * @route '/api/app/unidades-medida'
 */
        unidadesMedidaForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: unidadesMedida.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    unidadesMedida.form = unidadesMedidaForm
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::almacenes
 * @see app/Http/Controllers/Api/CatalogosApiController.php:55
 * @route '/api/app/almacenes'
 */
export const almacenes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: almacenes.url(options),
    method: 'get',
})

almacenes.definition = {
    methods: ["get","head"],
    url: '/api/app/almacenes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::almacenes
 * @see app/Http/Controllers/Api/CatalogosApiController.php:55
 * @route '/api/app/almacenes'
 */
almacenes.url = (options?: RouteQueryOptions) => {
    return almacenes.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::almacenes
 * @see app/Http/Controllers/Api/CatalogosApiController.php:55
 * @route '/api/app/almacenes'
 */
almacenes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: almacenes.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::almacenes
 * @see app/Http/Controllers/Api/CatalogosApiController.php:55
 * @route '/api/app/almacenes'
 */
almacenes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: almacenes.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CatalogosApiController::almacenes
 * @see app/Http/Controllers/Api/CatalogosApiController.php:55
 * @route '/api/app/almacenes'
 */
    const almacenesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: almacenes.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::almacenes
 * @see app/Http/Controllers/Api/CatalogosApiController.php:55
 * @route '/api/app/almacenes'
 */
        almacenesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: almacenes.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::almacenes
 * @see app/Http/Controllers/Api/CatalogosApiController.php:55
 * @route '/api/app/almacenes'
 */
        almacenesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: almacenes.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    almacenes.form = almacenesForm
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:65
 * @route '/api/app/sectores'
 */
export const sectores = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sectores.url(options),
    method: 'get',
})

sectores.definition = {
    methods: ["get","head"],
    url: '/api/app/sectores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:65
 * @route '/api/app/sectores'
 */
sectores.url = (options?: RouteQueryOptions) => {
    return sectores.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:65
 * @route '/api/app/sectores'
 */
sectores.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sectores.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:65
 * @route '/api/app/sectores'
 */
sectores.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: sectores.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:65
 * @route '/api/app/sectores'
 */
    const sectoresForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: sectores.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:65
 * @route '/api/app/sectores'
 */
        sectoresForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: sectores.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectores
 * @see app/Http/Controllers/Api/CatalogosApiController.php:65
 * @route '/api/app/sectores'
 */
        sectoresForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: sectores.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    sectores.form = sectoresForm
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectoresPorAlmacen
 * @see app/Http/Controllers/Api/CatalogosApiController.php:74
 * @route '/api/app/almacenes/{almacen_id}/sectores'
 */
export const sectoresPorAlmacen = (args: { almacen_id: string | number } | [almacen_id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sectoresPorAlmacen.url(args, options),
    method: 'get',
})

sectoresPorAlmacen.definition = {
    methods: ["get","head"],
    url: '/api/app/almacenes/{almacen_id}/sectores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectoresPorAlmacen
 * @see app/Http/Controllers/Api/CatalogosApiController.php:74
 * @route '/api/app/almacenes/{almacen_id}/sectores'
 */
sectoresPorAlmacen.url = (args: { almacen_id: string | number } | [almacen_id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { almacen_id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    almacen_id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        almacen_id: args.almacen_id,
                }

    return sectoresPorAlmacen.definition.url
            .replace('{almacen_id}', parsedArgs.almacen_id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectoresPorAlmacen
 * @see app/Http/Controllers/Api/CatalogosApiController.php:74
 * @route '/api/app/almacenes/{almacen_id}/sectores'
 */
sectoresPorAlmacen.get = (args: { almacen_id: string | number } | [almacen_id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sectoresPorAlmacen.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectoresPorAlmacen
 * @see app/Http/Controllers/Api/CatalogosApiController.php:74
 * @route '/api/app/almacenes/{almacen_id}/sectores'
 */
sectoresPorAlmacen.head = (args: { almacen_id: string | number } | [almacen_id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: sectoresPorAlmacen.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectoresPorAlmacen
 * @see app/Http/Controllers/Api/CatalogosApiController.php:74
 * @route '/api/app/almacenes/{almacen_id}/sectores'
 */
    const sectoresPorAlmacenForm = (args: { almacen_id: string | number } | [almacen_id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: sectoresPorAlmacen.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectoresPorAlmacen
 * @see app/Http/Controllers/Api/CatalogosApiController.php:74
 * @route '/api/app/almacenes/{almacen_id}/sectores'
 */
        sectoresPorAlmacenForm.get = (args: { almacen_id: string | number } | [almacen_id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: sectoresPorAlmacen.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CatalogosApiController::sectoresPorAlmacen
 * @see app/Http/Controllers/Api/CatalogosApiController.php:74
 * @route '/api/app/almacenes/{almacen_id}/sectores'
 */
        sectoresPorAlmacenForm.head = (args: { almacen_id: string | number } | [almacen_id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: sectoresPorAlmacen.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    sectoresPorAlmacen.form = sectoresPorAlmacenForm
const CatalogosApiController = { categorias, marcas, proveedores, unidadesMedida, almacenes, sectores, sectoresPorAlmacen }

export default CatalogosApiController