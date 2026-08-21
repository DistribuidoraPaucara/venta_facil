<?php

namespace App\Services\WebSocket;

/**
 * Servicio especializado para notificaciones WebSocket de devoluciones
 *
 * Maneja notificaciones en tiempo real para devoluciones de préstamos
 */
class DevolucionWebSocketService extends BaseWebSocketService
{
    /**
     * Notificar registro de devolución de cliente
     * Notifica a:
     * - Chofer que registró
     * - Admins, managers, cajeros
     */
    public function notifyRegistered($devolcion): bool
    {
        $eventData = [
            'id' => $devolcion->id,
            'devolucion_id' => $devolcion->id,
            'prestamo_id' => $devolcion->prestamo_cliente_id,
            'prestamo_numero' => $devolcion->prestamo?->numero ?? 'N/A',
            'cliente' => [
                'id' => $devolcion->prestamo?->cliente_id,
                'nombre' => $devolcion->prestamo?->cliente?->nombre ?? 'Cliente',
            ],
            'chofer' => [
                'id' => $devolcion->chofer_id,
                'nombre' => $devolcion->chofer?->name ?? 'N/A',
            ],
            'total_devuelto' => $devolcion->detalles()->sum('cantidad_devuelta') ?? 0,
            'total_dañado' => $devolcion->detalles()->sum('cantidad_dañada_total') ?? 0,
            'fecha_devolucion' => $devolcion->fecha_devolucion?->toIso8601String(),
            'observaciones' => $devolcion->observaciones,
            'monto_garantia' => (float) ($devolcion->monto_garantia_devuelta_total ?? 0),
            'estado' => $devolcion->estado,
        ];

        // 🎯 Recopilar usuarios y roles a notificar
        $userIds = [];
        $roles = ['admin', 'manager', 'cajero'];

        // 👤 Agregar chofer que registró la devolución
        if ($devolcion->chofer_id) {
            $userIds[] = $devolcion->chofer_id;
        }

        // 👤 Agregar usuario que creó la devolución
        if ($devolcion->created_by) {
            $userIds[] = $devolcion->created_by;
        }

        // ✅ Enviar a múltiples canales
        return $this->notifyMultiChannel('devolucion:registrada', $eventData, array_unique($userIds), $roles);
    }
}
