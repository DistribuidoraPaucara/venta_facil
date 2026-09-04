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
            'data' => Categoria::porEmpresa()
                ->where('activo', true)
                ->select('id', 'nombre')
                ->get()
        ]);
    }

    public function marcas()
    {
        return response()->json([
            'success' => true,
            'data' => Marca::porEmpresa()
                ->where('activo', true)
                ->select('id', 'nombre')
                ->get()
        ]);
    }

    public function proveedores()
    {
        return response()->json([
            'success' => true,
            'data' => Proveedor::porEmpresa()
                ->where('activo', true)
                ->select('id', 'nombre')
                ->get()
        ]);
    }

    public function unidadesMedida()
    {
        return response()->json([
            'success' => true,
            'data' => UnidadMedida::porEmpresa()
                ->where('activo', true)
                ->select('id', 'nombre', 'codigo')
                ->get()
        ]);
    }

    public function almacenes()
    {
        return response()->json([
            'success' => true,
            'data' => Almacen::porEmpresa()
                ->where('activo', true)
                ->select('id', 'nombre')
                ->get()
        ]);
    }

    public function sectores()
    {
        return response()->json([
            'success' => true,
            'data' => Sector::porEmpresa()
                ->select('id', 'nombre', 'almacen_id')
                ->get()
        ]);
    }

    public function sectoresPorAlmacen($almacen_id)
    {
        \Log::info('🔄 [CatalogosApiController] Cargando sectores para almacén: ' . $almacen_id);

        // Validar que el almacén pertenece a la empresa del usuario
        $almacen = Almacen::porEmpresa()->find($almacen_id);
        if (!$almacen) {
            return response()->json([
                'success' => false,
                'message' => 'Almacén no encontrado o no tiene acceso'
            ], 404);
        }

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
