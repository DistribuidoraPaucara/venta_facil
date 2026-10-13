// Modal para transferir un producto de un almacén a otro desde Actualizar Stock Masivo.
// Usa POST /api/inventario/transferir-producto (transferencia inmediata, queda en el historial de transferencias).
// Si el producto es un paquete fraccionable, permite transferir UNIDADES de su producto hijo:
// usa primero las unidades sueltas del origen (opcional) y abre solo los paquetes necesarios.
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog';

export interface StockRegistro {
  id: number;
  sector: string | null;
  lote: string | null;
  fecha_vencimiento: string | null;
  cantidad: number;
  cantidad_disponible: number;
}

interface ConversionHijo {
  id: number;
  producto_hijo_id: number | null;
  producto_hijo_nombre?: string | null;
  unidad_destino_nombre: string;
  factor_conversion: number | string;
}

export interface ProductoTransferible {
  id: number;
  nombre: string;
  almacen_id: number;
  almacen?: string;
  unidad_nombre: string;
  es_fraccionado?: boolean;
  stocks?: StockRegistro[];
  conversiones?: ConversionHijo[];
}

/** Datos de un producto en un almacén (fila del listado) */
export interface FilaAlmacen {
  cantidad_total: number;
  es_fraccionado?: boolean;
  stocks?: StockRegistro[];
}

interface Props {
  producto: ProductoTransferible | null;
  almacenes: { id: number; nombre: string }[];
  filaDe: (productoId: number, almacenId: number) => FilaAlmacen | undefined;
  onClose: () => void;
  onTransferido: () => void;
}

const formatear = (n: number) => Number(n.toFixed(4)).toString();

/**
 * Unidades sueltas del hijo: mismo registro que usa el backend
 * (sin lote ni vencimiento, priorizando el sector del paquete, luego el de menor id).
 */
function sueltasDelHijo(fila: FilaAlmacen | undefined, sectorPaquete: string | null): number {
  const candidatos = (fila?.stocks ?? [])
    .filter((s) => !s.lote && !s.fecha_vencimiento)
    .sort((a, b) => Number(b.sector === sectorPaquete) - Number(a.sector === sectorPaquete) || a.id - b.id);
  return Math.max(0, candidatos[0]?.cantidad_disponible ?? 0);
}

export default function TransferirProductoModal({ producto, almacenes, filaDe, onClose, onTransferido }: Props) {
  const registros = useMemo(
    () => (producto?.stocks ?? []).filter((s) => s.cantidad_disponible > 0),
    [producto],
  );
  const destinos = useMemo(
    () => almacenes.filter((a) => a.id !== producto?.almacen_id),
    [almacenes, producto],
  );
  const hijos = useMemo(
    () => (producto?.es_fraccionado ? (producto.conversiones ?? []).filter((c) => c.producto_hijo_id) : []),
    [producto],
  );

  const [modo, setModo] = useState<'paquete' | 'unidades'>('paquete');
  const [conversionId, setConversionId] = useState<number | null>(null);
  const [usarSueltas, setUsarSueltas] = useState(true);
  const [stockId, setStockId] = useState<number | null>(null);
  const [destinoId, setDestinoId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!producto) return;
    const mayor = [...registros].sort((a, b) => b.cantidad_disponible - a.cantidad_disponible)[0];
    setStockId(mayor?.id ?? null);
    setDestinoId(destinos.length === 1 ? destinos[0].id : null);
    setCantidad('');
    setModo('paquete');
    setConversionId(hijos[0]?.id ?? null);
    setUsarSueltas(true);
  }, [producto, registros, destinos, hijos]);

  const registro = registros.find((s) => s.id === stockId);
  const destino = destinos.find((a) => a.id === destinoId);
  const valor = Number(cantidad) || 0;
  const unidadPaquete = producto?.unidad_nombre ?? '';

  // ── Modo unidades (producto hijo) ──
  const conversion = hijos.find((c) => c.id === conversionId);
  const factor = Number(conversion?.factor_conversion ?? 0);
  const hijoId = conversion?.producto_hijo_id ?? 0;
  const filaHijoOrigen = producto && hijoId ? filaDe(hijoId, producto.almacen_id) : undefined;
  const filaHijoDestino = destino && hijoId ? filaDe(hijoId, destino.id) : undefined;
  const sueltas = sueltasDelHijo(filaHijoOrigen, registro?.sector ?? null);
  const sueltasUsables = usarSueltas ? sueltas : 0;
  const faltante = Math.max(0, Number((valor - sueltasUsables).toFixed(4)));
  const paquetesAbrir = faltante > 0 && factor > 0 ? Math.ceil(Number((faltante / factor).toFixed(4))) : 0;
  const unidadHijo = conversion?.unidad_destino_nombre ?? 'unidades';
  const esModoUnidades = modo === 'unidades' && !!conversion;

  // Cantidad múltiplo exacto del paquete: sugerir transferir paquetes cerrados
  const paquetesCerrados = factor > 0 && valor > 0 && Number.isInteger(Number((valor / factor).toFixed(4))) ? Number((valor / factor).toFixed(4)) : 0;

  // ── Validaciones ──
  const disponiblePaquetes = registro?.cantidad_disponible ?? 0;
  let error = '';
  if (valor > 0) {
    if (esModoUnidades) {
      if (filaHijoOrigen?.es_fraccionado === false && !Number.isInteger(valor)) error = `${conversion?.producto_hijo_nombre ?? 'El producto hijo'} solo admite cantidades enteras.`;
      else if (paquetesAbrir > disponiblePaquetes) error = `Se necesitan ${paquetesAbrir} ${unidadPaquete} y solo hay ${formatear(disponiblePaquetes)} disponible(s).`;
    } else {
      if (valor > disponiblePaquetes) error = `Supera el disponible (${formatear(disponiblePaquetes)}).`;
      else if (!producto?.es_fraccionado && !Number.isInteger(valor)) error = 'Este producto no es fraccionado: solo cantidades enteras.';
    }
  }
  const puedeGuardar = !!producto && !!registro && !!destino && valor > 0 && !error && !guardando;

  const transferir = async () => {
    if (!puedeGuardar || !registro || !destino || !producto) return;
    setGuardando(true);
    try {
      const response = await fetch('/api/inventario/transferir-producto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          stock_producto_id: registro.id,
          almacen_destino_id: destino.id,
          cantidad: valor,
          ...(esModoUnidades && { conversion_id: conversion!.id, usar_sueltas: usarSueltas }),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || (response.status === 403 ? 'No tienes permiso para crear transferencias' : 'Error al transferir'));
      }
      const unidad = esModoUnidades ? unidadHijo : unidadPaquete;
      toast.success(`🔁 ${data.message ?? 'Transferencia realizada'}: ${formatear(valor)} ${unidad} → ${destino.nombre}`);
      onTransferido();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al transferir');
    } finally {
      setGuardando(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  const etiquetaRegistro = (s: StockRegistro) =>
    [s.sector ?? 'Sin sector', s.lote ? `Lote ${s.lote}` : 'Sin lote', s.fecha_vencimiento ? `Vence ${s.fecha_vencimiento}` : null]
      .filter(Boolean)
      .join(' · ') + ` — Disp: ${formatear(s.cantidad_disponible)}`;

  const stockDestinoPaquete = producto && destino ? filaDe(producto.id, destino.id)?.cantidad_total ?? 0 : 0;
  const stockDestinoHijo = filaHijoDestino?.cantidad_total ?? 0;
  const sueltasTrasAbrir = sueltas + paquetesAbrir * factor;

  return (
    <Dialog open={!!producto} onOpenChange={(open) => !open && !guardando && onClose()}>
      {/* Altura máxima con scroll solo en el cuerpo: título y botones siempre visibles */}
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" /> Transferir producto
          </DialogTitle>
          <DialogDescription>
            #{producto?.id} {producto?.nombre} — desde <b>{producto?.almacen}</b>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6 py-1">
        {registros.length === 0 ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">No hay stock disponible de este producto en {producto?.almacen} para transferir.</p>
        ) : destinos.length === 0 ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">No hay otro almacén en la empresa al cual transferir.</p>
        ) : (
          <div className="space-y-4">
            {hijos.length > 0 && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Transferir en</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['paquete', 'unidades'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModo(m)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${modo === m
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      {m === 'paquete' ? `📦 ${unidadPaquete}` : `✂️ ${unidadHijo} (hijo)`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {esModoUnidades && hijos.length > 1 && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Producto hijo</label>
                <select className={inputClass} value={conversionId ?? ''} onChange={(e) => setConversionId(Number(e.target.value))}>
                  {hijos.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.producto_hijo_id} {c.producto_hijo_nombre ?? ''} (1 {unidadPaquete} = {Number(c.factor_conversion)} {c.unidad_destino_nombre})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">{esModoUnidades ? `${unidadPaquete} a abrir desde (sector / lote)` : 'Desde (sector / lote)'}</label>
              <select className={inputClass} value={stockId ?? ''} onChange={(e) => setStockId(Number(e.target.value))}>
                {registros.map((s) => (
                  <option key={s.id} value={s.id}>{etiquetaRegistro(s)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Almacén destino</label>
              <select className={inputClass} value={destinoId ?? ''} onChange={(e) => setDestinoId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Seleccionar almacén</option>
                {destinos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>

            {esModoUnidades && (
              <div className={`rounded-lg border p-3 text-sm space-y-2 ${sueltas > 0
                ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40'}`}>
                <div>
                  {sueltas > 0 ? '⚠️ ' : ''}Hay <b>{formatear(sueltas)} {unidadHijo}</b> sueltas de #{hijoId} {conversion?.producto_hijo_nombre} en {producto?.almacen}
                  {' '}(1 {unidadPaquete} = {formatear(factor)} {unidadHijo}).
                </div>
                {sueltas > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={usarSueltas} onChange={(e) => setUsarSueltas(e.target.checked)} />
                    <span>Usar primero las unidades sueltas (desmarca para abrir un {unidadPaquete} cerrado)</span>
                  </label>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Cantidad ({esModoUnidades ? unidadHijo : unidadPaquete})</label>
              <input
                type="number"
                min="0"
                step={esModoUnidades ? (filaHijoOrigen?.es_fraccionado ? 'any' : '1') : producto?.es_fraccionado ? 'any' : '1'}
                autoFocus
                className={inputClass}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && transferir()}
                placeholder="Ej: 3"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              {esModoUnidades && !error && paquetesCerrados > 0 && paquetesCerrados <= disponiblePaquetes && (
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  onClick={() => {
                    setModo('paquete');
                    setCantidad(String(paquetesCerrados));
                  }}
                >
                  💡 {formatear(valor)} {unidadHijo} = {paquetesCerrados} {unidadPaquete} completo(s). ¿Transferir el {unidadPaquete} cerrado en su lugar?
                </button>
              )}
            </div>

            {valor > 0 && registro && destino && !error && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm space-y-1">
                {esModoUnidades ? (
                  <>
                    {paquetesAbrir > 0 ? (
                      <div>
                        <span className="font-medium">1. Abrir {paquetesAbrir} {unidadPaquete} en {producto?.almacen}:</span>{' '}
                        {unidadPaquete} {formatear(registro.cantidad_disponible)} → <b>{formatear(registro.cantidad_disponible - paquetesAbrir)}</b>
                        {' · '}{unidadHijo} sueltas {formatear(sueltas)} → <b>{formatear(sueltasTrasAbrir)}</b>
                      </div>
                    ) : (
                      <div className="text-gray-600 dark:text-gray-300">No se abre ningún {unidadPaquete}: se usan las unidades sueltas.</div>
                    )}
                    <div>
                      <span className="font-medium">{paquetesAbrir > 0 ? '2. ' : ''}Transferir {formatear(valor)} {unidadHijo}:</span>{' '}
                      {producto?.almacen} {formatear(sueltasTrasAbrir)} → <b>{formatear(sueltasTrasAbrir - valor)}</b>
                      {' · '}{destino.nombre} {formatear(stockDestinoHijo)} → <b>{formatear(stockDestinoHijo + valor)}</b>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="font-medium">{producto?.almacen}:</span> {formatear(registro.cantidad_disponible)} →{' '}
                      <b>{formatear(registro.cantidad_disponible - valor)}</b> <span className="text-red-600">(−{formatear(valor)})</span>
                    </div>
                    <div>
                      <span className="font-medium">{destino.nombre}:</span> {formatear(stockDestinoPaquete)} →{' '}
                      <b>{formatear(stockDestinoPaquete + valor)}</b> <span className="text-green-600">(+{formatear(valor)})</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={onClose} disabled={guardando}>Cancelar</Button>
          <Button onClick={transferir} disabled={!puedeGuardar}>
            {guardando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
