<?php

namespace App\Enums;

/**
 * PaymentEstado - Estados de un pago iniciado por QR (transferencia/pasarela)
 *
 * Única fuente de verdad para el estado de un cobro por QR, independiente
 * de la pasarela que lo procese (mock, BNB, BCP, agregador, etc.).
 *
 * FLUJO DE ESTADOS:
 * PENDIENTE → PAGADO
 *         ↘ EXPIRADO / FALLIDO
 */
enum PaymentEstado: string
{
    case PENDIENTE = 'pendiente';
    case PAGADO = 'pagado';
    case EXPIRADO = 'expirado';
    case FALLIDO = 'fallido';

    /**
     * Obtener etiqueta legible para el usuario
     */
    public function label(): string
    {
        return match ($this) {
            self::PENDIENTE => 'Pendiente de pago',
            self::PAGADO => 'Pagado',
            self::EXPIRADO => 'QR expirado',
            self::FALLIDO => 'Pago fallido',
        };
    }

    /**
     * Obtener color para UI
     */
    public function color(): string
    {
        return match ($this) {
            self::PENDIENTE => '#FFC107', // Amarillo
            self::PAGADO => '#28A745',    // Verde
            self::EXPIRADO => '#6C757D',  // Gris
            self::FALLIDO => '#DC3545',   // Rojo
        };
    }

    /**
     * Verificar si es un estado final (ya no puede cambiar)
     */
    public function isFinal(): bool
    {
        return in_array($this, [self::PAGADO, self::EXPIRADO, self::FALLIDO]);
    }
}
