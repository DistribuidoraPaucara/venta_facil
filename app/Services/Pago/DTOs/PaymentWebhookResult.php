<?php

namespace App\Services\Pago\DTOs;

use App\Enums\PaymentEstado;

/**
 * Resultado de procesar (ya verificado) un webhook de la pasarela de pago.
 * El caller (controller) es quien decide qué hacer con esto: marcar la
 * venta como pagada, registrar el pago, notificar, etc.
 */
final readonly class PaymentWebhookResult
{
    public function __construct(
        public string $referencia,
        public PaymentEstado $estado,
        public float $monto,
    ) {
    }
}
