import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Badge } from '@/presentation/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';

import DeleteUser from '@/presentation/components/delete-user';
import HeadingSmall from '@/presentation/components/heading-small';
import InputError from '@/presentation/components/input-error';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configuración de perfil',
        href: '/settings/profile',
    },
];

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de perfil" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Información de perfil" description="Actualice su nombre y dirección de correo electrónico" />

                    <Form
                        method="PATCH"
                        action="/settings/profile"
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nombre</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Nombre completo"
                                    />

                                    <InputError className="mt-2" message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Correo electrónico</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Correo electrónico"
                                    />

                                    <InputError className="mt-2" message={errors.email} />
                                </div>

                                {mustVerifyEmail && auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Su dirección de correo electrónico no está verificada.{' '}
                                            <Link
                                                href="/email/verification-notification"
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Haga clic aquí para reenviar el correo electrónico de verificación.
                                            </Link>
                                        </p>

                                        {status === 'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                Se ha enviado un nuevo enlace de verificación a su dirección de correo electrónico.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Guardar</Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Guardado</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                {/* ✅ NUEVA SECCIÓN: Información de Empresa y Roles */}
                <div className="space-y-6 border-t pt-6">
                    <HeadingSmall
                        title="Información de acceso"
                        description="Empresa, roles y permisos asignados"
                    />

                    {/* Empresa */}
                    {auth.user.empresa && (
                        <Card className="border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <span>🏢</span> Empresa
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Nombre:</span>
                                        <span className="text-sm font-semibold">{auth.user.empresa.nombre_comercial}</span>
                                    </div>
                                    {auth.user.empresa.razon_social && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Razón social:</span>
                                            <span className="text-sm">{auth.user.empresa.razon_social}</span>
                                        </div>
                                    )}
                                    {auth.user.empresa.nit && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">NIT:</span>
                                            <span className="text-sm">{auth.user.empresa.nit}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Roles */}
                    {auth.roles && auth.roles.length > 0 && (
                        <Card className="border-purple-100 bg-purple-50 dark:border-purple-900 dark:bg-purple-950">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <span>👤</span> Roles ({auth.roles.length})
                                </CardTitle>
                                <CardDescription>Funciones asignadas en el sistema</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {auth.roles.map((role: any, idx: number) => (
                                        <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-100"
                                        >
                                            {typeof role === 'string' ? role : role.name}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Permisos */}
                    {auth.permissions && auth.permissions.length > 0 && (
                        <Card className="border-green-100 bg-green-50 dark:border-green-900 dark:bg-green-950">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <span>🔐</span> Permisos ({auth.permissions.length})
                                </CardTitle>
                                <CardDescription>Acciones que puedes realizar</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                                    {auth.permissions.map((permission: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            <span className="text-green-600 dark:text-green-400">✓</span>
                                            <span>{typeof permission === 'string' ? permission : permission.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sin información adicional */}
                    {(!auth.user.empresa && !auth.roles?.length && !auth.permissions?.length) && (
                        <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                            <CardContent className="pt-6">
                                <p className="text-center text-sm text-muted-foreground">
                                    No hay información adicional de acceso disponible
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
