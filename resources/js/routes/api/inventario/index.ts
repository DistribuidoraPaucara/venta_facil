import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::actualizarStockTabla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:595
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
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:595
 * @route '/api/inventario/actualizar-stock-tabla'
 */
actualizarStockTabla.url = (options?: RouteQueryOptions) => {
    return actualizarStockTabla.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::actualizarStockTabla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:595
 * @route '/api/inventario/actualizar-stock-tabla'
 */
actualizarStockTabla.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarStockTabla.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ActualizarStockMasivoController::actualizarStockTabla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:595
 * @route '/api/inventario/actualizar-stock-tabla'
 */
    const actualizarStockTablaForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: actualizarStockTabla.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ActualizarStockMasivoController::actualizarStockTabla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:595
 * @route '/api/inventario/actualizar-stock-tabla'
 */
        actualizarStockTablaForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: actualizarStockTabla.url(options),
            method: 'post',
        })
    
    actualizarStockTabla.form = actualizarStockTablaForm
const inventario = {
    actualizarStockTabla,
}

export default inventario