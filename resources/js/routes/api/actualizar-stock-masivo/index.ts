import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::descargarPlantilla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:54
 * @route '/api/actualizar-stock-masivo/descargar-plantilla'
 */
export const descargarPlantilla = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: descargarPlantilla.url(options),
    method: 'get',
})

descargarPlantilla.definition = {
    methods: ["get","head"],
    url: '/api/actualizar-stock-masivo/descargar-plantilla',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::descargarPlantilla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:54
 * @route '/api/actualizar-stock-masivo/descargar-plantilla'
 */
descargarPlantilla.url = (options?: RouteQueryOptions) => {
    return descargarPlantilla.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::descargarPlantilla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:54
 * @route '/api/actualizar-stock-masivo/descargar-plantilla'
 */
descargarPlantilla.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: descargarPlantilla.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::descargarPlantilla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:54
 * @route '/api/actualizar-stock-masivo/descargar-plantilla'
 */
descargarPlantilla.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: descargarPlantilla.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::procesarArchivo
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:229
 * @route '/api/actualizar-stock-masivo/procesar-archivo'
 */
export const procesarArchivo = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarArchivo.url(options),
    method: 'post',
})

procesarArchivo.definition = {
    methods: ["post"],
    url: '/api/actualizar-stock-masivo/procesar-archivo',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::procesarArchivo
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:229
 * @route '/api/actualizar-stock-masivo/procesar-archivo'
 */
procesarArchivo.url = (options?: RouteQueryOptions) => {
    return procesarArchivo.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::procesarArchivo
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:229
 * @route '/api/actualizar-stock-masivo/procesar-archivo'
 */
procesarArchivo.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarArchivo.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::procesarCsv
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:583
 * @route '/api/actualizar-stock-masivo/procesar-csv'
 */
export const procesarCsv = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarCsv.url(options),
    method: 'post',
})

procesarCsv.definition = {
    methods: ["post"],
    url: '/api/actualizar-stock-masivo/procesar-csv',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::procesarCsv
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:583
 * @route '/api/actualizar-stock-masivo/procesar-csv'
 */
procesarCsv.url = (options?: RouteQueryOptions) => {
    return procesarCsv.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::procesarCsv
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:583
 * @route '/api/actualizar-stock-masivo/procesar-csv'
 */
procesarCsv.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarCsv.url(options),
    method: 'post',
})
const actualizarStockMasivo = {
    descargarPlantilla,
procesarArchivo,
procesarCsv,
}

export default actualizarStockMasivo