import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import HeadingSmall from '@/presentation/components/heading-small';
import InputError from '@/presentation/components/input-error';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Textarea } from '@/presentation/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { useState } from 'react';

interface EmpresaData {
    id: number;
    nombre_comercial: string;
    razon_social: string;
    nit: string;
    telefono?: string;
    email?: string;
    sitio_web?: string;
    direccion?: string;
    ciudad?: string;
    pais?: string;
    logo_principal?: string;
    mensaje_footer?: string;
    mensaje_legal?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configuración de empresa',
        href: '/settings/empresa',
    },
];

export default function EmpresaSettings({ empresa }: { empresa: EmpresaData }) {
    const { auth } = usePage<SharedData>().props;
    const [logoPreview, setLogoPreview] = useState<string | null>(empresa?.logo_principal || null);

    // Verificar permisos: solo admin o manager de la empresa
    const canEditEmpresa = auth.permissions?.includes('empresas.editar') ||
                          auth.roles?.includes('admin') ||
                          auth.roles?.includes('manager');

    if (!canEditEmpresa) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Configuración de empresa" />
                <SettingsLayout>
                    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                        <CardContent className="pt-6">
                            <p className="text-center text-sm text-red-700 dark:text-red-200">
                                No tienes permisos para editar la información de la empresa.
                            </p>
                        </CardContent>
                    </Card>
                </SettingsLayout>
            </AppLayout>
        );
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de empresa" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Información de empresa"
                        description="Edite los datos de su empresa. Solo administradores y managers pueden realizar cambios."
                    />

                    <Form
                        method="PATCH"
                        action={`/empresas/${empresa.id}`}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                        encType="multipart/form-data"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                {/* Logo */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Logo de la empresa</CardTitle>
                                        <CardDescription>Imagen principal que representa su empresa</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {logoPreview && (
                                            <div className="relative h-40 w-40 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                    className="h-full w-full object-contain p-2"
                                                />
                                            </div>
                                        )}
                                        <div className="grid gap-2">
                                            <Label htmlFor="logo_principal">Logo principal</Label>
                                            <Input
                                                id="logo_principal"
                                                type="file"
                                                name="logo_principal"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                            />
                                            <InputError message={errors.logo_principal} className="mt-2" />
                                            <p className="text-xs text-muted-foreground">
                                                Formatos soportados: JPEG, PNG, JPG, GIF. Máximo 4MB
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Datos básicos */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Datos básicos</CardTitle>
                                        <CardDescription>Información general de la empresa</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Nombre Comercial */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="nombre_comercial">Nombre comercial *</Label>
                                            <Input
                                                id="nombre_comercial"
                                                className="mt-1 block w-full"
                                                defaultValue={empresa.nombre_comercial}
                                                name="nombre_comercial"
                                                required
                                                placeholder="Nombre comercial"
                                            />
                                            <InputError message={errors.nombre_comercial} className="mt-2" />
                                        </div>

                                        {/* Razón Social */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="razon_social">Razón social *</Label>
                                            <Input
                                                id="razon_social"
                                                className="mt-1 block w-full"
                                                defaultValue={empresa.razon_social}
                                                name="razon_social"
                                                required
                                                placeholder="Razón social"
                                            />
                                            <InputError message={errors.razon_social} className="mt-2" />
                                        </div>

                                        {/* NIT */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="nit">NIT</Label>
                                            <Input
                                                id="nit"
                                                className="mt-1 block w-full"
                                                defaultValue={empresa.nit || ''}
                                                name="nit"
                                                placeholder="NIT"
                                            />
                                            <InputError message={errors.nit} className="mt-2" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Contacto */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Información de contacto</CardTitle>
                                        <CardDescription>Datos para contactarse con la empresa</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Teléfono */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="telefono">Teléfono</Label>
                                            <Input
                                                id="telefono"
                                                className="mt-1 block w-full"
                                                defaultValue={empresa.telefono || ''}
                                                name="telefono"
                                                placeholder="Teléfono"
                                            />
                                            <InputError message={errors.telefono} className="mt-2" />
                                        </div>

                                        {/* Email */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                className="mt-1 block w-full"
                                                defaultValue={empresa.email || ''}
                                                name="email"
                                                placeholder="Email"
                                            />
                                            <InputError message={errors.email} className="mt-2" />
                                        </div>

                                        {/* Sitio web */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="sitio_web">Sitio web</Label>
                                            <Input
                                                id="sitio_web"
                                                type="url"
                                                className="mt-1 block w-full"
                                                defaultValue={empresa.sitio_web || ''}
                                                name="sitio_web"
                                                placeholder="https://..."
                                            />
                                            <InputError message={errors.sitio_web} className="mt-2" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Ubicación */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Ubicación</CardTitle>
                                        <CardDescription>Dirección de la empresa</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Dirección */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="direccion">Dirección</Label>
                                            <Input
                                                id="direccion"
                                                className="mt-1 block w-full"
                                                defaultValue={empresa.direccion || ''}
                                                name="direccion"
                                                placeholder="Dirección"
                                            />
                                            <InputError message={errors.direccion} className="mt-2" />
                                        </div>

                                        {/* Ciudad */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="ciudad">Ciudad</Label>
                                            <Input
                                                id="ciudad"
                                                className="mt-1 block w-full"
                                                defaultValue={empresa.ciudad || ''}
                                                name="ciudad"
                                                placeholder="Ciudad"
                                            />
                                            <InputError message={errors.ciudad} className="mt-2" />
                                        </div>

                                        {/* País */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="pais">País</Label>
                                            <Input
                                                id="pais"
                                                className="mt-1 block w-full"
                                                defaultValue={empresa.pais || ''}
                                                name="pais"
                                                placeholder="País"
                                            />
                                            <InputError message={errors.pais} className="mt-2" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Mensajes */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Mensajes personalizados</CardTitle>
                                        <CardDescription>Textos que aparecen en documentos</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Mensaje footer */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="mensaje_footer">Mensaje de pie de página</Label>
                                            <Textarea
                                                id="mensaje_footer"
                                                className="mt-1 block w-full"
                                                defaultValue={empresa.mensaje_footer || ''}
                                                name="mensaje_footer"
                                                placeholder="Mensaje que aparecerá en el pie de página"
                                                rows={3}
                                            />
                                            <InputError message={errors.mensaje_footer} className="mt-2" />
                                        </div>

                                        {/* Mensaje legal */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="mensaje_legal">Mensaje legal</Label>
                                            <Textarea
                                                id="mensaje_legal"
                                                className="mt-1 block w-full"
                                                defaultValue={empresa.mensaje_legal || ''}
                                                name="mensaje_legal"
                                                placeholder="Avisos legales y condiciones"
                                                rows={4}
                                            />
                                            <InputError message={errors.mensaje_legal} className="mt-2" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Botones de acción */}
                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Guardar cambios</Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            ✓ Cambios guardados
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
