import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ReportePreciosController::index
 * @see app/Http/Controllers/ReportePreciosController.php:18
 * @route '/reportes/precios'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/reportes/precios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportePreciosController::index
 * @see app/Http/Controllers/ReportePreciosController.php:18
 * @route '/reportes/precios'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportePreciosController::index
 * @see app/Http/Controllers/ReportePreciosController.php:18
 * @route '/reportes/precios'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportePreciosController::index
 * @see app/Http/Controllers/ReportePreciosController.php:18
 * @route '/reportes/precios'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportePreciosController::index
 * @see app/Http/Controllers/ReportePreciosController.php:18
 * @route '/reportes/precios'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportePreciosController::index
 * @see app/Http/Controllers/ReportePreciosController.php:18
 * @route '/reportes/precios'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportePreciosController::index
 * @see app/Http/Controllers/ReportePreciosController.php:18
 * @route '/reportes/precios'
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
* @see \App\Http\Controllers\ReportePreciosController::exportMethod
 * @see app/Http/Controllers/ReportePreciosController.php:474
 * @route '/reportes/precios/export'
 */
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/reportes/precios/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportePreciosController::exportMethod
 * @see app/Http/Controllers/ReportePreciosController.php:474
 * @route '/reportes/precios/export'
 */
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportePreciosController::exportMethod
 * @see app/Http/Controllers/ReportePreciosController.php:474
 * @route '/reportes/precios/export'
 */
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportePreciosController::exportMethod
 * @see app/Http/Controllers/ReportePreciosController.php:474
 * @route '/reportes/precios/export'
 */
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportePreciosController::exportMethod
 * @see app/Http/Controllers/ReportePreciosController.php:474
 * @route '/reportes/precios/export'
 */
    const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportMethod.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportePreciosController::exportMethod
 * @see app/Http/Controllers/ReportePreciosController.php:474
 * @route '/reportes/precios/export'
 */
        exportMethodForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportePreciosController::exportMethod
 * @see app/Http/Controllers/ReportePreciosController.php:474
 * @route '/reportes/precios/export'
 */
        exportMethodForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportMethod.form = exportMethodForm
/**
* @see \App\Http\Controllers\ReportePreciosController::pdf
 * @see app/Http/Controllers/ReportePreciosController.php:530
 * @route '/reportes/precios/pdf'
 */
export const pdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})

pdf.definition = {
    methods: ["get","head"],
    url: '/reportes/precios/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportePreciosController::pdf
 * @see app/Http/Controllers/ReportePreciosController.php:530
 * @route '/reportes/precios/pdf'
 */
pdf.url = (options?: RouteQueryOptions) => {
    return pdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportePreciosController::pdf
 * @see app/Http/Controllers/ReportePreciosController.php:530
 * @route '/reportes/precios/pdf'
 */
pdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportePreciosController::pdf
 * @see app/Http/Controllers/ReportePreciosController.php:530
 * @route '/reportes/precios/pdf'
 */
pdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportePreciosController::pdf
 * @see app/Http/Controllers/ReportePreciosController.php:530
 * @route '/reportes/precios/pdf'
 */
    const pdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportePreciosController::pdf
 * @see app/Http/Controllers/ReportePreciosController.php:530
 * @route '/reportes/precios/pdf'
 */
        pdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportePreciosController::pdf
 * @see app/Http/Controllers/ReportePreciosController.php:530
 * @route '/reportes/precios/pdf'
 */
        pdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    pdf.form = pdfForm
const precios = {
    index,
export: exportMethod,
pdf,
}

export default precios