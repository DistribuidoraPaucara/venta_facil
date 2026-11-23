<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Elimina el paso de verificación: los cierres que quedaron en PENDIENTE
 * pasan a CONSOLIDADA. Los cierres nuevos ya se crean como CONSOLIDADA
 * (CajaController::cerrarCaja y cajas:cerrar-antigua).
 *
 * - Solo cambia estado_cierre_id; no modifica montos, diferencias ni movimientos.
 * - Usa los códigos de estados_cierre, no IDs fijos, para funcionar en cualquier entorno.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('estados_cierre') || ! Schema::hasTable('cierres_caja')) {
            return;
        }

        $pendiente = DB::table('estados_cierre')->where('codigo', 'PENDIENTE')->value('id');
        $consolidada = DB::table('estados_cierre')->where('codigo', 'CONSOLIDADA')->value('id');

        if (! $pendiente || ! $consolidada) {
            return;
        }

        DB::table('cierres_caja')
            ->where('estado_cierre_id', $pendiente)
            ->update(['estado_cierre_id' => $consolidada]);
    }

    public function down(): void
    {
        // No se revierte: no se puede saber qué cierres estaban en PENDIENTE antes de la migración.
    }
};
