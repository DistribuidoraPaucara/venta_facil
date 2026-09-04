<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            // Agregar flags de características de productos por empresa
            $table->boolean('permite_vender_sin_stock')
                ->default(false)
                ->after('permite_productos_fraccionados')
                ->comment('Permite vender productos sin stock disponible');

            $table->boolean('permite_productos_alquilables')
                ->default(false)
                ->after('permite_vender_sin_stock')
                ->comment('Permite marcar productos como alquilables');

            $table->boolean('permite_productos_comida')
                ->default(false)
                ->after('permite_productos_alquilables')
                ->comment('Permite crear productos de comida sin stock');

            $table->boolean('permite_productos_combo')
                ->default(false)
                ->after('permite_productos_comida')
                ->comment('Permite crear productos combo');

            $table->boolean('permite_productos_adicionales')
                ->default(false)
                ->after('permite_productos_combo')
                ->comment('Permite crear productos adicionales (ej: complementos)');

            $table->boolean('permite_productos_produccion')
                ->default(false)
                ->after('permite_productos_adicionales')
                ->comment('Permite crear productos de producción (recetas)');
        });
    }

    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn([
                'permite_vender_sin_stock',
                'permite_productos_alquilables',
                'permite_productos_comida',
                'permite_productos_combo',
                'permite_productos_adicionales',
                'permite_productos_produccion',
            ]);
        });
    }
};
