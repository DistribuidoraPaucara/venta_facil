# 🏢 Estrategia Multi-Tenancy (Tenancy Mode)

## Descripción General
Implementación de multi-tenancy híbrido en los modelos maestros del sistema. Cada empresa puede tener sus propias configuraciones de Marca, Categoría y Tipo de Precio, mientras que Unidad de Medida permanece como dato global.

---

## 📋 Matriz de Implementación

| Modelo | Tipo | Scope | Relación | Notas |
|--------|------|-------|----------|-------|
| **UnidadMedida** | 🌍 Global | N/A | - | Estándares internacionales (kg, L, m, etc) |
| **Marca** | 🏢 Por Empresa | `->porEmpresa()` | `belongsTo(Empresa)` | Cada empresa sus propias marcas |
| **Categoria** | 🏢 Por Empresa | `->porEmpresa()` | `belongsTo(Empresa)` | Cada empresa su taxonomía |
| **TipoPrecio** | 🏢 Por Empresa | `->porEmpresa()` | `belongsTo(Empresa)` | Políticas de precio por empresa |
| **Producto** | 🏢 Por Empresa | `->porEmpresa()` | `belongsTo(Empresa)` | Ya implementado |

---

## 🔧 Cambios Realizados

### 1. **Migraciones Creadas**
```
2026_09_03_000001_add_empresa_id_to_marcas_table.php
2026_09_03_000002_add_empresa_id_to_categorias_table.php
2026_09_03_000003_add_empresa_id_to_tipos_precio_table.php
```

**Características:**
- Campo `empresa_id` nullable y con índice
- Foreign key con cascada (DELETE)
- Orden después del id para consistencia

### 2. **Modelos Actualizados**

#### ✅ Marca.php
```php
protected $fillable = [..., 'empresa_id'];

public function empresa() { ... }
public function scopePorEmpresa($query, $empresaId = null) { ... }
public function scopeActivas($query) { ... }
```

#### ✅ Categoria.php
```php
protected $fillable = [..., 'empresa_id'];

public function empresa() { ... }
public function scopePorEmpresa($query, $empresaId = null) { ... }
public function scopeActivas($query) { ... }
```

#### ✅ TipoPrecio.php
```php
protected $fillable = [..., 'empresa_id'];

public function empresa() { ... }
public function scopePorEmpresa($query, $empresaId = null) { ... }
```

#### ✅ UnidadMedida.php
- Sin cambios de estructura (permanece global)
- Agregados scopes para claridad
- Documentado como "datos maestros globales"

#### ✅ Empresa.php
```php
public function marcas() { ... }
public function categorias() { ... }
public function tiposPrecio() { ... }
public function productos() { ... }
```

---

## 🎯 Patrones de Uso

### Obtener datos de la empresa actual del usuario
```php
// Marca
$marcas = Marca::porEmpresa()->activas()->get();
$marcas = Marca::porEmpresa(auth()->user()->empresa_id)->get();

// Categoría
$categorias = Categoria::porEmpresa()->activas()->get();

// Tipo de Precio
$tiposPrecio = TipoPrecio::porEmpresa()->ordenados()->get();

// Unidad de Medida (global, sin scopePorEmpresa)
$unidades = UnidadMedida::activas()->get();
```

### Obtener datos de una empresa específica
```php
$marcas = Marca::porEmpresa(5)->get();
$categorias = Categoria::porEmpresa($empresaId)->activas()->get();
```

### Crear registros
```php
// Automático si hay usuario autenticado
$marca = Marca::create([
    'nombre' => 'Nike',
    'empresa_id' => auth()->user()->empresa_id,
]);

// Manual
$marca = $empresa->marcas()->create([
    'nombre' => 'Nike',
    'descripcion' => '...',
]);
```

---

## 🔒 Seguridad y Validación

### ✅ Implementado
- Foreign keys con cascada en migraciones
- Scopes que filtran automáticamente por usuario
- Relaciones inversas para acceso desde Empresa

### ⚠️ Pendiente en Controllers/Services
Revisar y actualizar donde sea necesario:
- Queries que seleccionen Marca, Categoría, TipoPrecio
- Formularios de creación/edición
- Exports y reportes
- APIs que devuelvan estos datos

---

## 📝 Checklist de Próximos Pasos

- [ ] Ejecutar migraciones: `php artisan migrate`
- [ ] Revisar/actualizar Controllers que usan Marca, Categoria, TipoPrecio
- [ ] Actualizar Requests/Validations con empresa_id
- [ ] Revisar Seeder con datos de empresa_id
- [ ] Testear filtrado por empresa en vistas
- [ ] Verificar APIs que exponen estos modelos
- [ ] Documentar cambios en notas de release

---

## 📚 Referencia Rápida

| Situación | Código |
|-----------|--------|
| Listar de usuario actual | `Model::porEmpresa()->get()` |
| Listar de empresa específica | `Model::porEmpresa($id)->get()` |
| Datos globales (UnidadMedida) | `UnidadMedida::activas()->get()` |
| Crear en empresa actual | `Model::create([..., 'empresa_id' => auth()->user()->empresa_id])` |
| Crear vía relación | `$empresa->marcas()->create([...])` |

