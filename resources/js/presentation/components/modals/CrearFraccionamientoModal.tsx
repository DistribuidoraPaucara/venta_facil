import React, { useState, useEffect } from 'react';
import { Button } from '@/presentation/components/ui/button';
import { AlertCircle, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Producto {
  id: number;
  nombre: string;
  sku: string;
  unidad_medida_id: number;
  unidad_nombre: string;
}

interface Almacen {
  id: number;
  nombre: string;
}

interface Sector {
  id: number;
  nombre: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onFraccionamientoCreado: () => void;
}

export default function CrearFraccionamientoModal({
  isOpen,
  onClose,
  onFraccionamientoCreado,
}: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    producto_padre_id: '',
    cantidad_padre: '',
    producto_hijo_id: '',
    cantidad_hijo: '',
    almacen_id: '',
    sector_id: '',
    razon: 'fraccionamiento_manual',
    notas: '',
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
    }
  }, [isOpen]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [productosRes, almacenesRes, sectoresRes] = await Promise.all([
        fetch('/api/productos'),
        fetch('/api/almacenes'),
        fetch('/api/productos/sectores-disponibles'),
      ]);

      const productosData = await productosRes.json();
      const almacenesData = await almacenesRes.json();
      const sectoresData = await sectoresRes.json();

      setProductos(Array.isArray(productosData.data) ? productosData.data : []);
      setAlmacenes(Array.isArray(almacenesData.data) ? almacenesData.data : []);
      setSectores(
        Array.isArray(sectoresData.data)
          ? sectoresData.data.map((s: any) => ({
              id: s.id || 0,
              nombre: s.nombre,
            }))
          : []
      );
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores({});

    // Validaciones básicas
    if (!formData.producto_padre_id) {
      setErrores((prev) => ({ ...prev, producto_padre_id: 'Selecciona un producto padre' }));
      return;
    }
    if (!formData.cantidad_padre || parseFloat(formData.cantidad_padre) <= 0) {
      setErrores((prev) => ({ ...prev, cantidad_padre: 'Cantidad debe ser mayor a 0' }));
      return;
    }
    if (!formData.producto_hijo_id) {
      setErrores((prev) => ({ ...prev, producto_hijo_id: 'Selecciona un producto hijo' }));
      return;
    }
    if (!formData.cantidad_hijo || parseFloat(formData.cantidad_hijo) <= 0) {
      setErrores((prev) => ({ ...prev, cantidad_hijo: 'Cantidad debe ser mayor a 0' }));
      return;
    }
    if (!formData.almacen_id) {
      setErrores((prev) => ({ ...prev, almacen_id: 'Selecciona un almacén' }));
      return;
    }
    if (!formData.sector_id) {
      setErrores((prev) => ({ ...prev, sector_id: 'Selecciona un sector' }));
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
          producto_padre_id: parseInt(formData.producto_padre_id),
          cantidad_padre: parseFloat(formData.cantidad_padre),
          producto_hijo_id: parseInt(formData.producto_hijo_id),
          cantidad_hijo: parseFloat(formData.cantidad_hijo),
          almacen_id: parseInt(formData.almacen_id),
          sector_id: parseInt(formData.sector_id),
          razon: formData.razon,
          notas: formData.notas || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message) {
          toast.error(data.message);
        } else {
          toast.error('Error al crear fraccionamiento');
        }
        return;
      }

      toast.success('Fraccionamiento creado exitosamente');
      setFormData({
        producto_padre_id: '',
        cantidad_padre: '',
        producto_hijo_id: '',
        cantidad_hijo: '',
        almacen_id: '',
        sector_id: '',
        razon: 'fraccionamiento_manual',
        notas: '',
      });
      onFraccionamientoCreado();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear fraccionamiento');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  const productoPadre = productos.find((p) => p.id === parseInt(formData.producto_padre_id));
  const productoHijo = productos.find((p) => p.id === parseInt(formData.producto_hijo_id));
  const factor =
    productoPadre && productoHijo && formData.cantidad_padre && formData.cantidad_hijo
      ? (parseFloat(formData.cantidad_hijo) / parseFloat(formData.cantidad_padre)).toFixed(2)
      : null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            📦 Nuevo Fraccionamiento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {cargando ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Producto Padre */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Producto a Fraccionar
              </label>
              <select
                value={formData.producto_padre_id}
                onChange={(e) => setFormData({ ...formData, producto_padre_id: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errores.producto_padre_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecciona un producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.nombre}
                  </option>
                ))}
              </select>
              {errores.producto_padre_id && (
                <p className="text-red-500 text-sm mt-1">{errores.producto_padre_id}</p>
              )}
            </div>

            {/* Cantidad Padre */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Cantidad a Fraccionar ({productoPadre?.unidad_nombre || 'unidad'})
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cantidad_padre}
                onChange={(e) => setFormData({ ...formData, cantidad_padre: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errores.cantidad_padre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0.00"
              />
              {errores.cantidad_padre && (
                <p className="text-red-500 text-sm mt-1">{errores.cantidad_padre}</p>
              )}
            </div>

            {/* Producto Hijo */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Producto Resultado
              </label>
              <select
                value={formData.producto_hijo_id}
                onChange={(e) => setFormData({ ...formData, producto_hijo_id: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errores.producto_hijo_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecciona un producto...</option>
                {productos
                  .filter((p) => p.id !== parseInt(formData.producto_padre_id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.nombre}
                    </option>
                  ))}
              </select>
              {errores.producto_hijo_id && (
                <p className="text-red-500 text-sm mt-1">{errores.producto_hijo_id}</p>
              )}
            </div>

            {/* Cantidad Hijo */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Cantidad Generada ({productoHijo?.unidad_nombre || 'unidad'})
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cantidad_hijo}
                onChange={(e) => setFormData({ ...formData, cantidad_hijo: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errores.cantidad_hijo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0.00"
              />
              {errores.cantidad_hijo && (
                <p className="text-red-500 text-sm mt-1">{errores.cantidad_hijo}</p>
              )}
            </div>

            {/* Factor de Conversión */}
            {factor && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Factor de conversión:</strong> 1 {productoPadre?.unidad_nombre} = {factor}{' '}
                  {productoHijo?.unidad_nombre}
                </p>
              </div>
            )}

            {/* Almacén */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Almacén
              </label>
              <select
                value={formData.almacen_id}
                onChange={(e) => setFormData({ ...formData, almacen_id: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errores.almacen_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecciona un almacén...</option>
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

            {/* Sector */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Sector
              </label>
              <select
                value={formData.sector_id}
                onChange={(e) => setFormData({ ...formData, sector_id: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errores.sector_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Selecciona un sector...</option>
                {sectores.map((s) => (
                  <option key={s.id || s.nombre} value={s.id || s.nombre}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              {errores.sector_id && (
                <p className="text-red-500 text-sm mt-1">{errores.sector_id}</p>
              )}
            </div>

            {/* Razón */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Razón del Fraccionamiento
              </label>
              <select
                value={formData.razon}
                onChange={(e) => setFormData({ ...formData, razon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fraccionamiento_manual">Fraccionamiento Manual</option>
                <option value="fraccionamiento_compra">Fraccionamiento de Compra</option>
                <option value="reagrupamiento">Reagrupamiento</option>
                <option value="ajuste_inventario">Ajuste de Inventario</option>
              </select>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={3}
                maxLength={1000}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Añade notas sobre este fraccionamiento..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.notas.length}/1000 caracteres
              </p>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={guardando}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={guardando}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Crear Fraccionamiento'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
