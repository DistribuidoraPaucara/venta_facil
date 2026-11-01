<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Venta por almacén por línea (ej. productos fríos en un almacén "REFRIGERADOR"):
 * - almacenes.permite_venta: almacenes que aparecen en la pantalla de ventas.
 * - tipos_precio.almacen_id: almacén del que descuenta un tipo de precio (ej. FRIO → REFRIGERADOR); null = almacén de la empresa.
 * - detalle_ventas.almacen_id: almacén elegido en cada línea de venta.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('almacenes', function (Blueprint $table) {
            $table->boolean('permite_venta')->default(false)->after('activo');
        });

        Schema::table('tipos_precio', function (Blueprint $table) {
            $table->foreignId('almacen_id')->nullable()->after('empresa_id')->constrained('almacenes')->nullOnDelete();
        });

        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->foreignId('almacen_id')->nullable()->after('tipo_precio_nombre')->constrained('almacenes')->nullOnDelete();
        });

        // El almacén de venta actual de cada empresa sigue siendo de venta
        DB::table('almacenes')
            ->whereIn('id', DB::table('empresas')->whereNotNull('almacen_id')->pluck('almacen_id'))
            ->update(['permite_venta' => true]);
    }

    public function down(): void
    {
        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('almacen_id');
        });

        Schema::table('tipos_precio', function (Blueprint $table) {
            $table->dropConstrainedForeignId('almacen_id');
        });

        Schema::table('almacenes', function (Blueprint $table) {
            $table->dropColumn('permite_venta');
        });
    }
};
