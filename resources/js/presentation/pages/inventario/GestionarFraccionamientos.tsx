/**
 * Page: Gestionar Fraccionamientos
 *
 * ✅ Listar fraccionamientos con filtros
 * ✅ Crear nuevo fraccionamiento
 * ✅ Ver detalles y historial
 * ✅ Revertir fraccionamientos
 * ✅ Estadísticas por producto
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Head, router, Link } from '@inertiajs/react';
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
import {
  Plus,
  Search,
  X,
  Loader2,
  AlertCircle,
  Eye,
  Trash2,
  RotateCcw,
  Calendar,
  User,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DetallesFraccionamientoModal from '@/presentation/components/modals/DetallesFraccionamientoModal';

interface Fraccionamiento {
  id: number;
  producto_padre_id: number;
  cantidad_padre: string;
  unidad_padre: { id: number; nombre: string; codigo: string };
  producto_hijo_id: number;
  cantidad_hijo: string;
  unidad_hijo: { id: number; nombre: string; codigo: string };
  productoPadre: { id: number; nombre: string; sku: string };
  productoHijo: { id: number; nombre: string; sku: string };
  almacen: { id: number; nombre: string };
  sector: { id: number; nombre: string };
  usuario: { id: number; name: string; email: string };
  fecha_fraccionamiento: string;
  razon: string;
  notas?: string;
}

interface PaginatedResponse {
  current_page: number;
  data: Fraccionamiento[];
  total: number;
  per_page: number;
  last_page: number;
}

export default function GestionarFraccionamientos() {
  const [fraccionamientos, setFraccionamientos] = useState<Fraccionamiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [busqueda, setBusqueda] = useState('');
  const [sectorFiltro, setSectorFiltro] = useState('');
  const [razonFiltro, setRazonFiltro] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [sectores, setSectores] = useState<Array<{ id: number; nombre: string }>>([]);
  const [razones] = useState([
    { value: 'fraccionamiento_manual', label: 'Fraccionamiento Manual' },
    { value: 'fraccionamiento_compra', label: 'Fraccionamiento de Compra' },
    { value: 'reagrupamiento', label: 'Reagrupamiento' },
    { value: 'ajuste_inventario', label: 'Ajuste de Inventario' },
  ]);

  const [fraccionamientoSeleccionado, setFraccionamientoSeleccionado] = useState<Fraccionamiento | null>(null);
  const [revertiendo, setRevertiendo] = useState<number | null>(null);

  // Cargar fraccionamientos
  useEffect(() => {
    cargarFraccionamientos();
    cargarSectores();
  }, [paginaActual, busqueda, sectorFiltro, razonFiltro, fechaDesde, fechaHasta]);

  const cargarFraccionamientos = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({
        page: paginaActual.toString(),
        per_page: '10',
      });

      if (sectorFiltro) params.append('sector_id', sectorFiltro);
      if (razonFiltro) params.append('razon', razonFiltro);
      if (fechaDesde) params.append('fecha_desde', fechaDesde);
      if (fechaHasta) params.append('fecha_hasta', fechaHasta);

      const response = await fetch(`/api/inventario/fraccionamientos?${params}`);
      const data = await response.json();

      if (data.success) {
        setFraccionamientos(data.data.data || []);
        setTotalPaginas(data.data.last_page);
      }
    } catch (error) {
      console.error('Error cargando fraccionamientos:', error);
      toast.error('Error al cargar fraccionamientos');
    } finally {
      setCargando(false);
    }
  };

  const cargarSectores = async () => {
    try {
      const response = await fetch('/api/productos/sectores-disponibles');
      const data = await response.json();

      if (Array.isArray(data.data)) {
        setSectores(
          data.data.map((s: any) => ({
            id: s.id || 0,
            nombre: s.nombre,
          }))
        );
      }
    } catch (error) {
      console.error('Error cargando sectores:', error);
    }
  };

  const handleRevertir = async (id: number) => {
    if (!window.confirm('¿Estás seguro de revertir este fraccionamiento?')) {
      return;
    }

    setRevertiendo(id);
    try {
      const response = await fetch(`/api/inventario/fraccionamientos/${id}/revertir`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Fraccionamiento revertido exitosamente');
        cargarFraccionamientos();
      } else {
        toast.error(data.message || 'Error al revertir');
      }
    } catch (error) {
      console.error('Error revertiendo:', error);
      toast.error('Error al revertir fraccionamiento');
    } finally {
      setRevertiendo(null);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setSectorFiltro('');
    setRazonFiltro('');
    setFechaDesde('');
    setFechaHasta('');
    setPaginaActual(1);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRazonBadge = (razon: string) => {
    const colores: Record<string, string> = {
      fraccionamiento_manual: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      fraccionamiento_compra: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      reagrupamiento: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      ajuste_inventario: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    };

    const labels: Record<string, string> = {
      fraccionamiento_manual: 'Manual',
      fraccionamiento_compra: 'Compra',
      reagrupamiento: 'Reagrupamiento',
      ajuste_inventario: 'Ajuste',
    };

    return (
      <Badge className={`text-xs ${colores[razon] || ''}`}>
        {labels[razon] || razon}
      </Badge>
    );
  };

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Inventario', href: '/inventario' },
        { title: 'Fraccionamientos', href: '#' },
      ]}
    >
      <Head title="Gestionar Fraccionamientos" />

      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              📦 Fraccionamientos
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Gestiona fraccionamientos de productos con auditoría completa
            </p>
          </div>
          <Link href="/inventario/fraccionamientos/crear">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base py-2">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Fraccionamiento
            </Button>
          </Link>
        </div>

        {/* Filtros */}
        <Card className="p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🔍 Filtros
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {/* Sector */}
            <select
              value={sectorFiltro}
              onChange={(e) => {
                setSectorFiltro(e.target.value);
                setPaginaActual(1);
              }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los sectores</option>
              {sectores.map((sector, idx) => (
                <option key={sector.id || `sector-${idx}`} value={sector.id || sector.nombre}>
                  {sector.nombre}
                </option>
              ))}
            </select>

            {/* Razón */}
            <select
              value={razonFiltro}
              onChange={(e) => {
                setRazonFiltro(e.target.value);
                setPaginaActual(1);
              }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las razones</option>
              {razones.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            {/* Fecha Desde */}
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setPaginaActual(1);
              }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Fecha Hasta */}
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setPaginaActual(1);
              }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {(sectorFiltro || razonFiltro || fechaDesde || fechaHasta) && (
            <Button
              onClick={limpiarFiltros}
              variant="outline"
              className="text-xs md:text-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </Card>

        {/* Tabla */}
        <Card className="p-4 md:p-6">
          {cargando ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : fraccionamientos.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm md:text-base">No hay fraccionamientos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900">
                    <TableHead className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4">
                      Padre → Hijo
                    </TableHead>
                    <TableHead className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4 hidden sm:table-cell">
                      Cantidades
                    </TableHead>
                    <TableHead className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4 hidden md:table-cell">
                      Ubicación
                    </TableHead>
                    <TableHead className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4 hidden lg:table-cell">
                      Razón
                    </TableHead>
                    <TableHead className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4 hidden lg:table-cell">
                      Usuario
                    </TableHead>
                    <TableHead className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fraccionamientos.map((frac) => (
                    <TableRow
                      key={frac.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 text-xs md:text-sm"
                    >
                      <TableCell className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="font-medium">{frac.productoPadre.sku}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {frac.productoPadre.nombre}
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400">
                            <Package className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">{frac.productoHijo.sku}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {frac.productoHijo.nombre}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4 hidden sm:table-cell">
                        <div className="space-y-1">
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {frac.cantidad_padre} {frac.unidad_padre.codigo}
                          </Badge>
                          <div className="text-gray-500 dark:text-gray-400">↓</div>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            {frac.cantidad_hijo} {frac.unidad_hijo.codigo}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4 hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="font-medium">{frac.almacen.nombre}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {frac.sector.nombre}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs md:text-sm px-2 md:px-4 hidden lg:table-cell">
                        {getRazonBadge(frac.razon)}
                      </TableCell>

                      <TableCell className="text-xs md:text-sm text-gray-900 dark:text-white px-2 md:px-4 hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="font-medium">{frac.usuario.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatearFecha(frac.fecha_fraccionamiento)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs md:text-sm px-2 md:px-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setFraccionamientoSeleccionado(frac)}
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRevertir(frac.id)}
                            disabled={revertiendo === frac.id}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 disabled:opacity-50"
                            title="Revertir"
                          >
                            {revertiendo === frac.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                variant="outline"
                className="text-xs md:text-sm"
              >
                ← Anterior
              </Button>

              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Página {paginaActual} de {totalPaginas}
              </div>

              <Button
                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                variant="outline"
                className="text-xs md:text-sm"
              >
                Siguiente →
              </Button>
            </div>
          )}
        </Card>

        {/* Info */}
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <AlertDescription className="text-xs md:text-sm text-blue-800 dark:text-blue-200 ml-2">
            <strong>💡 Tip:</strong> Los fraccionamientos revertidos se mantienen en el historial (soft delete) para auditoría.
          </AlertDescription>
        </Alert>
      </div>

      {/* Modales */}
      {fraccionamientoSeleccionado && (
        <DetallesFraccionamientoModal
          fraccionamiento={fraccionamientoSeleccionado}
          onClose={() => setFraccionamientoSeleccionado(null)}
        />
      )}
    </AppLayout>
  );
}
