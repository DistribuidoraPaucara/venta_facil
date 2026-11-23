<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Servicio de transferencias bancarias:
     * - productos.es_servicio: el producto no maneja stock (la comisión se cobra a mano).
     * - ventas.transferencia_monto / transferencia_tipo: monto que pasa por caja en efectivo, fuera del total.
     *     ENTRADA = la caja recibe efectivo (+monto)
     *     SALIDA  = la caja entrega efectivo (-monto)
     */
    public function up(): void
    {
        if (! Schema::hasColumn('productos', 'es_servicio')) {
            Schema::table('productos', function (Blueprint $table) {
                $table->boolean('es_servicio')->default(false)->after('es_combo');
            });
        }

        if (! Schema::hasColumn('ventas', 'transferencia_monto')) {
            Schema::table('ventas', function (Blueprint $table) {
                $table->decimal('transferencia_monto', 12, 2)->nullable()->after('total');
                $table->string('transferencia_tipo', 10)->nullable()->after('transferencia_monto');
            });
        }

        $tipos = [
            ['codigo' => 'TRANSFERENCIA_ENTRADA', 'nombre' => 'Transferencia - entrada a caja', 'direccion' => 'ENTRADA'],
            ['codigo' => 'TRANSFERENCIA_SALIDA', 'nombre' => 'Transferencia - salida de caja', 'direccion' => 'SALIDA'],
        ];

        // En PostgreSQL la secuencia de id puede quedar detrás de filas insertadas con id explícito
        // (causa "llave duplicada ... tipo_operacion_caja_pkey"): la alineamos antes de insertar.
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('tipo_operacion_caja', 'id'), COALESCE((SELECT MAX(id) FROM tipo_operacion_caja), 1), true)");
        }

        foreach ($tipos as $tipo) {
            DB::table('tipo_operacion_caja')->updateOrInsert(
                ['codigo' => $tipo['codigo']],
                ['nombre' => $tipo['nombre'], 'direccion' => $tipo['direccion']]
            );
        }
    }

    public function down(): void
    {
        DB::table('tipo_operacion_caja')
            ->whereIn('codigo', ['TRANSFERENCIA_ENTRADA', 'TRANSFERENCIA_SALIDA'])
            ->delete();

        Schema::table('ventas', function (Blueprint $table) {
            $table->dropColumn(['transferencia_monto', 'transferencia_tipo']);
        });

        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn('es_servicio');
        });
    }
};
