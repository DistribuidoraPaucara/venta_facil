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
        Schema::table('users', function (Blueprint $table) {
            // Eliminar constraints únicas globales
            $table->dropUnique(['usernick']);
            $table->dropUnique(['email']);

            // Agregar constraints únicas compuestas por empresa
            // Usar whereNotNull para permitir múltiples NULLs
            $table->unique(['usernick', 'empresa_id'], 'users_usernick_empresa_id_unique');
            $table->unique(['email', 'empresa_id'], 'users_email_empresa_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Revertir a constraints globales
            $table->dropUnique('users_usernick_empresa_id_unique');
            $table->dropUnique('users_email_empresa_id_unique');

            $table->unique(['usernick']);
            $table->unique(['email']);
        });
    }
};
