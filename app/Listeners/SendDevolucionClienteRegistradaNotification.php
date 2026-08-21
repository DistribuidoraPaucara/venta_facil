<?php

namespace App\Listeners;

use App\Events\DevolucionClienteRegistrada;
use App\Services\WebSocket\DevolucionWebSocketService;
use Illuminate\Support\Facades\Log;

/**
 * Listener que envía notificaciones cuando se registra una devolución de cliente
 *
 * Se ejecuta automáticamente cuando se dispara DevolucionClienteRegistrada
 * Emite notificación vía WebSocket en tiempo real
 */
class SendDevolucionClienteRegistradaNotification
{
    protected DevolucionWebSocketService $websocketService;

    public function __construct(DevolucionWebSocketService $websocketService)
    {
        $this->websocketService = $websocketService;
    }

    /**
     * Handle the event.
     */
    public function handle(DevolucionClienteRegistrada $event): void
    {
        try {
            $devolcion = $event->devolcion;

            \Log::info('🔔🔔🔔 LISTENER DISPARADO - SendDevolucionClienteRegistradaNotification');
            \Log::info('   Devolución ID: ' . $devolcion->id);
            \Log::info('   Prestamo ID: ' . $devolcion->prestamo_cliente_id);

            // Cargar relaciones necesarias
            if (!$devolcion->relationLoaded('prestamo')) {
                $devolcion->load('prestamo.cliente');
            }
            if (!$devolcion->relationLoaded('chofer')) {
                $devolcion->load('chofer');
            }
            if (!$devolcion->relationLoaded('detalles')) {
                $devolcion->load('detalles');
            }

            \Log::info('✅ Relaciones cargadas correctamente');

            // ✅ Usar servicio especializado de devoluciones
            $result = $this->websocketService->notifyRegistered($devolcion);

            if ($result) {
                \Log::info('✅✅✅ Notificación de devolución registrada enviada exitosamente', [
                    'devolcion_id' => $devolcion->id,
                    'prestamo_id' => $devolcion->prestamo_cliente_id,
                ]);
            } else {
                \Log::warning('⚠️ La notificación WebSocket de devolución no pudo enviarse', [
                    'devolcion_id' => $devolcion->id,
                ]);
            }

        } catch (\Exception $e) {
            \Log::error('❌❌❌ Error procesando notificación de devolución registrada', [
                'devolcion_id' => $event->devolcion->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
