import React from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
    onError: (error: string) => void;
    error: string | null;
}

export default function BarcodeScannerModal({
    isOpen,
    onClose,
    onScan,
    onError,
    error
}: BarcodeScannerModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Escanear código
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-3">
                    <BarcodeScannerComponent
                        width={280}
                        height={280}
                        onUpdate={(err, result) => {
                            try {
                                if (result) {
                                    // ✅ Manejar diferentes formatos de resultado
                                    const texto = typeof result === 'string'
                                        ? result
                                        : result.getText?.()
                                        ? result.getText()
                                        : result.text
                                        ? result.text
                                        : result.toString?.()
                                        ? result.toString()
                                        : null;

                                    if (texto) {
                                        console.log('✅ Código escaneado:', texto);
                                        onScan(texto);
                                    } else {
                                        onError('No se pudo extraer el código del resultado');
                                    }
                                } else if (err) {
                                    // ✅ Solo mostrar error si no es el error típico de "sin código"
                                    if (typeof err === 'string' && err.includes('not found')) {
                                        // Ignorar el error común cuando no hay código visible
                                        return;
                                    }
                                    console.warn('⚠️ Error del scanner:', err);
                                    // No mostrar error visual para cada frame sin código
                                }
                            } catch (error) {
                                console.error('❌ Error procesando resultado del scanner:', error);
                                onError(`Error al procesar: ${error instanceof Error ? error.message : 'desconocido'}`);
                            }
                        }}
                    />
                </div>

                {error && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">⚠️ Error del scanner</p>
                        <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                            {error}
                        </p>
                        <p className="text-xs text-red-500 dark:text-red-500 mt-2">
                            💡 Verifica: permisos de cámara, iluminación, o intenta entrada manual
                        </p>
                    </div>
                )}

                <div className="flex justify-end gap-1.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-600"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
