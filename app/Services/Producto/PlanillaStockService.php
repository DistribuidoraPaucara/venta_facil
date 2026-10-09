<?php

namespace App\Services\Producto;

use App\Models\Almacen;
use App\Models\Empresa;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\StockProducto;
use App\Services\Producto\Concerns\LeePlanilla;
use App\Services\Stock\MovimientoStockService;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Hoja "Stock" de la planilla de productos: un renglón por lote (stock_productos).
 *
 * - Fila con ID  → lote existente. Si "Stock nuevo" difiere del actual se registra un ajuste
 *                  (entrada o salida) por la diferencia con MovimientoStockService (queda en el kardex).
 * - Fila sin ID  → lote nuevo: se crea en 0 y se registra una entrada por la cantidad indicada.
 * - "Stock nuevo" vacío = no se toca ese lote. Nunca se eliminan lotes desde la planilla.
 * - No se permite bajar el stock de un lote con reservas (el ajuste de salida consumiría reservas).
 */
class PlanillaStockService
{
    use LeePlanilla;

    public const HOJA = 'Stock';
    public const HOJA_ALMACENES = 'Almacenes';

    /** clave interna => encabezado */
    public const COLUMNAS = [
        'id'                => 'ID (no modificar)',
        'sku'               => 'SKU',
        'producto'          => 'Producto (no se importa)',
        'almacen'           => 'Almacén',
        'lote'              => 'Lote',
        'fecha_vencimiento' => 'Vencimiento',
        'stock_actual'      => 'Stock actual (no se importa)',
        'reservado'         => 'Reservado (no se importa)',
        'stock_nuevo'       => 'Stock nuevo',
    ];

    public const REFERENCIA_TIPO = 'planilla_productos';

    private Empresa $empresa;

    public function __construct(private MovimientoStockService $movimientos)
    {
    }

    public function paraEmpresa(Empresa $empresa): static
    {
        $this->empresa = $empresa;

        return $this;
    }

    // ─────────────────────────────── Descarga ───────────────────────────────

    /**
     * Agrega las hojas "Stock" y "Almacenes" al libro.
     */
    public function agregarHojas(Spreadsheet $libro, bool $incluirInactivos): void
    {
        $almacenes = $this->almacenes();

        // Hoja de almacenes válidos (sirve de lista desplegable)
        $hojaAlm = $libro->createSheet();
        $hojaAlm->setTitle(self::HOJA_ALMACENES);
        $hojaAlm->fromArray([['Almacenes de ' . $this->nombreEmpresa()]], null, 'A1');
        $hojaAlm->getStyle('A1')->getFont()->setBold(true);
        foreach ($almacenes->values() as $i => $a) {
            $hojaAlm->setCellValue('A' . ($i + 2), $a->nombre);
        }
        $hojaAlm->getColumnDimension('A')->setWidth(40);

        // Hoja de stock
        $hoja = $libro->createSheet(1);
        $hoja->setTitle(self::HOJA);
        $hoja->fromArray(array_values(self::COLUMNAS), null, 'A1');
        $this->estiloEncabezado($hoja, 'I');
        // Encabezado de "Stock nuevo" en verde: es la única columna que se edita normalmente
        $hoja->getStyle('I1')->getFill()->getStartColor()->setRGB('059669');

        $lotes = $this->lotesExportacion($incluirInactivos);
        foreach ($lotes as $i => $l) {
            $r = $i + 2;
            $hoja->setCellValue("A{$r}", $l->id);
            $hoja->setCellValueExplicit("B{$r}", (string) $l->producto?->sku, DataType::TYPE_STRING);
            $hoja->setCellValue("C{$r}", $l->producto?->nombre);
            $hoja->setCellValue("D{$r}", $l->almacen?->nombre);
            if ($l->lote !== null) {
                $hoja->setCellValueExplicit("E{$r}", (string) $l->lote, DataType::TYPE_STRING);
            }
            if ($l->fecha_vencimiento) {
                $hoja->setCellValue("F{$r}", ExcelDate::PHPToExcel($l->fecha_vencimiento));
            }
            $hoja->setCellValue("G{$r}", (float) $l->cantidad);
            $hoja->setCellValue("H{$r}", (float) $l->cantidad_reservada);
        }

        $ultimaFila = max(2, $lotes->count() + 1);
        $hoja->getStyle("F2:F" . ($ultimaFila + 500))->getNumberFormat()->setFormatCode('yyyy-mm-dd');
        foreach (['A', 'C', 'G', 'H'] as $col) {
            $hoja->getStyle("{$col}2:{$col}{$ultimaFila}")->getFont()->getColor()->setRGB('888888');
        }

        // Lista desplegable de almacenes (también para filas nuevas que se agreguen abajo)
        if ($almacenes->isNotEmpty()) {
            $validacion = $hoja->getCell('D2')->getDataValidation();
            $validacion->setType(DataValidation::TYPE_LIST)
                ->setAllowBlank(true)
                ->setShowDropDown(true)
                ->setShowErrorMessage(true)
                ->setErrorTitle('Almacén no válido')
                ->setError('Elige un almacén de la lista (hoja "Almacenes").')
                ->setFormula1("'" . self::HOJA_ALMACENES . "'!\$A\$2:\$A\$" . ($almacenes->count() + 1));
            $validacion->setSqref('D2:D' . ($ultimaFila + 500));
        }

        foreach (['A' => 12, 'B' => 16, 'C' => 40, 'D' => 24, 'E' => 16, 'F' => 14, 'G' => 16, 'H' => 16, 'I' => 14] as $col => $ancho) {
            $hoja->getColumnDimension($col)->setWidth($ancho);
        }
        $hoja->freezePane('A2');
    }

    private function lotesExportacion(bool $incluirInactivos): Collection
    {
        return StockProducto::query()
            ->with(['producto' => fn($q) => $q->withoutGlobalScope('empresa')->select('id', 'sku', 'nombre', 'activo'), 'almacen:id,nombre'])
            ->whereHas('producto', fn($q) => $q->withoutGlobalScope('empresa')
                ->where('empresa_id', $this->empresa->id)
                ->when(! $incluirInactivos, fn($q) => $q->where('activo', true)))
            ->get()
            ->sortBy(fn($l) => [$l->producto?->nombre, $l->almacen?->nombre, $l->fecha_vencimiento?->timestamp ?? PHP_INT_MAX, $l->id])
            ->values();
    }

    // ─────────────────────────────── Validación ───────────────────────────────

    /**
     * @param Worksheet|null $hoja      Hoja "Stock" del archivo subido
     * @param Collection     $productos Productos de la empresa indexados por SKU (mayúsculas)
     * @param array          $skusACrear SKUs que la hoja Productos va a crear en esta misma carga
     *
     * @return array{filas: array, errores: array, resumen: array}
     */
    public function validar(?Worksheet $hoja, Collection $productos, array $skusACrear): array
    {
        if (! $hoja) {
            return $this->resultado([], [[
                'hoja'    => self::HOJA,
                'fila'    => 0,
                'sku'     => null,
                'nombre'  => null,
                'mensaje' => 'El archivo no tiene la hoja "Stock". Descarga la planilla de nuevo o desmarca "Importar también el stock".',
            ]]);
        }

        [$encabezados, $datos] = $this->leerHoja($hoja);
        $mapa = $this->mapearEncabezados($encabezados, self::COLUMNAS, ['id' => 'id', 'almacen' => 'almacen']);

        if (! isset($mapa['stock_nuevo'])) {
            return $this->resultado([], [[
                'hoja'    => self::HOJA,
                'fila'    => 1,
                'sku'     => null,
                'nombre'  => null,
                'mensaje' => 'No se encontró la columna "Stock nuevo" en la hoja Stock.',
            ]]);
        }

        $almacenes         = $this->almacenes();
        $almacenPorDefecto = $this->almacenPorDefecto($almacenes);

        // Lotes existentes de la empresa (incluye eliminados para detectar choques con el índice único)
        $idsEnArchivo = collect($datos)->map(fn($f) => $f[$mapa['id'] ?? -1] ?? null)->filter(fn($v) => is_numeric($v))->map(fn($v) => (int) $v);
        $lotesPorId   = StockProducto::whereIn('id', $idsEnArchivo->all())
            ->whereHas('producto', fn($q) => $q->withoutGlobalScope('empresa')->where('empresa_id', $this->empresa->id))
            ->get()
            ->keyBy('id');

        $errores = [];
        $filas   = [];
        $vistos  = [];

        foreach ($datos as $i => $celdas) {
            $numFila = $i + 2;
            $fila    = $this->filaPorClaves($celdas, $mapa);

            $stockNuevoTexto = $this->texto($fila['stock_nuevo'] ?? null);
            if ($stockNuevoTexto === null) {
                continue; // "Stock nuevo" vacío: la fila no se toca
            }

            $e          = [];
            $id         = $this->texto($fila['id'] ?? null);
            $sku        = $this->texto($fila['sku'] ?? null);
            $sku        = $sku !== null ? strtoupper($sku) : null;
            $stockNuevo = $this->numero($fila['stock_nuevo'], 'Stock nuevo', $e);
            $venc       = $this->fecha($fila['fecha_vencimiento'] ?? null, 'Vencimiento', $e);
            $loteTexto  = $this->texto($fila['lote'] ?? null);
            $almTexto   = $this->texto($fila['almacen'] ?? null);

            $nombreProd = $sku !== null ? ($productos->get($sku)?->nombre ?? $this->texto($fila['producto'] ?? null)) : $this->texto($fila['producto'] ?? null);

            if ($id !== null) {
                // ── Lote existente ──
                $lote = is_numeric($id) ? $lotesPorId->get((int) $id) : null;
                if (! $lote) {
                    $e[] = "No existe un lote con ID {$id} en esta empresa. Para un lote nuevo deja el ID vacío.";
                } else {
                    if (isset($vistos["id:{$lote->id}"])) {
                        $e[] = "El lote ID {$lote->id} está repetido (fila {$vistos["id:{$lote->id}"]}).";
                    }
                    $vistos["id:{$lote->id}"] = $numFila;

                    if ($loteTexto !== null && $this->normalizar($loteTexto) !== $this->normalizar((string) $lote->lote)) {
                        $e[] = 'No se puede cambiar el código de lote de un lote existente. Agrega una fila nueva sin ID.';
                    }
                    if ($almTexto !== null) {
                        $alm = $this->buscarAlmacen($almacenes, $almTexto);
                        if (! $alm || $alm->id !== $lote->almacen_id) {
                            $e[] = 'No se puede cambiar el almacén de un lote existente. Agrega una fila nueva sin ID.';
                        }
                    }

                    if (! $e && $stockNuevo !== null) {
                        $actual = (float) $lote->cantidad;
                        $delta  = round($stockNuevo - $actual, 4);

                        if ($delta < 0 && (float) $lote->cantidad_reservada > 0) {
                            $e[] = "El lote tiene {$lote->cantidad_reservada} unidades reservadas: no se puede bajar su stock desde la planilla.";
                        }

                        $cambiaVenc = $venc && ! $venc->isSameDay($lote->fecha_vencimiento);

                        if (! $e && ($delta != 0 || $cambiaVenc)) {
                            $filas[] = [
                                'fila'              => $numFila,
                                'accion'            => $delta > 0 ? 'entrada' : ($delta < 0 ? 'salida' : 'fecha'),
                                'stock_producto_id' => $lote->id,
                                'sku'               => $sku,
                                'producto'          => $nombreProd,
                                'lote'              => $lote->lote,
                                'stock_actual'      => $actual,
                                'stock_nuevo'       => $stockNuevo,
                                'delta'             => $delta,
                                'fecha_vencimiento' => $cambiaVenc ? $venc->toDateString() : null,
                            ];
                        }
                    }
                }
            } else {
                // ── Lote nuevo ──
                $producto = null;
                if ($sku === null) {
                    $e[] = 'Para un lote nuevo indica el SKU del producto.';
                } elseif (! $productos->has($sku) && ! in_array($sku, $skusACrear, true)) {
                    $e[] = "No existe un producto con SKU {$sku} en esta empresa (ni en la hoja Productos).";
                } else {
                    $producto = $productos->get($sku);
                }

                $almacen = $almTexto !== null ? $this->buscarAlmacen($almacenes, $almTexto) : $almacenPorDefecto;
                if (! $almacen) {
                    $e[] = $almTexto !== null
                        ? "El almacén \"{$almTexto}\" no existe en esta empresa (revisa la hoja Almacenes)."
                        : 'Indica el almacén (la empresa tiene varios).';
                }

                if ($loteTexto !== null && mb_strlen($loteTexto) > 50) {
                    $e[] = 'El lote no puede tener más de 50 caracteres.';
                }

                if (! $e) {
                    $clave = "nuevo:{$sku}|{$almacen->id}|" . $this->normalizar($loteTexto);
                    if (isset($vistos[$clave])) {
                        $e[] = "Ese producto/almacén/lote ya aparece en la fila {$vistos[$clave]}.";
                    }
                    $vistos[$clave] = $numFila;

                    // ¿Ya existe ese lote (activo o eliminado)? Evita duplicar y chocar con el índice único
                    if ($producto) {
                        $existente = StockProducto::withTrashed()
                            ->where('producto_id', $producto->id)
                            ->where('almacen_id', $almacen->id)
                            ->when($loteTexto === null, fn($q) => $q->whereNull('lote'), fn($q) => $q->where('lote', $loteTexto))
                            ->orderByRaw('deleted_at IS NOT NULL')
                            ->first();
                        if ($existente && ! $existente->trashed()) {
                            $e[] = "Ese lote ya existe (ID {$existente->id}). Edita su fila en lugar de agregar una nueva.";
                        } elseif ($existente && $loteTexto !== null) {
                            $e[] = "El lote \"{$loteTexto}\" fue eliminado antes para este producto y almacén. Usa otro código de lote.";
                        }
                    }
                }

                if (! $e && $stockNuevo > 0) {
                    $filas[] = [
                        'fila'              => $numFila,
                        'accion'            => 'nuevo',
                        'stock_producto_id' => null,
                        'sku'               => $sku,
                        'producto'          => $nombreProd,
                        'almacen_id'        => $almacen->id,
                        'lote'              => $loteTexto,
                        'stock_actual'      => 0,
                        'stock_nuevo'       => $stockNuevo,
                        'delta'             => $stockNuevo,
                        'fecha_vencimiento' => $venc?->toDateString(),
                    ];
                }
            }

            foreach ($e as $msg) {
                $errores[] = ['hoja' => self::HOJA, 'fila' => $numFila, 'sku' => $sku, 'nombre' => $nombreProd, 'mensaje' => $msg];
            }
        }

        return $this->resultado($filas, $errores);
    }

    // ─────────────────────────────── Importación ───────────────────────────────

    /**
     * Aplica los cambios validados. Debe llamarse dentro de la transacción de la importación.
     *
     * @param Collection $productosPorSku Productos de la empresa (ya con los creados en esta carga)
     */
    public function aplicar(array $filas, Collection $productosPorSku, string $numeroDocumento, string $archivo): void
    {
        foreach ($filas as $f) {
            if ($f['accion'] === 'nuevo') {
                $producto = $productosPorSku->get($f['sku']);
                if (! $producto) {
                    throw new \RuntimeException("Fila {$f['fila']} (Stock): no se encontró el producto {$f['sku']}.");
                }

                $lote = StockProducto::create([
                    'producto_id'         => $producto->id,
                    'almacen_id'          => $f['almacen_id'],
                    'lote'                => $f['lote'],
                    'fecha_vencimiento'   => $f['fecha_vencimiento'],
                    'cantidad'            => 0,
                    'cantidad_disponible' => 0,
                    'cantidad_reservada'  => 0,
                    'fecha_actualizacion' => now(),
                ]);
                $stockId = $lote->id;
            } else {
                $stockId = $f['stock_producto_id'];
                if ($f['fecha_vencimiento']) {
                    StockProducto::whereKey($stockId)->update(['fecha_vencimiento' => $f['fecha_vencimiento']]);
                }
            }

            if ($f['delta'] == 0) {
                continue;
            }

            $this->movimientos->registrarMovimientoYActualizar(
                stockProductoId: $stockId,
                cantidad: $f['delta'] > 0 ? abs($f['delta']) : -abs($f['delta']),
                tipo: $f['delta'] > 0 ? MovimientoInventario::TIPO_ENTRADA_AJUSTE : MovimientoInventario::TIPO_SALIDA_AJUSTE,
                referencia_tipo: self::REFERENCIA_TIPO,
                referencia_id: 0,
                metadataAdicional: [
                    'motivo'       => $f['accion'] === 'nuevo' ? 'Stock inicial desde planilla de productos' : 'Ajuste desde planilla de productos',
                    'archivo'      => $archivo,
                    'fila'         => $f['fila'],
                    'stock_antes'  => $f['stock_actual'],
                    'stock_nuevo'  => $f['stock_nuevo'],
                    'lote'         => $f['lote'],
                ],
                numeroDocumento: $numeroDocumento,
            );
        }
    }

    // ─────────────────────────────── Helpers ───────────────────────────────

    /**
     * Almacenes activos de la empresa o compartidos (empresa_id NULL; hay bases donde son globales).
     */
    private function almacenes(): Collection
    {
        return Almacen::where(fn($q) => $q->where('empresa_id', $this->empresa->id)->orWhereNull('empresa_id'))
            ->where('activo', true)
            ->orderByRaw('empresa_id IS NULL')
            ->orderBy('nombre')
            ->get(['id', 'nombre']);
    }

    /** Almacén que se usa si la fila no lo indica: el de la empresa o el único que tenga. */
    private function almacenPorDefecto(Collection $almacenes): ?Almacen
    {
        if ($this->empresa->almacen_id && ($a = $almacenes->firstWhere('id', $this->empresa->almacen_id))) {
            return $a;
        }

        return $almacenes->count() === 1 ? $almacenes->first() : null;
    }

    private function buscarAlmacen(Collection $almacenes, string $texto): ?Almacen
    {
        if (is_numeric($texto) && ($a = $almacenes->firstWhere('id', (int) $texto))) {
            return $a;
        }

        return $almacenes->first(fn($a) => $this->normalizar($a->nombre) === $this->normalizar($texto));
    }

    private function nombreEmpresa(): string
    {
        return $this->empresa->nombre_comercial ?: ($this->empresa->razon_social ?: "empresa #{$this->empresa->id}");
    }

    private function estiloEncabezado(Worksheet $hoja, string $ultimaCol): void
    {
        $hoja->getStyle("A1:{$ultimaCol}1")->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $hoja->getStyle("A1:{$ultimaCol}1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('4F46E5');
    }

    private function resultado(array $filas, array $errores): array
    {
        $col      = collect($filas);
        $conError = collect($errores)->pluck('fila')->unique()->count();

        return [
            'filas'   => $filas,
            'errores' => $errores,
            'resumen' => [
                'lotes_nuevos'      => $col->where('accion', 'nuevo')->count(),
                'entradas'          => $col->where('accion', 'entrada')->count(),
                'salidas'           => $col->where('accion', 'salida')->count(),
                'solo_fecha'        => $col->where('accion', 'fecha')->count(),
                'unidades_entrada'  => round($col->where('delta', '>', 0)->sum('delta'), 4),
                'unidades_salida'   => round(abs($col->where('delta', '<', 0)->sum('delta')), 4),
                'errores'           => $conError,
            ],
        ];
    }
}
