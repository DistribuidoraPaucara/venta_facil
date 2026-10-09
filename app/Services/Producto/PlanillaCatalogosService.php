<?php

namespace App\Services\Producto;

use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Marca;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\UnidadMedida;
use App\Services\Producto\Concerns\LeePlanilla;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Hojas de catálogos de la planilla: Categorías, Marcas, Unidades y Proveedores.
 *
 * - Fila con ID  → registro existente: se actualizan los campos con valor distinto (celda vacía = sin cambio).
 * - Fila sin ID  → registro nuevo en la empresa destino.
 * - Nunca se eliminan registros; para dejar de usarlos se marca Activo = NO.
 * - Registros compartidos (empresa_id NULL): solo se pueden modificar si el sistema tiene una sola empresa,
 *   porque en un sistema con varias empresas el cambio afectaría a todas.
 */
class PlanillaCatalogosService
{
    use LeePlanilla;

    /**
     * Configuración de cada hoja.
     * - campos: clave => [encabezado, max caracteres]  (el primero es el que identifica por nombre)
     * - fk: columna de productos que apunta al catálogo (para contar uso)
     */
    public const CATALOGOS = [
        'categorias' => [
            'hoja'   => 'Categorías',
            'modelo' => Categoria::class,
            'fk'     => 'categoria_id',
            'clave'  => 'nombre',
            'campos' => ['nombre' => ['Nombre', 255], 'descripcion' => ['Descripción', 500]],
        ],
        'marcas' => [
            'hoja'   => 'Marcas',
            'modelo' => Marca::class,
            'fk'     => 'marca_id',
            'clave'  => 'nombre',
            'campos' => ['nombre' => ['Nombre', 255], 'descripcion' => ['Descripción', 500]],
        ],
        'unidades' => [
            'hoja'   => 'Unidades',
            'modelo' => UnidadMedida::class,
            'fk'     => 'unidad_medida_id',
            'clave'  => 'codigo',
            'campos' => ['codigo' => ['Código', 10], 'nombre' => ['Nombre', 50]],
        ],
        'proveedores' => [
            'hoja'   => 'Proveedores',
            'modelo' => Proveedor::class,
            'fk'     => 'proveedor_id',
            'clave'  => 'nombre',
            'campos' => [
                'nombre'       => ['Nombre', 255],
                'razon_social' => ['Razón social', 255],
                'nit'          => ['NIT', 50],
                'telefono'     => ['Teléfono', 50],
                'email'        => ['Email', 255],
                'direccion'    => ['Dirección', 500],
                'contacto'     => ['Contacto', 255],
            ],
        ],
    ];

    private Empresa $empresa;

    public function paraEmpresa(Empresa $empresa): static
    {
        $this->empresa = $empresa;

        return $this;
    }

    /** ¿Se pueden editar los registros compartidos (empresa_id NULL)? Solo si hay una única empresa. */
    public function compartidosEditables(): bool
    {
        return Empresa::count() <= 1;
    }

    /** Columnas de una hoja: ID + campos + Activo + informativas. */
    public static function columnas(string $tipo): array
    {
        $cfg = self::CATALOGOS[$tipo];

        return ['id' => 'ID (no modificar)']
            + array_map(fn($c) => $c[0], $cfg['campos'])
            + ['activo' => 'Activo (SI/NO)', 'compartido' => 'Compartido (no se importa)', 'productos' => 'Productos (no se importa)'];
    }

    // ─────────────────────────────── Descarga ───────────────────────────────

    public function agregarHojas(Spreadsheet $libro): void
    {
        foreach (self::CATALOGOS as $tipo => $cfg) {
            $hoja = $libro->createSheet();
            $hoja->setTitle($cfg['hoja']);

            $columnas = self::columnas($tipo);
            $hoja->fromArray(array_values($columnas), null, 'A1');
            $ultimaCol = $hoja->getHighestColumn();
            $hoja->getStyle("A1:{$ultimaCol}1")->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
            $hoja->getStyle("A1:{$ultimaCol}1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('7C3AED');

            $uso      = $this->usoEnProductos($cfg['fk']);
            $editable = $this->compartidosEditables();

            $r = 2;
            foreach ($this->visibles($cfg['modelo']) as $m) {
                $fila = [$m->id];
                foreach (array_keys($cfg['campos']) as $campo) {
                    $fila[] = $m->{$campo};
                }
                $fila[] = $m->activo ? 'SI' : 'NO';
                $fila[] = $m->empresa_id === null ? 'SI' : 'NO';
                $fila[] = (int) ($uso[$m->id] ?? 0);
                $hoja->fromArray($fila, null, "A{$r}", true);

                if ($m->empresa_id === null && ! $editable) {
                    $hoja->getStyle("A{$r}:{$ultimaCol}{$r}")->getFont()->getColor()->setRGB('888888');
                }
                $r++;
            }

            // Columnas informativas en gris
            $ultimaFila = max(2, $r - 1);
            $cols       = array_keys($columnas);
            foreach (['id', 'compartido', 'productos'] as $info) {
                $letra = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(array_search($info, $cols) + 1);
                $hoja->getStyle("{$letra}2:{$letra}{$ultimaFila}")->getFont()->getColor()->setRGB('888888');
            }

            foreach ($cols as $i => $clave) {
                $letra = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
                $hoja->getColumnDimension($letra)->setWidth(match ($clave) {
                    'id', 'activo', 'codigo' => 12,
                    'compartido', 'productos' => 24,
                    'nombre', 'razon_social', 'descripcion', 'direccion' => 36,
                    default => 18,
                });
            }
            $hoja->freezePane('A2');
        }
    }

    // ─────────────────────────────── Validación ───────────────────────────────

    /**
     * Valida todas las hojas de catálogos presentes en el libro (las ausentes se ignoran).
     *
     * @return array{cambios: array, errores: array, resumen: array, nuevos: array}
     */
    public function validar(Spreadsheet $libro): array
    {
        $cambios = [];
        $errores = [];
        $resumen = [];
        $nuevos  = [];

        foreach (self::CATALOGOS as $tipo => $cfg) {
            $hoja = $libro->getSheetByName($cfg['hoja']);
            $resumen[$tipo] = ['crear' => 0, 'actualizar' => 0];
            $nuevos[$tipo]  = [];
            if (! $hoja) {
                continue;
            }

            [$c, $e] = $this->validarHoja($tipo, $hoja);
            $cambios = array_merge($cambios, $c);
            $errores = array_merge($errores, $e);

            $col                          = collect($c);
            $resumen[$tipo]['crear']      = $col->where('accion', 'crear')->count();
            $resumen[$tipo]['actualizar'] = $col->where('accion', 'actualizar')->count();
            $nuevos[$tipo]                = $col->where('accion', 'crear')->pluck('datos.' . $cfg['clave'])->values()->all();
        }

        return compact('cambios', 'errores', 'resumen', 'nuevos');
    }

    private function validarHoja(string $tipo, Worksheet $hoja): array
    {
        $cfg      = self::CATALOGOS[$tipo];
        $nombreH  = $cfg['hoja'];
        $clave    = $cfg['clave'];
        $editable = $this->compartidosEditables();

        [$encabezados, $datos] = $this->leerHoja($hoja);
        $mapa = $this->mapearEncabezados($encabezados, self::columnas($tipo), ['id' => 'id', 'activo' => 'activo']);

        if (! isset($mapa[$clave])) {
            return [[], [$this->error($nombreH, 1, null, "No se encontró la columna \"{$cfg['campos'][$clave][0]}\".")]];
        }

        $existentes = $this->visibles($cfg['modelo']);
        $porId      = $existentes->keyBy('id');
        // Índice por clave (nombre o código) normalizada → registro, para detectar duplicados
        $porClave   = $existentes->keyBy(fn($m) => $this->normalizar($m->{$clave}));

        $cambios = [];
        $errores = [];
        $vistos  = [];

        foreach ($datos as $i => $celdas) {
            $numFila = $i + 2;
            $fila    = $this->filaPorClaves($celdas, $mapa);

            $valores = [];
            foreach (array_keys($cfg['campos']) as $campo) {
                $valores[$campo] = $this->texto($fila[$campo] ?? null);
            }
            $id = $this->texto($fila['id'] ?? null);

            if ($id === null && collect($valores)->filter()->isEmpty()) {
                continue; // fila vacía
            }

            $e      = [];
            $activo = $this->booleano($fila['activo'] ?? null, $e);

            foreach ($cfg['campos'] as $campo => [$titulo, $max]) {
                if ($valores[$campo] !== null && mb_strlen($valores[$campo]) > $max) {
                    $e[] = "{$titulo}: máximo {$max} caracteres.";
                }
            }
            if ($tipo === 'proveedores' && $valores['email'] !== null && ! filter_var($valores['email'], FILTER_VALIDATE_EMAIL)) {
                $e[] = "Email: \"{$valores['email']}\" no es válido.";
            }

            $valorClave = $valores[$clave];
            $etiqueta   = $valorClave ?? ($id !== null ? "ID {$id}" : null);

            if ($id !== null) {
                // ── Existente ──
                $registro = is_numeric($id) ? $porId->get((int) $id) : null;
                if (! $registro) {
                    $e[] = "No existe un registro con ID {$id} para esta empresa. Para uno nuevo deja el ID vacío.";
                } else {
                    if (isset($vistos["id:{$registro->id}"])) {
                        $e[] = "El ID {$registro->id} está repetido (fila {$vistos["id:{$registro->id}"]}).";
                    }
                    $vistos["id:{$registro->id}"] = $numFila;

                    $cambiosCampos = [];
                    foreach ($valores as $campo => $valor) {
                        if ($valor !== null && (string) $registro->{$campo} !== $valor) {
                            $cambiosCampos[$campo] = $valor;
                        }
                    }
                    if ($activo !== null && (bool) $registro->activo !== $activo) {
                        $cambiosCampos['activo'] = $activo;
                    }

                    if ($cambiosCampos && $registro->empresa_id === null && ! $editable) {
                        $e[] = 'Es un registro compartido entre empresas: no se puede modificar desde aquí. Agrega uno propio en una fila sin ID.';
                    }

                    // Renombrar a un nombre/código que ya existe
                    if (isset($cambiosCampos[$clave])) {
                        $otro = $porClave->get($this->normalizar($cambiosCampos[$clave]));
                        if ($otro && $otro->id !== $registro->id) {
                            $e[] = "Ya existe \"{$cambiosCampos[$clave]}\" (ID {$otro->id}).";
                        }
                    }

                    if (! $e && $cambiosCampos) {
                        $cambios[] = ['tipo' => $tipo, 'accion' => 'actualizar', 'fila' => $numFila, 'id' => $registro->id, 'datos' => $cambiosCampos];
                    }
                }
            } else {
                // ── Nuevo ──
                if ($valorClave === null) {
                    $e[] = "{$cfg['campos'][$clave][0]} es obligatorio.";
                } else {
                    $norm = $this->normalizar($valorClave);
                    if ($existe = $porClave->get($norm)) {
                        $e[] = "Ya existe \"{$valorClave}\" (ID {$existe->id}). Edita esa fila en lugar de agregar una nueva.";
                    }
                    if (isset($vistos["nuevo:{$norm}"])) {
                        $e[] = "\"{$valorClave}\" está repetido (fila {$vistos["nuevo:{$norm}"]}).";
                    }
                    $vistos["nuevo:{$norm}"] = $numFila;
                }
                if ($tipo === 'unidades' && $valores['nombre'] === null) {
                    $e[] = 'Nombre es obligatorio.';
                }

                if (! $e) {
                    $cambios[] = [
                        'tipo'   => $tipo,
                        'accion' => 'crear',
                        'fila'   => $numFila,
                        'id'     => null,
                        'datos'  => array_filter($valores, fn($v) => $v !== null) + ['activo' => $activo ?? true],
                    ];
                }
            }

            foreach ($e as $msg) {
                $errores[] = $this->error($nombreH, $numFila, $etiqueta, $msg);
            }
        }

        return [$cambios, $errores];
    }

    // ─────────────────────────────── Importación ───────────────────────────────

    /** Aplica los cambios validados. Debe llamarse dentro de la transacción de la importación. */
    public function aplicar(array $cambios): void
    {
        foreach ($cambios as $c) {
            $modelo = self::CATALOGOS[$c['tipo']]['modelo'];

            if ($c['accion'] === 'actualizar') {
                $modelo::whereKey($c['id'])->firstOrFail()->update($c['datos']);
                continue;
            }

            $datos = $c['datos'] + ['empresa_id' => $this->empresa->id];
            if ($c['tipo'] === 'proveedores') {
                $datos['fecha_registro'] = now();
            }
            if ($c['tipo'] === 'unidades') {
                $datos['codigo'] = strtoupper($datos['codigo']);
            }
            $modelo::create($datos);
        }
    }

    // ─────────────────────────────── Helpers ───────────────────────────────

    /** Registros de la empresa + compartidos, ordenados por nombre. */
    private function visibles(string $modelo): Collection
    {
        /** @var class-string<Model> $modelo */
        return $modelo::where(fn($q) => $q->where('empresa_id', $this->empresa->id)->orWhereNull('empresa_id'))
            ->orderBy('nombre')
            ->get();
    }

    /** Cantidad de productos de la empresa que usan cada registro del catálogo. */
    private function usoEnProductos(string $fk): Collection
    {
        return Producto::withoutGlobalScope('empresa')
            ->where('empresa_id', $this->empresa->id)
            ->whereNotNull($fk)
            ->groupBy($fk)
            ->selectRaw("{$fk} as fk, COUNT(*) as total")
            ->pluck('total', 'fk');
    }

    private function error(string $hoja, int $fila, ?string $nombre, string $mensaje): array
    {
        return ['hoja' => $hoja, 'fila' => $fila, 'sku' => null, 'nombre' => $nombre, 'mensaje' => $mensaje];
    }
}
