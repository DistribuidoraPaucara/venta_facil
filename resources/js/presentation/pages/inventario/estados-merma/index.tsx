// Pages: Estados de Merma index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/presentation/components/generic/generic-container';
import { estadosMermaConfig } from '@/config/modules/estadosMerma.config';
import estadoMermaService from '@/infrastructure/services/estadoMerma.service';
import type { Pagination } from '@/domain/entities/shared';
import type { EstadoMerma, EstadoMermaFormData } from '@/domain/entities/estado-merma';

interface EstadoMermaIndexProps {
  estadosMerma: Pagination<EstadoMerma>;
  filters: { q?: string };
}

export default function EstadoMermaIndex({ estadosMerma, filters }: EstadoMermaIndexProps) {
  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: '/dashboard' },
      { title: 'Inventario', href: '/inventario/dashboard' },
      { title: 'Estados de Merma', href: estadoMermaService.indexUrl() }
    ]}>
      <GenericContainer<EstadoMerma, EstadoMermaFormData>
        entities={estadosMerma}
        filters={filters}
        config={estadosMermaConfig}
        service={estadoMermaService}
      />
    </AppLayout>
  );
}
