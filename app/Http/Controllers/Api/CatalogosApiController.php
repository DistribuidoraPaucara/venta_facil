<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Almacen;
use App\Models\Categoria;
use App\Models\Marca;
use App\Models\Proveedor;
use App\Models\Sector;
use App\Models\UnidadMedida;

class CatalogosApiController extends Controller
{
    public function categorias()
    {
        return response()->json([
            'success' => true,
            'data' => Categoria::where('activo', true)
                ->select('id', 'nombre')
                ->get()
        ]);
    }

    public function marcas()
    {
        return response()->json([
            'success' => true,
            'data' => Marca::where('activo', true)
                ->select('id', 'nombre')
                ->get()
        ]);
    }

    public function proveedores()
    {
        return response()->json([
            'success' => true,
            'data' => Proveedor::where('activo', true)
                ->select('id', 'nombre')
                ->get()
        ]);
    }

    public function unidadesMedida()
    {
        return response()->json([
            'success' => true,
            'data' => UnidadMedida::where('activo', true)
                ->select('id', 'nombre', 'codigo')
                ->get()
        ]);
    }

    public function almacenes()
    {
        return response()->json([
            'success' => true,
            'data' => Almacen::where('activo', true)
                ->select('id', 'nombre')
                ->get()
        ]);
    }

    public function sectores()
    {
        return response()->json([
            'success' => true,
            'data' => Sector::select('id', 'nombre', 'almacen_id')
                ->get()
        ]);
    }

    public function sectoresPorAlmacen($almacen_id)
    {
        \Log::info('🔄 [CatalogosApiController] Cargando sectores para almacén: ' . $almacen_id);

        $sectores = Sector::where('almacen_id', $almacen_id)
            ->where('activo', true)
            ->select('id', 'nombre')
            ->get();

        \Log::info('✅ [CatalogosApiController] Sectores encontrados: ' . $sectores->count());

        return response()->json([
            'success' => true,
            'data' => $sectores
        ]);
    }
}
