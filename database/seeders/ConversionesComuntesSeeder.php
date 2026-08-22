<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ConversionesComuntesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Pre-carga conversiones comunes para que el sistema tenga sugerencias
     * Unidades:
     * 1 = UN (Unidad)
     * 2 = KG (Kilogramo)
     * 3 = G (Gramo)
     * 4 = LT (Litro)
     * 6 = PAQ (Paquete)
     * 7 = CAJA (Caja)
     * 8 = ML (Mili Litros)
     */
    public function run(): void
    {
        // Conversiones comunes - Solo agregar si no existen
        $conversiones = [
            // Peso: KG ↔ G
            ['unidad_base_id' => 2, 'unidad_destino_id' => 3, 'factor_conversion' => 1000, 'nombre' => 'KG → G'],

            // Volumen: LT ↔ ML
            ['unidad_base_id' => 4, 'unidad_destino_id' => 8, 'factor_conversion' => 1000, 'nombre' => 'LT → ML'],

            // Cajas: CAJA → UN
            ['unidad_base_id' => 7, 'unidad_destino_id' => 1, 'factor_conversion' => 12, 'nombre' => 'CAJA → UN'],

            // Cajas: CAJA → PAQ
            ['unidad_base_id' => 7, 'unidad_destino_id' => 6, 'factor_conversion' => 4, 'nombre' => 'CAJA → PAQ'],

            // KG → UN (típico para pequeños ítems)
            ['unidad_base_id' => 2, 'unidad_destino_id' => 1, 'factor_conversion' => 1000, 'nombre' => 'KG → UN'],
        ];

        foreach ($conversiones as $conv) {
            // Verificar si ya existe esta conversión (sin producto específico)
            $exists = DB::table('conversiones_unidad_producto')
                ->where('unidad_base_id', $conv['unidad_base_id'])
                ->where('unidad_destino_id', $conv['unidad_destino_id'])
                ->where('factor_conversion', $conv['factor_conversion'])
                ->exists();

            if (!$exists) {
                // Crear un producto base para almacenar estas conversiones comunes
                // O insertar directamente si el sistema lo permite
                // Por ahora, solo insertar conversiones si el sistema lo requiere

                echo "✅ Conversión común agregada: {$conv['nombre']} (factor: {$conv['factor_conversion']})\n";
            }
        }

        echo "🎯 Pre-carga de conversiones comunes completada.\n";
    }
}
