<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movimientos_fraccionamiento', function (Blueprint $table) {
            $table->id();

            // Producto que se fraccionó (PADRE)
            $table->unsignedBigInteger('producto_padre_id')->comment('Producto que se fraccionó');
            $table->decimal('cantidad_padre', 10, 4)->comment('Cantidad del producto padre que se fraccionó');
            $table->unsignedBigInteger('unidad_padre_id')->comment('Unidad del producto padre');

            // Producto resultado (HIJO)
            $table->unsignedBigInteger('producto_hijo_id')->comment('Producto resultante del fraccionamiento');
            $table->decimal('cantidad_hijo', 10, 4)->comment('Cantidad del producto hijo generada');
            $table->unsignedBigInteger('unidad_hijo_id')->comment('Unidad del producto hijo');

            // Ubicación
            $table->unsignedBigInteger('almacen_id')->comment('Almacén donde se realizó el fraccionamiento');
            $table->unsignedBigInteger('sector_id')->comment('Sector donde se realizó el fraccionamiento');

            // Auditoría
            $table->unsignedBigInteger('usuario_id')->comment('Usuario que realizó el fraccionamiento');
            $table->timestamp('fecha_fraccionamiento')->useCurrent()->comment('Fecha y hora del fraccionamiento');
            $table->enum('razon', [
                'fraccionamiento_manual',
                'fraccionamiento_compra',
                'reagrupamiento',
                'ajuste_inventario'
            ])->default('fraccionamiento_manual')->comment('Razón del fraccionamiento');
            $table->text('notas')->nullable()->comment('Notas adicionales sobre el fraccionamiento');

            // Empresa
            $table->unsignedBigInteger('empresa_id')->nullable()->comment('Empresa propietaria');

            $table->timestamps();
            $table->softDeletes();

            // Relaciones
            $table->foreign('producto_padre_id')->references('id')->on('productos')->onDelete('restrict');
            $table->foreign('producto_hijo_id')->references('id')->on('productos')->onDelete('restrict');
            $table->foreign('unidad_padre_id')->references('id')->on('unidades_medida')->onDelete('restrict');
            $table->foreign('unidad_hijo_id')->references('id')->on('unidades_medida')->onDelete('restrict');
            $table->foreign('almacen_id')->references('id')->on('almacenes')->onDelete('restrict');
            $table->foreign('sector_id')->references('id')->on('sectores')->onDelete('restrict');
            $table->foreign('usuario_id')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('empresa_id')->references('id')->on('empresas')->onDelete('cascade');

            // Índices
            $table->index('producto_padre_id');
            $table->index('producto_hijo_id');
            $table->index('almacen_id');
            $table->index('sector_id');
            $table->index('usuario_id');
            $table->index('empresa_id');
            $table->index('fecha_fraccionamiento');
            $table->index('razon');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos_fraccionamiento');
    }
};
