<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Varios proveedores por producto.
 * - producto_proveedor: relación producto ↔ proveedor con el último precio de compra de cada proveedor.
 *   Se crea/actualiza sola al aprobar compras (ProductoProveedorService) y se edita en el formulario de productos.
 * - productos.proveedor_id se mantiene como copia del proveedor principal (lo usan filtros y reportes).
 *
 * Carga inicial: relaciones salidas de compras aprobadas/facturadas + el proveedor actual de cada producto (principal).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto_proveedor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->foreignId('proveedor_id')->constrained('proveedores')->cascadeOnDelete();
            $table->string('codigo_proveedor', 100)->nullable(); // código del producto en el catálogo del proveedor
            $table->decimal('ultimo_precio', 14, 4)->nullable();
            $table->foreignId('unidad_medida_id')->nullable()->constrained('unidades_medida')->nullOnDelete();
            $table->date('fecha_ultima_compra')->nullable();
            $table->foreignId('ultima_compra_id')->nullable()->constrained('compras')->nullOnDelete();
            $table->boolean('es_principal')->default(false);
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['producto_id', 'proveedor_id']);
            $table->index(['empresa_id', 'proveedor_id']);
        });

        // 1) Una fila por producto + proveedor de compras aprobadas/facturadas, con su última compra
        DB::statement(<<<'SQL'
            INSERT INTO producto_proveedor
                (empresa_id, producto_id, proveedor_id, ultimo_precio, unidad_medida_id, fecha_ultima_compra,
                 ultima_compra_id, es_principal, activo, created_at, updated_at)
            SELECT DISTINCT ON (dc.producto_id, c.proveedor_id)
                p.empresa_id, dc.producto_id, c.proveedor_id, dc.precio_unitario,
                COALESCE(dc.unidad_medida_id, p.unidad_medida_id), c.fecha, c.id, false, true, NOW(), NOW()
            FROM detalle_compras dc
            JOIN compras c ON c.id = dc.compra_id
            JOIN estados_documento e ON e.id = c.estado_documento_id AND e.codigo IN ('APROBADO', 'FACTURADO')
            JOIN productos p ON p.id = dc.producto_id
            WHERE c.proveedor_id IS NOT NULL AND dc.precio_unitario > 0
            ORDER BY dc.producto_id, c.proveedor_id, c.fecha DESC, c.id DESC, dc.id DESC
        SQL);

        // 2) El proveedor actual del producto pasa a ser el principal (se crea la fila si no venía de compras)
        DB::statement(<<<'SQL'
            INSERT INTO producto_proveedor (empresa_id, producto_id, proveedor_id, es_principal, activo, created_at, updated_at)
            SELECT p.empresa_id, p.id, p.proveedor_id, true, true, NOW(), NOW()
            FROM productos p
            WHERE p.proveedor_id IS NOT NULL AND p.empresa_id IS NOT NULL
            ON CONFLICT (producto_id, proveedor_id) DO UPDATE SET es_principal = true
        SQL);

        // 3) Productos con proveedores pero sin principal: el de la compra más reciente
        DB::statement(<<<'SQL'
            UPDATE producto_proveedor pp SET es_principal = true
            FROM (
                SELECT DISTINCT ON (producto_id) id
                FROM producto_proveedor
                WHERE producto_id NOT IN (SELECT producto_id FROM producto_proveedor WHERE es_principal)
                ORDER BY producto_id, fecha_ultima_compra DESC NULLS LAST, id DESC
            ) x
            WHERE pp.id = x.id
        SQL);

        DB::statement(<<<'SQL'
            UPDATE productos p SET proveedor_id = pp.proveedor_id
            FROM producto_proveedor pp
            WHERE pp.producto_id = p.id AND pp.es_principal AND p.proveedor_id IS DISTINCT FROM pp.proveedor_id
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_proveedor');
    }
};
