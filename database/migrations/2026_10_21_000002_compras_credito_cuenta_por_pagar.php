<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Compras a crédito → cuenta por pagar.
 *
 * - tipos_pago CREDITO tenía es_credito = false: CompraController decide por ese campo si crea la cuenta
 *   por pagar, así que nunca se creaba.
 * - compras.fecha_vencimiento_credito: vencimiento elegido al registrar la compra a crédito. Se guarda en la
 *   compra porque en BORRADOR todavía no existe la cuenta (se crea al aprobar).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('tipos_pago')->where('codigo', 'CREDITO')->update(['es_credito' => true]);

        Schema::table('compras', function (Blueprint $table) {
            $table->date('fecha_vencimiento_credito')->nullable()->after('tipo_pago_id');
        });
    }

    public function down(): void
    {
        Schema::table('compras', function (Blueprint $table) {
            $table->dropColumn('fecha_vencimiento_credito');
        });

        DB::table('tipos_pago')->where('codigo', 'CREDITO')->update(['es_credito' => false]);
    }
};
