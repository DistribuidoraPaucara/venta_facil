<?php

namespace App\Http\Traits;

/**
 * Trait para catálogos con color (Tipos de Merma, Estados de Merma)
 *
 * A partir del color base (ej: 'red') genera las clases Tailwind de fondo y texto
 * con el mismo formato que usan los seeders.
 */
trait CatalogoColorTrait
{
    /**
     * Colores disponibles para los catálogos
     */
    protected function coloresPermitidos(): array
    {
        return ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
    }

    /**
     * Completar bg_color y text_color a partir del color base
     */
    protected function conClasesColor(array $data): array
    {
        $color = $data['color'] ?? 'gray';

        $data['color']      = $color;
        $data['bg_color']   = "bg-{$color}-100 dark:bg-{$color}-900/20";
        $data['text_color'] = "text-{$color}-800 dark:text-{$color}-300";

        return $data;
    }
}
