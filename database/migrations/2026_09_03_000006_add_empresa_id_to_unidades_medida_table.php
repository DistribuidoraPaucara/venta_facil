<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('unidades_medida', function (Blueprint $table) {
            $table->unsignedBigInteger('empresa_id')->nullable()->after('id');
            $table->foreign('empresa_id')->references('id')->on('empresas')->onDelete('cascade');
            $table->index('empresa_id');

            // Cambiar constraint único para incluir empresa_id
            $table->dropUnique(['codigo']);
            $table->unique(['codigo', 'empresa_id']);
        });
    }

    public function down(): void
    {
        Schema::table('unidades_medida', function (Blueprint $table) {
            $table->dropForeign(['empresa_id']);
            $table->dropIndex(['empresa_id']);
            $table->dropUnique(['codigo', 'empresa_id']);
            $table->unique(['codigo']);
            $table->dropColumn('empresa_id');
        });
    }
};
