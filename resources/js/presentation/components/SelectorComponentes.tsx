/**
 * Componente: SelectorComponentes
 * ✅ NUEVO (2026-08-22)
 *
 * Permite seleccionar componentes/adicionales opcionales para un producto
 * Muestra componentes obligatorios y opcionales
 */

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ComponenteProducto } from '@/domain/entities/productos-comida';
import axios from 'axios';

interface ComponenteDelProducto {
    componente_id: number;
    componente_nombre: string;
    cantidad_requerida: number;
    es_opcional: boolean;
    precio_unitario: number;
}

interface SelectorComponentesProps {
    productoId: number;
    cantidad: number;
    onComponentesSeleccionados: (componentes: ComponenteProducto[]) => void;
}

export function SelectorComponentes({
    productoId,
    cantidad,
    onComponentesSeleccionados,
}: SelectorComponentesProps) {
    const [componentes, setComponentes] = useState<ComponenteDelProducto[]>([]);
    const [componentesSeleccionados, setComponentesSeleccionados] = useState<Record<number, number>>({});
    const [expandido, setExpandido] = useState(false);
    const [cargando, setCargando] = useState(false);

    // Cargar componentes del producto
    useEffect(() => {
        cargarComponentes();
    }, [productoId]);

    // Notificar cambios de componentes seleccionados
    useEffect(() => {
        const componentesProcesados = componentes
            .filter(comp => componentesSeleccionados[comp.componente_id] > 0)
            .map(comp => ({
                componente_id: comp.componente_id,
                componente_nombre: comp.componente_nombre,
                cantidad: componentesSeleccionados[comp.componente_id],
                cantidad_total_necesaria: componentesSeleccionados[comp.componente_id] * cantidad,
                precio_unitario: comp.precio_unitario,
                subtotal_componente: (componentesSeleccionados[comp.componente_id] * cantidad) * comp.precio_unitario,
                es_opcional: comp.es_opcional,
            }));

        onComponentesSeleccionados(componentesProcesados);
    }, [componentesSeleccionados, cantidad]);

    const cargarComponentes = async () => {
        if (!productoId) return;

        setCargando(true);
        try {
            const response = await axios.get(`/api/productos/${productoId}/componentes`);
            const comps = response.data.data || [];

            setComponentes(comps);

            // Inicializar componentes obligatorios con cantidad requerida
            const seleccionadosIniciales: Record<number, number> = {};
            comps.forEach((comp: ComponenteDelProducto) => {
                if (!comp.es_opcional) {
                    seleccionadosIniciales[comp.componente_id] = comp.cantidad_requerida;
                }
            });
            setComponentesSeleccionados(seleccionadosIniciales);

            if (comps.length > 0) {
                setExpandido(true);
            }
        } catch (error) {
            console.error('Error al cargar componentes:', error);
        } finally {
            setCargando(false);
        }
    };

    if (componentes.length === 0) {
        return null;
    }

    const componentesObligatorios = componentes.filter(c => !c.es_opcional);
    const componentesOpcionales = componentes.filter(c => c.es_opcional);

    const handleCantidadChange = (componenteId: number, cantidad: string) => {
        const value = Math.max(0, parseFloat(cantidad) || 0);
        setComponentesSeleccionados(prev => ({
            ...prev,
            [componenteId]: value,
        }));
    };

    return (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
                onClick={() => setExpandido(!expandido)}
                className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 mb-3"
            >
                {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                🛒 Componentes/Adicionales ({componentes.length})
            </button>

            {expandido && (
                <div className="space-y-4 pl-4">
                    {/* Componentes Obligatorios */}
                    {componentesObligatorios.length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">
                                ⚠️ Obligatorios
                            </h4>
                            <div className="space-y-2">
                                {componentesObligatorios.map(comp => (
                                    <div key={comp.componente_id} className="flex items-center gap-3">
                                        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {comp.componente_nombre}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            ({comp.cantidad_requerida.toFixed(2)})
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {comp.precio_unitario.toFixed(2)} Bs
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Componentes Opcionales */}
                    {componentesOpcionales.length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">
                                ✨ Adicionales (Opcionales)
                            </h4>
                            <div className="space-y-2">
                                {componentesOpcionales.map(comp => (
                                    <div key={comp.componente_id} className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={(componentesSeleccionados[comp.componente_id] || 0) > 0}
                                            onChange={(e) =>
                                                handleCantidadChange(
                                                    comp.componente_id,
                                                    e.target.checked ? comp.cantidad_requerida.toString() : '0'
                                                )
                                            }
                                            className="w-4 h-4 rounded cursor-pointer"
                                        />
                                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                            {comp.componente_nombre}
                                        </span>
                                        {(componentesSeleccionados[comp.componente_id] || 0) > 0 && (
                                            <>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    value={componentesSeleccionados[comp.componente_id] || 0}
                                                    onChange={(e) =>
                                                        handleCantidadChange(comp.componente_id, e.target.value)
                                                    }
                                                    className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                                />
                                                <span className="text-xs text-gray-500 dark:text-gray-400 min-w-max">
                                                    {comp.precio_unitario.toFixed(2)} Bs × {(
                                                        (componentesSeleccionados[comp.componente_id] || 0) * cantidad
                                                    ).toFixed(2)} = {(
                                                        (componentesSeleccionados[comp.componente_id] || 0) *
                                                        cantidad *
                                                        comp.precio_unitario
                                                    ).toFixed(2)} Bs
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
