<?php

namespace App\Services\Pago\Exceptions;

use RuntimeException;

/**
 * Se lanza cuando un webhook de la pasarela de pago no puede verificarse
 * (firma inválida, payload corrupto, referencia desconocida, etc.).
 *
 * El controller que llama a manejarWebhook() debe capturar esto y responder
 * 400/401 SIN marcar ninguna venta como pagada.
 */
class WebhookInvalidoException extends RuntimeException
{
}
