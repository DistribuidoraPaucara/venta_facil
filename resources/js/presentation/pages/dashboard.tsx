/**
 * Dashboard
 * Reutiliza el dashboard administrativo apuntando a /dashboard
 */

import { type BreadcrumbItem } from '@/types';
import { type ComponentProps } from 'react';
import AdminDashboard from '@/presentation/pages/admin/dashboard';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

type DashboardProps = ComponentProps<typeof AdminDashboard>;

export default function Dashboard({
    titulo = 'Dashboard',
    descripcion = 'Resumen general de tu empresa',
    ...props
}: DashboardProps) {
    return (
        <AdminDashboard
            {...props}
            titulo={titulo}
            descripcion={descripcion}
            ruta="/dashboard"
            breadcrumbs={breadcrumbs}
        />
    );
}
