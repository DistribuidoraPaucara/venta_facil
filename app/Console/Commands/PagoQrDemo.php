<?php

namespace App\Console\Commands;

use App\Models\Venta;
use App\Services\Pago\Contracts\PaymentGatewayInterface;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

/**
 * Prueba de humo del scaffold de pago por QR (MockPaymentGateway por defecto).
 *
 * No depende de ningún banco: genera un QR de cobro para una venta,
 * simula la llegada del webhook de confirmación y verifica que el
 * estado quede en PAGADO. Sirve para validar el flujo completo mientras
 * no haya credenciales reales de BNB/BCP.
 *
 * Uso: php artisan pago:demo-qr {venta_id}
 */
class PagoQrDemo extends Command
{
    protected $signature = 'pago:demo-qr {venta_id : ID de una venta existente}';
    protected $description = 'Prueba de humo del flujo de cobro por QR (crear QR → webhook → confirmar pagado)';

    public function handle(PaymentGatewayInterface $gateway): int
    {
        $venta = Venta::find($this->argument('venta_id'));

        if (! $venta) {
            $this->error("No existe la venta #{$this->argument('venta_id')}");
            return self::FAILURE;
        }

        $this->info("🧾 Venta #{$venta->numero} — total: {$venta->total}");

        // 1) Generar QR de cobro
        $qr = $gateway->crearQr($venta);
        $this->line("📱 QR generado — referencia: {$qr->referencia} | monto: {$qr->monto} {$qr->moneda} | expira: {$qr->expiraEn}");

        $estadoInicial = $gateway->consultarEstado($qr->referencia);
        $this->line("🔍 Estado antes de pagar: {$estadoInicial->label()}");

        // 2) Simular el webhook que enviaría el banco/pasarela al confirmar el pago
        $webhookFalso = Request::create('/fake-webhook', 'POST', [
            'referencia' => $qr->referencia,
            'estado'     => 'pagado',
        ]);

        $resultado = $gateway->manejarWebhook($webhookFalso);
        $this->info("✅ Webhook procesado — estado: {$resultado->estado->label()} | monto confirmado: {$resultado->monto}");

        // 3) Confirmar que el estado quedó persistido
        $estadoFinal = $gateway->consultarEstado($qr->referencia);
        $this->line("🔍 Estado final: {$estadoFinal->label()}");

        if (! $estadoFinal->isFinal() || $estadoFinal->value !== 'pagado') {
            $this->error('❌ El flujo no terminó en PAGADO, revisar el gateway.');
            return self::FAILURE;
        }

        $this->info('🎉 Flujo de QR de cobro OK de punta a punta (con gateway mock).');
        return self::SUCCESS;
    }
}
