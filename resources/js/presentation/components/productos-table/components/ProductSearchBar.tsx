import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { formatCurrencyWith2Decimals } from '@/lib/utils';
import BarcodeScannerModal from './BarcodeScannerModal';
import type { Producto } from '@/domain/entities/ventas';
import { useProductSearch } from '../hooks/useProductSearch';

interface ProductSearchBarProps {
    tipo: 'compra' | 'venta';
    almacen_id?: number;
    cliente_id?: number | null;
    isClienteGeneral?: boolean;
    readOnly?: boolean;
    es_farmacia?: boolean;
    permitirProductosSinStock?: boolean; // ✅ NUEVO (2026-05-26): Permitir productos sin stock
    onProductSelected: (producto: Producto) => void;
    onMedicamentoInfo: (producto: Producto) => void;
}

export interface ProductSearchBarHandle {
    focus: () => void;
}

const ProductSearchBar = forwardRef<ProductSearchBarHandle, ProductSearchBarProps>(
    (
        {
    tipo,
    almacen_id,
    cliente_id,
    isClienteGeneral = false,
    readOnly = false,
    es_farmacia = false,
    permitirProductosSinStock = false,
    onProductSelected,
    onMedicamentoInfo
}: ProductSearchBarProps,
        ref
    ) => {
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [loadingInyectables, setLoadingInyectables] = useState(false); // ✅ NUEVO (2026-05-08)
    const inputSearchRef = useRef<HTMLInputElement>(null); // ✅ NUEVO: Ref para el input de búsqueda

    const {
        productSearch,
        setProductSearch,
        productosDisponibles,
        isLoading,
        terminoBuscado,
        searchError,
        isFocused,
        setIsFocused,
        buscarProductos,
        confirmarBusqueda,
        handleScannerResult,
        handleAgregarProductoYLimpiar
    } = useProductSearch({
        tipo,
        almacen_id,
        cliente_id,
        isClienteGeneral,
        readOnly,
        es_farmacia, // ✅ NUEVO (2026-05-08): Pasar es_farmacia para permitir productos sin stock
        permitirProductosSinStock, // ✅ NUEVO (2026-05-26): Pasar permitirProductosSinStock
        onAddProduct: onProductSelected
    });

    // ✅ NUEVO (2026-09-10): Exponer método focus via forwardRef
    useImperativeHandle(ref, () => ({
        focus: () => {
            inputSearchRef.current?.focus();
        }
    }), []);

    // ✅ Reaabrir sugerencias cuando hay nuevos resultados
    useEffect(() => {
        if (productosDisponibles.length > 0 && !showSuggestions) {
            setShowSuggestions(true);
        }
    }, [productosDisponibles.length]);

    // Al volver a escribir, reabrir el panel (si se cerró con ✕) para ver el indicador y los resultados
    useEffect(() => {
        if (productSearch.trim().length >= 2) setShowSuggestions(true);
    }, [productSearch]);

    // ✅ Logging cuando los productos disponibles cambian
    useEffect(() => {
        if (productosDisponibles.length > 0) {
            const modoDescripcion = tipo === 'compra' ? 'COMPRA (Precio Costo)' : 'VENTA (Precio Venta)';
            console.log(`📍 [ProductSearchBar] Modo ${modoDescripcion} - Mostrando ${productosDisponibles.length} productos en tabla`);
            console.log(`🔍 [ProductSearchBar] VERIFICACIÓN tipo='${tipo}' (tipo === 'compra' ? ${tipo === 'compra'} : false)`);
            console.table(productosDisponibles.slice(0, 3).map(p => ({
                nombre: p.nombre,
                código: p.codigo,
                precio: p.precio_venta,
                tipoPrecio: tipo === 'compra' ? 'Costo' : (p.tipo_precio_nombre_recomendado || 'Base'),
                tipo_precio_nombre_recomendado: p.tipo_precio_nombre_recomendado,
                stock: (p as any).stock,
                preciosDisponibles: p.precios?.length || 0
            })));
        }
    }, [productosDisponibles, tipo]);

    // "Sin resultados" solo cuando terminó de buscar exactamente lo que está escrito
    // (antes aparecía durante la espera del debounce, antes de haber buscado)
    const sinResultados =
        !isLoading && !searchError && productosDisponibles.length === 0 && terminoBuscado !== '' && terminoBuscado === productSearch.trim();

    // ✅ Manejadores del modal escáner
    const openScannerModal = () => {
        setScannerError(null);
        setShowScannerModal(true);
    };

    const closeScannerModal = () => {
        setShowScannerModal(false);
        setScannerError(null);
    };

    const handleScannerError = (error: string) => {
        setScannerError(error);
        console.warn('Error del escáner:', error);
    };

    const handleScan = (result: string) => {
        handleScannerResult(result);
        closeScannerModal();
    };

    // ✅ Cerrar sugerencias cuando se selecciona un producto
    const handleSelectProducto = (producto: Producto) => {
        handleAgregarProductoYLimpiar(producto);
        setShowSuggestions(false);
        // ✅ NUEVO (2026-09-08): Volver el foco al input de búsqueda para agregar otro producto
        setTimeout(() => {
            inputSearchRef.current?.focus();
        }, 0);
    };

    // ✅ NUEVO (2026-05-08): Cargar productos inyectables directamente
    const handleCargarInyectables = async () => {
        setLoadingInyectables(true);
        try {
            const params = new URLSearchParams({
                q: 'INYECTABLE',
                tipo: tipo,
                limite: '50'
            });

            if (almacen_id) params.append('almacen_id', almacen_id.toString());

            const response = await fetch(`/api/app/productos/buscar?${params.toString()}`);
            if (!response.ok) throw new Error('Error al cargar inyectables');

            const data = await response.json();
            const productos = data.data || [];

            if (productos.length === 0) {
                alert('No se encontraron productos con SKU INYECTABLE');
                return;
            }

            // console.log(`💊 [ProductSearchBar] Cargando ${productos.length} productos inyectables`);
            productos.forEach((producto: Producto) => {
                handleAgregarProductoYLimpiar(producto);
            });
        } catch (error) {
            console.error('Error cargando inyectables:', error);
            alert('Error al cargar los productos inyectables');
        } finally {
            setLoadingInyectables(false);
        }
    };

    return (
        <>
            {/* Buscador de productos */}
            <div className="sticky top-0 z-10 pb-1 mb-2 mt-3">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            id="product-search-input"
                            ref={inputSearchRef}
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    // Código exacto (o ID) → se agrega; si no, lista de resultados
                                    confirmarBusqueda();
                                }
                            }}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            autoComplete="off"
                            disabled={readOnly}
                            className={`w-full px-2 py-1 pr-8 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-zinc-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${productSearch ? 'pt-3' : ''}`}
                            placeholder=""
                        />
                        {/* Indicador de búsqueda dentro del campo (se ve aunque el panel de sugerencias esté cerrado) */}
                        {isLoading && (
                            <span
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"
                                role="status"
                                aria-label="Buscando productos"
                                title="Buscando productos…"
                            />
                        )}
                        <label className={`absolute left-3 transition-all duration-200 pointer-events-none ${productSearch || isFocused
                            ? 'top-[-20px] text-xs font-medium text-green-600 dark:text-green-400'
                            : 'top-1/2 -translate-y-1/2 text-xs text-gray-600 dark:text-gray-400'
                            }`}>
                            Buscar productos
                        </label>
                    </div>
                    <button
                        type="button"
                        disabled={readOnly || isLoading}
                        onClick={() => buscarProductos()}
                        className="px-2 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Buscar producto"
                    >
                        <svg className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        disabled={readOnly}
                        onClick={openScannerModal}
                        className="px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center sm:hidden"
                        title="Escanear código de barras"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 15h4.01M12 21h4.01M12 18h4.01M12 9h4.01M12 6h4.01M12 3h4.01" />
                        </svg>
                    </button>

                    {/* ✅ NUEVO (2026-05-08): Botón para cargar inyectables (solo en farmacias) */}
                    {es_farmacia && (
                        <button
                            type="button"
                            disabled={readOnly || loadingInyectables}
                            onClick={handleCargarInyectables}
                            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            title="Cargar todos los productos inyectables"
                        >
                            <span className="hidden sm:inline text-sm font-medium">💊</span>
                        </button>
                    )}
                </div>

                {/* ✅ Mostrar resultados solo si hay búsqueda realizada */}
                {showSuggestions && (isLoading || productosDisponibles.length > 0 || searchError || sinResultados) && (
                    <div className="mt-1 max-h-[60vh] overflow-y-auto border border-gray-200 dark:border-zinc-600 rounded-md">
                        {/* ✅ ESTADO: Cargando (arriba; si había resultados quedan visibles, atenuados) */}
                        {isLoading && (
                            <div className="flex items-center justify-center gap-2 px-2.5 py-2 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                                {productSearch.trim() ? `Buscando “${productSearch.trim()}”…` : 'Buscando…'}
                            </div>
                        )}

                        {/* ✅ ESTADO: Error */}
                        {searchError && !isLoading && (
                            <div className="px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 text-center">
                                ❌ {searchError}
                            </div>
                        )}

                        {/* ✅ ESTADO: Resultados encontrados - TABLA MODERNA */}
                        {productosDisponibles.length > 0 && (
                            <>
                                <table className={`w-full border-collapse transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
                                    {/* ✅ ENCABEZADO: Tabla (fijo al hacer scroll) */}
                                    <thead className="sticky top-0 z-10 bg-white dark:bg-zinc-900">
                                        <tr className={`border-b-2 ${tipo === 'compra'
                                            ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border-red-200 dark:border-red-800'
                                            : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800'
                                        }`}>
                                            <th colSpan={8} className="px-4 py-3 text-left">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-semibold text-sm ${tipo === 'compra'
                                                            ? 'text-red-900 dark:text-red-200'
                                                            : 'text-green-900 dark:text-green-200'
                                                        }`}>
                                                            ✨ {productosDisponibles.length} {productosDisponibles.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                                                        </span>
                                                        <span className={`text-xs ${tipo === 'compra'
                                                            ? 'text-red-700 dark:text-red-300'
                                                            : 'text-green-700 dark:text-green-300'
                                                        }`}>Haz clic en una fila para agregar</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowSuggestions(false)}
                                                        className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${tipo === 'compra'
                                                            ? 'hover:bg-red-200 dark:hover:bg-red-900/40'
                                                            : 'hover:bg-green-200 dark:hover:bg-green-900/40'
                                                        }`}
                                                        title="Cerrar sugerencias"
                                                    >
                                                        <span className={`text-lg font-bold ${tipo === 'compra'
                                                            ? 'text-red-700 dark:text-red-400'
                                                            : 'text-green-700 dark:text-green-400'
                                                        }`}>✕</span>
                                                    </button>
                                                </div>
                                            </th>
                                        </tr>
                                        <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">ID</th>
                                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Producto</th>
                                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">SKU / Código de barras</th>
                                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {tipo === 'compra' ? 'Precio Costo' : 'Precio Venta'}
                                            </th>
                                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {tipo === 'compra' ? 'Tipo' : 'Tipo Precio'}
                                            </th>
                                            <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">Stock</th>
                                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Unidad</th>
                                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Marca</th>
                                            {/* <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Categoría</th> */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productosDisponibles.map((producto) => (
                                            <tr
                                                key={producto.id}
                                                onClick={() => handleSelectProducto(producto)}
                                                className={`border-b border-gray-100 dark:border-zinc-700 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${tipo === 'compra'
                                                    ? 'hover:bg-red-50 dark:hover:bg-red-900/20'
                                                    : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                                                }`}
                                            >
                                                <td className="px-3 py-3 text-xs whitespace-nowrap">
                                                    {/* Abre la edición en otra pestaña (no se pierde la venta) y no agrega el producto */}
                                                    <a
                                                        href={`/productos/${producto.id}/edit`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Editar producto en otra pestaña"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-1.5 py-0.5 font-bold text-white hover:bg-blue-700 hover:underline"
                                                    >
                                                        #{producto.id}
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 3h7v7m0-7L10 14M5 5h4M5 5v14h14v-4" />
                                                        </svg>
                                                    </a>
                                                </td>
                                                <td className="px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                                    {producto.nombre}
                                                </td>
                                                <td className="px-3 py-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    <div>{producto.codigo}</div>
                                                    {(() => {
                                                        // Códigos de barra activos (codigos_barra), el principal primero. Si lo buscado
                                                        // coincide con otro código, se muestra ese, para ver por qué apareció el producto.
                                                        const codigos: string[] = producto.codigos_barras ?? [];
                                                        if (codigos.length === 0) {
                                                            return <div className="text-xs text-gray-400 dark:text-gray-500">Sin código de barras</div>;
                                                        }
                                                        const termino = productSearch.trim().toLowerCase();
                                                        const mostrado = (termino && codigos.find((c) => c.toLowerCase().includes(termino))) || codigos[0];
                                                        const otros = codigos.filter((c) => c !== mostrado);
                                                        return (
                                                            <div className="flex items-center gap-1 font-mono text-xs">
                                                                <span title="Código de barras">▮▯ {mostrado}</span>
                                                                {otros.length > 0 && (
                                                                    <span
                                                                        title={`Otros códigos de barras:\n${otros.join('\n')}`}
                                                                        className="cursor-help rounded bg-gray-200 px-1 font-sans text-gray-700 dark:bg-zinc-700 dark:text-gray-300"
                                                                    >
                                                                        +{otros.length}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-3 py-3 text-sm font-bold text-right text-green-700 dark:text-green-400">
                                                    {formatCurrencyWith2Decimals(producto.precio_venta || 0)}
                                                </td>
                                                <td className="px-3 py-3 text-xs">
                                                    {(() => {
                                                        const esCompra = tipo === 'compra';
                                                        const tieneRecomendado = !!producto.tipo_precio_nombre_recomendado;

                                                        // console.log(`🏷️ [ProductSearchBar-Badge] ${producto.nombre} | tipo='${tipo}' esCompra=${esCompra} tieneRecomendado=${tieneRecomendado} valor='${producto.tipo_precio_nombre_recomendado}'`);

                                                        if (esCompra) {
                                                            return (
                                                                <span className="inline-block bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-full font-medium">
                                                                    Costo
                                                                </span>
                                                            );
                                                        } else if (tieneRecomendado) {
                                                            return (
                                                                <span className="inline-block bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full font-medium">
                                                                    {producto.tipo_precio_nombre_recomendado}
                                                                </span>
                                                            );
                                                        } else {
                                                            return <span className="text-gray-400 text-xs">Base</span>;
                                                        }
                                                    })()}
                                                </td>
                                                <td className="px-3 py-3 text-sm text-center font-medium">
                                                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                                        {(producto as any).stock ?? (producto as any).stock_disponible ?? 0}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-xs">
                                                    {producto.unidad ? (
                                                        <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium">
                                                            {producto.unidad.nombre}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-xs">
                                                    {producto.marca ? (
                                                        <span className="inline-block bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-medium">
                                                            {producto.marca.nombre}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                {/* <td className="px-3 py-3 text-xs">
                                                    {producto.categoria ? (
                                                        <span className="inline-block bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full font-medium">
                                                            {producto.categoria.nombre}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td> */}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* ✅ Botón para mostrar info de medicamentos (solo para farmacias) */}
                                {es_farmacia && productosDisponibles.some(p => p.principio_activo || p.uso_de_medicacion) && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 px-4 py-2.5 flex gap-2 flex-wrap">
                                        {productosDisponibles
                                            .filter(p => p.principio_activo || p.uso_de_medicacion)
                                            .map(producto => (
                                                <button
                                                    key={`med-${producto.id}`}
                                                    type="button"
                                                    onClick={() => onMedicamentoInfo(producto)}
                                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold bg-white dark:bg-zinc-800 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 transition"
                                                >
                                                    💊 {producto.nombre}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* ✅ ESTADO: Sin resultados */}
                        {sinResultados && (
                            <div className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 text-center bg-gray-50 dark:bg-zinc-800/50">
                                🔍 No se encontraron productos para “{terminoBuscado}”
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal del escáner */}
            <BarcodeScannerModal
                isOpen={showScannerModal}
                onClose={closeScannerModal}
                onScan={handleScan}
                onError={handleScannerError}
                error={scannerError}
            />
        </>
    );
});

ProductSearchBar.displayName = 'ProductSearchBar';

export default ProductSearchBar;
