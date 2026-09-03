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
        Schema::table('empresas', function (Blueprint $table) {
            // Hacer nullable los campos opcionales
            $table->string('nit', 20)->nullable()->change();
            $table->string('direccion')->nullable()->change();
            $table->string('ciudad', 100)->nullable()->change();
            $table->string('pais', 50)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            // Revertir a NOT NULL
            $table->string('nit', 20)->nullable(false)->change();
            $table->string('direccion')->nullable(false)->change();
            $table->string('ciudad', 100)->nullable(false)->change();
            $table->string('pais', 50)->nullable(false)->change();
        });
    }
};
