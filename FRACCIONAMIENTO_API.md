# 📦 API de Fraccionamiento de Productos

Sistema completo para gestionar el fraccionamiento de productos con trazabilidad e auditoría.

## 🗂️ Tabla: `movimientos_fraccionamiento`

Almacena todos los fraccionamientos realizados con auditoría completa.

### Campos:
```
id                    : ID único del fraccionamiento
producto_padre_id     : ID del producto que se fraccionó
cantidad_padre        : Cantidad fraccionada (decimal:4)
unidad_padre_id       : Unidad de medida del padre
producto_hijo_id      : ID del producto resultado
cantidad_hijo         : Cantidad generada (decimal:4)
unidad_hijo_id        : Unidad de medida del hijo
almacen_id            : Almacén donde ocurrió
sector_id             : Sector donde ocurrió
usuario_id            : Usuario que realizó el fraccionamiento
fecha_fraccionamiento : Timestamp del evento
razon                 : Razón del fraccionamiento
notas                 : Notas adicionales
empresa_id            : Empresa propietaria
created_at, updated_at: Timestamps automáticos
deleted_at            : Para soft deletes (reverversión)
```

---

## 📍 Endpoints de la API

### 1. Crear Fraccionamiento

**POST** `/api/inventario/fraccionamientos`

#### Request:
```json
{
  "producto_padre_id": 1,
  "cantidad_padre": 5,
  "producto_hijo_id": 2,
  "cantidad_hijo": 50,
  "almacen_id": 1,
  "sector_id": 1,
  "razon": "fraccionamiento_manual",
  "notas": "Fraccionamiento de paquetes en cajetillas"
}
```

#### Response (201):
```json
{
  "success": true,
  "message": "Fraccionamiento realizado exitosamente",
  "data": {
    "id": 1,
    "producto_padre_id": 1,
    "cantidad_padre": "5.0000",
    "unidad_padre_id": 1,
    "productoPadre": {
      "id": 1,
      "nombre": "Cigarros - Paquete",
      "sku": "CIG-PAQ"
    },
    "producto_hijo_id": 2,
    "cantidad_hijo": "50.0000",
    "unidad_hijo_id": 2,
    "productoHijo": {
      "id": 2,
      "nombre": "Cigarros - Cajetilla",
      "sku": "CIG-CAJ"
    },
    "almacen_id": 1,
    "sector_id": 1,
    "usuario_id": 3,
    "usuario": {
      "id": 3,
      "name": "Juan Pérez",
      "email": "juan@example.com"
    },
    "fecha_fraccionamiento": "2026-09-10T14:30:00Z",
    "razon": "fraccionamiento_manual",
    "notas": "Fraccionamiento de paquetes en cajetillas",
    "created_at": "2026-09-10T14:30:00Z"
  }
}
```

#### Validaciones:
- ✅ `producto_padre_id` requerido, debe existir en BD
- ✅ `cantidad_padre` > 0
- ✅ `producto_hijo_id` requerido, debe existir en BD
- ✅ `producto_hijo_id ≠ producto_padre_id`
- ✅ `cantidad_hijo` > 0
- ✅ Stock disponible del padre
- ❌ Error si no hay suficiente stock

---

### 2. Listar Fraccionamientos

**GET** `/api/inventario/fraccionamientos`

#### Query Parameters (todos opcionales):
```
?producto_padre_id=1
?producto_hijo_id=2
?almacen_id=1
?sector_id=1
?razon=fraccionamiento_manual
?fecha_desde=2026-09-01
?fecha_hasta=2026-09-30
?usuario_id=3
?per_page=15
?page=1
```

#### Response (200):
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "cantidad_padre": "5.0000",
        "cantidad_hijo": "50.0000",
        "almacen": { "id": 1, "nombre": "Almacén Central" },
        "sector": { "id": 1, "nombre": "Sector A" },
        "usuario": { "id": 3, "name": "Juan Pérez" },
        "fecha_fraccionamiento": "2026-09-10T14:30:00Z",
        "razon": "fraccionamiento_manual"
      }
    ],
    "total": 150,
    "per_page": 15,
    "last_page": 10
  }
}
```

---

### 3. Obtener Detalle de Fraccionamiento

**GET** `/api/inventario/fraccionamientos/{id}`

#### Response (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "producto_padre_id": 1,
    "cantidad_padre": "5.0000",
    "producto_hijo_id": 2,
    "cantidad_hijo": "50.0000",
    "almacen_id": 1,
    "sector_id": 1,
    "usuario_id": 3,
    "fecha_fraccionamiento": "2026-09-10T14:30:00Z",
    "razon": "fraccionamiento_manual",
    "notas": "Fraccionamiento de paquetes",
    "factor_conversion": 10,
    "productoPadre": { ... },
    "productoHijo": { ... },
    "almacen": { ... },
    "sector": { ... },
    "usuario": { ... }
  }
}
```

---

### 4. Revertir Fraccionamiento

**DELETE** `/api/inventario/fraccionamientos/{id}/revertir`

Deshace un fraccionamiento (soft delete) y devuelve el stock a su estado anterior.

#### Response (200):
```json
{
  "success": true,
  "message": "Fraccionamiento revertido exitosamente",
  "data": null
}
```

#### Errores posibles:
- ❌ `404`: Fraccionamiento no existe
- ❌ `400`: Fraccionamiento ya fue revertido
- ❌ `400`: Stock insuficiente para revertir

---

### 5. Historial de Producto

**GET** `/api/inventario/fraccionamientos/producto/{productoId}/historial`

Obtiene todos los fraccionamientos donde interviene un producto (como padre o hijo).

#### Response (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tipo": "padre", // o "hijo"
      "producto_padre_id": 1,
      "cantidad_padre": "5.0000",
      "producto_hijo_id": 2,
      "cantidad_hijo": "50.0000",
      "fecha_fraccionamiento": "2026-09-10T14:30:00Z",
      "usuario": { "name": "Juan Pérez" },
      "razon": "fraccionamiento_manual"
    },
    {
      "id": 2,
      "tipo": "hijo",
      "producto_padre_id": 2,
      "cantidad_padre": "10.0000",
      "producto_hijo_id": 3,
      "cantidad_hijo": "100.0000",
      "fecha_fraccionamiento": "2026-09-11T10:15:00Z",
      "usuario": { "name": "María García" },
      "razon": "fraccionamiento_manual"
    }
  ]
}
```

---

### 6. Estadísticas de Fraccionamiento

**GET** `/api/inventario/fraccionamientos/producto/{productoPadreId}/estadisticas`

#### Query Parameters:
```
?dias=30  (default: 30)
```

#### Response (200):
```json
{
  "success": true,
  "data": {
    "total_fraccionamientos": 5,
    "cantidad_padre_total": "25.0000",
    "cantidad_hijo_total": "250.0000",
    "factor_promedio": 10,
    "por_razon": {
      "fraccionamiento_manual": {
        "cantidad": 3,
        "cantidad_padre": "15.0000",
        "cantidad_hijo": "150.0000"
      },
      "fraccionamiento_compra": {
        "cantidad": 2,
        "cantidad_padre": "10.0000",
        "cantidad_hijo": "100.0000"
      }
    }
  }
}
```

---

## 💻 Ejemplos de Uso

### Ejemplo 1: Fraccionar Cigarros

```javascript
// Cigarros en paquetes → Cajetillas
const response = await fetch('/api/inventario/fraccionamientos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    producto_padre_id: 1,      // Cigarros - Paquete
    cantidad_padre: 10,        // 10 paquetes
    producto_hijo_id: 2,       // Cigarros - Cajetilla
    cantidad_hijo: 100,        // 100 cajetillas (10 × 10)
    almacen_id: 1,
    sector_id: 1,
    razon: 'fraccionamiento_manual',
    notas: 'Fraccionamiento manual en mostrador'
  })
});

const data = await response.json();
console.log(`Fraccionamiento ID: ${data.data.id}`);
```

### Ejemplo 2: Obtener Historial de Cigarros

```javascript
// Ver todos los fraccionamientos de un producto
const response = await fetch('/api/inventario/fraccionamientos/producto/1/historial');
const historial = await response.json();

historial.data.forEach(mov => {
  console.log(`${mov.fecha_fraccionamiento}: ${mov.cantidad_padre} → ${mov.cantidad_hijo}`);
});
```

### Ejemplo 3: Revertir Fraccionamiento

```javascript
// Deshacer un fraccionamiento
const response = await fetch('/api/inventario/fraccionamientos/1/revertir', {
  method: 'DELETE'
});

const result = await response.json();
if (result.success) {
  console.log('Fraccionamiento revertido');
}
```

### Ejemplo 4: Filtrar Fraccionamientos

```javascript
// Todos los fraccionamientos del sector 1 en el último mes
const response = await fetch(
  '/api/inventario/fraccionamientos' +
  '?sector_id=1' +
  '&fecha_desde=2026-08-10' +
  '&fecha_hasta=2026-09-10' +
  '&per_page=50'
);

const data = await response.json();
console.log(`Total: ${data.data.total}`);
```

---

## 🔐 Autenticación y Permisos

Todas las rutas requieren autenticación:
```php
Route::middleware(['auth:sanctum,web'])->group(function () {
    Route::group(['prefix' => 'inventario'], function () {
        // ... fraccionamientos routes
    });
});
```

Se registra automáticamente:
- ✅ Usuario que realiza la acción
- ✅ Fecha y hora exacta
- ✅ IP del usuario (en logs)
- ✅ Empresa propietaria

---

## 📊 Validaciones y Reglas

### Stock:
- ✅ Solo se puede fraccionar si existe stock suficiente
- ✅ El stock se decrementa automáticamente en el padre
- ✅ El stock se incrementa automáticamente en el hijo
- ✅ Si el hijo no existe en ese almacén/sector, se crea automáticamente

### Productos:
- ✅ Padre y hijo deben ser productos diferentes
- ✅ Ambos deben existir en la BD
- ✅ No se requiere que sean marcados como "es_fraccionado"

### Auditoría:
- ✅ Cada fraccionamiento se registra como movimiento separado
- ✅ Reversión = soft delete (se mantiene registro histórico)
- ✅ Imposible eliminar permanentemente (solo administrador con DB access)

---

## 🐛 Manejo de Errores

### Errores Comunes:

**400: Stock insuficiente**
```json
{
  "success": false,
  "message": "Stock insuficiente. Disponible: 3, Solicitado: 5"
}
```

**400: Producto no existe**
```json
{
  "success": false,
  "message": "The selected producto padre id is invalid."
}
```

**400: Productos iguales**
```json
{
  "success": false,
  "message": "El producto padre y hijo no pueden ser el mismo"
}
```

**400: Ya fue revertido**
```json
{
  "success": false,
  "message": "Este fraccionamiento ya fue revertido"
}
```

---

## 🔄 Flujo Completo Ejemplo

```
1. COMPRA
   ├─ Compro: 100 paquetes de cigarros
   └─ Stock: Cigarros-Paquete = 100

2. FRACCIONAMIENTO #1
   ├─ Acción: Fracciono 10 paquetes en 100 cajetillas
   ├─ Stock: Cigarros-Paquete = 90
   └─ Stock: Cigarros-Cajetilla = 100
   └─ Registro: movimientos_fraccionamiento (id: 1)

3. VENTA
   ├─ Vendo: 5 cajetillas
   └─ Stock: Cigarros-Cajetilla = 95 ✅ Stock limpio

4. AUDITORÍA
   └─ Pregunta: "¿De dónde salieron esas 5 cajetillas?"
   └─ Respuesta: "Del fraccionamiento #1, realizado por Juan el 10/09"

5. REVERVERSIÓN (si es necesario)
   ├─ Acción: Revertir fraccionamiento #1
   ├─ Stock: Cigarros-Paquete = 100
   └─ Stock: Cigarros-Cajetilla = 0 (o restante)
   └─ Registro: soft delete (deleted_at se completa)
```

---

## 📝 Migration y Setup

Ejecutar:
```bash
php artisan migrate
```

Esto crea:
- ✅ Tabla `movimientos_fraccionamiento`
- ✅ Índices optimizados
- ✅ Foreign keys con restricciones

---

## 🎯 Casos de Uso

1. **Fraccionamiento Manual**: Mostrador convierte productos
2. **Fraccionamiento de Compra**: Proveedor entrega fraccionado
3. **Reagrupamiento**: Vuelvo a juntar fracciones
4. **Ajuste de Inventario**: Correcciones por merma o error

Cada uno genera su propio registro para auditoría perfecta.

---

## 💡 Notas Importantes

⚠️ **CRÍTICO**:
- No hay límites en cuántos niveles puedes fraccionar (padre → hijo → nieto)
- Cada nivel mantiene su propia trazabilidad
- El sistema permite fraccionar un "hijo" en otro "nieto"
- Reportes recursivos pueden mostrar el árbol completo

✅ **BENEFICIOS**:
- Stock siempre en números enteros (no hay 7.5 unidades)
- Auditoría perfecta: sabes exactamente quién, cuándo, por qué
- Reportes claros: "¿Cuántas conversiones hizo Juan este mes?"
- Control de calidad: "¿De dónde salió este lote defectuoso?"
