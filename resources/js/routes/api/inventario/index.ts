import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::actualizarStockTabla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:598
 * @route '/api/inventario/actualizar-stock-tabla'
 */
export const actualizarStockTabla = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarStockTabla.url(options),
    method: 'post',
})

actualizarStockTabla.definition = {
    methods: ["post"],
    url: '/api/inventario/actualizar-stock-tabla',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::actualizarStockTabla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:598
 * @route '/api/inventario/actualizar-stock-tabla'
 */
actualizarStockTabla.url = (options?: RouteQueryOptions) => {
    return actualizarStockTabla.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::actualizarStockTabla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:598
 * @route '/api/inventario/actualizar-stock-tabla'
 */
actualizarStockTabla.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarStockTabla.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ActualizarStockMasivoController::actualizarStockTabla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:598
 * @route '/api/inventario/actualizar-stock-tabla'
 */
    const actualizarStockTablaForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: actualizarStockTabla.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ActualizarStockMasivoController::actualizarStockTabla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:598
 * @route '/api/inventario/actualizar-stock-tabla'
 */
        actualizarStockTablaForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: actualizarStockTabla.url(options),
            method: 'post',
        })
    
    actualizarStockTabla.form = actualizarStockTablaForm
/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::transferirProducto
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:815
 * @route '/api/inventario/transferir-producto'
 */
export const transferirProducto = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: transferirProducto.url(options),
    method: 'post',
})

transferirProducto.definition = {
    methods: ["post"],
    url: '/api/inventario/transferir-producto',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::transferirProducto
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:815
 * @route '/api/inventario/transferir-producto'
 */
transferirProducto.url = (options?: RouteQueryOptions) => {
    return transferirProducto.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::transferirProducto
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:815
 * @route '/api/inventario/transferir-producto'
 */
transferirProducto.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: transferirProducto.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ActualizarStockMasivoController::transferirProducto
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:815
 * @route '/api/inventario/transferir-producto'
 */
    const transferirProductoForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: transferirProducto.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ActualizarStockMasivoController::transferirProducto
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:815
 * @route '/api/inventario/transferir-producto'
 */
        transferirProductoForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: transferirProducto.url(options),
            method: 'post',
        })
    
    transferirProducto.form = transferirProductoForm
const inventario = {
    actualizarStockTabla,
transferirProducto,
}

export default inventario