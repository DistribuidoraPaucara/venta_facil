<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('detalles_pago_venta', function (Blueprint $table) {
            // Agregar campo monto_original para guardar el monto que realmente pagó el cliente
            // Antes de cualquier escalado proporcional
            $table->decimal('monto_original', 12, 2)->nullable()->after('monto')
                ->comment('Monto original pagado antes de escalado proporcional');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detalles_pago_venta', function (Blueprint $table) {
            $table->dropColumn('monto_original');
        });
    }
};
