/**
 * Page: Actualizar Stock Masivo
 *
 * Permitir actualización masiva de stock mediante CSV:
 * ✅ Descargar plantilla CSV (id,sku,nombre,cantidad_total,lote_fifo)
 * ✅ Cargar CSV y procesar con trazabilidad de lote
 * ✅ Crear movimientos en movimientos_inventario con lote registrado
 * ✅ Crear lote=null si no existe stock previo
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import { Badge } from '@/presentation/components/ui/badge';
import { Alert, AlertDescription } from '@/presentation/components/ui/alert';
import { Download, Upload, CheckCircle2, AlertCircle, Loader2, Save, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChangesPreview {
  producto_id: number;
  sku: string;
  nombre: string;
  stock_anterior: number;
  stock_nuevo: number;
  diferencia: number;
}

interface Producto {
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  cantidad_total: number;
  unidad_medida_id: number;           // ✅ NUEVO
  unidad_nombre: string;              // ✅ NUEVO
  conversiones: any[];                // ✅ NUEVO
}

interface CambioTabla {
  cantidad: number;
  unidad_id: number;
  cantidad_convertida: number;
}

interface TablaEdicion {
  [key: number]: CambioTabla;
}

export default function ActualizarStockMasivo() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pestaña, setPestaña] = useState<'tabla' | 'csv'>('tabla');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [cambiosTabla, setCambiosTabla] = useState<TablaEdicion>({});
  const [guardandoTabla, setGuardandoTabla] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [previewData, setPreviewData] = useState<ChangesPreview[]>([]);
  const [resultado, setResultado] = useState<any>(null);
  const [errores, setErrores] = useState<string[]>([]);

  // Cargar productos al abrir la página
  useEffect(() => {
    cargarProductos();
  }, []);

  // Filtrar productos según búsqueda
  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return productos;

    const busquedaLower = busqueda.toLowerCase();
    return productos.filter(p =>
      p.sku.toLowerCase().includes(busquedaLower) ||
      p.nombre.toLowerCase().includes(busquedaLower) ||
      p.categoria.toLowerCase().includes(busquedaLower)
    );
  }, [productos, busqueda]);

  // Cargar todos los productos
  const cargarProductos = async () => {
    setCargandoProductos(true);
    try {
      const response = await fetch('/api/productos/para-actualizar-stock');
      const data = await response.json();

      if (data.success) {
        setProductos(data.data || []);
      } else {
        toast.error('Error al cargar productos');
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setCargandoProductos(false);
    }
  };

  // ✅ Descargar plantilla en el formato especificado
  const descargarPlantilla = async (formato: 'csv' | 'excel' = 'csv') => {
    setCargando(true);
    try {
      const url = `/api/actualizar-stock-masivo/descargar-plantilla?formato=${formato}`;
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const urlObj = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      a.download = `plantilla-stock-${new Date().toISOString().split('T')[0]}.${formato === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(urlObj);
      document.body.removeChild(a);
      toast.success(`Plantilla descargada en formato ${formato.toUpperCase()}`);
    } catch (error) {
      console.error('Error descargando plantilla:', error);
      toast.error('Error al descargar plantilla');
    } finally {
      setCargando(false);
    }
  };

  // ✅ Manejar cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const esCSV = file.name.endsWith('.csv');
      const esExcel = file.name.endsWith('.xlsx');

      if (!esCSV && !esExcel) {
        toast.error('Por favor selecciona un archivo CSV o Excel (.xlsx)');
        return;
      }
      setArchivo(file);
      setErrores([]);
      setResultado(null);
    }
  };

  // ✅ Procesar archivo (CSV o Excel)
  const procesarArchivo = async () => {
    if (!archivo) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    setProcesando(true);
    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      const response = await fetch('/api/actualizar-stock-masivo/procesar-archivo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar CSV');
      }

      setResultado(data);
      if (data.errores?.length > 0) {
        setErrores(data.errores);
      }

      toast.success(`✅ ${data.registros_actualizados} productos actualizados`);
    } catch (error) {
      console.error('Error procesando CSV:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar CSV');
    } finally {
      setProcesando(false);
    }
  };

  // ✅ Calcular cantidad convertida según unidad
  const calcularConversion = (producto: Producto, cantidad: number, unidadDestino: number): number => {
    if (unidadDestino === producto.unidad_medida_id) {
      return cantidad; // Sin conversión
    }

    const conversion = producto.conversiones?.find(
      (c: any) => c.unidad_destino_id === unidadDestino
    );

    if (conversion) {
      return cantidad / conversion.factor_conversion;
    }

    return cantidad; // Sin conversión encontrada
  };

  // ✅ Manejar cambio de cantidad/unidad en la tabla
  const handleCambioTabla = (productoId: number, cantidad: string, unidadId?: number) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    const valor = parseInt(cantidad, 10);
    const unidad = unidadId || producto.unidad_medida_id;

    if (!isNaN(valor) && valor > 0) {
      const cantidadConvertida = calcularConversion(producto, valor, unidad);
      setCambiosTabla(prev => ({
        ...prev,
        [productoId]: {
          cantidad: valor,
          unidad_id: unidad,
          cantidad_convertida: cantidadConvertida
        },
      }));
    } else if (cantidad === '' || cantidad === '-') {
      setCambiosTabla(prev => ({
        ...prev,
        [productoId]: {
          cantidad: 0,
          unidad_id: unidad,
          cantidad_convertida: 0
        },
      }));
    }
  };

  // ✅ Guardar cambios de la tabla
  const guardarCambiosTabla = async () => {
    // Filtrar solo los cambios con incremento diferente a 0
    const cambiosFiltrados = Object.entries(cambiosTabla)
      .filter(([, cambio]) => cambio.cantidad !== 0)
      .map(([productoId, cambio]) => {
        const producto = productos.find(p => p.id === parseInt(productoId, 10));
        return {
          producto_id: parseInt(productoId, 10),
          cantidad_nueva: (producto?.cantidad_total || 0) + cambio.cantidad_convertida,
          unidad_id: cambio.unidad_id,
          cantidad_original: cambio.cantidad,
        };
      });

    if (cambiosFiltrados.length === 0) {
      toast.error('No hay cambios para guardar');
      return;
    }

    setGuardandoTabla(true);
    const cambios = cambiosFiltrados;

    try {
      const response = await fetch('/api/inventario/actualizar-stock-tabla', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ cambios }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar stock');
      }

      toast.success(`✅ ${data.registros_actualizados} productos actualizados`);
      setCambiosTabla({});
      cargarProductos();
    } catch (error) {
      console.error('Error guardando cambios:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar stock');
    } finally {
      setGuardandoTabla(false);
    }
  };

  // ✅ Reiniciar
  const reiniciar = () => {
    setArchivo(null);
    setPreviewData([]);
    setResultado(null);
    setErrores([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Inventario', href: '/inventario' },
        { title: 'Actualizar Stock Masivo', href: '#' },
      ]}
    >
      <Head title="Actualizar Stock Masivo" />

      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            📊 Actualizar Stock Masivo
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
            Edita los productos directamente en la tabla o utiliza la carga de CSV
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 md:gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setPestaña('tabla')}
            className={`px-3 md:px-4 py-2 font-medium text-xs md:text-sm whitespace-nowrap transition-colors ${
              pestaña === 'tabla'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            📋 Directa
          </button>
          <button
            onClick={() => setPestaña('csv')}
            className={`px-3 md:px-4 py-2 font-medium text-xs md:text-sm whitespace-nowrap transition-colors ${
              pestaña === 'csv'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            📥 CSV
          </button>
        </div>

        {/* Sección Principal - Tabla de Edición Directa */}
        {pestaña === 'tabla' && (
          <Card className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-4">📋 Productos en Inventario</h3>

            {cargandoProductos ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm md:text-base">No hay productos en el inventario</p>
              </div>
            ) : (
              <div>
                {/* Buscador */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-9 md:pl-10 pr-9 md:pr-10 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {busqueda && (
                      <button
                        onClick={() => setBusqueda('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                      >
                        <X className="w-4 md:w-5 h-4 md:h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Contador de resultados */}
                {busqueda && (
                  <div className="mb-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    Mostrando {productosFiltrados.length} de {productos.length} productos
                  </div>
                )}

                {productosFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm md:text-base">No se encontraron productos que coincidan con la búsqueda</p>
                  </div>
                ) : (
                <div className="overflow-x-auto border rounded-lg dark:border-gray-700 -mx-4 md:-mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900">
                        <TableHead className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4">ID</TableHead>
                        <TableHead className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4">SKU</TableHead>
                        <TableHead className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4 hidden md:table-cell">Producto</TableHead>
                        <TableHead className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4 hidden lg:table-cell">Categoría</TableHead>
                        <TableHead className="text-xs md:text-sm text-right text-gray-900 dark:text-white px-1 md:px-4">Stock</TableHead>
                        <TableHead className="text-xs md:text-sm text-right text-gray-900 dark:text-white px-1 md:px-4">Inc.</TableHead>
                        <TableHead className="text-xs md:text-sm text-right text-gray-900 dark:text-white px-1 md:px-4 hidden sm:table-cell">Final</TableHead>
                        <TableHead className="text-xs md:text-sm text-center text-gray-900 dark:text-white px-1 md:px-4">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productosFiltrados.map((producto) => {
                        const tienesCambio = producto.id in cambiosTabla;
                        const cambio = cambiosTabla[producto.id] || { cantidad: 0, unidad_id: producto.unidad_medida_id, cantidad_convertida: 0 };
                        const stockFinal = producto.cantidad_total + cambio.cantidad_convertida;
                        const unidadActual = cambio.unidad_id === producto.unidad_medida_id
                          ? producto.unidad_nombre
                          : producto.conversiones?.find((c: any) => c.unidad_destino_id === cambio.unidad_id)?.unidad_destino_nombre || producto.unidad_nombre;

                        return (
                          <TableRow key={producto.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 text-xs md:text-sm">
                            <TableCell className="text-xs md:text-sm text-gray-900 dark:text-white font-medium px-2 md:px-4">#{producto.id}</TableCell>
                            <TableCell className="text-xs md:text-sm text-gray-900 dark:text-white font-medium px-2 md:px-4">{producto.sku}</TableCell>
                            <TableCell className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4 hidden md:table-cell">{producto.nombre}</TableCell>
                            <TableCell className="text-xs md:text-sm text-gray-600 dark:text-gray-300 px-2 md:px-4 hidden lg:table-cell">
                              <Badge className="text-xs md:text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {producto.categoria}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs md:text-sm text-right text-gray-900 dark:text-white font-semibold px-1 md:px-4">
                              {producto.cantidad_total} {producto.unidad_nombre}
                            </TableCell>
                            <TableCell className="text-right px-1 md:px-4 space-y-1">
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={tienesCambio && cambio.cantidad !== 0 ? cambio.cantidad : ''}
                                  onChange={(e) => handleCambioTabla(producto.id, e.target.value, cambio.unidad_id)}
                                  className="w-12 md:w-16 px-1 md:px-2 py-1 text-xs md:text-sm text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <select
                                  value={cambio.unidad_id}
                                  onChange={(e) => handleCambioTabla(producto.id, String(cambio.cantidad), Number(e.target.value))}
                                  className="px-1 md:px-2 py-1 text-xs md:text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value={producto.unidad_medida_id}>{producto.unidad_nombre}</option>
                                  {producto.conversiones?.map((conv: any) => (
                                    <option key={conv.id} value={conv.unidad_destino_id}>
                                      {conv.unidad_destino_nombre}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {cambio.cantidad_convertida !== cambio.cantidad && cambio.cantidad > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  = {cambio.cantidad_convertida.toFixed(2)} {producto.unidad_nombre}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs md:text-sm text-right text-gray-900 dark:text-white font-semibold px-1 md:px-4 hidden sm:table-cell">
                              {tienesCambio && cambio.cantidad !== 0 ? (
                                <span className={cambio.cantidad > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                  {stockFinal.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">{producto.cantidad_total}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center px-1 md:px-4">
                              {tienesCambio && cambio.cantidad !== 0 ? (
                                <Badge className={`text-xs md:text-sm ${cambio.cantidad > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                                  {cambio.cantidad > 0 ? '+' : ''}{cambio.cantidad_convertida.toFixed(2)}
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                )}

                <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={guardarCambiosTabla}
                    disabled={Object.keys(cambiosTabla).length === 0 || guardandoTabla}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-sm md:text-base py-2 md:py-2"
                  >
                    {guardandoTabla ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Guardando...</span>
                        <span className="sm:hidden">Guardando</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 hidden sm:inline" />
                        <span>Guardar</span> {Object.keys(cambiosTabla).length > 0 ? `(${Object.keys(cambiosTabla).length})` : ''}
                      </>
                    )}
                  </Button>
                  {Object.keys(cambiosTabla).length > 0 && (
                    <Button
                      onClick={() => {
                        setCambiosTabla({});
                        cargarProductos();
                      }}
                      variant="outline"
                      className="w-full sm:w-auto text-sm md:text-base py-2 md:py-2"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>

                {Object.entries(cambiosTabla).filter(([, incremento]) => incremento !== 0).length > 0 && (
                  <Alert className="mt-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <AlertDescription className="text-xs md:text-sm text-blue-800 dark:text-blue-200 ml-2">
                      <strong>Cambios pendientes:</strong> {Object.entries(cambiosTabla).filter(([, incremento]) => incremento !== 0).length} producto(s)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Sección Principal - Carga CSV */}
        {pestaña === 'csv' && (
          <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
            {/* Panel Izquierdo: Descargar y Cargar */}
            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-4">📥 Descargar Plantilla</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-4">
                Elige el formato: CSV o Excel (.xlsx)
              </p>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-6">
                <Button
                  onClick={() => descargarPlantilla('csv')}
                  disabled={cargando}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base py-2"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Descargando...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2 hidden sm:inline" />
                      CSV
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => descargarPlantilla('excel')}
                  disabled={cargando}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm md:text-base py-2"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Descargando...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2 hidden sm:inline" />
                      Excel
                    </>
                  )}
                </Button>
              </div>

              <hr className="my-6" />

              <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-4">📤 Cargar Archivo</h3>

              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 md:p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 md:w-8 h-6 md:h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {archivo ? archivo.name : 'Haz clic para seleccionar archivo'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    CSV o Excel (.xlsx) | Máximo 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {archivo && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-xs md:text-sm text-green-800 dark:text-green-200 line-clamp-2">
                      ✅ {archivo.name} ({(archivo.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                )}

                <Button
                  onClick={procesarArchivo}
                  disabled={!archivo || procesando}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm md:text-base py-2"
                >
                  {procesando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Procesando...</span>
                      <span className="sm:hidden">Procesando</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 hidden sm:inline" />
                      Procesar Archivo
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Panel Derecho: Resultados */}
            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Resultado</h3>

              {!resultado ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm md:text-base">Carga un archivo para ver los resultados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Actualizados</p>
                      <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                        {resultado.registros_actualizados}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Movimientos</p>
                      <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {resultado.movimientos_creados}
                      </p>
                    </div>
                  </div>

                  {resultado.errores?.length > 0 && (
                    <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <AlertDescription className="text-red-800 dark:text-red-200 text-xs md:text-sm ml-2">
                        {resultado.errores.length} filas con errores:
                        <ul className="mt-2 space-y-1 text-xs">
                          {resultado.errores.slice(0, 3).map((error: string, i: number) => (
                            <li key={i}>• {error}</li>
                          ))}
                          {resultado.errores.length > 3 && (
                            <li>• ... y {resultado.errores.length - 3} más</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={reiniciar}
                    variant="outline"
                    className="w-full text-sm md:text-base py-2"
                  >
                    Cargar otro archivo
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Información adicional */}
        <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <AlertDescription className="text-xs md:text-sm text-yellow-800 dark:text-yellow-200 ml-2">
            <strong>⚠️ Importante:</strong> Los cambios se guardan inmediatamente. Se crearán movimientos en el inventario.
          </AlertDescription>
        </Alert>
      </div>
    </AppLayout>
  );
}
