<?php

namespace App\Observers;

use App\Models\Compra;

/**
 * Observer de compras.
 *
 * La cuenta por pagar de las compras a crédito NO se maneja aquí: la crea, ajusta o quita
 * CompraController::sincronizarCuentaPorPagar() al aprobar o editar la compra (según tipo_pagos.es_credito).
 * Antes este observer intentaba crearla al pasar a un estado "RECIBIDO" que no existe; si se hubiera
 * creado ese estado, habría duplicado las cuentas del controlador.
 */
class CompraObserver
{
    public function created(Compra $compra): void
    {
        //
    }

    public function updated(Compra $compra): void
    {
        //
    }
}
