import { useState, useCallback, useRef, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { NotificationService } from '@/infrastructure/services/notification.service';
import type { Producto } from '@/domain/entities/ventas';
import Fuse from 'fuse.js';

// Máximo de productos por búsqueda en API (el backend también lo limita a 100)
const LIMITE_BUSQUEDA_API = '100';

interface UseProductSearchProps {
    tipo: 'compra' | 'venta';
    almacen_id?: number;
    cliente_id?: number | null;
    readOnly?: boolean;
    onAddProduct: (producto: Producto) => void;
    useFuseSearch?: boolean; // ✅ NIVEL 2: Permitir deshabilitar Fuse.js si es necesario
    isClienteGeneral?: boolean; // ✅ NUEVO: Indicar si es cliente GENERAL para seleccionar tipo de precio
    es_farmacia?: boolean; // ✅ NUEVO (2026-05-08): Indicar si es farmacia para permitir productos sin stock
    permitirProductosSinStock?: boolean; // ✅ NUEVO (2026-05-26): Permitir productos sin stock en proformas
}

export function useProductSearch({
    tipo,
    almacen_id,
    cliente_id,
    readOnly,
    onAddProduct,
    useFuseSearch = false, // ✅ DESACTIVADO (2026-05-08): Usar búsqueda por API en lugar de cargar todos los productos al inicio
    isClienteGeneral = false, // ✅ NUEVO: Por defecto NO es cliente general
    es_farmacia = false, // ✅ NUEVO (2026-05-08): Por defecto NO es farmacia
    permitirProductosSinStock = false // ✅ NUEVO (2026-05-26): Por defecto NO permitir sin stock
}: UseProductSearchProps) {
    const [productSearch, setProductSearch] = useState('');
    const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // Término de la última búsqueda TERMINADA: "sin resultados" solo se muestra si coincide con lo escrito
    const [terminoBuscado, setTerminoBuscado] = useState('');
    // Número de la búsqueda vigente: las respuestas de búsquedas anteriores se descartan
    const busquedaVigenteRef = useRef(0);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    // ✅ NUEVO: Obtener empresa_id del usuario autenticado usando Hooks en el cuerpo de la función
    const { auth } = usePage().props as any;
    const empresaId = auth?.user?.empresa_id;

    // ✅ NIVEL 2: Estados para Fuse.js
    const [todosProductos, setTodosProductos] = useState<Producto[]>([]);
    const [productosInicioCargados, setProductosInicioCargados] = useState(false);
    const fuseIndexRef = useRef<Fuse<Producto> | null>(null);

    // ✅ NIVEL 1: Caché local para búsquedas
    const searchCacheRef = useRef<Map<string, Producto[]>>(new Map());

    // ✅ NIVEL 1: Ref para debounce
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ✅ Helper: Transformar respuesta de API a formato Producto
    const transformarProductoAPI = (p: any): Producto => {
        // 🔍 Logging de entrada - verificar códigos de barras
        if (p.nombre && (p.nombre.includes('Paceña') || p.nombre.includes('Corona'))) {
            console.log(`🔄 [transformarProductoAPI] ENTRADA: ${p.nombre}`, {
                codigosBarra: p.codigosBarra,
                codigos_barras: p.codigos_barras,
                codigos_producto: p.codigos_producto
            });
        }

        const stockDisponible = tipo === 'compra'
            ? (p.stock_disponible !== null && p.stock_disponible !== undefined ? p.stock_disponible : (p.stock || 0))
            : (p.stock_disponible || 0);

        // ✅ NUEVO: Determinar el precio correcto según tipo (compra vs venta) y cliente
        let precioVenta = p.precio_base || 0;
        let tipoPrecioUsado = 'precio_base';
        let tipoPrecioSeleccionado = null;

        // ✅ MODO COMPRA: Buscar precio de costo que coincida con unidad base (PAQUETE)
        if (tipo === 'compra') {
            // ✅ NUEVO: Para compras, buscar en el array de precios el que coincida con tipo_precio_id_recomendado
            // y con la unidad_medida_id del producto (PAQUETE)
            if (p.precios && Array.isArray(p.precios) && p.precios.length > 0) {
                // Estrategia 1: Buscar por tipo_precio_id recomendado + unidad base
                const precioCosto = p.precios.find((pr: any) =>
                    pr.tipo_precio_id === p.tipo_precio_id_recomendado &&
                    pr.unidad_medida_id === p.unidad_medida_id
                );

                if (precioCosto) {
                    precioVenta = precioCosto.precio || 0;
                    tipoPrecioUsado = precioCosto.nombre || 'Precio Costo';
                    tipoPrecioSeleccionado = precioCosto.tipo_precio_id;
                    console.log(`💵 [transformarProductoAPI] MODO COMPRA (Estrategia 1) - ${p.nombre}: Precio Costo (${p.unidad_medida_nombre}) = ${precioVenta}`);
                } else {
                    // Estrategia 2: Si no hay tipo_precio_id_recomendado, buscar COSTO (9) + unidad base
                    const precioCostoExplicito = p.precios.find((pr: any) =>
                        pr.tipo_precio_id === 9 &&
                        pr.unidad_medida_id === p.unidad_medida_id
                    );

                    if (precioCostoExplicito) {
                        precioVenta = precioCostoExplicito.precio || 0;
                        tipoPrecioUsado = precioCostoExplicito.nombre || 'Precio Costo';
                        tipoPrecioSeleccionado = precioCostoExplicito.tipo_precio_id;
                        console.log(`💵 [transformarProductoAPI] MODO COMPRA (Estrategia 2) - ${p.nombre}: Precio Costo Explícito (${p.unidad_medida_nombre}) = ${precioVenta}`);
                    } else {
                        // Estrategia 3: Último fallback, usar precio_costo
                        precioVenta = p.precio_costo || 0;
                        tipoPrecioUsado = 'Precio Costo';
                        console.log(`💵 [transformarProductoAPI] MODO COMPRA (Estrategia 3) - ${p.nombre}: Precio Costo Fallback = ${precioVenta}`);
                    }
                }
            } else {
                precioVenta = p.precio_costo || 0;
                tipoPrecioUsado = 'Precio Costo';
                console.log(`💵 [transformarProductoAPI] MODO COMPRA - ${p.nombre}: Precio Costo = ${precioVenta}`);
            }
        }
        // ✅ MODO VENTA: Seleccionar según cliente (LICORERIA vs VENTA)
        else if (tipo === 'venta') {
            // Si hay array de precios disponibles
            if (p.precios && Array.isArray(p.precios) && p.precios.length > 0) {
                // ✅ LÓGICA: Seleccionar tipo de precio según cliente
                let tipoNombreBuscado = null;

                if (isClienteGeneral) {
                    // ✅ CLIENTE GENERAL → buscar LICORERIA
                    tipoNombreBuscado = 'LICORERIA';
                    console.log(`🎯 [transformarProductoAPI] Cliente es GENERAL → buscando precio ${tipoNombreBuscado}`);
                } else {
                    // ✅ OTROS CLIENTES → buscar VENTA
                    tipoNombreBuscado = 'VENTA';
                    console.log(`🎯 [transformarProductoAPI] Cliente es ESPECÍFICO → buscando precio ${tipoNombreBuscado}`);
                }

                // Intentar encontrar el precio por nombre exacto
                if (tipoNombreBuscado) {
                    const precioBuscado = p.precios.find((pr: any) =>
                        (pr.nombre?.toUpperCase() === tipoNombreBuscado?.toUpperCase() ||
                         pr.tipoPrecio?.nombre?.toUpperCase() === tipoNombreBuscado?.toUpperCase())
                    );

                    if (precioBuscado) {
                        precioVenta = precioBuscado.precio || 0;
                        tipoPrecioUsado = precioBuscado.nombre || precioBuscado.tipoPrecio?.nombre || tipoNombreBuscado;
                        tipoPrecioSeleccionado = precioBuscado.tipo_precio_id;
                        console.log(`✅ [transformarProductoAPI] ${p.nombre}: Precio ${tipoNombreBuscado} encontrado = ${precioVenta}`);
                    } else {
                        // Si no encuentra el tipo buscado, usar recomendado o primero disponible
                        console.log(`⚠️ [transformarProductoAPI] ${p.nombre}: Precio ${tipoNombreBuscado} NO encontrado, usando alternativa`);
                        if (p.tipo_precio_id_recomendado) {
                            const precioRecomendado = p.precios.find((pr: any) => pr.tipo_precio_id === p.tipo_precio_id_recomendado);
                            if (precioRecomendado) {
                                precioVenta = precioRecomendado.precio || 0;
                                tipoPrecioUsado = precioRecomendado.nombre || p.tipo_precio_nombre_recomendado || 'Recomendado';
                                tipoPrecioSeleccionado = p.tipo_precio_id_recomendado;
                            }
                        } else {
                            precioVenta = p.precios[0].precio || 0;
                            tipoPrecioUsado = p.precios[0].nombre || 'Primer disponible';
                            tipoPrecioSeleccionado = p.precios[0].tipo_precio_id;
                        }
                    }
                }
            }

            // 🔍 Logging: Mostrar qué precio se seleccionó en VENTA
            if (p.precios && p.precios.length > 0) {
                console.log(`💰 [transformarProductoAPI] MODO VENTA - ${p.nombre} | Precio: ${precioVenta} (${tipoPrecioUsado}) | Tipos disponibles:`, p.precios.map((pr: any) => ({
                    tipo: pr.nombre || pr.tipoPrecio?.nombre,
                    precio: pr.precio,
                    esMarcado: pr.tipo_precio_id === tipoPrecioSeleccionado
                })));
            }
        }

        // 🔍 VERIFICACIÓN: Intentar obtener códigos de barras desde diferentes fuentes
        let codigosBarrasExtraidos: string[] = [];

        if (p.codigosBarra && Array.isArray(p.codigosBarra) && p.codigosBarra.length > 0) {
            // El principal primero (es el que se muestra en las sugerencias)
            codigosBarrasExtraidos = [...p.codigosBarra]
                .sort((a: any, b: any) => Number(!!b.es_principal) - Number(!!a.es_principal))
                .map((cb: any) => cb.codigo);
            if (p.nombre && (p.nombre.includes('Paceña') || p.nombre.includes('Corona'))) {
                console.log(`✅ [transformarProductoAPI] ${p.nombre}: Códigos de barras desde codigosBarra:`, codigosBarrasExtraidos);
            }
        } else if (p.codigos_barras && Array.isArray(p.codigos_barras) && p.codigos_barras.length > 0) {
            codigosBarrasExtraidos = p.codigos_barras.map((cb: any) => typeof cb === 'string' ? cb : cb.codigo);
            if (p.nombre && (p.nombre.includes('Paceña') || p.nombre.includes('Corona'))) {
                console.log(`✅ [transformarProductoAPI] ${p.nombre}: Códigos de barras desde codigos_barras:`, codigosBarrasExtraidos);
            }
        } else if (p.codigos_producto && Array.isArray(p.codigos_producto) && p.codigos_producto.length > 0) {
            codigosBarrasExtraidos = p.codigos_producto.map((cb: any) => cb.codigo || cb);
            if (p.nombre && (p.nombre.includes('Paceña') || p.nombre.includes('Corona'))) {
                console.log(`✅ [transformarProductoAPI] ${p.nombre}: Códigos de barras desde codigos_producto:`, codigosBarrasExtraidos);
            }
        } else {
            if (p.nombre && (p.nombre.includes('Paceña') || p.nombre.includes('Corona'))) {
                console.log(`⚠️ [transformarProductoAPI] ${p.nombre}: NO SE ENCONTRARON CÓDIGOS DE BARRAS en ninguna fuente`);
            }
        }

        const resultado: Producto = {
            id: p.id,
            nombre: p.nombre,
            codigo: p.sku || p.codigo_barras,
            codigo_barras: p.codigo_barras,
            precio_venta: precioVenta,
            precio_costo: p.precio_costo || 0,
            // ✅ FIJO: En modo COMPRA usar precioVenta calculado (90 PAQUETE), en modo VENTA usar precio_costo
            precio_compra: tipo === 'compra' ? precioVenta : (p.precio_costo || 0),
            stock: stockDisponible,
            stock_disponible_calc: stockDisponible,
            stock_total_calc: p.stock_total || 0,
            stock_reservado: p.stock_reservado || 0,
            capacidad: p.capacidad || null,
            peso: p.peso,
            codigos_barras: codigosBarrasExtraidos,
            es_fraccionado: p.es_fraccionado || false,
            unidad_medida_id: p.unidad_medida_id,
            unidad_medida_nombre: p.unidad_medida_nombre,
            conversiones: p.conversiones || [],
            precios: p.precios?.map((pr: any) => ({
                id: pr.id,
                tipo_precio_id: pr.tipo_precio_id,
                nombre: pr.nombre || pr.tipoPrecio?.nombre,
                precio: pr.precio,
                unidad_medida_id: pr.unidad_medida_id, // ✅ IMPORTANTE para productos fraccionados
            })) || [],
            tipo_precio_id_recomendado: tipoPrecioSeleccionado || p.tipo_precio_id_recomendado,
            tipo_precio_nombre_recomendado: tipoPrecioUsado || p.tipo_precio_nombre_recomendado,
            es_combo: p.es_combo || false,
            combo_items: p.combo_items || [],
            limite_productos: p.limite_productos || null,
            limite_venta: p.limite_venta || null,
            marca: p.marca ? { id: p.marca.id, nombre: p.marca.nombre } : null,
            unidad: p.unidad ? { id: p.unidad.id, nombre: p.unidad.nombre, codigo: p.unidad.codigo } : null,
            categoria: p.categoria ? { id: p.categoria.id, nombre: p.categoria.nombre } : null,
            principio_activo: p.principio_activo || null,
            uso_de_medicacion: p.uso_de_medicacion || null
        };

        // 🔍 Logging de salida - mostrar resumen
        if (p.nombre && (p.nombre.includes('Paceña') || p.nombre.includes('Corona'))) {
            console.log(`📤 [transformarProductoAPI] SALIDA: ${p.nombre}`, {
                codigo: resultado.codigo,
                codigos_barras: resultado.codigos_barras,
                codigosCount: resultado.codigos_barras.length
            });
        }

        return resultado;
    };

    // ✅ Helper: Filtrar productos válidos según tipo
    const filtrarProductosValidos = (productosAPI: Producto[]): Producto[] => {
        return productosAPI.filter(p => {
            if (tipo === 'venta') {
                const esCombo = (p as any).es_combo || false;
                const tieneComponentes = ((p as any).combo_items?.length || 0) > 0;
                const permiteSinStock = (p as any).permite_venta_sin_stock || false;
                const esFraccionado = (p as any).es_fraccionado || false; // ✨ NUEVO: Detectar productos fraccionados

                if (esCombo) {
                    return tieneComponentes;
                }

                // ✅ MODIFICADO (2026-05-26): Si permitirProductosSinStock es true, NO filtrar por stock
                if (permitirProductosSinStock) {
                    // ✨ NUEVO: Permitir productos fraccionados aunque tengan precio_venta = 0
                    // porque se venderán por sus unidades convertidas
                    return p.precio_venta > 0 || esFraccionado;
                }

                // Si NO permitir sin stock, aplicar filtro de stock normal
                const tieneStockSuficiente = p.stock > 0;
                // ✨ NUEVO: Permitir productos fraccionados aunque tengan precio_venta = 0
                return (tieneStockSuficiente || (es_farmacia && permiteSinStock)) && (p.precio_venta > 0 || esFraccionado);
            }
            return true;
        });
    };

    // ✅ Función para agregar producto y limpiar input/sugerencias
    const handleAgregarProductoYLimpiar = (producto: Producto) => {
        onAddProduct(producto);
        setProductSearch('');
        setProductosDisponibles([]);
        setSearchError(null);
    };

    // ✅ NIVEL 2: Cargar todos los productos una sola vez (para Fuse.js)
    useEffect(() => {
        if (!useFuseSearch || productosInicioCargados) return;

        const cargarTodosProductos = async () => {
            try {
                setIsLoading(true);
                const params = new URLSearchParams({
                    limite: '2000', // ⚡ Cargar todos los productos
                    tipo: tipo
                });

                if (almacen_id) params.append('almacen_id', almacen_id.toString());
                if (cliente_id) params.append('cliente_id', cliente_id.toString());
                if (permitirProductosSinStock) params.append('permitir_sin_stock', 'true'); // ✅ NUEVO (2026-05-26)

                const url = `/api/app/productos/listar?${params.toString()}`;

                // 📤 LOG: Mostrar exactamente qué se envía
                console.log('📤 [useProductSearch] PARÁMETROS ENVIADOS AL BACKEND:', {
                    url,
                    parametros: {
                        limite: params.get('limite'),
                        tipo: params.get('tipo'),
                        almacen_id: params.get('almacen_id'),
                        cliente_id: params.get('cliente_id')
                    }
                });

                const response = await fetch(url);

                if (!response.ok) {
                    console.warn(`⚠️ [useProductSearch] Endpoint /listar no disponible (${response.status}), usando búsqueda tradicional`);
                    setProductosInicioCargados(true);
                    return;
                }

                const data = await response.json();

                // 📥 LOG: Mostrar exactamente qué llega del backend
                console.log('📥 [useProductSearch] RESPUESTA COMPLETA DEL BACKEND:', {
                    success: data.success,
                    total: data.data?.length,
                    permiteSinStock: data.data?.filter((p: any) => p.permite_venta_sin_stock)?.length || 0,
                    primerosProductos: data.data?.slice(0, 5).map((p: any) => ({
                        id: p.id,
                        nombre: p.nombre,
                        permiteSinStock: p.permite_venta_sin_stock,
                        stock: p.stock_disponible || p.stock,
                        precios: p.precios?.length || 0
                    })) || []
                });

                console.log('📊 [useProductSearch] DATOS CRUDOS:', data);

                const productosAPI = data.data.map(transformarProductoAPI);
                console.log(`📊 [useProductSearch] Productos transformados: ${productosAPI.length}`);

                const productosValidos = filtrarProductosValidos(productosAPI);
                console.log(`✅ [useProductSearch] Productos válidos (después de filtrar): ${productosValidos.length}`);

                setTodosProductos(productosValidos);
                setProductosInicioCargados(true);

                // 🔍 Configurar Fuse.js
                fuseIndexRef.current = new Fuse(productosValidos, {
                    keys: [
                        { name: 'nombre', weight: 0.5 },
                        { name: 'codigo', weight: 0.3 },
                        { name: 'marca.nombre', weight: 0.1 },
                        { name: 'categoria.nombre', weight: 0.1 }
                    ],
                    threshold: 0.3, // 🎯 Tolerancia 0-1 (menor = más estricto)
                    minMatchCharLength: 2,
                    limit: 10,
                    isCaseSensitive: false
                });

                console.log(`✨ [useProductSearch] Fuse.js inicializado con ${productosValidos.length} productos`);
                console.log(`%c📋 ÍNDICE DE PRODUCTOS CARGADO`, 'color: #00aa00; font-weight: bold; font-size: 14px;', {
                    totalCargado: productosValidos.length,
                    tipo: tipo,
                    almacen_id: almacen_id,
                    cliente_id: cliente_id,
                    pesos: {
                        nombre: 0.5,
                        codigo: 0.3,
                        marca: 0.1,
                        categoria: 0.1
                    }
                });
            } catch (error) {
                console.error('❌ [useProductSearch] Error cargando productos:', error);
                setProductosInicioCargados(true);
            } finally {
                setIsLoading(false);
            }
        };

        cargarTodosProductos();
    }, [useFuseSearch, productosInicioCargados, tipo, almacen_id, cliente_id]);

    // Parámetros comunes a las búsquedas por API
    const paramsBase = useCallback(
        (q: string, extra: Record<string, string> = {}) => {
            const params = new URLSearchParams({ q, tipo, ...extra });
            if (almacen_id) params.append('almacen_id', almacen_id.toString());
            if (cliente_id) params.append('cliente_id', cliente_id.toString());
            if (permitirProductosSinStock) params.append('permitir_sin_stock', 'true'); // ✅ NUEVO (2026-05-26)
            if (empresaId) params.append('empresa_id', empresaId.toString());
            else console.warn('⚠️ [useProductSearch] No se encontró empresa_id del usuario autenticado');
            return params;
        },
        [tipo, almacen_id, cliente_id, permitirProductosSinStock, empresaId],
    );

    // Búsqueda por texto en la API (nombre, código, SKU…; si son dígitos, el producto con ese ID va primero)
    const buscarEnApi = useCallback(
        async (term: string): Promise<Producto[]> => {
            const url = `/api/app/productos/buscar?${paramsBase(term, { limite: LIMITE_BUSQUEDA_API }).toString()}`;
            console.log('📡 [useProductSearch] URL:', url);

            const response = await fetch(url);
            if (!response.ok) {
                console.error(`❌ [useProductSearch] Error HTTP ${response.status}:`, response.statusText);
                throw new Error('Error en búsqueda de productos');
            }

            const data = await response.json();
            const resultados = filtrarProductosValidos((data.data ?? []).map(transformarProductoAPI));
            console.log(`✅ [useProductSearch] Productos válidos (después de filtrar): ${resultados.length}`);
            return resultados;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [paramsBase],
    );

    // Búsqueda EXACTA de un código (escáner / Enter): código de barras o SKU; el ID solo si no coincide ninguno
    const buscarCodigoExacto = useCallback(
        async (codigo: string): Promise<Producto | null> => {
            // ✅ NIVEL 2: Si Fuse.js está disponible, buscar localmente primero
            if (useFuseSearch && fuseIndexRef.current && productosInicioCargados) {
                const resultadosFuse = fuseIndexRef.current.search(codigo, { limit: 1 });
                if (resultadosFuse.length > 0) return resultadosFuse[0].item;
            }

            const url = `/api/productos/buscar?${paramsBase(codigo, { tipo_busqueda: 'exacta', limite: '1' }).toString()}`;
            console.log('📡 [Scanner] URL:', url);
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`❌ [Scanner] Error HTTP ${response.status}:`, response.statusText);
                throw new Error('Error buscando producto');
            }

            const data = await response.json();
            return data.data && data.data.length > 0 ? transformarProductoAPI(data.data[0]) : null;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [paramsBase, useFuseSearch, productosInicioCargados],
    );

    // Motivo por el que un producto encontrado por código no se puede agregar a una venta (null = se puede)
    const motivoNoAgregable = (producto: Producto): string | null => {
        if (tipo !== 'venta') return null;
        const esCombo = (producto as any).es_combo || false;
        const tieneComponentes = ((producto as any).combo_items?.length || 0) > 0;

        if (esCombo) return tieneComponentes ? null : 'Combo sin productos componentes configurados';
        if (producto.stock === 0) return 'Producto sin stock disponible';
        if (producto.precio_venta === 0) return 'Producto sin precio de venta configurado';
        return null;
    };

    // ✅ NIVEL 1 + 2: Función de búsqueda con debounce, caché y Fuse.js
    const buscarProductos = useCallback(async (searchTerm?: string) => {
        // ✅ IMPORTANTE: Usar argumento si se proporciona, sino usar estado actual
        const term = searchTerm !== undefined ? searchTerm.trim() : productSearch.trim();

        // Toda búsqueda nueva invalida la anterior (la que espera el debounce o la que está en curso)
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        const id = ++busquedaVigenteRef.current;

        // Si no hay búsqueda o es muy corta, no hacer request
        if (term.length < 2) {
            setProductosDisponibles([]);
            setSearchError(null);
            setIsLoading(false);
            setTerminoBuscado('');
            return;
        }

        // 💾 Revisar caché primero - ✅ MODIFICADO (2026-05-26): Incluir permitirProductosSinStock en clave
        const cacheKey = `${term}_${tipo}_${almacen_id}_${cliente_id}_${permitirProductosSinStock}`;
        if (searchCacheRef.current.has(cacheKey)) {
            console.log('✅ [useProductSearch] Resultado del caché para:', term);
            setProductosDisponibles(searchCacheRef.current.get(cacheKey) || []);
            setSearchError(null);
            setIsLoading(false);
            setTerminoBuscado(term);
            return;
        }

        // El indicador se enciende YA (también durante la espera del debounce), no recién al llamar a la API
        setIsLoading(true);
        setSearchError(null);

        // ⏰ Esperar 300ms antes de buscar (debounce)
        searchTimeoutRef.current = setTimeout(async () => {

            try {
                let resultados: Producto[] = [];

                // ✅ NIVEL 2: Si Fuse.js está disponible, usar búsqueda local
                if (useFuseSearch && fuseIndexRef.current && productosInicioCargados) {
                    console.log('🔍 [useProductSearch] Búsqueda LOCAL con Fuse.js para:', term);
                    const resultadosFuse = fuseIndexRef.current.search(term);
                    resultados = resultadosFuse.map(r => r.item);
                    console.log(`✨ [useProductSearch] Resultados Fuse.js: ${resultados.length} productos`);
                    if (resultados.length > 0) {
                        console.table(resultados.map(p => ({
                            nombre: p.nombre,
                            código: p.codigo,
                            precio: p.precio_venta,
                            stock: p.stock,
                            unidad: p.unidad_medida_nombre
                        })));
                    }
                } else {
                    // ✅ NIVEL 1: Fallback a búsqueda por API
                    resultados = await buscarEnApi(term);
                }

                // 💾 Guardar en caché
                searchCacheRef.current.set(cacheKey, resultados);
                if (id !== busquedaVigenteRef.current) return; // llegó tarde: ya se escribió otra cosa
                setProductosDisponibles(resultados);
                setTerminoBuscado(term);
                console.log(`🎯 [useProductSearch] Resultado final para mostrar: ${resultados.length} productos`);

                // Mientras se escribe NO se agrega nada solo, aunque haya un único resultado: con una pausa
                // a mitad de un código se agregaba un producto equivocado. Se agrega con clic, Enter o escáner.
            } catch (error) {
                if (id !== busquedaVigenteRef.current) return;
                console.error('❌ [useProductSearch] Error:', error);
                setSearchError('Error al buscar productos');
                setProductosDisponibles([]);
            } finally {
                if (id === busquedaVigenteRef.current) setIsLoading(false);
            }
        }, 300); // ⏱️ 300ms debounce
    }, [productSearch, tipo, almacen_id, cliente_id, useFuseSearch, productosInicioCargados, empresaId, buscarEnApi]);

    // ✅ Limpiar timeout al desmontar o cuando cambian dependencias
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // ✅ AUTO-DISPARAR búsqueda cuando productSearch cambia (para que funcione sin presionar botón)
    // ⚠️ PERO: Solo buscar si hay más de 1 carácter (evitar búsquedas innecesarias en page load)
    // (con menos de 2 caracteres buscarProductos solo limpia y cancela la búsqueda pendiente)
    useEffect(() => {
        buscarProductos(productSearch);
    }, [productSearch, buscarProductos]);

    // ✅ Manejar resultado del escáner (búsqueda EXACTA por código de barras)
    const handleScannerResult = useCallback(async (result: string) => {
        if (!result) return;

        console.log(`🔍 [Scanner] Escaneando código: "${result}"`);

        try {
            setIsLoading(true);
            setSearchError(null);

            const producto = await buscarCodigoExacto(result);
            if (!producto) {
                NotificationService.error('No se encontró producto con ese código de barras');
                return;
            }

            const motivo = motivoNoAgregable(producto);
            if (motivo) {
                NotificationService.error(motivo);
                return;
            }

            handleAgregarProductoYLimpiar(producto);
            NotificationService.success(`Producto escaneado: ${producto.nombre}`);
        } catch (error) {
            console.error('❌ [Scanner] Error:', error);
            NotificationService.error('Error al buscar producto escaneado');
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buscarCodigoExacto, tipo]);

    // ✅ Enter en el buscador (también lo envían los lectores de código de barras tipo teclado):
    // 1) si el texto es un código exacto (barras/SKU, o el ID si ninguno coincide) agrega ese producto;
    // 2) si no, muestra la búsqueda normal y agrega solo si hay un único resultado (Enter = intención explícita).
    const confirmarBusqueda = useCallback(async () => {
        const term = productSearch.trim();
        if (term.length < 2) return;

        // Cancelar la búsqueda con espera que dejó el tipeo: Enter decide ahora
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        const id = ++busquedaVigenteRef.current;

        setIsLoading(true);
        setSearchError(null);
        try {
            const exacto = await buscarCodigoExacto(term);
            if (id !== busquedaVigenteRef.current) return; // se siguió escribiendo
            if (exacto) {
                const motivo = motivoNoAgregable(exacto);
                if (motivo) {
                    NotificationService.error(`${exacto.nombre}: ${motivo}`);
                    return;
                }
                handleAgregarProductoYLimpiar(exacto);
                return;
            }

            const resultados = await buscarEnApi(term);
            searchCacheRef.current.set(`${term}_${tipo}_${almacen_id}_${cliente_id}_${permitirProductosSinStock}`, resultados);
            if (id !== busquedaVigenteRef.current) return;
            if (resultados.length === 1) {
                handleAgregarProductoYLimpiar(resultados[0]);
            } else {
                setProductosDisponibles(resultados);
                setTerminoBuscado(term);
            }
        } catch (error) {
            if (id !== busquedaVigenteRef.current) return;
            console.error('❌ [useProductSearch] Error al confirmar búsqueda:', error);
            setSearchError('Error al buscar productos');
            setProductosDisponibles([]);
        } finally {
            if (id === busquedaVigenteRef.current) setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productSearch, buscarCodigoExacto, buscarEnApi, tipo, almacen_id, cliente_id, permitirProductosSinStock]);


    return {
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
    };
}
