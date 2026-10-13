<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Permite transferir productos fraccionados (ej. 2.5 kg): las cantidades eran integer.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('detalle_transferencia_inventarios', function (Blueprint $table) {
            $table->decimal('cantidad', 15, 4)->change();
            $table->decimal('cantidad_recibida', 15, 4)->default(0)->change();
        });

        Schema::table('transferencia_inventarios', function (Blueprint $table) {
            $table->decimal('total_cantidad', 15, 4)->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('detalle_transferencia_inventarios', function (Blueprint $table) {
            $table->integer('cantidad')->change();
            $table->integer('cantidad_recibida')->default(0)->change();
        });

        Schema::table('transferencia_inventarios', function (Blueprint $table) {
            $table->integer('total_cantidad')->default(0)->change();
        });
    }
};
