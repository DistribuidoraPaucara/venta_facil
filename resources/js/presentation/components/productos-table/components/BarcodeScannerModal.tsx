import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

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
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanningRef = useRef(false);

    useEffect(() => {
        if (!isOpen || !videoRef.current) return;

        let animationFrameId: number;
        let initTimeout: NodeJS.Timeout;

        const startScanning = async () => {
            try {
                setIsScanning(true);

                // ✅ Inicializar el reader si no existe
                if (!readerRef.current) {
                    readerRef.current = new BrowserMultiFormatReader();
                }

                // ✅ Acceder a la cámara
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                    audio: false
                });

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await new Promise((resolve) => {
                        if (videoRef.current) {
                            videoRef.current.onloadedmetadata = resolve;
                        }
                    });
                }

                scanningRef.current = true;

                // ✅ Loop de escaneo continuo
                const scanFrame = async () => {
                    if (!scanningRef.current || !videoRef.current || !readerRef.current) return;

                    try {
                        const result = await readerRef.current.decodeFromVideoElement(videoRef.current);
                        if (result) {
                            console.log('✅ Código detectado:', result.getText());
                            onScan(result.getText());
                            return; // Detener el loop una vez que se escanea
                        }
                    } catch (err) {
                        // ✅ NotFoundException es normal cuando no hay código - ignorar
                        if (!(err instanceof NotFoundException)) {
                            console.warn('⚠️ Error escaneando:', err);
                        }
                    }

                    // ✅ Continuar intentando cada 100ms
                    animationFrameId = requestAnimationFrame(scanFrame);
                };

                scanFrame();
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                console.error('❌ Error iniciando scanner:', err);

                // ✅ Mensajes de error más específicos
                if (errorMsg.includes('Permission denied')) {
                    onError('Permiso de cámara denegado. Verifica los permisos del navegador.');
                } else if (errorMsg.includes('NotFoundError')) {
                    onError('No se encontró ninguna cámara en tu dispositivo.');
                } else if (errorMsg.includes('NotAllowedError')) {
                    onError('Debes permitir acceso a la cámara para usar el scanner.');
                } else {
                    onError(`Error: ${errorMsg}`);
                }

                setIsScanning(false);
            }
        };

        // ✅ Esperar un poco para que el modal se renderice primero
        initTimeout = setTimeout(startScanning, 300);

        return () => {
            clearTimeout(initTimeout);
            scanningRef.current = false;

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            // ✅ Detener stream de video
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => {
                    track.stop();
                });
                streamRef.current = null;
            }

            setIsScanning(false);
        };
    }, [isOpen, onScan, onError]);

    const handleManualSubmit = () => {
        if (manualInput.trim()) {
            console.log('✅ Código ingresado manualmente:', manualInput);
            onScan(manualInput.trim());
            setManualInput('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Escanear código de barras/QR
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

                {/* Video feed */}
                <div className="mb-3 bg-black rounded-md overflow-hidden relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 object-cover"
                        style={{ aspectRatio: '1/1' }}
                    />
                    {isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-48 h-48 border-2 border-green-500 rounded-lg opacity-50"></div>
                        </div>
                    )}
                </div>

                {/* Status */}
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        {isScanning ? '🔍 Apunta a un código de barras o QR...' : '⏳ Iniciando cámara...'}
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">⚠️ Error</p>
                        <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
                    </div>
                )}

                {/* Manual input */}
                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        O ingresa manualmente:
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleManualSubmit();
                                }
                            }}
                            placeholder="Código de barras..."
                            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={handleManualSubmit}
                            disabled={!manualInput.trim()}
                            className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Agregar
                        </button>
                    </div>
                </div>

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
