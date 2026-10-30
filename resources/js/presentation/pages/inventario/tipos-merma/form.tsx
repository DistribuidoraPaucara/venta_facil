// Pages: Tipos de Merma form page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericFormContainer from '@/presentation/components/generic/generic-form-container';
import { tiposMermaConfig } from '@/config/modules/tiposMerma.config';
import tipoMermaService from '@/infrastructure/services/tipoMerma.service';
import type { TipoMerma, TipoMermaFormData } from '@/domain/entities/tipo-merma';

interface TipoMermaFormProps {
  tipoMerma?: TipoMerma | null;
}

const initialTipoMermaData: TipoMermaFormData = {
  clave: '',
  label: '',
  descripcion: '',
  color: 'gray',
  requiere_aprobacion: false,
  activo: true,
};

export default function TipoMermaForm({ tipoMerma }: TipoMermaFormProps) {
  const isEditing = !!tipoMerma;

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: '/dashboard' },
      { title: 'Inventario', href: '/inventario/dashboard' },
      { title: 'Tipos de Merma', href: tipoMermaService.indexUrl() },
      { title: isEditing ? 'Editar' : 'Nuevo', href: '#' }
    ]}>
      <GenericFormContainer<TipoMerma, TipoMermaFormData>
        entity={tipoMerma}
        config={tiposMermaConfig}
        service={tipoMermaService}
        initialData={initialTipoMermaData}
      />
    </AppLayout>
  );
}
