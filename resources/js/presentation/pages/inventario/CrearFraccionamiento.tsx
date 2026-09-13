/**
 * Page: Crear Fraccionamiento
 *
 * ✅ Formulario completo para crear fraccionamientos
 * ✅ Input único para buscar/escanear productos
 * ✅ Validaciones en tiempo real
 * ✅ Cálculo automático de factor
 * ✅ Vista previa del resultado
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Alert, AlertDescription } from '@/presentation/components/ui/alert';
import SearchSelect from '@/presentation/components/ui/search-select';
import { Loader2, ArrowRight, AlertCircle, CheckCircle2, X, ArrowUpDown, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Stock {
  id: number;
  almacen_id: number;
  almacen_nombre: string;
  sector_id: number;
  sector_nombre: string;
  cantidad: number;
  cantidad_disponible: number;
}

interface Limite {
  id: number;
  almacen_id: number;
  sector_id: number;
  cantidad_minima: number;
  cantidad_maxima: number;
}

interface Producto {
  id: number;
  nombre: string;
  sku: string;
  unidad_medida_id: number;
  unidad_nombre: string;
  stocks?: Stock[];
  limites?: Limite[];
  stock_total?: number;
}

interface ProductoSeleccionado extends Producto {
  rol: 'padre' | 'hijo';
}

interface Almacen {
  id: number;
  nombre: string;
}

export default function CrearFraccionamiento() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [sectores, setSectores] = useState<Array<{ id?: number; nombre: string }>>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [buscando, setBuscando] = useState(false);

  // Productos agregados (máximo 2)
  const [productosAgregados, setProductosAgregados] = useState<ProductoSeleccionado[]>([]);

  // Búsqueda/Escaneo
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<Producto[]>([]);

  // Conversiones del producto padre
  const [conversionesDisponibles, setConversionesDisponibles] = useState<any[]>([]);
  const [cargandoConversiones, setCargandoConversiones] = useState(false);

  const [formData, setFormData] = useState({
    cantidad_padre: '',
    cantidad_hijo: '',
    almacen_id: '',
    sector_id: '',
    razon: 'fraccionamiento_manual',
    notas: '',
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  // Sectores disponibles para el producto padre en el almacén seleccionado
  const [sectoresDisponiblesParaProducto, setSectoresDisponiblesParaProducto] = useState<Array<{ id: number; nombre: string }>>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [almacenesRes, sectoresRes] = await Promise.all([
        fetch('/api/almacenes'),
        fetch('/api/productos/sectores-disponibles'),
      ]);

      const almacenesData = await almacenesRes.json();
      const sectoresData = await sectoresRes.json();

      setAlmacenes(Array.isArray(almacenesData.data) ? almacenesData.data : []);
      setSectores(
        Array.isArray(sectoresData.data)
          ? sectoresData.data.map((s: any) => ({
              id: s.id || 0,
              nombre: s.nombre,
            }))
          : []
      );

      // Cargar productos disponibles
      const productosRes = await fetch('/api/inventario/fraccionamientos/productos/disponibles');
      const productosData = await productosRes.json();
      setProductos(Array.isArray(productosData.data) ? productosData.data : []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  // Buscar productos - Padre necesita stock, Hijo NO necesita stock previo
  const handleBuscar = async (valor: string) => {
    setBusqueda(valor);

    if (!valor.trim()) {
      setSugerencias([]);
      return;
    }

    // Si no hay almacén, no buscar
    if (!formData.almacen_id) {
      setSugerencias([]);
      return;
    }

    setBuscando(true);
    try {
      const valorLower = valor.toLowerCase();
      const almacenIdInt = parseInt(formData.almacen_id);
      const esProductoPadre = productosAgregados.length === 0;

      // Primero intentar buscar por código de barras
      try {
        const barcodeRes = await fetch(
          `/api/app/productos/buscar-codigo-barras?codigo=${encodeURIComponent(valor)}`
        );
        const barcodeData = await barcodeRes.json();

        if (barcodeData.success && barcodeData.data) {
          // Solo padre necesita stock en el almacén
          if (esProductoPadre) {
            const tieneStock = barcodeData.data.stocks?.some((s: Stock) => s.almacen_id === almacenIdInt);
            if (tieneStock) {
              setSugerencias([barcodeData.data]);
              setBuscando(false);
              return;
            }
          } else {
            // Hijo puede ser cualquier producto
            setSugerencias([barcodeData.data]);
            setBuscando(false);
            return;
          }
        }
      } catch (error) {
        // Continuar con búsqueda por nombre/SKU
      }

      // Búsqueda por nombre o SKU
      const resultados = productos.filter((p) => {
        const coincideNombre = p.nombre.toLowerCase().includes(valorLower) || p.sku.toLowerCase().includes(valorLower);

        // Si es padre: debe tener stock en el almacén
        if (esProductoPadre) {
          return coincideNombre && p.stocks?.some((s: Stock) => s.almacen_id === almacenIdInt);
        }

        // Si es hijo: puede ser cualquier producto
        return coincideNombre;
      });

      setSugerencias(resultados);
    } catch (error) {
      console.error('Error buscando:', error);
    } finally {
      setBuscando(false);
    }
  };

  // Agregar producto a la lista
  const handleAgregarProducto = (producto: Producto) => {
    // Evitar duplicados
    if (productosAgregados.some((p) => p.id === producto.id)) {
      toast.error('Este producto ya fue agregado');
      return;
    }

    // Máximo 2 productos
    if (productosAgregados.length >= 2) {
      toast.error('Solo puedes agregar 2 productos');
      return;
    }

    const rol = productosAgregados.length === 0 ? ('padre' as const) : ('hijo' as const);

    setProductosAgregados([
      ...productosAgregados,
      {
        ...producto,
        rol,
      },
    ]);

    setBusqueda('');
    setSugerencias([]);

    // Si es producto padre
    if (rol === 'padre') {
      // Buscar conversiones automáticamente
      buscarConversiones(producto.id);

      // Cargar sectores disponibles de este producto en el almacén seleccionado
      if (formData.almacen_id && producto.limites) {
        const sectoresDelProducto = producto.limites
          .filter((limite: any) => limite.almacen_id === parseInt(formData.almacen_id))
          .map((limite: any) => {
            const sectorEncontrado = sectores.find((s) => s.id === limite.sector_id);
            return {
              id: limite.sector_id,
              nombre: sectorEncontrado?.nombre || 'Sector desconocido',
            };
          });

        setSectoresDisponiblesParaProducto(sectoresDelProducto);

        // Si hay solo un sector, seleccionarlo automáticamente
        if (sectoresDelProducto.length === 1) {
          setFormData((prev) => ({ ...prev, sector_id: String(sectoresDelProducto[0].id) }));
        }
      }
    }

    toast.success(`${producto.nombre} agregado como ${rol}`);
  };

  // Buscar conversiones del producto padre
  const buscarConversiones = async (productoPadreId: number) => {
    setCargandoConversiones(true);
    try {
      const url = `/api/inventario/fraccionamientos/producto/${productoPadreId}/conversiones`;
      console.log('Buscando conversiones en:', url);
      const res = await fetch(url);
      const data = await res.json();

      console.log('Respuesta conversiones:', data);

      if (data.success && data.data && data.data.length > 0) {
        console.log('Conversiones cargadas:', data.data);
        setConversionesDisponibles(data.data);
        toast.success(`${data.data.length} conversión(es) disponible(s)`);
      } else {
        console.log('Sin conversiones disponibles');
        setConversionesDisponibles([]);
      }
    } catch (error) {
      console.error('Error buscando conversiones:', error);
      setConversionesDisponibles([]);
    } finally {
      setCargandoConversiones(false);
    }
  };

  // Cambiar orden de productos
  const handleCambiarOrden = () => {
    if (productosAgregados.length !== 2) return;

    const [p1, p2] = productosAgregados;
    setProductosAgregados([
      { ...p1, rol: 'hijo' },
      { ...p2, rol: 'padre' },
    ]);

    toast.success('Orden invertido');
  };

  // Limpiar productos
  const handleLimpiar = () => {
    setProductosAgregados([]);
    setFormData((prev) => ({
      ...prev,
      cantidad_padre: '',
      cantidad_hijo: '',
    }));
    toast.success('Productos limpios');
  };

  // Remover un producto específico
  const handleRemover = (id: number) => {
    const nuevos = productosAgregados.filter((p) => p.id !== id);
    setProductosAgregados(nuevos);

    // Si quedan productos, actualizar roles
    if (nuevos.length === 1) {
      nuevos[0].rol = 'padre';
      setProductosAgregados(nuevos);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});

    // Validaciones
    if (productosAgregados.length !== 2) {
      toast.error('Debes agregar 2 productos');
      return;
    }

    const productoPadre = productosAgregados.find((p) => p.rol === 'padre');
    const productoHijo = productosAgregados.find((p) => p.rol === 'hijo');

    if (!formData.cantidad_padre || parseFloat(formData.cantidad_padre) <= 0) {
      setErrores((prev) => ({ ...prev, cantidad_padre: 'Mayor a 0' }));
      return;
    }
    if (!formData.cantidad_hijo || parseFloat(formData.cantidad_hijo) <= 0) {
      setErrores((prev) => ({ ...prev, cantidad_hijo: 'Mayor a 0' }));
      return;
    }
    if (!formData.almacen_id) {
      setErrores((prev) => ({ ...prev, almacen_id: 'Requerido' }));
      return;
    }
    if (!formData.sector_id) {
      toast.error('El sector no se asignó automáticamente. Verifica que el producto padre tenga stock_limites en este almacén');
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch('/api/inventario/fraccionamientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          producto_padre_id: productoPadre?.id,
          cantidad_padre: parseFloat(formData.cantidad_padre),
          producto_hijo_id: productoHijo?.id,
          cantidad_hijo: parseFloat(formData.cantidad_hijo),
          almacen_id: parseInt(formData.almacen_id),
          sector_id: parseInt(formData.sector_id),
          razon: formData.razon,
          notas: formData.notas || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Error al crear');
        return;
      }

      toast.success('Fraccionamiento creado exitosamente');
      window.location.href = '/inventario/fraccionamientos';
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear fraccionamiento');
    } finally {
      setGuardando(false);
    }
  };

  const productoPadre = productosAgregados.find((p) => p.rol === 'padre');
  const productoHijo = productosAgregados.find((p) => p.rol === 'hijo');
  const factor =
    productoPadre && productoHijo && formData.cantidad_padre && formData.cantidad_hijo
      ? (parseFloat(formData.cantidad_hijo) / parseFloat(formData.cantidad_padre)).toFixed(2)
      : null;

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Inventario', href: '/inventario' },
        { title: 'Fraccionamientos', href: '/inventario/fraccionamientos' },
        { title: 'Crear', href: '#' },
      ]}
    >
      <Head title="Crear Fraccionamiento" />

      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📦 Crear Fraccionamiento
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Registra el fraccionamiento de un producto
          </p>
        </div>

        {cargando ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Formulario */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Sección: Ubicación */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      📍 Ubicación
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Almacén *
                        </label>
                        <select
                          value={formData.almacen_id}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              almacen_id: e.target.value,
                              sector_id: '',
                            });
                            // Limpiar búsqueda y productos cuando cambia almacén
                            setProductosAgregados([]);
                            setBusqueda('');
                            setSugerencias([]);
                            setConversionesDisponibles([]);
                            setSectoresDisponiblesParaProducto([]);
                          }}
                          className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errores.almacen_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <option value="">Selecciona...</option>
                          {almacenes.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.nombre}
                            </option>
                          ))}
                        </select>
                        {errores.almacen_id && (
                          <p className="text-red-500 text-sm mt-1">{errores.almacen_id}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Sector (Auto-asignado)
                        </label>
                        <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                          {formData.sector_id && sectoresDisponiblesParaProducto.length > 0 ? (
                            <p className="font-medium text-green-600 dark:text-green-400">
                              ✓ {sectoresDisponiblesParaProducto.find((s) => String(s.id) === formData.sector_id)?.nombre}
                            </p>
                          ) : productoPadre && sectoresDisponiblesParaProducto.length === 0 ? (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              ⚠️ El producto no tiene sectores en este almacén
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Se asignará automáticamente cuando selecciones el producto padre
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Input Único de Búsqueda/Escaneo */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      🔍 Buscar Productos
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Escanear/Buscar por código de barras, SKU o nombre *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => handleBuscar(e.target.value)}
                            placeholder={formData.almacen_id ? "Escanea código de barras o escribe SKU/nombre..." : "Selecciona un almacén primero..."}
                            disabled={!formData.almacen_id}
                            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              formData.almacen_id
                                ? 'border-gray-300 dark:border-gray-600 cursor-text'
                                : 'border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50'
                            }`}
                            autoFocus
                          />
                          {buscando && (
                            <Loader2 className="absolute right-3 top-3 w-5 h-5 animate-spin text-gray-500" />
                          )}
                        </div>

                        {/* Sugerencias */}
                        {sugerencias.length > 0 && (
                          <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 max-h-96 overflow-y-auto">
                            {sugerencias.map((producto) => (
                              <button
                                key={producto.id}
                                type="button"
                                onClick={() => handleAgregarProducto(producto)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-700 last:border-0 transition"
                              >
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                      {producto.sku}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                      {producto.nombre}
                                    </p>
                                    {/* Stock disponible */}
                                    {producto.stocks && producto.stocks.length > 0 ? (
                                      <div className="mt-2 text-xs space-y-1">
                                        <p className="font-semibold text-blue-600 dark:text-blue-400">
                                          📦 Total: {producto.stock_total} {producto.unidad_nombre}
                                        </p>
                                        <div className="space-y-0.5 bg-gray-100 dark:bg-gray-700 p-1 rounded">
                                          {producto.stocks.slice(0, 3).map((stock) => (
                                            <p key={`${stock.almacen_id}-${stock.sector_id}`} className="text-gray-700 dark:text-gray-300">
                                              {stock.almacen_nombre} / {stock.sector_nombre}: {stock.cantidad}
                                            </p>
                                          ))}
                                          {producto.stocks.length > 3 && (
                                            <p className="text-gray-600 dark:text-gray-400 italic">
                                              +{producto.stocks.length - 3} ubicaciones más
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">⚠️ Sin stock registrado</p>
                                    )}
                                  </div>
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex-shrink-0">
                                    {producto.unidad_nombre}
                                  </Badge>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  

                  {/* Conversiones disponibles del producto padre */}
                  {conversionesDisponibles.length > 0 && productosAgregados.length === 1 && (
                    <div className="border-b pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        🔄 Conversiones Disponibles
                      </h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Selecciona el producto hijo de las conversiones configuradas:
                        </p>
                        {conversionesDisponibles.map((conversion) => (
                          <button
                            key={conversion.id}
                            type="button"
                            onClick={() => {
                              if (conversion.producto_hijo) {
                                handleAgregarProducto({
                                  id: conversion.producto_hijo_id,
                                  nombre: conversion.producto_hijo.nombre,
                                  sku: conversion.producto_hijo.sku,
                                  unidad_medida_id: 0,
                                  unidad_nombre: conversion.producto_hijo.unidad_nombre,
                                });
                                // Auto-llenar cantidades basado en factor
                                setFormData((prev) => ({
                                  ...prev,
                                  cantidad_padre: '1',
                                  cantidad_hijo: conversion.factor_conversion.toString(),
                                }));
                              }
                            }}
                            className="w-full text-left px-4 py-3 border border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {conversion.producto_hijo.sku}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {conversion.producto_hijo.nombre}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  Factor: 1 {conversion.unidad_base_nombre} = {conversion.factor_conversion} {conversion.unidad_destino_nombre}
                                </p>
                              </div>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                ✓ Usar
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tabla de Productos Agregados */}
                  {productosAgregados.length > 0 && (
                    <div className="border-b pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        ✓ Productos Agregados
                      </h3>

                      <div className="space-y-3">
                        {productosAgregados.map((producto, idx) => (
                          <div
                            key={producto.id}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                              producto.rol === 'padre'
                                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={
                                    producto.rol === 'padre'
                                      ? 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                      : 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                  }
                                >
                                  {producto.rol === 'padre' ? '📦 Padre' : '🥤 Hijo'}
                                </Badge>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {producto.sku}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {producto.nombre}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {producto.unidad_nombre}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              {productosAgregados.length === 2 && (
                                <button
                                  type="button"
                                  onClick={handleCambiarOrden}
                                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                                  title="Cambiar orden"
                                >
                                  <ArrowUpDown className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemover(producto.id)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                                title="Remover"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cantidades */}
                  {productosAgregados.length === 2 && (
                    <div className="border-b pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        📊 Cantidades
                      </h3>

                      <div className="space-y-6">
                        {/* Cantidad a fraccionar del Padre */}
                        <div>
                          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Cantidad a fraccionar de {productoPadre?.nombre} *
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={formData.cantidad_padre}
                              onChange={(e) => {
                                const valor = e.target.value;
                                setFormData({ ...formData, cantidad_padre: valor });
                                // Calcular automáticamente cantidad_hijo
                                if (valor && !isNaN(parseFloat(valor)) && conversionesDisponibles.length > 0) {
                                  const conv = conversionesDisponibles[0];
                                  const factor = conv.factor_conversion || conv.factor || 1;
                                  console.log('Conversión:', conv);
                                  console.log('Factor:', factor);
                                  const cantidadCalculada = (parseFloat(valor) * factor).toFixed(2);
                                  setFormData((prev) => ({ ...prev, cantidad_hijo: cantidadCalculada }));
                                }
                              }}
                              className={`flex-1 px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errores.cantidad_padre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                              }`}
                              placeholder="0.00"
                            />
                            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-medium">
                              {productoPadre?.unidad_nombre}
                            </div>
                          </div>
                          {errores.cantidad_padre && (
                            <p className="text-red-500 text-sm mt-1">{errores.cantidad_padre}</p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Stock disponible: {productoPadre?.stocks?.find((s) => s.almacen_id === parseInt(formData.almacen_id))?.cantidad || 0} {productoPadre?.unidad_nombre}
                          </p>
                        </div>

                        {/* Factor y Cantidad Calculada */}
                        {conversionesDisponibles.length > 0 && formData.cantidad_padre && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cálculo Automático:</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formData.cantidad_padre} {productoPadre?.unidad_nombre} × {conversionesDisponibles[0].factor_conversion || conversionesDisponibles[0].factor || 1} = <span className="text-green-600 dark:text-green-400">{formData.cantidad_hijo} {productoHijo?.unidad_nombre}</span>
                            </p>
                          </div>
                        )}

                        {/* Cantidad Hijo (Read-only) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Cantidad resultante en {productoHijo?.nombre} (Automática)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={formData.cantidad_hijo}
                              readOnly
                              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed opacity-75"
                            />
                            <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-medium">
                              {productoHijo?.unidad_nombre}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Se calcula automáticamente usando el factor de conversión
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  

                  {/* Sección: Detalles */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      📝 Detalles Adicionales
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Razón del Fraccionamiento *
                        </label>
                        <select
                          value={formData.razon}
                          onChange={(e) => setFormData({ ...formData, razon: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="fraccionamiento_manual">Fraccionamiento Manual</option>
                          <option value="fraccionamiento_compra">Fraccionamiento de Compra</option>
                          <option value="reagrupamiento">Reagrupamiento</option>
                          <option value="ajuste_inventario">Ajuste de Inventario</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Notas (opcional)
                        </label>
                        <textarea
                          value={formData.notas}
                          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                          rows={4}
                          maxLength={1000}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Añade notas sobre este fraccionamiento..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formData.notas.length}/1000 caracteres
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-3 pt-6 border-t">
                    <Link href="/inventario/fraccionamientos">
                      <Button type="button" variant="outline" className="flex-1">
                        Cancelar
                      </Button>
                    </Link>
                    {productosAgregados.length > 0 && (
                      <Button
                        type="button"
                        onClick={handleLimpiar}
                        variant="outline"
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpiar
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={guardando || productosAgregados.length !== 2}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      {guardando ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        '✓ Crear Fraccionamiento'
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* Vista Previa */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  📊 Vista Previa
                </h3>

                {productoPadre && productoHijo ? (
                  <div className="space-y-4">
                    {/* Resumen */}
                    <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">De</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formData.cantidad_padre} {productoPadre.unidad_nombre}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {productoPadre.sku}
                          </p>
                        </div>

                        <div className="flex items-center justify-center py-2">
                          <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>

                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">A</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formData.cantidad_hijo} {productoHijo.unidad_nombre}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {productoHijo.sku}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Factor */}
                    {factor && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Factor de Conversión
                        </p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {factor}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          1 {productoPadre.unidad_nombre} = {factor} {productoHijo.unidad_nombre}
                        </p>
                      </div>
                    )}

                    {/* Ubicación y Stock disponible del Padre */}
                    {formData.almacen_id && formData.sector_id && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Ubicación
                        </p>
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {almacenes.find((a) => a.id === parseInt(formData.almacen_id))?.nombre}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {sectores.find((s) => (s.id || s.nombre).toString() === formData.sector_id)?.nombre}
                          </p>
                        </div>

                        {/* Stock del Padre en esa ubicación */}
                        {productoPadre && (
                          <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-2">
                              📦 Stock del Padre
                            </p>
                            {productoPadre.stocks && productoPadre.stocks.length > 0 ? (
                              (() => {
                                const stockEnUbicacion = productoPadre.stocks.find(
                                  (s) =>
                                    s.almacen_id === parseInt(formData.almacen_id) &&
                                    s.sector_id === parseInt(formData.sector_id)
                                );

                                return stockEnUbicacion ? (
                                  <div className="bg-white dark:bg-gray-800 rounded p-2">
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                      {stockEnUbicacion.cantidad} {productoPadre.unidad_nombre}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      Disponible: {stockEnUbicacion.cantidad_disponible}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="bg-red-100 dark:bg-red-900/30 rounded p-2">
                                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                      ⚠️ Sin stock en esta ubicación
                                    </p>
                                    <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                                      Stock disponible en:
                                    </p>
                                    <ul className="mt-1 space-y-0.5">
                                      {productoPadre.stocks.map((s) => (
                                        <li
                                          key={`${s.almacen_id}-${s.sector_id}`}
                                          className="text-xs text-red-600 dark:text-red-300"
                                        >
                                          • {s.almacen_nombre} / {s.sector_nombre}: {s.cantidad}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="bg-red-100 dark:bg-red-900/30 rounded p-2">
                                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                  ❌ Producto sin stock registrado
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Agrega 2 productos para ver la vista previa
                    </p>
                  </div>
                )}

                {/* Info */}
                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <AlertDescription className="text-xs text-blue-800 dark:text-blue-200 ml-2">
                    El stock se actualizará automáticamente al crear el fraccionamiento.
                  </AlertDescription>
                </Alert>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
