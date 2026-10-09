import { formatCurrencyMinimalDecimals } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface QrCobroData {
    referencia: string;
    qr_data_uri: string;
    monto: number;
    moneda: string;
    expira_en: string | null;
}

interface QrCobroModalProps {
    isOpen: boolean;
    onClose: () => void;
    monto: number;
    monedaId: number;
}

/**
 * Muestra un QR de cobro para que el cliente escanee y transfiera.
 *
 * ⚠️ Es solo una ayuda visual: NO confirma el pago automáticamente.
 * El cajero sigue verificando a simple vista que el dinero llegó y
 * completa el monto/guardado de la venta como hace hoy.
 */
export default function QrCobroModal({ isOpen, onClose, monto, monedaId }: QrCobroModalProps) {
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [qr, setQr] = useState<QrCobroData | null>(null);

    const generarQr = async () => {
        setCargando(true);
        setError(null);
        setQr(null);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/ventas/qr/generar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ monto, moneda_id: monedaId }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                setError(result.message || 'No se pudo generar el QR de cobro');
                return;
            }

            setQr(result.data);
        } catch (err) {
            console.error('❌ [QrCobroModal] Error generando QR:', err);
            setError('Error de conexión al generar el QR');
        } finally {
            setCargando(false);
        }
    };

    // Generar el QR cada vez que se abre el modal
    useEffect(() => {
        if (isOpen) {
            generarQr();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60">
            <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-800">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📱 QR para transferencia</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                {cargando && (
                    <div className="flex flex-col items-center gap-3 py-8 text-gray-600 dark:text-gray-300">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        <span className="text-sm">Generando QR...</span>
                    </div>
                )}

                {!cargando && error && (
                    <div className="space-y-3 py-4">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        <button
                            onClick={generarQr}
                            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {!cargando && !error && qr && (
                    <div className="space-y-4">
                        <div className="flex justify-center rounded-lg bg-white p-3">
                            <img src={qr.qr_data_uri} alt="QR de cobro" className="h-56 w-56" />
                        </div>

                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrencyMinimalDecimals(qr.monto)} {qr.moneda}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Ref: {qr.referencia}</p>
                        </div>

                        <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                            ⚠️ Este QR es una ayuda visual para el cliente. Verificá que la transferencia llegó antes de
                            registrar el pago y guardar la venta.
                        </p>

                        <button
                            onClick={onClose}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-zinc-600 dark:text-gray-300 dark:hover:bg-zinc-700"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
