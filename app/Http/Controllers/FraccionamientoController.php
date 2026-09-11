<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class FraccionamientoController extends Controller
{
    public function index()
    {
        return Inertia::render('inventario/GestionarFraccionamientos');
    }

    public function create()
    {
        return Inertia::render('inventario/CrearFraccionamiento');
    }
}
