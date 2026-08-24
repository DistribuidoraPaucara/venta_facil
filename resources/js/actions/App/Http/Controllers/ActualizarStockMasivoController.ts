import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
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
* @see \App\Http\Controllers\ActualizarStockMasivoController::procesarCSV
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:583
 * @route '/api/actualizar-stock-masivo/procesar-csv'
 */
export const procesarCSV = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarCSV.url(options),
    method: 'post',
})

procesarCSV.definition = {
    methods: ["post"],
    url: '/api/actualizar-stock-masivo/procesar-csv',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::procesarCSV
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:583
 * @route '/api/actualizar-stock-masivo/procesar-csv'
 */
procesarCSV.url = (options?: RouteQueryOptions) => {
    return procesarCSV.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::procesarCSV
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:583
 * @route '/api/actualizar-stock-masivo/procesar-csv'
 */
procesarCSV.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: procesarCSV.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::actualizarStockTabla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:596
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
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:596
 * @route '/api/inventario/actualizar-stock-tabla'
 */
actualizarStockTabla.url = (options?: RouteQueryOptions) => {
    return actualizarStockTabla.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::actualizarStockTabla
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:596
 * @route '/api/inventario/actualizar-stock-tabla'
 */
actualizarStockTabla.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: actualizarStockTabla.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::index
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:42
 * @route '/inventario/actualizar-stock-masivo'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventario/actualizar-stock-masivo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::index
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:42
 * @route '/inventario/actualizar-stock-masivo'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::index
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:42
 * @route '/inventario/actualizar-stock-masivo'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ActualizarStockMasivoController::index
 * @see app/Http/Controllers/ActualizarStockMasivoController.php:42
 * @route '/inventario/actualizar-stock-masivo'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})
const ActualizarStockMasivoController = { descargarPlantilla, procesarArchivo, procesarCSV, actualizarStockTabla, index }

export default ActualizarStockMasivoController