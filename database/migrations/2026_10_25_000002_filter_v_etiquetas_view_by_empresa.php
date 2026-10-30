<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Por ahora la vista de etiquetas solo aplica a la empresa 2
        DB::statement($this->vista('AND p.empresa_id = 2'));
    }

    public function down(): void
    {
        DB::statement($this->vista(''));
    }

    private function vista(string $filtroEmpresa): string
    {
        return <<<SQL
            CREATE OR REPLACE VIEW v_etiquetas AS
            SELECT
                p.id,
                COALESCE(cb.codigo, p.id::text) AS codigo_barra,
                p.nombre,
                pv.precio::numeric(18,2)        AS precio_venta
            FROM productos p
            -- Precio de venta: precios_producto + tipos_precio 'VENTA' de la misma empresa
            JOIN LATERAL (
                SELECT pr.precio
                FROM precios_producto pr
                JOIN tipos_precio tp ON tp.id = pr.tipo_precio_id
                WHERE pr.producto_id = p.id
                  AND pr.activo = true
                  AND pr.unidad_medida_id IS NULL
                  AND tp.codigo = 'VENTA'
                  AND tp.activo = true
                  AND tp.empresa_id = p.empresa_id
                ORDER BY pr.id DESC
                LIMIT 1
            ) pv ON true
            -- Código de barras principal activo
            LEFT JOIN LATERAL (
                SELECT c.codigo
                FROM codigos_barra c
                WHERE c.producto_id = p.id
                  AND c.activo = true
                ORDER BY c.es_principal DESC, c.id
                LIMIT 1
            ) cb ON true
            WHERE p.activo = true
              {$filtroEmpresa}
        SQL;
    }
};
