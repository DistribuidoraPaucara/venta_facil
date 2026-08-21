<?php

namespace App\Events;

use App\Models\DevolucionCliente;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DevolucionClienteRegistrada
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public DevolucionCliente $devolcion;

    /**
     * Create a new event instance.
     */
    public function __construct(DevolucionCliente $devolcion)
    {
        $this->devolcion = $devolcion;
    }
}
