import { CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';

interface TipoPrecio {
  id: number;
  nombre: string;
  color: string;
}

interface PreciosFiltrosCardProps {
  formData: {
    fecha_desde: string;
    fecha_hasta: string;
    tipo_precio_id: string;
    usuario: string;
    motivo: string;
    variacion: string;
    q: string;
  };
  tipos_precio: TipoPrecio[];
  usuarios: string[];
  motivos: string[];
  ALL_VALUE: string;
  onUpdateField: (key: string, value: string) => void;
  onFilter: () => void;
  onClear: () => void;
}

export function PreciosFiltrosCard({
  formData,
  tipos_precio,
  usuarios,
  motivos,
  ALL_VALUE,
  onUpdateField,
  onFilter,
  onClear,
}: PreciosFiltrosCardProps) {
  return (
    <form
      className="p-4 space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-md"
      onSubmit={(e) => {
        e.preventDefault();
        onFilter();
      }}
    >
      <CardTitle>Filtros</CardTitle>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Producto */}
        <div className="md:col-span-2">
          <Label>Producto</Label>
          <Input
            value={formData.q}
            placeholder="ID, código de barras, SKU o nombre"
            onChange={(e) => onUpdateField('q', e.target.value)}
          />
        </div>

        {/* Fecha Desde */}
        <div>
          <Label>Fecha Desde</Label>
          <Input
            type="date"
            value={formData.fecha_desde}
            onChange={(e) => onUpdateField('fecha_desde', e.target.value)}
          />
        </div>

        {/* Fecha Hasta */}
        <div>
          <Label>Fecha Hasta</Label>
          <Input
            type="date"
            value={formData.fecha_hasta}
            onChange={(e) => onUpdateField('fecha_hasta', e.target.value)}
          />
        </div>

        {/* Tipo de Precio */}
        <div>
          <Label>Tipo de Precio</Label>
          <Select value={formData.tipo_precio_id} onValueChange={(value) => onUpdateField('tipo_precio_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos los tipos</SelectItem>
              {tipos_precio.map(tipo => (
                <SelectItem key={tipo.id} value={tipo.id.toString()}>
                  {tipo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Variación */}
        <div>
          <Label>Variación</Label>
          <Select value={formData.variacion} onValueChange={(value) => onUpdateField('variacion', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Subidas y bajadas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Subidas y bajadas</SelectItem>
              <SelectItem value="sube">▲ Solo subidas</SelectItem>
              <SelectItem value="baja">▼ Solo bajadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Usuario */}
        <div>
          <Label>Usuario</Label>
          <Select value={formData.usuario} onValueChange={(value) => onUpdateField('usuario', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los usuarios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos los usuarios</SelectItem>
              {usuarios.map(u => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Motivo */}
        <div>
          <Label>Motivo</Label>
          <Select value={formData.motivo} onValueChange={(value) => onUpdateField('motivo', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los motivos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos los motivos</SelectItem>
              {motivos.map(m => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botones */}
        <div className="md:col-span-4 flex justify-end gap-2">
          <Button type="submit">Filtrar</Button>
          <Button type="button" variant="outline" onClick={onClear}>
            Limpiar
          </Button>
        </div>
      </div>
    </form>
  );
}
