<?php

namespace App\Services\Producto\Concerns;

use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Utilidades para leer y validar celdas de las planillas de productos / stock.
 */
trait LeePlanilla
{
    /**
     * @return array{0: array, 1: array} [encabezados, filas de datos]
     */
    protected function leerHoja(Worksheet $hoja): array
    {
        $filas       = $hoja->toArray(null, true, false, false);
        $encabezados = array_shift($filas) ?? [];

        return [$encabezados, $filas];
    }

    /**
     * Relaciona cada columna conocida con su índice en la hoja (el orden de columnas no importa).
     *
     * @param array $columnas clave interna => encabezado
     */
    protected function mapearEncabezados(array $encabezados, array $columnas, array $alias = []): array
    {
        $porNombre = [];
        foreach ($columnas as $clave => $titulo) {
            $porNombre[$this->normalizar($titulo)] = $clave;
            $porNombre[$this->normalizar(str_replace('_', ' ', $clave))] = $clave;
        }
        foreach ($alias as $texto => $clave) {
            $porNombre[$this->normalizar($texto)] = $clave;
        }

        $mapa = [];
        foreach ($encabezados as $indice => $titulo) {
            $clave = $porNombre[$this->normalizar((string) $titulo)] ?? null;
            if ($clave && ! isset($mapa[$clave])) {
                $mapa[$clave] = $indice;
            }
        }

        return $mapa;
    }

    protected function filaPorClaves(array $celdas, array $mapa): array
    {
        $fila = [];
        foreach ($mapa as $clave => $col) {
            $fila[$clave] = $celdas[$col] ?? null;
        }

        return $fila;
    }

    protected function texto(mixed $valor): ?string
    {
        if ($valor === null) {
            return null;
        }
        $valor = trim((string) $valor);

        return $valor === '' ? null : $valor;
    }

    protected function numero(mixed $valor, string $campo, array &$errores, bool $entero = false): ?float
    {
        $texto = $this->texto($valor);
        if ($texto === null) {
            return null;
        }
        // Acepta coma decimal (1,50) además de punto
        $texto = str_replace(',', '.', $texto);

        if (! is_numeric($texto) || (float) $texto < 0) {
            $errores[] = "{$campo}: \"{$valor}\" no es un número válido (debe ser 0 o mayor).";
            return null;
        }
        if ($entero && floor((float) $texto) != (float) $texto) {
            $errores[] = "{$campo}: debe ser un número entero.";
            return null;
        }

        return (float) $texto;
    }

    protected function booleano(mixed $valor, array &$errores): ?bool
    {
        $texto = $this->texto($valor);
        if ($texto === null) {
            return null;
        }

        return match ($this->normalizar($texto)) {
            'si', 's', '1', 'true', 'activo', 'x' => true,
            'no', 'n', '0', 'false', 'inactivo'   => false,
            default => tap(null, function () use (&$errores, $texto) {
                $errores[] = "Activo: \"{$texto}\" no es válido (usa SI o NO).";
            }),
        };
    }

    /**
     * Acepta fecha de Excel (número de serie) o texto AAAA-MM-DD / DD/MM/AAAA.
     */
    protected function fecha(mixed $valor, string $campo, array &$errores): ?Carbon
    {
        if ($valor === null || $this->texto($valor) === null) {
            return null;
        }

        try {
            if (is_numeric($valor)) {
                return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $valor))->startOfDay();
            }

            $texto = $this->texto($valor);
            foreach (['Y-m-d', 'd/m/Y', 'd-m-Y', 'Y/m/d'] as $formato) {
                $fecha = Carbon::createFromFormat('!' . $formato, $texto);
                if ($fecha && $fecha->format($formato) === $texto) {
                    return $fecha;
                }
            }
        } catch (\Throwable) {
            // cae al error de abajo
        }

        $errores[] = "{$campo}: \"{$valor}\" no es una fecha válida (usa AAAA-MM-DD o DD/MM/AAAA).";

        return null;
    }

    protected function normalizar(?string $texto): string
    {
        $texto = mb_strtolower(trim((string) $texto));

        return strtr($texto, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n']);
    }
}
