<?php

namespace App\Services\Pago\DTOs;

use DateTimeInterface;

/**
 * Resultado de crear un QR de cobro para una venta.
 * Común a cualquier pasarela (mock, BNB, BCP, agregador, etc.).
 */
final readonly class PaymentQrResult
{
    public function __construct(
        public string $referencia,
        public string $qrDataUri,
        public float $monto,
        public string $moneda,
        public ?DateTimeInterface $expiraEn = null,
    ) {
    }
}
