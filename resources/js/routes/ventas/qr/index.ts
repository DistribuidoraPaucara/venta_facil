import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\PagoQrController::generar
 * @see app/Http/Controllers/PagoQrController.php:20
 * @route '/ventas/qr/generar'
 */
export const generar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generar.url(options),
    method: 'post',
})

generar.definition = {
    methods: ["post"],
    url: '/ventas/qr/generar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PagoQrController::generar
 * @see app/Http/Controllers/PagoQrController.php:20
 * @route '/ventas/qr/generar'
 */
generar.url = (options?: RouteQueryOptions) => {
    return generar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PagoQrController::generar
 * @see app/Http/Controllers/PagoQrController.php:20
 * @route '/ventas/qr/generar'
 */
generar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generar.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PagoQrController::generar
 * @see app/Http/Controllers/PagoQrController.php:20
 * @route '/ventas/qr/generar'
 */
    const generarForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: generar.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PagoQrController::generar
 * @see app/Http/Controllers/PagoQrController.php:20
 * @route '/ventas/qr/generar'
 */
        generarForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: generar.url(options),
            method: 'post',
        })
    
    generar.form = generarForm
const qr = {
    generar,
}

export default qr