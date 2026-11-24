import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
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
* @see \App\Http\Controllers\ProduccionMasivaController::guardar
 * @see app/Http/Controllers/ProduccionMasivaController.php:232
 * @route '/api/producciones/masiva/guardar'
 */
export const guardar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: guardar.url(options),
    method: 'post',
})

guardar.definition = {
    methods: ["post"],
    url: '/api/producciones/masiva/guardar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProduccionMasivaController::guardar
 * @see app/Http/Controllers/ProduccionMasivaController.php:232
 * @route '/api/producciones/masiva/guardar'
 */
guardar.url = (options?: RouteQueryOptions) => {
    return guardar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProduccionMasivaController::guardar
 * @see app/Http/Controllers/ProduccionMasivaController.php:232
 * @route '/api/producciones/masiva/guardar'
 */
guardar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: guardar.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RegistroProduccionController::registro
 * @see app/Http/Controllers/RegistroProduccionController.php:22
 * @route '/api/producciones/masiva/registro'
 */
export const registro = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: registro.url(options),
    method: 'get',
})

registro.definition = {
    methods: ["get","head"],
    url: '/api/producciones/masiva/registro',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RegistroProduccionController::registro
 * @see app/Http/Controllers/RegistroProduccionController.php:22
 * @route '/api/producciones/masiva/registro'
 */
registro.url = (options?: RouteQueryOptions) => {
    return registro.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RegistroProduccionController::registro
 * @see app/Http/Controllers/RegistroProduccionController.php:22
 * @route '/api/producciones/masiva/registro'
 */
registro.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: registro.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RegistroProduccionController::registro
 * @see app/Http/Controllers/RegistroProduccionController.php:22
 * @route '/api/producciones/masiva/registro'
 */
registro.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: registro.url(options),
    method: 'head',
})

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
const produccionesMasiva = {
    productosDisponibles,
calcularCapacidad,
guardar,
registro,
show,
cambiarEstado,
destroy,
}

export default produccionesMasiva