import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\SettingsEmpresaController::edit
 * @see app/Http/Controllers/SettingsEmpresaController.php:16
 * @route '/settings/empresa'
 */
export const edit = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/settings/empresa',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SettingsEmpresaController::edit
 * @see app/Http/Controllers/SettingsEmpresaController.php:16
 * @route '/settings/empresa'
 */
edit.url = (options?: RouteQueryOptions) => {
    return edit.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SettingsEmpresaController::edit
 * @see app/Http/Controllers/SettingsEmpresaController.php:16
 * @route '/settings/empresa'
 */
edit.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SettingsEmpresaController::edit
 * @see app/Http/Controllers/SettingsEmpresaController.php:16
 * @route '/settings/empresa'
 */
edit.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SettingsEmpresaController::update
 * @see app/Http/Controllers/SettingsEmpresaController.php:55
 * @route '/settings/empresa'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/settings/empresa',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\SettingsEmpresaController::update
 * @see app/Http/Controllers/SettingsEmpresaController.php:55
 * @route '/settings/empresa'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SettingsEmpresaController::update
 * @see app/Http/Controllers/SettingsEmpresaController.php:55
 * @route '/settings/empresa'
 */
update.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})
const empresa = {
    edit,
update,
}

export default empresa