<?php

namespace App\Http\Controllers;

use App\Models\HistorialPrecio;
use App\Models\PrecioProducto;
use App\Models\TipoPrecio;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReportePreciosController extends Controller
{
    /**
     * Reporte de actualizaciones de precios (historial_precios): cada cambio con anterior → nuevo, motivo y usuario
     */
    public function index(Request $request): Response
    {
        $filtros = $this->validarFiltrosHistorial($request);

        $cambios = $this->queryHistorial($filtros)
            ->with(['precioProducto.producto:id,nombre,sku', 'precioProducto.unidadMedida:id,nombre', 'tipoPrecio:id,nombre,color'])
            ->orderByDesc('fecha_cambio')
            ->orderByDesc('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (HistorialPrecio $h) => $this->transformarCambio($h));

        $deEmpresa = fn () => HistorialPrecio::query()->whereHas('precioProducto.producto');

        return Inertia::render('reportes/precios/index', [
            'cambios'      => $cambios,
            'estadisticas' => $this->calcularEstadisticasHistorial($filtros),
            'filtros'      => $filtros,
            'tipos_precio' => TipoPrecio::porEmpresa()->ordenados()->get(['id', 'nombre', 'color']),
            'usuarios'     => $deEmpresa()->whereNotNull('usuario')->distinct()->orderBy('usuario')->pluck('usuario'),
            'motivos'      => $deEmpresa()->whereNotNull('motivo')->distinct()->orderBy('motivo')->pluck('motivo'),
        ]);
    }

    /**
     * Reporte de ganancias sobre ventas reales (aprobadas/facturadas).
     * - Costo vigente a la fecha de cada venta (según historial_precios), no el costo actual.
     * - Costo de la misma unidad en que se vendió (o convertido con conversiones_unidad_producto).
     * - Las ventas sin costo registrado no se suman a la ganancia: se reportan aparte.
     */
    public function ganancias(Request $request): Response
    {
        [$filtros, $filas, $error] = $this->gananciasFiltradas($request);

        if ($error) {
            return Inertia::render('reportes/ganancias/index', [
                'error'        => $error,
                'ganancias'    => new \Illuminate\Pagination\LengthAwarePaginator([], 0, 25),
                'estadisticas' => $this->resumirGanancias(collect()),
                'filtros'      => $filtros,
                'tipos_precio' => [],
            ]);
        }

        $page    = max(1, (int) $request->get('page', 1));
        $perPage = 25;

        $paginadas = new \Illuminate\Pagination\LengthAwarePaginator(
            $filas->slice(($page - 1) * $perPage, $perPage)->values(),
            $filas->count(),
            $perPage,
            $page,
            ['path' => route('reportes.ganancias.index'), 'query' => $request->query()]
        );

        return Inertia::render('reportes/ganancias/index', [
            'ganancias'    => $paginadas,
            'estadisticas' => $this->resumirGanancias($filas),
            'filtros'      => $filtros,
            'tipos_precio' => TipoPrecio::porEmpresa()->ganancias()->activos()->ordenados()->get(['id', 'nombre', 'color']),
        ]);
    }

    /**
     * Filtros validados + filas calculadas, filtradas por costo y ordenadas. Lo usan la pantalla, el Excel y el PDF.
     * Sin fechas se toma el mes actual (calcular todo el historial de ventas es innecesariamente pesado).
     *
     * @return array{0: array, 1: \Illuminate\Support\Collection, 2: ?string}
     */
    private function gananciasFiltradas(Request $request): array
    {
        $filtros = $request->validate([
            'fecha_desde'    => ['nullable', 'date'],
            'fecha_hasta'    => ['nullable', 'date'],
            'tipo_precio_id' => ['nullable', Rule::exists('tipos_precio', 'id')->where('empresa_id', auth()->user()?->empresa_id)],
            'costo'          => ['nullable', 'in:con_costo,sin_costo'],
            'q'              => ['nullable', 'string', 'max:255'],
            'orden'          => ['nullable', 'in:ganancia,margen,cantidad,ingresos,producto'],
            'direccion'      => ['nullable', 'in:asc,desc'],
        ]);

        if (empty($filtros['fecha_desde']) && empty($filtros['fecha_hasta'])) {
            $filtros['fecha_desde'] = now()->startOfMonth()->toDateString();
            $filtros['fecha_hasta'] = now()->toDateString();
        }

        $tipoCosto = TipoPrecio::porEmpresa()->precioBase()->first();
        if (! $tipoCosto) {
            return [$filtros, collect(), 'No se encontró un tipo de precio base (costo) configurado.'];
        }

        $filas = $this->calcularGanancias($filtros, $tipoCosto->id);

        if (($filtros['costo'] ?? null) === 'con_costo') {
            $filas = $filas->filter(fn ($f) => $f['estado_costo'] !== 'sin_costo');
        } elseif (($filtros['costo'] ?? null) === 'sin_costo') {
            $filas = $filas->filter(fn ($f) => $f['estado_costo'] !== 'completo');
        }

        return [$filtros, $this->ordenarGanancias($filas, $filtros['orden'] ?? 'ganancia', $filtros['direccion'] ?? 'desc'), null];
    }

    /**
     * Al ordenar por ganancia o margen, las filas sin costo van siempre al final (no tienen esos valores)
     */
    private function ordenarGanancias(\Illuminate\Support\Collection $filas, string $orden, string $direccion): \Illuminate\Support\Collection
    {
        $signo = $direccion === 'asc' ? 1 : -1;
        $campo = [
            'ganancia' => 'ganancia',
            'margen'   => 'margen',
            'cantidad' => 'cantidad_vendida',
            'ingresos' => 'ingresos_totales',
        ][$orden] ?? null;

        return $filas->sort(function ($a, $b) use ($orden, $campo, $signo) {
            if (in_array($orden, ['ganancia', 'margen'], true)) {
                $sinA = $a['estado_costo'] === 'sin_costo';
                $sinB = $b['estado_costo'] === 'sin_costo';
                if ($sinA !== $sinB) {
                    return $sinA <=> $sinB;
                }
                if ($sinA) {
                    return $b['ingresos_totales'] <=> $a['ingresos_totales'];
                }
            }

            $cmp = $campo
                ? ($a[$campo] ?? 0) <=> ($b[$campo] ?? 0)
                : strcasecmp($a['producto']['nombre'], $b['producto']['nombre']);

            return $cmp * $signo ?: strcasecmp($a['producto']['nombre'], $b['producto']['nombre']);
        })->values();
    }

    /**
     * Excel de ganancias con los mismos filtros y orden de la pantalla
     */
    public function exportGanancias(Request $request)
    {
        [$filtros, $filas, $error] = $this->gananciasFiltradas($request);
        abort_if($error !== null, 422, $error ?? '');

        $estados = ['completo' => 'Con costo', 'parcial' => 'Costo parcial', 'sin_costo' => 'Sin costo'];

        $libro = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $hoja  = $libro->getActiveSheet();
        $hoja->setTitle('Ganancias');

        $desde = \Carbon\Carbon::parse($filtros['fecha_desde'] ?? now())->format('d/m/Y');
        $hasta = \Carbon\Carbon::parse($filtros['fecha_hasta'] ?? now())->format('d/m/Y');
        $hoja->setCellValue('A1', "Reporte de ganancias del {$desde} al {$hasta}");
        $hoja->getStyle('A1')->getFont()->setBold(true)->setSize(13);

        $encabezados = ['ID Producto', 'Producto', 'SKU', 'Unidad', 'Tipo de precio', 'Cantidad', 'Precio prom.', 'Costo prom.',
            'Vendido', 'Vendido sin costo', 'Costo total', 'Ganancia', 'Margen %', '% s/costo', 'Estado costo', 'Última venta'];
        $hoja->fromArray($encabezados, null, 'A3');
        $hoja->getStyle('A3:P3')->getFont()->setBold(true);

        $fila = 4;
        foreach ($filas as $g) {
            $sinCosto = $g['estado_costo'] === 'sin_costo';
            $hoja->fromArray([
                $g['producto']['id'],
                $g['producto']['nombre'],
                $g['producto']['sku'],
                $g['unidad_medida'],
                $g['tipo_precio']['nombre'],
                $g['cantidad_vendida'],
                $g['precio_promedio'],
                $g['costo_promedio'],
                $g['ingresos_totales'],
                $g['ingresos_sin_costo'],
                $sinCosto ? null : $g['costos_totales'],
                $sinCosto ? null : $g['ganancia'],
                $g['margen'],
                $g['markup'],
                $estados[$g['estado_costo']] ?? $g['estado_costo'],
                $g['ultima_venta'],
            ], null, "A{$fila}", true);
            $fila++;
        }

        // Totales (ganancia y margen solo sobre lo vendido con costo, igual que en pantalla)
        $r = $this->resumirGanancias($filas);
        $hoja->fromArray(['', 'TOTAL', '', '', '', '', '', '', $r['ingresos_totales'], $r['ingresos_sin_costo'], $r['costos_totales'], $r['ganancia_total'], $r['margen']], null, "A{$fila}", true);
        $hoja->getStyle("A{$fila}:P{$fila}")->getFont()->setBold(true);

        $hoja->getStyle("G4:L{$fila}")->getNumberFormat()->setFormatCode('#,##0.00');
        $hoja->getStyle("M4:N{$fila}")->getNumberFormat()->setFormatCode('0.00');
        foreach (range('A', 'P') as $col) {
            $hoja->getColumnDimension($col)->setAutoSize(true);
        }
        $hoja->freezePane('A4');
        $hoja->setAutoFilter('A3:P' . max(3, $fila - 1));

        $nombre = 'ganancias_' . now()->format('Y-m-d_His') . '.xlsx';

        return response()->streamDownload(function () use ($libro) {
            (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($libro))->save('php://output');
        }, $nombre, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    /**
     * PDF imprimible (A4 vertical) del reporte de ganancias con los mismos filtros y orden de la pantalla
     */
    public function pdfGanancias(Request $request)
    {
        [$filtros, $filas, $error] = $this->gananciasFiltradas($request);
        abort_if($error !== null, 422, $error ?? '');

        $limite  = 2000;
        $ordenes = ['ganancia' => 'ganancia', 'margen' => 'margen', 'cantidad' => 'cantidad', 'ingresos' => 'vendido', 'producto' => 'producto'];

        $filtrosTexto   = [];
        $filtrosTexto[] = 'Fechas: ' . \Carbon\Carbon::parse($filtros['fecha_desde'] ?? now())->format('d/m/Y')
            . ' al ' . \Carbon\Carbon::parse($filtros['fecha_hasta'] ?? now())->format('d/m/Y');
        if (! empty($filtros['tipo_precio_id'])) {
            $filtrosTexto[] = 'Tipo: ' . (TipoPrecio::find($filtros['tipo_precio_id'])?->nombre ?? $filtros['tipo_precio_id']);
        }
        if (! empty($filtros['costo'])) {
            $filtrosTexto[] = $filtros['costo'] === 'con_costo' ? 'Solo con costo' : 'Solo sin costo';
        }
        if (! empty($filtros['q'])) {
            $filtrosTexto[] = "Producto: {$filtros['q']}";
        }
        $filtrosTexto[] = 'Orden: ' . ($ordenes[$filtros['orden'] ?? 'ganancia'] ?? 'ganancia')
            . (($filtros['direccion'] ?? 'desc') === 'asc' ? ' ascendente' : ' descendente');

        $empresa = \App\Models\Empresa::find(auth()->user()?->empresa_id) ?? new \App\Models\Empresa();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('impresion.reportes.ganancias-a4', [
            'empresa'               => $empresa,
            'logo_principal_base64' => $this->logoBase64($empresa->logo_principal),
            'filas'                 => $filas->take($limite),
            'truncado'              => $filas->count() > $limite,
            'total_filas'           => $filas->count(),
            'estadisticas'          => $this->resumirGanancias($filas),
            'filtros_texto'         => $filtrosTexto,
            'usuario'               => auth()->user()?->name ?? 'Sistema',
            'fecha_impresion'       => now(),
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('ganancias_' . now()->format('Y-m-d_His') . '.pdf');
    }

    /**
     * Agrupa las ventas por producto + unidad + tipo de precio y calcula costo y ganancia línea por línea
     */
    private function calcularGanancias(array $filtros, int $tipoCostoId): \Illuminate\Support\Collection
    {
        $empresaId = auth()->user()?->empresa_id;

        // Solo ventas efectivas: 3 = APROBADO, 4 = FACTURADO (antes se excluía solo el 2 = PENDIENTE y entraban las anuladas)
        $lineas = \Illuminate\Support\Facades\DB::table('detalle_ventas')
            ->join('ventas', 'ventas.id', '=', 'detalle_ventas.venta_id')
            ->join('productos', 'productos.id', '=', 'detalle_ventas.producto_id')
            ->where('productos.empresa_id', $empresaId)
            ->whereIn('ventas.estado_documento_id', [3, 4])
            ->when(! empty($filtros['fecha_desde']), fn ($q) => $q->whereDate('ventas.fecha', '>=', $filtros['fecha_desde']))
            ->when(! empty($filtros['fecha_hasta']), fn ($q) => $q->whereDate('ventas.fecha', '<=', $filtros['fecha_hasta']))
            ->when(! empty($filtros['tipo_precio_id']), fn ($q) => $q->where('detalle_ventas.tipo_precio_id', $filtros['tipo_precio_id']))
            ->when(! empty($filtros['q']), function ($q) use ($filtros) {
                $termino = trim($filtros['q']);
                $q->where(function ($q) use ($termino) {
                    if (ctype_digit($termino) && strlen($termino) <= 9) {
                        $q->orWhere('productos.id', (int) $termino);
                    }
                    $q->orWhere('productos.nombre', 'ilike', "%{$termino}%")
                        ->orWhere('productos.sku', 'ilike', "%{$termino}%")
                        ->orWhereExists(fn ($e) => $e->from('codigos_barra')
                            ->whereColumn('codigos_barra.producto_id', 'productos.id')
                            ->where('codigos_barra.activo', true)
                            ->where('codigos_barra.codigo', $termino));
                });
            })
            ->get([
                'detalle_ventas.producto_id',
                'detalle_ventas.cantidad',
                'detalle_ventas.subtotal',
                'detalle_ventas.unidad_medida_id',
                'detalle_ventas.tipo_precio_id',
                'detalle_ventas.tipo_precio_nombre',
                'ventas.created_at as fecha_venta',
                'productos.nombre as producto_nombre',
                'productos.sku',
                'productos.unidad_medida_id as unidad_base_id',
            ]);

        if ($lineas->isEmpty()) {
            return collect();
        }

        $productoIds = $lineas->pluck('producto_id')->unique()->values();

        // Precios de costo (activos y quitados: uno quitado después de la venta era el vigente en ese momento)
        $costos = PrecioProducto::whereIn('producto_id', $productoIds)
            ->where('tipo_precio_id', $tipoCostoId)
            ->get(['id', 'producto_id', 'unidad_medida_id', 'precio', 'activo'])
            ->groupBy('producto_id');

        $historial = HistorialPrecio::whereIn('precio_producto_id', $costos->flatten()->pluck('id'))
            ->orderBy('fecha_cambio')
            ->orderBy('id')
            ->get(['precio_producto_id', 'valor_anterior', 'valor_nuevo', 'fecha_cambio'])
            ->groupBy('precio_producto_id');

        $conversiones = \Illuminate\Support\Facades\DB::table('conversiones_unidad_producto')
            ->whereIn('producto_id', $productoIds)
            ->where('activo', true)
            ->get(['producto_id', 'unidad_base_id', 'unidad_destino_id', 'factor_conversion'])
            ->groupBy('producto_id');

        $unidades = \App\Models\UnidadMedida::whereIn('id', $lineas->pluck('unidad_medida_id')->merge($lineas->pluck('unidad_base_id'))->filter()->unique())
            ->pluck('nombre', 'id');
        $tipos = TipoPrecio::whereIn('id', $lineas->pluck('tipo_precio_id')->filter()->unique())->get(['id', 'nombre', 'color'])->keyBy('id');

        // Costo de un precio en una fecha: el valor_anterior del primer cambio posterior a la venta;
        // si no cambió después, su valor actual (solo si sigue activo). Un anterior 0 indica que aún no existía:
        // se toma el primer costo registrado para no dejar sin costo todas las ventas previas a la carga del costo.
        $costoEnFecha = function (PrecioProducto $pp, string $fecha) use ($historial): ?float {
            $cambios   = $historial->get($pp->id, collect());
            $siguiente = $cambios->first(fn ($h) => $h->fecha_cambio->format('Y-m-d H:i:s') > $fecha);
            if ($siguiente) {
                $valor = (float) $siguiente->valor_anterior > 0 ? (float) $siguiente->valor_anterior : (float) $siguiente->valor_nuevo;
            } else {
                $valor = $pp->activo ? (float) $pp->precio : 0.0;
            }

            return $valor > 0 ? $valor : null;
        };

        // Costo unitario de una línea en su unidad de venta; null si no hay costo aplicable
        $costoLinea = function ($l) use ($costos, $conversiones, $costoEnFecha): ?float {
            $preciosCosto = $costos->get($l->producto_id, collect());
            if ($preciosCosto->isEmpty()) {
                return null;
            }
            $unidadVenta = $l->unidad_medida_id ?: $l->unidad_base_id;
            $fecha       = (string) $l->fecha_venta;

            // 1) Costo registrado en la misma unidad en que se vendió (sin unidad = unidad base del producto)
            foreach ($preciosCosto->sortByDesc('activo') as $pp) {
                if (($pp->unidad_medida_id ?: $l->unidad_base_id) == $unidadVenta && ($c = $costoEnFecha($pp, $fecha)) !== null) {
                    return $c;
                }
            }

            // 2) Convertir desde el costo de otra unidad con las conversiones del producto
            foreach ($conversiones->get($l->producto_id, collect()) as $conv) {
                $factor = (float) $conv->factor_conversion;
                if ($factor <= 0) {
                    continue;
                }
                foreach ($preciosCosto->sortByDesc('activo') as $pp) {
                    $unidadCosto = $pp->unidad_medida_id ?: $l->unidad_base_id;
                    $c           = null;
                    if ($unidadCosto == $conv->unidad_base_id && $unidadVenta == $conv->unidad_destino_id) {
                        // 1 base = factor destino → costo por destino = costo base / factor
                        $c = ($v = $costoEnFecha($pp, $fecha)) !== null ? $v / $factor : null;
                    } elseif ($unidadCosto == $conv->unidad_destino_id && $unidadVenta == $conv->unidad_base_id) {
                        $c = ($v = $costoEnFecha($pp, $fecha)) !== null ? $v * $factor : null;
                    }
                    if ($c !== null) {
                        return $c;
                    }
                }
            }

            return null;
        };

        $grupos = [];
        foreach ($lineas as $l) {
            $unidadVenta = $l->unidad_medida_id ?: $l->unidad_base_id;
            $key         = "{$l->producto_id}_{$unidadVenta}_{$l->tipo_precio_id}";
            $cantidad    = (float) $l->cantidad;
            $ingreso     = (float) $l->subtotal;
            $costoUnit   = $costoLinea($l);

            if (! isset($grupos[$key])) {
                $tipo          = $tipos->get($l->tipo_precio_id);
                $grupos[$key]  = [
                    'key'               => $key,
                    'producto'          => ['id' => $l->producto_id, 'nombre' => $l->producto_nombre, 'sku' => $l->sku],
                    'unidad_medida'     => $unidades->get($unidadVenta),
                    'tipo_precio'       => [
                        'id'     => $l->tipo_precio_id,
                        'nombre' => $tipo?->nombre ?? $l->tipo_precio_nombre ?? 'Sin tipo',
                        'color'  => $tipo?->color,
                    ],
                    'cantidad_vendida'  => 0.0,
                    'ingresos_totales'  => 0.0,
                    'ingresos_con_costo'=> 0.0,
                    'ingresos_sin_costo'=> 0.0,
                    'cantidad_con_costo'=> 0.0,
                    'costos_totales'    => 0.0,
                    'ultima_venta'      => null,
                ];
            }

            $g = &$grupos[$key];
            $g['cantidad_vendida'] += $cantidad;
            $g['ingresos_totales'] += $ingreso;
            if ($costoUnit !== null) {
                $g['ingresos_con_costo'] += $ingreso;
                $g['cantidad_con_costo'] += $cantidad;
                $g['costos_totales']     += $costoUnit * $cantidad;
            } else {
                $g['ingresos_sin_costo'] += $ingreso;
            }
            $g['ultima_venta'] = max($g['ultima_venta'] ?? '', substr((string) $l->fecha_venta, 0, 10));
            unset($g);
        }

        return collect($grupos)->map(function ($g) {
            $ganancia = $g['ingresos_con_costo'] - $g['costos_totales'];
            $estado   = $g['ingresos_sin_costo'] <= 0 ? 'completo' : ($g['ingresos_con_costo'] > 0 ? 'parcial' : 'sin_costo');

            return array_merge($g, [
                'estado_costo'     => $estado,
                'precio_promedio'  => $g['cantidad_vendida'] > 0 ? round($g['ingresos_totales'] / $g['cantidad_vendida'], 2) : 0,
                'costo_promedio'   => $g['cantidad_con_costo'] > 0 ? round($g['costos_totales'] / $g['cantidad_con_costo'], 2) : null,
                'ganancia'         => round($ganancia, 2),
                // Margen sobre la venta y markup sobre el costo, solo con las ventas que tienen costo
                'margen'           => $g['ingresos_con_costo'] > 0 ? round($ganancia / $g['ingresos_con_costo'] * 100, 2) : null,
                'markup'           => $g['costos_totales'] > 0 ? round($ganancia / $g['costos_totales'] * 100, 2) : null,
                'ingresos_totales' => round($g['ingresos_totales'], 2),
                'costos_totales'   => round($g['costos_totales'], 2),
            ]);
        })->values();
    }

    private function resumirGanancias(\Illuminate\Support\Collection $filas): array
    {
        $ingresosConCosto = $filas->sum('ingresos_con_costo');
        $costos           = $filas->sum('costos_totales');
        $ganancia         = $ingresosConCosto - $costos;
        $sinCosto         = $filas->filter(fn ($f) => $f['estado_costo'] !== 'completo');

        return [
            'ingresos_totales'      => round($filas->sum('ingresos_totales'), 2),
            'ingresos_con_costo'    => round($ingresosConCosto, 2),
            'costos_totales'        => round($costos, 2),
            'ganancia_total'        => round($ganancia, 2),
            'margen'                => $ingresosConCosto > 0 ? round($ganancia / $ingresosConCosto * 100, 2) : null,
            'ingresos_sin_costo'    => round($filas->sum('ingresos_sin_costo'), 2),
            'productos_sin_costo'   => $sinCosto->pluck('producto.id')->unique()->count(),
            'productos_vendidos'    => $filas->pluck('producto.id')->unique()->count(),
            'productos_con_perdida' => $filas->filter(fn ($f) => $f['estado_costo'] !== 'sin_costo' && $f['ganancia'] < 0)->pluck('producto.id')->unique()->count(),
        ];
    }

    /**
     * Exporta a Excel las actualizaciones de precios con los mismos filtros del reporte
     */
    public function export(Request $request)
    {
        $filtros = $this->validarFiltrosHistorial($request);

        $cambios = $this->queryHistorial($filtros)
            ->with(['precioProducto.producto:id,nombre,sku', 'precioProducto.unidadMedida:id,nombre', 'tipoPrecio:id,nombre,color'])
            ->orderByDesc('fecha_cambio')
            ->orderByDesc('id')
            ->limit(20000)
            ->get()
            ->map(fn (HistorialPrecio $h) => $this->transformarCambio($h));

        $libro = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $hoja  = $libro->getActiveSheet();
        $hoja->setTitle('Actualizaciones');

        $hoja->fromArray(['Fecha', 'ID Producto', 'Producto', 'SKU', 'Tipo de precio', 'Unidad', 'Anterior', 'Nuevo', 'Variación Bs', 'Variación %', 'Motivo', 'Usuario'], null, 'A1');
        $hoja->getStyle('A1:L1')->getFont()->setBold(true);

        $fila = 2;
        foreach ($cambios as $c) {
            $hoja->fromArray([
                $c['fecha_cambio'],
                $c['producto']['id'] ?? null,
                $c['producto']['nombre'] ?? '',
                $c['producto']['sku'] ?? '',
                $c['tipo_precio']['nombre'] ?? '',
                $c['unidad_medida'] ?? '',
                $c['valor_anterior'],
                $c['valor_nuevo'],
                $c['variacion'],
                $c['porcentaje_cambio'],
                $c['motivo'] ?? '',
                $c['usuario'] ?? '',
            ], null, "A{$fila}", true);
            $fila++;
        }

        $hoja->getStyle("G2:I{$fila}")->getNumberFormat()->setFormatCode('#,##0.00');
        $hoja->getStyle("J2:J{$fila}")->getNumberFormat()->setFormatCode('0.00');
        foreach (range('A', 'L') as $col) {
            $hoja->getColumnDimension($col)->setAutoSize(true);
        }
        $hoja->freezePane('A2');
        $hoja->setAutoFilter('A1:L' . max(1, $fila - 1));

        $nombre = 'actualizaciones_precios_' . now()->format('Y-m-d_His') . '.xlsx';

        return response()->streamDownload(function () use ($libro) {
            (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($libro))->save('php://output');
        }, $nombre, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    /**
     * PDF imprimible (A4 vertical) de las actualizaciones de precios con los mismos filtros del reporte
     */
    public function pdf(Request $request)
    {
        $filtros = $this->validarFiltrosHistorial($request);
        $limite  = 2000; // dompdf se vuelve muy lento con más filas; para más está el Excel

        $cambios = $this->queryHistorial($filtros)
            ->with(['precioProducto.producto:id,nombre,sku', 'precioProducto.unidadMedida:id,nombre', 'tipoPrecio:id,nombre,color'])
            ->orderByDesc('fecha_cambio')
            ->orderByDesc('id')
            ->limit($limite + 1)
            ->get()
            ->map(fn (HistorialPrecio $h) => $this->transformarCambio($h));

        $truncado = $cambios->count() > $limite;
        $cambios  = $cambios->take($limite);

        // Descripción legible de los filtros aplicados
        $filtrosTexto = [];
        if (! empty($filtros['fecha_desde']) || ! empty($filtros['fecha_hasta'])) {
            $desde          = ! empty($filtros['fecha_desde']) ? \Carbon\Carbon::parse($filtros['fecha_desde'])->format('d/m/Y') : 'inicio';
            $hasta          = ! empty($filtros['fecha_hasta']) ? \Carbon\Carbon::parse($filtros['fecha_hasta'])->format('d/m/Y') : 'hoy';
            $filtrosTexto[] = "Fechas: {$desde} al {$hasta}";
        }
        if (! empty($filtros['tipo_precio_id'])) {
            $filtrosTexto[] = 'Tipo: ' . (TipoPrecio::find($filtros['tipo_precio_id'])?->nombre ?? $filtros['tipo_precio_id']);
        }
        if (! empty($filtros['variacion'])) {
            $filtrosTexto[] = $filtros['variacion'] === 'sube' ? 'Solo subidas' : 'Solo bajadas';
        }
        if (! empty($filtros['usuario'])) {
            $filtrosTexto[] = "Usuario: {$filtros['usuario']}";
        }
        if (! empty($filtros['motivo'])) {
            $filtrosTexto[] = "Motivo: {$filtros['motivo']}";
        }
        if (! empty($filtros['q'])) {
            $filtrosTexto[] = "Producto: {$filtros['q']}";
        }

        // Empresa del usuario (no la "principal"): el sistema es multiempresa
        $empresa = \App\Models\Empresa::find(auth()->user()?->empresa_id) ?? new \App\Models\Empresa();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('impresion.reportes.actualizaciones-precios-a4', [
            'empresa'               => $empresa,
            'logo_principal_base64' => $this->logoBase64($empresa->logo_principal),
            'cambios'               => $cambios,
            'truncado'              => $truncado,
            'estadisticas'          => $this->calcularEstadisticasHistorial($filtros),
            'filtros_texto'         => $filtrosTexto,
            'usuario'               => auth()->user()?->name ?? 'Sistema',
            'fecha_impresion'       => now(),
        ])->setPaper('a4', 'portrait');

        // inline: se abre en el navegador listo para imprimir
        return $pdf->stream('actualizaciones_precios_' . now()->format('Y-m-d_His') . '.pdf');
    }

    private function logoBase64(?string $logoUrl): ?string
    {
        if (! $logoUrl) {
            return null;
        }
        if (str_starts_with($logoUrl, 'data:')) {
            return $logoUrl;
        }
        $ruta = public_path($logoUrl);
        if (! is_file($ruta)) {
            return null;
        }
        $mime = mime_content_type($ruta) ?: 'image/png';

        return 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($ruta));
    }

    private function validarFiltrosHistorial(Request $request): array
    {
        return $request->validate([
            'fecha_desde'    => ['nullable', 'date'],
            'fecha_hasta'    => ['nullable', 'date'],
            'tipo_precio_id' => ['nullable', Rule::exists('tipos_precio', 'id')->where('empresa_id', auth()->user()?->empresa_id)],
            'usuario'        => ['nullable', 'string', 'max:255'],
            'motivo'         => ['nullable', 'string', 'max:500'],
            'variacion'      => ['nullable', 'in:sube,baja'],
            'q'              => ['nullable', 'string', 'max:255'],
        ]);
    }

    /**
     * Cambios de precio de la empresa con los filtros aplicados.
     * whereHas('precioProducto.producto') aplica el scope de empresa de Producto.
     */
    private function queryHistorial(array $filtros)
    {
        $query = HistorialPrecio::query()->whereHas('precioProducto.producto', function ($q) use ($filtros) {
            if (empty($filtros['q'])) {
                return;
            }
            $termino = trim($filtros['q']);
            $q->where(function ($q) use ($termino) {
                if (ctype_digit($termino) && strlen($termino) <= 9) {
                    $q->orWhere('productos.id', (int) $termino);
                }
                $q->orWhere('nombre', 'ilike', "%{$termino}%")
                    ->orWhere('sku', 'ilike', "%{$termino}%")
                    ->orWhereHas('codigosBarra', fn ($cb) => $cb->where('activo', true)->where('codigo', $termino));
            });
        });

        if (! empty($filtros['fecha_desde'])) {
            $query->where('historial_precios.fecha_cambio', '>=', $filtros['fecha_desde'] . ' 00:00:00');
        }
        if (! empty($filtros['fecha_hasta'])) {
            $query->where('historial_precios.fecha_cambio', '<=', $filtros['fecha_hasta'] . ' 23:59:59');
        }
        if (! empty($filtros['tipo_precio_id'])) {
            $query->where('historial_precios.tipo_precio_id', $filtros['tipo_precio_id']);
        }
        if (! empty($filtros['usuario'])) {
            $query->where('historial_precios.usuario', $filtros['usuario']);
        }
        if (! empty($filtros['motivo'])) {
            $query->where('historial_precios.motivo', $filtros['motivo']);
        }
        if (($filtros['variacion'] ?? null) === 'sube') {
            $query->whereColumn('historial_precios.valor_nuevo', '>', 'historial_precios.valor_anterior');
        } elseif (($filtros['variacion'] ?? null) === 'baja') {
            $query->whereColumn('historial_precios.valor_nuevo', '<', 'historial_precios.valor_anterior');
        }

        return $query;
    }

    private function transformarCambio(HistorialPrecio $h): array
    {
        $anterior = (float) $h->valor_anterior;
        $nuevo    = (float) $h->valor_nuevo;
        $producto = $h->precioProducto?->producto;

        return [
            'id'                => $h->id,
            'fecha_cambio'      => $h->fecha_cambio?->format('Y-m-d H:i'),
            'producto'          => $producto ? ['id' => $producto->id, 'nombre' => $producto->nombre, 'sku' => $producto->sku] : null,
            'tipo_precio'       => $h->tipoPrecio ? ['id' => $h->tipoPrecio->id, 'nombre' => $h->tipoPrecio->nombre, 'color' => $h->tipoPrecio->color] : null,
            'unidad_medida'     => $h->precioProducto?->unidadMedida?->nombre,
            'precio_activo'     => (bool) $h->precioProducto?->activo,
            'valor_anterior'    => $anterior,
            'valor_nuevo'       => $nuevo,
            'variacion'         => round($nuevo - $anterior, 2),
            // Se calcula aquí: el valor guardado no es confiable en altas desde 0
            'porcentaje_cambio' => $anterior > 0 ? round((($nuevo - $anterior) / $anterior) * 100, 2) : null,
            'motivo'            => $h->motivo,
            'usuario'           => $h->usuario,
        ];
    }

    private function calcularEstadisticasHistorial(array $filtros): array
    {
        $resumen = $this->queryHistorial($filtros)
            ->join('precios_producto', 'precios_producto.id', '=', 'historial_precios.precio_producto_id')
            ->selectRaw('COUNT(*) AS total_cambios')
            ->selectRaw('COUNT(DISTINCT precios_producto.producto_id) AS productos_afectados')
            ->selectRaw('SUM(CASE WHEN historial_precios.valor_nuevo > historial_precios.valor_anterior THEN 1 ELSE 0 END) AS subidas')
            ->selectRaw('SUM(CASE WHEN historial_precios.valor_nuevo < historial_precios.valor_anterior THEN 1 ELSE 0 END) AS bajadas')
            ->selectRaw('AVG(CASE WHEN historial_precios.valor_anterior > 0 AND historial_precios.valor_nuevo > 0 THEN (historial_precios.valor_nuevo - historial_precios.valor_anterior) / historial_precios.valor_anterior * 100 END) AS variacion_promedio')
            ->toBase()
            ->first();

        $porUsuario = $this->queryHistorial($filtros)
            ->selectRaw("COALESCE(historial_precios.usuario, 'Sin usuario') AS usuario, COUNT(*) AS cambios")
            ->groupByRaw("COALESCE(historial_precios.usuario, 'Sin usuario')")
            ->orderByDesc('cambios')
            ->limit(5)
            ->toBase()
            ->get()
            ->map(fn ($r) => ['usuario' => $r->usuario, 'cambios' => (int) $r->cambios]);

        return [
            'total_cambios'       => (int) ($resumen->total_cambios ?? 0),
            'productos_afectados' => (int) ($resumen->productos_afectados ?? 0),
            'subidas'             => (int) ($resumen->subidas ?? 0),
            'bajadas'             => (int) ($resumen->bajadas ?? 0),
            'variacion_promedio'  => isset($resumen->variacion_promedio) ? round((float) $resumen->variacion_promedio, 2) : null,
            'por_usuario'         => $porUsuario,
        ];
    }
}
