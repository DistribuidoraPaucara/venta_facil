import { router } from '@inertiajs/react';
import { toast } from 'react-toastify';

/**
 * Duplica una compra como una nueva en BORRADOR (mismos productos, cantidades y precios; sin lote,
 * vencimiento ni factura) y abre su edición. El aviso de éxito lo muestra compras/edit desde el flash.
 */
export function duplicarCompra(compraId: number | string, alTerminar?: () => void) {
    router.post(
        `/compras/${compraId}/duplicar`,
        {},
        {
            onError: (errores) => {
                toast.error(Object.values(errores).join(' ') || 'No se pudo duplicar la compra');
            },
            onFinish: () => alTerminar?.(),
        },
    );
}
