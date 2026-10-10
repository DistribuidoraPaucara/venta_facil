// Modal para fraccionar un producto padre (ej. paquete) en su producto hijo (ej. unidad)
// desde la pantalla de Actualizar Stock Masivo. Usa POST /api/inventario/fraccionamientos.
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Scissors } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog';

export interface ConversionHijo {
  id: number;
  producto_hijo_id: number | null;
  producto_hijo_nombre?: string | null;
  unidad_destino_nombre: string;
  factor_conversion: number | string;
}

export interface ProductoFraccionable {
  id: number;
  nombre: string;
  unidad_nombre: string;
  conversiones: ConversionHijo[];
}

interface StockUbicacion {
  id: number;
  almacen_id: number;
  almacen_nombre: string | null;
  sector_id: number | null;
  sector_nombre: string | null;
  cantidad: number;
}

interface Props {
  producto: ProductoFraccionable | null;
  onClose: () => void;
  onFraccionado: () => void;
}

const formatear = (n: number) => Number(n.toFixed(4)).toString();

export default function FraccionarProductoModal({ producto, onClose, onFraccionado }: Props) {
  const hijos = useMemo(
    () => (producto?.conversiones ?? []).filter((c) => c.producto_hijo_id),
    [producto],
  );

  const [conversionId, setConversionId] = useState<number | null>(null);
  const [ubicaciones, setUbicaciones] = useState<StockUbicacion[]>([]);
  const [stockId, setStockId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Al abrir: elegir el primer hijo y cargar el stock del padre por almacén/sector
  useEffect(() => {
    if (!producto) return;
    setConversionId(hijos[0]?.id ?? null);
    setCantidad('');
    setUbicaciones([]);
    setStockId(null);

    let cancelado = false;
    setCargando(true);
    fetch(`/api/inventario/fraccionamientos/productos/disponibles?search=${producto.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelado) return;
        const padre = (data.data ?? []).find((p: any) => p.id === producto.id);
        // El fraccionamiento necesita almacén y sector, y stock para descontar
        const conStock: StockUbicacion[] = (padre?.stocks ?? []).filter(
          (s: StockUbicacion) => s.sector_id && s.cantidad > 0,
        );
        setUbicaciones(conStock);
        // Por defecto, la ubicación con más stock
        const mayor = [...conStock].sort((a, b) => b.cantidad - a.cantidad)[0];
        setStockId(mayor?.id ?? null);
      })
      .catch(() => !cancelado && toast.error('Error al cargar el stock del producto'))
      .finally(() => !cancelado && setCargando(false));

    return () => {
      cancelado = true;
    };
  }, [producto, hijos]);

  const conversion = hijos.find((c) => c.id === conversionId);
  const ubicacion = ubicaciones.find((u) => u.id === stockId);
  const factor = Number(conversion?.factor_conversion ?? 0);
  const cantidadPadre = Number(cantidad) || 0;
  const cantidadHijo = cantidadPadre * factor;
  const excedeStock = !!ubicacion && cantidadPadre > ubicacion.cantidad;
  const puedeGuardar = !!conversion && !!ubicacion && cantidadPadre > 0 && factor > 0 && !excedeStock && !guardando;

  const fraccionar = async () => {
    if (!producto || !conversion || !ubicacion || !puedeGuardar) return;
    setGuardando(true);
    try {
      const response = await fetch('/api/inventario/fraccionamientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          producto_padre_id: producto.id,
          cantidad_padre: cantidadPadre,
          producto_hijo_id: conversion.producto_hijo_id,
          cantidad_hijo: cantidadHijo,
          almacen_id: ubicacion.almacen_id,
          sector_id: ubicacion.sector_id,
          razon: 'fraccionamiento_manual',
          notas: 'Fraccionado desde Actualizar Stock Masivo',
        }),
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Error al fraccionar');
      }
      toast.success(
        `✂️ ${formatear(cantidadPadre)} ${producto.unidad_nombre} → +${formatear(cantidadHijo)} ${conversion.unidad_destino_nombre}`,
      );
      onFraccionado();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al fraccionar');
    } finally {
      setGuardando(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <Dialog open={!!producto} onOpenChange={(open) => !open && !guardando && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" /> Fraccionar producto
          </DialogTitle>
          <DialogDescription>
            #{producto?.id} {producto?.nombre}
          </DialogDescription>
        </DialogHeader>

        {cargando ? (
          <div className="flex items-center justify-center py-6 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cargando stock...
          </div>
        ) : hijos.length === 0 ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Este producto no tiene conversiones hacia un producto hijo. Configúralas en la edición del producto (paso Conversiones).
          </p>
        ) : ubicaciones.length === 0 ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            No hay stock de este producto en ningún almacén/sector para fraccionar.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Producto hijo</label>
              <select className={inputClass} value={conversionId ?? ''} onChange={(e) => setConversionId(Number(e.target.value))}>
                {hijos.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.producto_hijo_id} {c.producto_hijo_nombre ?? ''} (1 {producto?.unidad_nombre} = {Number(c.factor_conversion)} {c.unidad_destino_nombre})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Fraccionar desde</label>
              <select className={inputClass} value={stockId ?? ''} onChange={(e) => setStockId(Number(e.target.value))}>
                {ubicaciones.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.almacen_nombre ?? 'Almacén'} / {u.sector_nombre ?? 'Sector'} — Stock: {formatear(u.cantidad)} {producto?.unidad_nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Cantidad a fraccionar ({producto?.unidad_nombre})</label>
              <input
                type="number"
                min="0"
                step="any"
                autoFocus
                className={inputClass}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fraccionar()}
                placeholder="Ej: 2"
              />
              {excedeStock && (
                <p className="text-xs text-red-600">Supera el stock disponible en esta ubicación ({formatear(ubicacion!.cantidad)}).</p>
              )}
            </div>

            {cantidadPadre > 0 && ubicacion && conversion && !excedeStock && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm space-y-1">
                <div>
                  <span className="font-medium">#{producto?.id} {producto?.nombre}:</span>{' '}
                  {formatear(ubicacion.cantidad)} → <b>{formatear(ubicacion.cantidad - cantidadPadre)}</b> {producto?.unidad_nombre}{' '}
                  <span className="text-red-600">(−{formatear(cantidadPadre)})</span>
                </div>
                <div>
                  <span className="font-medium">#{conversion.producto_hijo_id} {conversion.producto_hijo_nombre}:</span>{' '}
                  <span className="text-green-600 font-semibold">+{formatear(cantidadHijo)} {conversion.unidad_destino_nombre}</span>
                </div>
                <div className="text-xs text-gray-500">en {ubicacion.almacen_nombre} / {ubicacion.sector_nombre}</div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={fraccionar} disabled={!puedeGuardar}>
            {guardando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scissors className="w-4 h-4 mr-2" />}
            Fraccionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
