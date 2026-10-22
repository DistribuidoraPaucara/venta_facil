<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * compras.proveedor_id pasa a admitir NULL: una orden de compra (compra en BORRADOR) puede crearse
 * desde "Productos para Comprar" sin proveedor todavía elegido. Para pasar a PENDIENTE, APROBADO o
 * FACTURADO el proveedor sigue siendo obligatorio (lo valida UpdateCompraRequest).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE compras ALTER COLUMN proveedor_id DROP NOT NULL');
    }

    public function down(): void
    {
        $sinProveedor = DB::table('compras')->whereNull('proveedor_id')->count();
        if ($sinProveedor > 0) {
            throw new \RuntimeException(
                "No se puede volver a NOT NULL: hay {$sinProveedor} compra(s) sin proveedor. Asígneles uno o elimínelas primero."
            );
        }

        DB::statement('ALTER TABLE compras ALTER COLUMN proveedor_id SET NOT NULL');
    }
};
