import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ProduccionMasivaController::productosDisponibles
 * @see app/Http/Controllers/ProduccionMasivaController.php:80
 * @route '/api/producciones/masiva/productos-disponibles'
 */
export const productosDisponibles = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(options),
    method: 'get',
})

productosDisponibles.definition = {
    methods: ["get","head"],
    url: '/api/producciones/masiva/productos-disponibles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProduccionMasivaController::productosDisponibles
 * @see app/Http/Controllers/ProduccionMasivaController.php:80
 * @route '/api/producciones/masiva/productos-disponibles'
 */
productosDisponibles.url = (options?: RouteQueryOptions) => {
    return productosDisponibles.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionMasivaController::productosDisponibles
 * @see app/Http/Controllers/ProduccionMasivaController.php:80
 * @route '/api/producciones/masiva/productos-disponibles'
 */
productosDisponibles.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productosDisponibles.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProduccionMasivaController::productosDisponibles
 * @see app/Http/Controllers/ProduccionMasivaController.php:80
 * @route '/api/producciones/masiva/productos-disponibles'
 */
productosDisponibles.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: productosDisponibles.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProduccionMasivaController::productosDisponibles
 * @see app/Http/Controllers/ProduccionMasivaController.php:80
 * @route '/api/producciones/masiva/productos-disponibles'
 */
    const productosDisponiblesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: productosDisponibles.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProduccionMasivaController::productosDisponibles
 * @see app/Http/Controllers/ProduccionMasivaController.php:80
 * @route '/api/producciones/masiva/productos-disponibles'
 */
        productosDisponiblesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: productosDisponibles.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProduccionMasivaController::productosDisponibles
 * @see app/Http/Controllers/ProduccionMasivaController.php:80
 * @route '/api/producciones/masiva/productos-disponibles'
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
* @see \App\Http\Controllers\ProduccionMasivaController::calcularCapacidad
 * @see app/Http/Controllers/ProduccionMasivaController.php:131
 * @route '/api/producciones/masiva/calcular-capacidad'
 */
export const calcularCapacidad = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: calcularCapacidad.url(options),
    method: 'post',
})

calcularCapacidad.definition = {
    methods: ["post"],
    url: '/api/producciones/masiva/calcular-capacidad',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProduccionMasivaController::calcularCapacidad
 * @see app/Http/Controllers/ProduccionMasivaController.php:131
 * @route '/api/producciones/masiva/calcular-capacidad'
 */
calcularCapacidad.url = (options?: RouteQueryOptions) => {
    return calcularCapacidad.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionMasivaController::calcularCapacidad
 * @see app/Http/Controllers/ProduccionMasivaController.php:131
 * @route '/api/producciones/masiva/calcular-capacidad'
 */
calcularCapacidad.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: calcularCapacidad.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ProduccionMasivaController::calcularCapacidad
 * @see app/Http/Controllers/ProduccionMasivaController.php:131
 * @route '/api/producciones/masiva/calcular-capacidad'
 */
    const calcularCapacidadForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: calcularCapacidad.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProduccionMasivaController::calcularCapacidad
 * @see app/Http/Controllers/ProduccionMasivaController.php:131
 * @route '/api/producciones/masiva/calcular-capacidad'
 */
        calcularCapacidadForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: calcularCapacidad.url(options),
            method: 'post',
        })
    
    calcularCapacidad.form = calcularCapacidadForm
/**
* @see \App\Http\Controllers\ProduccionMasivaController::guardarProduccionMasiva
 * @see app/Http/Controllers/ProduccionMasivaController.php:232
 * @route '/api/producciones/masiva/guardar'
 */
export const guardarProduccionMasiva = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: guardarProduccionMasiva.url(options),
    method: 'post',
})

guardarProduccionMasiva.definition = {
    methods: ["post"],
    url: '/api/producciones/masiva/guardar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProduccionMasivaController::guardarProduccionMasiva
 * @see app/Http/Controllers/ProduccionMasivaController.php:232
 * @route '/api/producciones/masiva/guardar'
 */
guardarProduccionMasiva.url = (options?: RouteQueryOptions) => {
    return guardarProduccionMasiva.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionMasivaController::guardarProduccionMasiva
 * @see app/Http/Controllers/ProduccionMasivaController.php:232
 * @route '/api/producciones/masiva/guardar'
 */
guardarProduccionMasiva.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: guardarProduccionMasiva.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ProduccionMasivaController::guardarProduccionMasiva
 * @see app/Http/Controllers/ProduccionMasivaController.php:232
 * @route '/api/producciones/masiva/guardar'
 */
    const guardarProduccionMasivaForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: guardarProduccionMasiva.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProduccionMasivaController::guardarProduccionMasiva
 * @see app/Http/Controllers/ProduccionMasivaController.php:232
 * @route '/api/producciones/masiva/guardar'
 */
        guardarProduccionMasivaForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: guardarProduccionMasiva.url(options),
            method: 'post',
        })
    
    guardarProduccionMasiva.form = guardarProduccionMasivaForm
const ProduccionMasivaController = { productosDisponibles, calcularCapacidad, guardarProduccionMasiva }

export default ProduccionMasivaController