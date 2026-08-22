import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
 * @see [serialized-closure]:2
 * @route '/produccion/recetas-manager'
 */
export const recetasManager = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: recetasManager.url(options),
    method: 'get',
})

recetasManager.definition = {
    methods: ["get","head"],
    url: '/produccion/recetas-manager',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see [serialized-closure]:2
 * @route '/produccion/recetas-manager'
 */
recetasManager.url = (options?: RouteQueryOptions) => {
    return recetasManager.definition.url + queryParams(options)
}

/**
 * @see [serialized-closure]:2
 * @route '/produccion/recetas-manager'
 */
recetasManager.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: recetasManager.url(options),
    method: 'get',
})
/**
 * @see [serialized-closure]:2
 * @route '/produccion/recetas-manager'
 */
recetasManager.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: recetasManager.url(options),
    method: 'head',
})

    /**
 * @see [serialized-closure]:2
 * @route '/produccion/recetas-manager'
 */
    const recetasManagerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: recetasManager.url(options),
        method: 'get',
    })

            /**
 * @see [serialized-closure]:2
 * @route '/produccion/recetas-manager'
 */
        recetasManagerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: recetasManager.url(options),
            method: 'get',
        })
            /**
 * @see [serialized-closure]:2
 * @route '/produccion/recetas-manager'
 */
        recetasManagerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: recetasManager.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    recetasManager.form = recetasManagerForm
/**
 * @see [serialized-closure]:2
 * @route '/produccion/registro-produccion'
 */
export const registroProduccion = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: registroProduccion.url(options),
    method: 'get',
})

registroProduccion.definition = {
    methods: ["get","head"],
    url: '/produccion/registro-produccion',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see [serialized-closure]:2
 * @route '/produccion/registro-produccion'
 */
registroProduccion.url = (options?: RouteQueryOptions) => {
    return registroProduccion.definition.url + queryParams(options)
}

/**
 * @see [serialized-closure]:2
 * @route '/produccion/registro-produccion'
 */
registroProduccion.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: registroProduccion.url(options),
    method: 'get',
})
/**
 * @see [serialized-closure]:2
 * @route '/produccion/registro-produccion'
 */
registroProduccion.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: registroProduccion.url(options),
    method: 'head',
})

    /**
 * @see [serialized-closure]:2
 * @route '/produccion/registro-produccion'
 */
    const registroProduccionForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: registroProduccion.url(options),
        method: 'get',
    })

            /**
 * @see [serialized-closure]:2
 * @route '/produccion/registro-produccion'
 */
        registroProduccionForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: registroProduccion.url(options),
            method: 'get',
        })
            /**
 * @see [serialized-closure]:2
 * @route '/produccion/registro-produccion'
 */
        registroProduccionForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: registroProduccion.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    registroProduccion.form = registroProduccionForm
/**
 * @see [serialized-closure]:2
 * @route '/produccion/reporte-produccion'
 */
export const reporteProduccion = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteProduccion.url(options),
    method: 'get',
})

reporteProduccion.definition = {
    methods: ["get","head"],
    url: '/produccion/reporte-produccion',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see [serialized-closure]:2
 * @route '/produccion/reporte-produccion'
 */
reporteProduccion.url = (options?: RouteQueryOptions) => {
    return reporteProduccion.definition.url + queryParams(options)
}

/**
 * @see [serialized-closure]:2
 * @route '/produccion/reporte-produccion'
 */
reporteProduccion.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporteProduccion.url(options),
    method: 'get',
})
/**
 * @see [serialized-closure]:2
 * @route '/produccion/reporte-produccion'
 */
reporteProduccion.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reporteProduccion.url(options),
    method: 'head',
})

    /**
 * @see [serialized-closure]:2
 * @route '/produccion/reporte-produccion'
 */
    const reporteProduccionForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reporteProduccion.url(options),
        method: 'get',
    })

            /**
 * @see [serialized-closure]:2
 * @route '/produccion/reporte-produccion'
 */
        reporteProduccionForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteProduccion.url(options),
            method: 'get',
        })
            /**
 * @see [serialized-closure]:2
 * @route '/produccion/reporte-produccion'
 */
        reporteProduccionForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reporteProduccion.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    reporteProduccion.form = reporteProduccionForm
const produccion = {
    recetasManager,
registroProduccion,
reporteProduccion,
}

export default produccion