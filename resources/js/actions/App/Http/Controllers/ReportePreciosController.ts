import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
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
/**
* @see \App\Http\Controllers\ReportePreciosController::ganancias
 * @see app/Http/Controllers/ReportePreciosController.php:48
 * @route '/reportes/ganancias'
 */
export const ganancias = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ganancias.url(options),
    method: 'get',
})

ganancias.definition = {
    methods: ["get","head"],
    url: '/reportes/ganancias',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportePreciosController::ganancias
 * @see app/Http/Controllers/ReportePreciosController.php:48
 * @route '/reportes/ganancias'
 */
ganancias.url = (options?: RouteQueryOptions) => {
    return ganancias.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportePreciosController::ganancias
 * @see app/Http/Controllers/ReportePreciosController.php:48
 * @route '/reportes/ganancias'
 */
ganancias.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ganancias.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportePreciosController::ganancias
 * @see app/Http/Controllers/ReportePreciosController.php:48
 * @route '/reportes/ganancias'
 */
ganancias.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ganancias.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportePreciosController::ganancias
 * @see app/Http/Controllers/ReportePreciosController.php:48
 * @route '/reportes/ganancias'
 */
    const gananciasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ganancias.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportePreciosController::ganancias
 * @see app/Http/Controllers/ReportePreciosController.php:48
 * @route '/reportes/ganancias'
 */
        gananciasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ganancias.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportePreciosController::ganancias
 * @see app/Http/Controllers/ReportePreciosController.php:48
 * @route '/reportes/ganancias'
 */
        gananciasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ganancias.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ganancias.form = gananciasForm
/**
* @see \App\Http\Controllers\ReportePreciosController::exportGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:156
 * @route '/reportes/ganancias/export'
 */
export const exportGanancias = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportGanancias.url(options),
    method: 'get',
})

exportGanancias.definition = {
    methods: ["get","head"],
    url: '/reportes/ganancias/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportePreciosController::exportGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:156
 * @route '/reportes/ganancias/export'
 */
exportGanancias.url = (options?: RouteQueryOptions) => {
    return exportGanancias.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportePreciosController::exportGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:156
 * @route '/reportes/ganancias/export'
 */
exportGanancias.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportGanancias.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportePreciosController::exportGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:156
 * @route '/reportes/ganancias/export'
 */
exportGanancias.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportGanancias.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportePreciosController::exportGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:156
 * @route '/reportes/ganancias/export'
 */
    const exportGananciasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportGanancias.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportePreciosController::exportGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:156
 * @route '/reportes/ganancias/export'
 */
        exportGananciasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportGanancias.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportePreciosController::exportGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:156
 * @route '/reportes/ganancias/export'
 */
        exportGananciasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportGanancias.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportGanancias.form = exportGananciasForm
/**
* @see \App\Http\Controllers\ReportePreciosController::pdfGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:224
 * @route '/reportes/ganancias/pdf'
 */
export const pdfGanancias = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdfGanancias.url(options),
    method: 'get',
})

pdfGanancias.definition = {
    methods: ["get","head"],
    url: '/reportes/ganancias/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportePreciosController::pdfGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:224
 * @route '/reportes/ganancias/pdf'
 */
pdfGanancias.url = (options?: RouteQueryOptions) => {
    return pdfGanancias.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportePreciosController::pdfGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:224
 * @route '/reportes/ganancias/pdf'
 */
pdfGanancias.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdfGanancias.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportePreciosController::pdfGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:224
 * @route '/reportes/ganancias/pdf'
 */
pdfGanancias.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdfGanancias.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportePreciosController::pdfGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:224
 * @route '/reportes/ganancias/pdf'
 */
    const pdfGananciasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pdfGanancias.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportePreciosController::pdfGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:224
 * @route '/reportes/ganancias/pdf'
 */
        pdfGananciasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdfGanancias.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportePreciosController::pdfGanancias
 * @see app/Http/Controllers/ReportePreciosController.php:224
 * @route '/reportes/ganancias/pdf'
 */
        pdfGananciasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdfGanancias.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    pdfGanancias.form = pdfGananciasForm
const ReportePreciosController = { index, exportMethod, pdf, ganancias, exportGanancias, pdfGanancias, export: exportMethod }

export default ReportePreciosController