# 🚀 Instalación UI Fraccionamientos

Pasos para registrar la página en tu aplicación Laravel.

## 1. Registrar la Ruta

En `routes/web.php`, agrega la ruta dentro del middleware autenticado:

```php
Route::middleware(['auth', 'web'])->group(function () {
    // ... otras rutas

    Route::get('/inventario/fraccionamientos', 
        [\App\Http\Controllers\FraccionamientoController::class, 'index'])
        ->name('fraccionamientos.index');
});
```

## 2. Crear el Controller

Archivo: `app/Http/Controllers/FraccionamientoController.php`

```php
<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class FraccionamientoController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventario/GestionarFraccionamientos');
    }
}
```

## 3. Agregar al Menú del Sidebar

Si tienes un archivo de configuración de menú, agrega:

```php
[
    'title' => 'Fraccionamientos',
    'href' => route('fraccionamientos.index'),
    'icon' => 'package', // o el icono que prefieras
    'parent' => 'Inventario', // si está dentro de un submenu
]
```

O si es manual en el layout:

```jsx
<Link href={route('fraccionamientos.index')}>
  📦 Fraccionamientos
</Link>
```

## 4. Permisos (Opcional)

Si usas políticas de autorización, agrega en `app/Policies/FraccionamientoPolicy.php`:

```php
<?php

namespace App\Policies;

use App\Models\User;

class FraccionamientoPolicy
{
    public function view(User $user): bool
    {
        return $user->hasPermission('fraccionamientos.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('fraccionamientos.create');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermission('fraccionamientos.delete');
    }
}
```

## 5. Estructura de Carpetas

Asegúrate que existan estas carpetas:

```
resources/js/presentation/
├── pages/
│   └── inventario/
│       └── GestionarFraccionamientos.tsx
└── components/
    └── modals/
        ├── CrearFraccionamientoModal.tsx
        └── DetallesFraccionamientoModal.tsx
```

## 6. Variables de Entorno (si es necesario)

Verifica que tu `.env` tenga configurado correctamente:

```
APP_URL=http://localhost
SANCTUM_STATEFUL_DOMAINS=localhost
```

## 7. Ejecutar Migration

```bash
php artisan migrate
```

## 8. Compilar Assets (si usas npm/yarn)

```bash
npm run dev
```

o

```bash
npm run build
```

## ✅ Verificación

Después de instalar, verifica:

1. ✅ La página carga sin errores en `/inventario/fraccionamientos`
2. ✅ Puedes crear un fraccionamiento
3. ✅ Se registra en la BD
4. ✅ Se actualiza el stock automáticamente
5. ✅ Se puede ver el historial
6. ✅ Se puede revertir un fraccionamiento

## 🐛 Problemas Comunes

### Error 404 en Ruta
- Verifica que la ruta esté en `routes/web.php` dentro del middleware autenticado
- Limpia la caché: `php artisan route:clear`

### Modal no se abre
- Verifica que los componentes Modal estén en las carpetas correctas
- Asegúrate de que los imports sean correctos

### API retorna error 401
- Verifica que el usuario esté autenticado
- Comprueba que el CSRF token se está enviando correctamente

### Stock no se actualiza
- Verifica que el usuario tenga permisos
- Comprueba los logs en `storage/logs/laravel.log`

## 📝 Documentación

Toda la documentación de la API está en `FRACCIONAMIENTO_API.md`.

---

## 🎯 URLs Disponibles

Una vez instalado, tendrás acceso a:

- **Web UI**: `GET /inventario/fraccionamientos` → Página principal
- **API Crear**: `POST /api/inventario/fraccionamientos`
- **API Listar**: `GET /api/inventario/fraccionamientos`
- **API Ver**: `GET /api/inventario/fraccionamientos/{id}`
- **API Revertir**: `DELETE /api/inventario/fraccionamientos/{id}/revertir`
- **API Historial**: `GET /api/inventario/fraccionamientos/producto/{id}/historial`
- **API Stats**: `GET /api/inventario/fraccionamientos/producto/{id}/estadisticas`

---

¡Listo! Tu UI de fraccionamientos está completamente operativa.
