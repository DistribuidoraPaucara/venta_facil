import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4927
 * @route '/inventario/movimientos/kardex/exportar'
 */
export const exportar = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportar.url(options),
    method: 'get',
})

exportar.definition = {
    methods: ["get","head"],
    url: '/inventario/movimientos/kardex/exportar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4927
 * @route '/inventario/movimientos/kardex/exportar'
 */
exportar.url = (options?: RouteQueryOptions) => {
    return exportar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4927
 * @route '/inventario/movimientos/kardex/exportar'
 */
exportar.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportar.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4927
 * @route '/inventario/movimientos/kardex/exportar'
 */
exportar.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportar.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4927
 * @route '/inventario/movimientos/kardex/exportar'
 */
    const exportarForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportar.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4927
 * @route '/inventario/movimientos/kardex/exportar'
 */
        exportarForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportar.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InventarioController::exportar
 * @see app/Http/Controllers/InventarioController.php:4927
 * @route '/inventario/movimientos/kardex/exportar'
 */
        exportarForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportar.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportar.form = exportarForm
const kardex = {
    exportar,
}

export default kardex