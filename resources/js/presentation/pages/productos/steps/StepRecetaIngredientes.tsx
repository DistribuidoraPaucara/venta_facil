import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import SearchSelect from '@/presentation/components/ui/search-select';
import { Trash2 } from 'lucide-react';
import NotificationService from '@/infrastructure/services/notification.service';

interface Ingrediente {
    producto_id: number | string;
    producto_nombre?: string;
    cantidad_requerida: number;
    unidad_medida_id?: number | string;
    unidad_nombre?: string;
}

interface StepRecetaIngredientesProps {
    ingredientes: Ingrediente[];
    productosDisponibles: Array<{ id: number | string; nombre: string }>;
    unidadesDisponibles: Array<{ id: number | string; nombre: string; codigo: string }>;
    setIngredientes: (ingredientes: Ingrediente[]) => void;
    errors?: Record<string, string>;
}

export default function StepRecetaIngredientes({
    ingredientes,
    productosDisponibles,
    unidadesDisponibles,
    setIngredientes,
    errors = {},
}: StepRecetaIngredientesProps) {
    // 🔍 DEBUG
    console.log('📦 StepRecetaIngredientes - productosDisponibles:', productosDisponibles);
    console.log('📦 StepRecetaIngredientes - unidadesDisponibles:', unidadesDisponibles);
    console.log('📦 StepRecetaIngredientes - ingredientes:', ingredientes);
    const addIngrediente = () => {
        const nuevoIngrediente: Ingrediente = {
            producto_id: '',
            cantidad_requerida: 1,
            unidad_medida_id: unidadesDisponibles[0]?.id || '',
        };
        setIngredientes([...ingredientes, nuevoIngrediente]);
    };

    const updateIngrediente = (index: number, field: keyof Ingrediente, value: any) => {
        const nuevosIngredientes = [...ingredientes];
        const ingrediente = nuevosIngredientes[index];

        if (field === 'producto_id') {
            // Actualizar nombre del producto
            const producto = productosDisponibles.find((p) => String(p.id) === String(value));
            ingrediente.producto_id = value;
            ingrediente.producto_nombre = producto?.nombre;
        } else if (field === 'unidad_medida_id') {
            // Actualizar nombre de la unidad
            const unidad = unidadesDisponibles.find((u) => String(u.id) === String(value));
            ingrediente.unidad_medida_id = value;
            ingrediente.unidad_nombre = unidad?.nombre;
        } else {
            (ingrediente as any)[field] = value;
        }

        setIngredientes(nuevosIngredientes);
    };

    const removeIngrediente = async (index: number) => {
        const confirmed = await NotificationService.confirm('¿Estás seguro de eliminar este ingrediente?', {
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
        });

        if (confirmed) {
            setIngredientes(ingredientes.filter((_, i) => i !== index));
        }
    };

    const costoEstimado = 0; // TODO: Calcular basado en precios de ingredientes

    return (
        <div className="space-y-4">
            {/* Encabezado */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200">🏭 Ingredientes de la Receta</h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    Asocia otros productos como ingredientes. Indica la cantidad y unidad de medida requerida para elaborar este producto.
                </p>
            </div>

            {/* Tabla de ingredientes */}
            {ingredientes.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-border" style={{ overflow: 'visible' }}>
                    <table className="w-full text-sm">
                        <thead className="bg-secondary">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Producto</th>
                                <th className="px-4 py-3 text-left font-semibold">Cantidad</th>
                                <th className="px-4 py-3 text-left font-semibold">Unidad</th>
                                <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody style={{ position: 'relative' }}>
                            {ingredientes.map((ing, index) => (
                                <tr key={index} className="border-t border-border hover:bg-secondary/30">
                                    {/* Producto */}
                                    <td className="px-4 py-3 relative" style={{ overflow: 'visible' }}>
                                        <SearchSelect
                                            id={`ingrediente_producto_${index}`}
                                            placeholder="Selecciona un producto"
                                            value={String(ing.producto_id) || ''}
                                            options={productosDisponibles.map((p) => ({
                                                value: String(p.id),
                                                label: p.nombre,
                                            }))}
                                            onChange={(value) => updateIngrediente(index, 'producto_id', value)}
                                            allowClear={true}
                                            emptyText="No hay productos disponibles"
                                        />
                                    </td>

                                    {/* Cantidad */}
                                    <td className="px-4 py-3">
                                        <Input
                                            type="number"
                                            min="0.001"
                                            step="0.001"
                                            value={ing.cantidad_requerida || ''}
                                            onChange={(e) =>
                                                updateIngrediente(index, 'cantidad_requerida', Number(e.target.value))
                                            }
                                            placeholder="Cantidad"
                                            className="w-full"
                                        />
                                    </td>

                                    {/* Unidad */}
                                    <td className="px-4 py-3">
                                        <SearchSelect
                                            id={`ingrediente_unidad_${index}`}
                                            placeholder="Unidad"
                                            value={String(ing.unidad_medida_id) || ''}
                                            options={unidadesDisponibles.map((u) => ({
                                                value: String(u.id),
                                                label: u.nombre,
                                                description: u.codigo,
                                            }))}
                                            onChange={(value) => updateIngrediente(index, 'unidad_medida_id', value)}
                                            allowClear={false}
                                            emptyText="No hay unidades disponibles"
                                        />
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeIngrediente(index)}
                                            className="inline-flex items-center justify-center rounded-lg hover:bg-red-100 p-2 text-red-600 dark:hover:bg-red-900/20 dark:text-red-400"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="rounded-lg border-2 border-dashed border-border bg-secondary/50 p-8 text-center">
                    <p className="text-muted-foreground">No hay ingredientes agregados aún</p>
                </div>
            )}

            {/* Botón agregar */}
            <Button type="button" variant="outline" onClick={addIngrediente} className="w-full">
                + Agregar Ingrediente
            </Button>

            {/* Resumen */}
            {ingredientes.length > 0 && (
                <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-900 dark:text-green-200">Total de Ingredientes</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{ingredientes.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-green-900 dark:text-green-200">Costo Estimado</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                ${costoEstimado.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Errores */}
            {Object.keys(errors).length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
                    {Object.entries(errors).map(([key, message]) => (
                        <p key={key} className="text-sm text-red-600 dark:text-red-400">
                            {message}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}
