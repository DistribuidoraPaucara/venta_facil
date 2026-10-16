import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:41
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
 * @see app/Http/Controllers/EditorProductosController.php:41
 * @route '/inventario/editor-productos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:41
 * @route '/inventario/editor-productos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:41
 * @route '/inventario/editor-productos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:41
 * @route '/inventario/editor-productos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:41
 * @route '/inventario/editor-productos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EditorProductosController::index
 * @see app/Http/Controllers/EditorProductosController.php:41
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
 * @see app/Http/Controllers/EditorProductosController.php:73
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
 * @see app/Http/Controllers/EditorProductosController.php:73
 * @route '/inventario/editor-productos/datos'
 */
datos.url = (options?: RouteQueryOptions) => {
    return datos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EditorProductosController::datos
 * @see app/Http/Controllers/EditorProductosController.php:73
 * @route '/inventario/editor-productos/datos'
 */
datos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: datos.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EditorProductosController::datos
 * @see app/Http/Controllers/EditorProductosController.php:73
 * @route '/inventario/editor-productos/datos'
 */
datos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: datos.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EditorProductosController::datos
 * @see app/Http/Controllers/EditorProductosController.php:73
 * @route '/inventario/editor-productos/datos'
 */
    const datosForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: datos.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EditorProductosController::datos
 * @see app/Http/Controllers/EditorProductosController.php:73
 * @route '/inventario/editor-productos/datos'
 */
        datosForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: datos.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EditorProductosController::datos
 * @see app/Http/Controllers/EditorProductosController.php:73
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
 * @see app/Http/Controllers/EditorProductosController.php:212
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
 * @see app/Http/Controllers/EditorProductosController.php:212
 * @route '/inventario/editor-productos/guardar'
 */
guardar.url = (options?: RouteQueryOptions) => {
    return guardar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EditorProductosController::guardar
 * @see app/Http/Controllers/EditorProductosController.php:212
 * @route '/inventario/editor-productos/guardar'
 */
guardar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: guardar.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EditorProductosController::guardar
 * @see app/Http/Controllers/EditorProductosController.php:212
 * @route '/inventario/editor-productos/guardar'
 */
    const guardarForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: guardar.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EditorProductosController::guardar
 * @see app/Http/Controllers/EditorProductosController.php:212
 * @route '/inventario/editor-productos/guardar'
 */
        guardarForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: guardar.url(options),
            method: 'post',
        })
    
    guardar.form = guardarForm
const editorProductos = {
    index,
datos,
guardar,
}

export default editorProductos