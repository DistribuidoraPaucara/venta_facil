<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Services\Pago\Contracts\PaymentGatewayInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Genera QRs de cobro para mostrarle al cliente durante el checkout.
 *
 * ⚠️ Ayuda visual, no confirmación automática: el cajero sigue verificando
 * a simple vista que el cliente pagó y registra el monto como hoy. Cuando
 * haya integración real (BNB) con webhook, este es el punto donde se
 * conectaría la confirmación automática — ver App\Services\Pago.
 */
class PagoQrController extends Controller
{
    public function generar(Request $request, PaymentGatewayInterface $gateway): JsonResponse
    {
        $validado = $request->validate([
            'monto'     => ['required', 'numeric', 'min:0.01'],
            'moneda_id' => ['nullable', 'integer', 'exists:monedas,id'],
        ]);

        try {
            // No se persiste: el QR es previo a guardar la venta, solo necesitamos
            // el monto/moneda para que el gateway arme el cobro.
            $venta = new Venta([
                'total'     => $validado['monto'],
                'moneda_id' => $validado['moneda_id'] ?? 1,
            ]);

            $qr = $gateway->crearQr($venta);

            return response()->json([
                'success' => true,
                'data'    => [
                    'referencia'  => $qr->referencia,
                    'qr_data_uri' => $qr->qrDataUri,
                    'monto'       => $qr->monto,
                    'moneda'      => $qr->moneda,
                    'expira_en'   => $qr->expiraEn?->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            \Log::error('❌ [PagoQrController] Error generando QR de cobro', [
                'mensaje' => $e->getMessage(),
                'monto'   => $validado['monto'] ?? null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'No se pudo generar el QR de cobro',
            ], 500);
        }
    }
}
