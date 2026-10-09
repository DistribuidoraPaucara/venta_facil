<?php

namespace App\Services\Pago\Contracts;

use App\Enums\PaymentEstado;
use App\Models\Venta;
use App\Services\Pago\DTOs\PaymentQrResult;
use App\Services\Pago\DTOs\PaymentWebhookResult;
use App\Services\Pago\Exceptions\WebhookInvalidoException;
use Illuminate\Http\Request;

/**
 * Contrato que debe cumplir cualquier pasarela de cobro por QR
 * (mock para desarrollo, BNB, BCP, un agregador como PagoFácil, etc.).
 *
 * El resto de la app (controllers, jobs) programa contra esta interfaz,
 * nunca contra una pasarela concreta, para poder cambiar de proveedor
 * sin tocar el resto del sistema.
 */
interface PaymentGatewayInterface
{
    /**
     * Generar un QR de cobro dinámico (monto + referencia) para una venta.
     */
    public function crearQr(Venta $venta): PaymentQrResult;

    /**
     * Consultar el estado actual de un cobro por su referencia.
     * Útil como respaldo si el webhook no llega (polling).
     */
    public function consultarEstado(string $referencia): PaymentEstado;

    /**
     * Procesar y VERIFICAR un webhook entrante de la pasarela.
     *
     * Implementaciones reales deben validar la firma/autenticidad del
     * request aquí antes de devolver un resultado; si no es válido deben
     * lanzar WebhookInvalidoException en lugar de devolver un resultado.
     *
     * @throws WebhookInvalidoException
     */
    public function manejarWebhook(Request $request): PaymentWebhookResult;
}
