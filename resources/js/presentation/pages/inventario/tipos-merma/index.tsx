// Pages: Tipos de Merma index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/presentation/components/generic/generic-container';
import { tiposMermaConfig } from '@/config/modules/tiposMerma.config';
import tipoMermaService from '@/infrastructure/services/tipoMerma.service';
import type { Pagination } from '@/domain/entities/shared';
import type { TipoMerma, TipoMermaFormData } from '@/domain/entities/tipo-merma';

interface TipoMermaIndexProps {
  tiposMerma: Pagination<TipoMerma>;
  filters: { q?: string };
}

export default function TipoMermaIndex({ tiposMerma, filters }: TipoMermaIndexProps) {
  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: '/dashboard' },
      { title: 'Inventario', href: '/inventario/dashboard' },
      { title: 'Tipos de Merma', href: tipoMermaService.indexUrl() }
    ]}>
      <GenericContainer<TipoMerma, TipoMermaFormData>
        entities={tiposMerma}
        filters={filters}
        config={tiposMermaConfig}
        service={tipoMermaService}
      />
    </AppLayout>
  );
}
