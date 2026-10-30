// Pages: Estados de Merma form page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericFormContainer from '@/presentation/components/generic/generic-form-container';
import { estadosMermaConfig } from '@/config/modules/estadosMerma.config';
import estadoMermaService from '@/infrastructure/services/estadoMerma.service';
import type { EstadoMerma, EstadoMermaFormData } from '@/domain/entities/estado-merma';

interface EstadoMermaFormProps {
  estadoMerma?: EstadoMerma | null;
}

const initialEstadoMermaData: EstadoMermaFormData = {
  clave: '',
  label: '',
  color: 'gray',
  activo: true,
};

export default function EstadoMermaForm({ estadoMerma }: EstadoMermaFormProps) {
  const isEditing = !!estadoMerma;

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: '/dashboard' },
      { title: 'Inventario', href: '/inventario/dashboard' },
      { title: 'Estados de Merma', href: estadoMermaService.indexUrl() },
      { title: isEditing ? 'Editar' : 'Nuevo', href: '#' }
    ]}>
      <GenericFormContainer<EstadoMerma, EstadoMermaFormData>
        entity={estadoMerma}
        config={estadosMermaConfig}
        service={estadoMermaService}
        initialData={initialEstadoMermaData}
      />
    </AppLayout>
  );
}
