<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Flujo de aprobación de mermas:
 * - Una merma PENDIENTE guarda sus productos en productos_pendientes y no descuenta stock.
 * - Al aprobarla se descuenta el stock; al rechazarla se cierra sin tocar el stock.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mermas_inventario', function (Blueprint $table) {
            $table->json('productos_pendientes')->nullable()->after('observacion');
            $table->foreignId('aprobado_por_id')->nullable()->after('estado')->constrained('users')->nullOnDelete();
            $table->timestamp('fecha_aprobacion')->nullable()->after('aprobado_por_id');
            $table->text('observacion_aprobacion')->nullable()->after('fecha_aprobacion');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE mermas_inventario DROP CONSTRAINT IF EXISTS mermas_inventario_estado_check');
            DB::statement("ALTER TABLE mermas_inventario ADD CONSTRAINT mermas_inventario_estado_check CHECK (estado IN ('pendiente', 'procesado', 'rechazado'))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE mermas_inventario DROP CONSTRAINT IF EXISTS mermas_inventario_estado_check');
            DB::statement("ALTER TABLE mermas_inventario ADD CONSTRAINT mermas_inventario_estado_check CHECK (estado IN ('pendiente', 'procesado'))");
        }

        Schema::table('mermas_inventario', function (Blueprint $table) {
            $table->dropConstrainedForeignId('aprobado_por_id');
            $table->dropColumn(['productos_pendientes', 'fecha_aprobacion', 'observacion_aprobacion']);
        });
    }
};
