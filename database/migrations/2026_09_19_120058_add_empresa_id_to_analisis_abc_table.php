<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('analisis_abc', function (Blueprint $table) {
            // Nullable primero para poder rellenar los registros existentes
            $table->foreignId('empresa_id')
                ->after('almacen_id')
                ->nullable()
                ->constrained('empresas')
                ->onDelete('cascade');

            $table->index(['empresa_id', 'periodo_ano', 'periodo_mes']);
        });

        // ✅ Rellenar empresa_id de registros existentes a partir del producto
        // (producto_id es NOT NULL, así que siempre hay de dónde heredarlo)
        DB::statement(<<<SQL
            UPDATE analisis_abc a
            SET empresa_id = p.empresa_id
            FROM productos p
            WHERE a.producto_id = p.id
            AND a.empresa_id IS NULL
        SQL);

        // ✅ NOT NULL después de rellenar (nuevos cálculos siempre lo van a traer)
        Schema::table('analisis_abc', function (Blueprint $table) {
            $table->unsignedBigInteger('empresa_id')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('analisis_abc', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'periodo_ano', 'periodo_mes']);
            $table->dropForeignIdFor(\App\Models\Empresa::class);
        });
    }
};
