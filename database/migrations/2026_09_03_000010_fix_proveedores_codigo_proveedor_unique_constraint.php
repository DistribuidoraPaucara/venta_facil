<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            // Verificar si existe el constraint unique antiguo
            // En PostgreSQL, buscamos la constraint por nombre
            try {
                // Eliminar constraint único antiguo (global)
                $table->dropUnique(['codigo_proveedor']);
            } catch (\Exception $e) {
                // Si no existe, continuar
            }

            // Agregar constraint único compuesto (por empresa)
            $table->unique(['codigo_proveedor', 'empresa_id']);
        });
    }

    public function down(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            // Revertir al constraint original
            $table->dropUnique(['codigo_proveedor', 'empresa_id']);
            $table->unique(['codigo_proveedor']);
        });
    }
};
