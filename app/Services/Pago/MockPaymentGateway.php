<?php

namespace App\Services\Pago;

use App\Enums\PaymentEstado;
use App\Models\Venta;
use App\Services\Pago\Contracts\PaymentGatewayInterface;
use App\Services\Pago\DTOs\PaymentQrResult;
use App\Services\Pago\DTOs\PaymentWebhookResult;
use App\Services\Pago\Exceptions\WebhookInvalidoException;
use App\Services\QrCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Pasarela de pago "falsa" para desarrollo y pruebas, mientras no haya
 * credenciales/API real del banco (BNB, BCP, etc.).
 *
 * Permite construir y probar todo el flujo (mostrar QR, esperar
 * confirmación, marcar venta pagada) sin depender de ningún tercero.
 * El estado del cobro se guarda en Cache (no en base de datos) porque
 * es un dato transitorio de desarrollo, no un registro real de pago.
 *
 * Para pasar a producción: crear App\Services\Pago\BnbPaymentGateway
 * (misma interfaz) e intercambiar el binding en AppServiceProvider.
 */
class MockPaymentGateway implements PaymentGatewayInterface
{
    private const TTL_MINUTOS = 30;

    public function crearQr(Venta $venta): PaymentQrResult
    {
        $referencia = 'MOCK-' . Str::upper(Str::random(10));
        $monto      = (float) $venta->total;
        $moneda     = $venta->moneda?->codigo ?? 'BOB';
        $expiraEn   = now()->addMinutes(self::TTL_MINUTOS);

        Cache::put(
            $this->cacheKey($referencia),
            [
                'estado'   => PaymentEstado::PENDIENTE->value,
                'venta_id' => $venta->id,
                'monto'    => $monto,
                'moneda'   => $moneda,
            ],
            $expiraEn
        );

        // Payload simulado: en un proveedor real esto sería la cadena EMV
        // que devuelve su API, no algo que uno arma a mano.
        $payload = "MOCK-QR|{$referencia}|{$monto}|{$moneda}";
        $qrDataUri = QrCodeService::generateDataUri($payload, scale: 4)
            ?? throw new \RuntimeException('No se pudo generar el QR de prueba');

        return new PaymentQrResult(
            referencia: $referencia,
            qrDataUri: $qrDataUri,
            monto: $monto,
            moneda: $moneda,
            expiraEn: $expiraEn,
        );
    }

    public function consultarEstado(string $referencia): PaymentEstado
    {
        $data = Cache::get($this->cacheKey($referencia));

        if ($data === null) {
            return PaymentEstado::EXPIRADO;
        }

        return PaymentEstado::from($data['estado']);
    }

    public function manejarWebhook(Request $request): PaymentWebhookResult
    {
        $referencia = (string) $request->input('referencia');
        $estadoRaw  = (string) $request->input('estado');

        $data = $referencia !== '' ? Cache::get($this->cacheKey($referencia)) : null;

        if ($data === null) {
            throw new WebhookInvalidoException("Referencia de pago desconocida o expirada: {$referencia}");
        }

        $estado = PaymentEstado::tryFrom($estadoRaw);

        if ($estado === null) {
            throw new WebhookInvalidoException("Estado de pago inválido en webhook: {$estadoRaw}");
        }

        $data['estado'] = $estado->value;
        Cache::put($this->cacheKey($referencia), $data, now()->addMinutes(self::TTL_MINUTOS));

        return new PaymentWebhookResult(
            referencia: $referencia,
            estado: $estado,
            monto: (float) $data['monto'],
        );
    }

    private function cacheKey(string $referencia): string
    {
        return "pago_mock:{$referencia}";
    }
}
