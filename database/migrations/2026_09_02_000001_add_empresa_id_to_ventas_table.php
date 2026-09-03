<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            // Agregar empresa_id como nullable primero (para datos existentes)
            $table->foreignId('empresa_id')
                ->after('usuario_id')
                ->nullable()
                ->constrained('empresas')
                ->onDelete('restrict');

            // Agregar índice compuesto para filtrado rápido por empresa
            $table->index(['empresa_id', 'id']);
            $table->index(['empresa_id', 'fecha']);
        });

        // ✅ Actualizar ventas existentes con empresa_id del usuario
        // Si el usuario no tiene empresa_id, asignar empresa_id = 1 por defecto
        DB::statement(<<<SQL
            UPDATE ventas v
            SET empresa_id = COALESCE(u.empresa_id, 1)
            FROM users u
            WHERE v.usuario_id = u.id
            AND v.empresa_id IS NULL
        SQL);

        // ✅ Hacer empresa_id NOT NULL después de asignar valores
        Schema::table('ventas', function (Blueprint $table) {
            $table->unsignedBigInteger('empresa_id')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'id']);
            $table->dropIndex(['empresa_id', 'fecha']);
            $table->dropForeignIdFor(\App\Models\Empresa::class);
        });
    }
};
