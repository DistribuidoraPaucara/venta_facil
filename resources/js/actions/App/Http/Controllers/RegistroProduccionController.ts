import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\RegistroProduccionController::getProducciones
 * @see app/Http/Controllers/RegistroProduccionController.php:22
 * @route '/api/producciones/masiva/registro'
 */
export const getProducciones = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getProducciones.url(options),
    method: 'get',
})

getProducciones.definition = {
    methods: ["get","head"],
    url: '/api/producciones/masiva/registro',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RegistroProduccionController::getProducciones
 * @see app/Http/Controllers/RegistroProduccionController.php:22
 * @route '/api/producciones/masiva/registro'
 */
getProducciones.url = (options?: RouteQueryOptions) => {
    return getProducciones.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RegistroProduccionController::getProducciones
 * @see app/Http/Controllers/RegistroProduccionController.php:22
 * @route '/api/producciones/masiva/registro'
 */
getProducciones.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getProducciones.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RegistroProduccionController::getProducciones
 * @see app/Http/Controllers/RegistroProduccionController.php:22
 * @route '/api/producciones/masiva/registro'
 */
getProducciones.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getProducciones.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\RegistroProduccionController::getProducciones
 * @see app/Http/Controllers/RegistroProduccionController.php:22
 * @route '/api/producciones/masiva/registro'
 */
    const getProduccionesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getProducciones.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\RegistroProduccionController::getProducciones
 * @see app/Http/Controllers/RegistroProduccionController.php:22
 * @route '/api/producciones/masiva/registro'
 */
        getProduccionesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getProducciones.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\RegistroProduccionController::getProducciones
 * @see app/Http/Controllers/RegistroProduccionController.php:22
 * @route '/api/producciones/masiva/registro'
 */
        getProduccionesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getProducciones.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getProducciones.form = getProduccionesForm
/**
* @see \App\Http\Controllers\RegistroProduccionController::show
 * @see app/Http/Controllers/RegistroProduccionController.php:72
 * @route '/api/producciones/masiva/{id}'
 */
export const show = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/producciones/masiva/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RegistroProduccionController::show
 * @see app/Http/Controllers/RegistroProduccionController.php:72
 * @route '/api/producciones/masiva/{id}'
 */
show.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return show.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RegistroProduccionController::show
 * @see app/Http/Controllers/RegistroProduccionController.php:72
 * @route '/api/producciones/masiva/{id}'
 */
show.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RegistroProduccionController::show
 * @see app/Http/Controllers/RegistroProduccionController.php:72
 * @route '/api/producciones/masiva/{id}'
 */
show.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\RegistroProduccionController::show
 * @see app/Http/Controllers/RegistroProduccionController.php:72
 * @route '/api/producciones/masiva/{id}'
 */
    const showForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\RegistroProduccionController::show
 * @see app/Http/Controllers/RegistroProduccionController.php:72
 * @route '/api/producciones/masiva/{id}'
 */
        showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\RegistroProduccionController::show
 * @see app/Http/Controllers/RegistroProduccionController.php:72
 * @route '/api/producciones/masiva/{id}'
 */
        showForm.head = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\RegistroProduccionController::cambiarEstado
 * @see app/Http/Controllers/RegistroProduccionController.php:106
 * @route '/api/producciones/masiva/{id}/estado'
 */
export const cambiarEstado = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: cambiarEstado.url(args, options),
    method: 'put',
})

cambiarEstado.definition = {
    methods: ["put"],
    url: '/api/producciones/masiva/{id}/estado',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\RegistroProduccionController::cambiarEstado
 * @see app/Http/Controllers/RegistroProduccionController.php:106
 * @route '/api/producciones/masiva/{id}/estado'
 */
cambiarEstado.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return cambiarEstado.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RegistroProduccionController::cambiarEstado
 * @see app/Http/Controllers/RegistroProduccionController.php:106
 * @route '/api/producciones/masiva/{id}/estado'
 */
cambiarEstado.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: cambiarEstado.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\RegistroProduccionController::cambiarEstado
 * @see app/Http/Controllers/RegistroProduccionController.php:106
 * @route '/api/producciones/masiva/{id}/estado'
 */
    const cambiarEstadoForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cambiarEstado.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\RegistroProduccionController::cambiarEstado
 * @see app/Http/Controllers/RegistroProduccionController.php:106
 * @route '/api/producciones/masiva/{id}/estado'
 */
        cambiarEstadoForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cambiarEstado.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    cambiarEstado.form = cambiarEstadoForm
/**
* @see \App\Http\Controllers\RegistroProduccionController::destroy
 * @see app/Http/Controllers/RegistroProduccionController.php:127
 * @route '/api/producciones/masiva/{id}'
 */
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/producciones/masiva/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\RegistroProduccionController::destroy
 * @see app/Http/Controllers/RegistroProduccionController.php:127
 * @route '/api/producciones/masiva/{id}'
 */
destroy.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    id: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        id: args.id,
                }

    return destroy.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RegistroProduccionController::destroy
 * @see app/Http/Controllers/RegistroProduccionController.php:127
 * @route '/api/producciones/masiva/{id}'
 */
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\RegistroProduccionController::destroy
 * @see app/Http/Controllers/RegistroProduccionController.php:127
 * @route '/api/producciones/masiva/{id}'
 */
    const destroyForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\RegistroProduccionController::destroy
 * @see app/Http/Controllers/RegistroProduccionController.php:127
 * @route '/api/producciones/masiva/{id}'
 */
        destroyForm.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\RegistroProduccionController::index
 * @see app/Http/Controllers/RegistroProduccionController.php:14
 * @route '/produccion/registro-produccion'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/produccion/registro-produccion',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RegistroProduccionController::index
 * @see app/Http/Controllers/RegistroProduccionController.php:14
 * @route '/produccion/registro-produccion'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RegistroProduccionController::index
 * @see app/Http/Controllers/RegistroProduccionController.php:14
 * @route '/produccion/registro-produccion'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RegistroProduccionController::index
 * @see app/Http/Controllers/RegistroProduccionController.php:14
 * @route '/produccion/registro-produccion'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\RegistroProduccionController::index
 * @see app/Http/Controllers/RegistroProduccionController.php:14
 * @route '/produccion/registro-produccion'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\RegistroProduccionController::index
 * @see app/Http/Controllers/RegistroProduccionController.php:14
 * @route '/produccion/registro-produccion'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\RegistroProduccionController::index
 * @see app/Http/Controllers/RegistroProduccionController.php:14
 * @route '/produccion/registro-produccion'
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
const RegistroProduccionController = { getProducciones, show, cambiarEstado, destroy, index }

export default RegistroProduccionController