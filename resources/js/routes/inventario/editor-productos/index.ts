import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
import limites from './limites'
import lotes from './lotes'
/**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:42
 * @route '/inventario/editor-productos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventario/editor-productos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:42
 * @route '/inventario/editor-productos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:42
 * @route '/inventario/editor-productos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:42
 * @route '/inventario/editor-productos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:42
 * @route '/inventario/editor-productos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:42
 * @route '/inventario/editor-productos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:42
 * @route '/inventario/editor-productos'
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
* @see \App\Http\Controllers\EditorProductosController::datos
 * @see app/Http/Controllers/EditorProductosController.php:75
 * @route '/inventario/editor-productos/datos'
 */
export const datos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: datos.url(options),
    method: 'get',
})

datos.definition = {
    methods: ["get","head"],
    url: '/inventario/editor-productos/datos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EditorProductosController::datos
 * @see app/Http/Controllers/EditorProductosController.php:75
 * @route '/inventario/editor-productos/datos'
 */
datos.url = (options?: RouteQueryOptions) => {
    return datos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EditorProductosController::datos
 * @see app/Http/Controllers/EditorProductosController.php:75
 * @route '/inventario/editor-productos/datos'
 */
datos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: datos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EditorProductosController::datos
 * @see app/Http/Controllers/EditorProductosController.php:75
 * @route '/inventario/editor-productos/datos'
 */
datos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: datos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EditorProductosController::datos
 * @see app/Http/Controllers/EditorProductosController.php:75
 * @route '/inventario/editor-productos/datos'
 */
    const datosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: datos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EditorProductosController::datos
 * @see app/Http/Controllers/EditorProductosController.php:75
 * @route '/inventario/editor-productos/datos'
 */
        datosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: datos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EditorProductosController::datos
 * @see app/Http/Controllers/EditorProductosController.php:75
 * @route '/inventario/editor-productos/datos'
 */
        datosForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: datos.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    datos.form = datosForm
/**
* @see \App\Http\Controllers\EditorProductosController::guardar
 * @see app/Http/Controllers/EditorProductosController.php:226
 * @route '/inventario/editor-productos/guardar'
 */
export const guardar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: guardar.url(options),
    method: 'post',
})

guardar.definition = {
    methods: ["post"],
    url: '/inventario/editor-productos/guardar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EditorProductosController::guardar
 * @see app/Http/Controllers/EditorProductosController.php:226
 * @route '/inventario/editor-productos/guardar'
 */
guardar.url = (options?: RouteQueryOptions) => {
    return guardar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EditorProductosController::guardar
 * @see app/Http/Controllers/EditorProductosController.php:226
 * @route '/inventario/editor-productos/guardar'
 */
guardar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: guardar.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EditorProductosController::guardar
 * @see app/Http/Controllers/EditorProductosController.php:226
 * @route '/inventario/editor-productos/guardar'
 */
    const guardarForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: guardar.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EditorProductosController::guardar
 * @see app/Http/Controllers/EditorProductosController.php:226
 * @route '/inventario/editor-productos/guardar'
 */
        guardarForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: guardar.url(options),
            method: 'post',
        })
    
    guardar.form = guardarForm
/**
* @see \App\Http\Controllers\EditorProductosController::limites
 * @see app/Http/Controllers/EditorProductosController.php:398
 * @route '/inventario/editor-productos/{producto}/limites'
 */
export const limites = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: limites.url(args, options),
    method: 'get',
})

limites.definition = {
    methods: ["get","head"],
    url: '/inventario/editor-productos/{producto}/limites',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EditorProductosController::limites
 * @see app/Http/Controllers/EditorProductosController.php:398
 * @route '/inventario/editor-productos/{producto}/limites'
 */
limites.url = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return limites.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EditorProductosController::limites
 * @see app/Http/Controllers/EditorProductosController.php:398
 * @route '/inventario/editor-productos/{producto}/limites'
 */
limites.get = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: limites.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EditorProductosController::limites
 * @see app/Http/Controllers/EditorProductosController.php:398
 * @route '/inventario/editor-productos/{producto}/limites'
 */
limites.head = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: limites.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EditorProductosController::limites
 * @see app/Http/Controllers/EditorProductosController.php:398
 * @route '/inventario/editor-productos/{producto}/limites'
 */
    const limitesForm = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: limites.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EditorProductosController::limites
 * @see app/Http/Controllers/EditorProductosController.php:398
 * @route '/inventario/editor-productos/{producto}/limites'
 */
        limitesForm.get = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: limites.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EditorProductosController::limites
 * @see app/Http/Controllers/EditorProductosController.php:398
 * @route '/inventario/editor-productos/{producto}/limites'
 */
        limitesForm.head = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: limites.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    limites.form = limitesForm
/**
* @see \App\Http\Controllers\EditorProductosController::lotes
 * @see app/Http/Controllers/EditorProductosController.php:460
 * @route '/inventario/editor-productos/{producto}/lotes'
 */
export const lotes = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: lotes.url(args, options),
    method: 'get',
})

lotes.definition = {
    methods: ["get","head"],
    url: '/inventario/editor-productos/{producto}/lotes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EditorProductosController::lotes
 * @see app/Http/Controllers/EditorProductosController.php:460
 * @route '/inventario/editor-productos/{producto}/lotes'
 */
lotes.url = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return lotes.definition.url
            .replace('{producto}', parsedArgs.producto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EditorProductosController::lotes
 * @see app/Http/Controllers/EditorProductosController.php:460
 * @route '/inventario/editor-productos/{producto}/lotes'
 */
lotes.get = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: lotes.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EditorProductosController::lotes
 * @see app/Http/Controllers/EditorProductosController.php:460
 * @route '/inventario/editor-productos/{producto}/lotes'
 */
lotes.head = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: lotes.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EditorProductosController::lotes
 * @see app/Http/Controllers/EditorProductosController.php:460
 * @route '/inventario/editor-productos/{producto}/lotes'
 */
    const lotesForm = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: lotes.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EditorProductosController::lotes
 * @see app/Http/Controllers/EditorProductosController.php:460
 * @route '/inventario/editor-productos/{producto}/lotes'
 */
        lotesForm.get = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: lotes.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EditorProductosController::lotes
 * @see app/Http/Controllers/EditorProductosController.php:460
 * @route '/inventario/editor-productos/{producto}/lotes'
 */
        lotesForm.head = (args: { producto: string | number } | [producto: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: lotes.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    lotes.form = lotesForm
const editorProductos = {
    index,
datos,
guardar,
limites,
lotes,
}

export default editorProductos