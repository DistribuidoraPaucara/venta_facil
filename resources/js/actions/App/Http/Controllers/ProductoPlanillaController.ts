import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ProductoPlanillaController::index
 * @see app/Http/Controllers/ProductoPlanillaController.php:30
 * @route '/productos/importar-exportar'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/productos/importar-exportar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoPlanillaController::index
 * @see app/Http/Controllers/ProductoPlanillaController.php:30
 * @route '/productos/importar-exportar'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoPlanillaController::index
 * @see app/Http/Controllers/ProductoPlanillaController.php:30
 * @route '/productos/importar-exportar'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProductoPlanillaController::index
 * @see app/Http/Controllers/ProductoPlanillaController.php:30
 * @route '/productos/importar-exportar'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProductoPlanillaController::index
 * @see app/Http/Controllers/ProductoPlanillaController.php:30
 * @route '/productos/importar-exportar'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProductoPlanillaController::index
 * @see app/Http/Controllers/ProductoPlanillaController.php:30
 * @route '/productos/importar-exportar'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProductoPlanillaController::index
 * @see app/Http/Controllers/ProductoPlanillaController.php:30
 * @route '/productos/importar-exportar'
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
* @see \App\Http\Controllers\ProductoPlanillaController::descargar
 * @see app/Http/Controllers/ProductoPlanillaController.php:57
 * @route '/productos/importar-exportar/descargar'
 */
export const descargar = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: descargar.url(options),
    method: 'get',
})

descargar.definition = {
    methods: ["get","head"],
    url: '/productos/importar-exportar/descargar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductoPlanillaController::descargar
 * @see app/Http/Controllers/ProductoPlanillaController.php:57
 * @route '/productos/importar-exportar/descargar'
 */
descargar.url = (options?: RouteQueryOptions) => {
    return descargar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoPlanillaController::descargar
 * @see app/Http/Controllers/ProductoPlanillaController.php:57
 * @route '/productos/importar-exportar/descargar'
 */
descargar.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: descargar.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProductoPlanillaController::descargar
 * @see app/Http/Controllers/ProductoPlanillaController.php:57
 * @route '/productos/importar-exportar/descargar'
 */
descargar.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: descargar.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProductoPlanillaController::descargar
 * @see app/Http/Controllers/ProductoPlanillaController.php:57
 * @route '/productos/importar-exportar/descargar'
 */
    const descargarForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: descargar.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProductoPlanillaController::descargar
 * @see app/Http/Controllers/ProductoPlanillaController.php:57
 * @route '/productos/importar-exportar/descargar'
 */
        descargarForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: descargar.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProductoPlanillaController::descargar
 * @see app/Http/Controllers/ProductoPlanillaController.php:57
 * @route '/productos/importar-exportar/descargar'
 */
        descargarForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: descargar.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    descargar.form = descargarForm
/**
* @see \App\Http\Controllers\ProductoPlanillaController::validar
 * @see app/Http/Controllers/ProductoPlanillaController.php:67
 * @route '/productos/importar-exportar/validar'
 */
export const validar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validar.url(options),
    method: 'post',
})

validar.definition = {
    methods: ["post"],
    url: '/productos/importar-exportar/validar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductoPlanillaController::validar
 * @see app/Http/Controllers/ProductoPlanillaController.php:67
 * @route '/productos/importar-exportar/validar'
 */
validar.url = (options?: RouteQueryOptions) => {
    return validar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoPlanillaController::validar
 * @see app/Http/Controllers/ProductoPlanillaController.php:67
 * @route '/productos/importar-exportar/validar'
 */
validar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validar.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ProductoPlanillaController::validar
 * @see app/Http/Controllers/ProductoPlanillaController.php:67
 * @route '/productos/importar-exportar/validar'
 */
    const validarForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: validar.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProductoPlanillaController::validar
 * @see app/Http/Controllers/ProductoPlanillaController.php:67
 * @route '/productos/importar-exportar/validar'
 */
        validarForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: validar.url(options),
            method: 'post',
        })
    
    validar.form = validarForm
/**
* @see \App\Http\Controllers\ProductoPlanillaController::importar
 * @see app/Http/Controllers/ProductoPlanillaController.php:84
 * @route '/productos/importar-exportar/importar'
 */
export const importar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importar.url(options),
    method: 'post',
})

importar.definition = {
    methods: ["post"],
    url: '/productos/importar-exportar/importar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductoPlanillaController::importar
 * @see app/Http/Controllers/ProductoPlanillaController.php:84
 * @route '/productos/importar-exportar/importar'
 */
importar.url = (options?: RouteQueryOptions) => {
    return importar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProductoPlanillaController::importar
 * @see app/Http/Controllers/ProductoPlanillaController.php:84
 * @route '/productos/importar-exportar/importar'
 */
importar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importar.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ProductoPlanillaController::importar
 * @see app/Http/Controllers/ProductoPlanillaController.php:84
 * @route '/productos/importar-exportar/importar'
 */
    const importarForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: importar.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProductoPlanillaController::importar
 * @see app/Http/Controllers/ProductoPlanillaController.php:84
 * @route '/productos/importar-exportar/importar'
 */
        importarForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: importar.url(options),
            method: 'post',
        })
    
    importar.form = importarForm
const ProductoPlanillaController = { index, descargar, validar, importar }

export default ProductoPlanillaController