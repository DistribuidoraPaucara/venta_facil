import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\CajaAppController::estado
 * @see app/Http/Controllers/Api/CajaAppController.php:37
 * @route '/api/app/caja/estado'
 */
export const estado = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estado.url(options),
    method: 'get',
})

estado.definition = {
    methods: ["get","head"],
    url: '/api/app/caja/estado',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\CajaAppController::estado
 * @see app/Http/Controllers/Api/CajaAppController.php:37
 * @route '/api/app/caja/estado'
 */
estado.url = (options?: RouteQueryOptions) => {
    return estado.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CajaAppController::estado
 * @see app/Http/Controllers/Api/CajaAppController.php:37
 * @route '/api/app/caja/estado'
 */
estado.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estado.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\CajaAppController::estado
 * @see app/Http/Controllers/Api/CajaAppController.php:37
 * @route '/api/app/caja/estado'
 */
estado.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: estado.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\CajaAppController::estado
 * @see app/Http/Controllers/Api/CajaAppController.php:37
 * @route '/api/app/caja/estado'
 */
    const estadoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: estado.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\CajaAppController::estado
 * @see app/Http/Controllers/Api/CajaAppController.php:37
 * @route '/api/app/caja/estado'
 */
        estadoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estado.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\CajaAppController::estado
 * @see app/Http/Controllers/Api/CajaAppController.php:37
 * @route '/api/app/caja/estado'
 */
        estadoForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estado.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    estado.form = estadoForm
/**
* @see \App\Http\Controllers\Api\CajaAppController::abrir
 * @see app/Http/Controllers/Api/CajaAppController.php:58
 * @route '/api/app/caja/abrir'
 */
export const abrir = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: abrir.url(options),
    method: 'post',
})

abrir.definition = {
    methods: ["post"],
    url: '/api/app/caja/abrir',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CajaAppController::abrir
 * @see app/Http/Controllers/Api/CajaAppController.php:58
 * @route '/api/app/caja/abrir'
 */
abrir.url = (options?: RouteQueryOptions) => {
    return abrir.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CajaAppController::abrir
 * @see app/Http/Controllers/Api/CajaAppController.php:58
 * @route '/api/app/caja/abrir'
 */
abrir.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: abrir.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CajaAppController::abrir
 * @see app/Http/Controllers/Api/CajaAppController.php:58
 * @route '/api/app/caja/abrir'
 */
    const abrirForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: abrir.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CajaAppController::abrir
 * @see app/Http/Controllers/Api/CajaAppController.php:58
 * @route '/api/app/caja/abrir'
 */
        abrirForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: abrir.url(options),
            method: 'post',
        })
    
    abrir.form = abrirForm
/**
* @see \App\Http\Controllers\Api\CajaAppController::cerrar
 * @see app/Http/Controllers/Api/CajaAppController.php:151
 * @route '/api/app/caja/cerrar'
 */
export const cerrar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cerrar.url(options),
    method: 'post',
})

cerrar.definition = {
    methods: ["post"],
    url: '/api/app/caja/cerrar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\CajaAppController::cerrar
 * @see app/Http/Controllers/Api/CajaAppController.php:151
 * @route '/api/app/caja/cerrar'
 */
cerrar.url = (options?: RouteQueryOptions) => {
    return cerrar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\CajaAppController::cerrar
 * @see app/Http/Controllers/Api/CajaAppController.php:151
 * @route '/api/app/caja/cerrar'
 */
cerrar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cerrar.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Api\CajaAppController::cerrar
 * @see app/Http/Controllers/Api/CajaAppController.php:151
 * @route '/api/app/caja/cerrar'
 */
    const cerrarForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cerrar.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Api\CajaAppController::cerrar
 * @see app/Http/Controllers/Api/CajaAppController.php:151
 * @route '/api/app/caja/cerrar'
 */
        cerrarForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cerrar.url(options),
            method: 'post',
        })
    
    cerrar.form = cerrarForm
const CajaAppController = { estado, abrir, cerrar }

export default CajaAppController