import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function CrearFraccionamientoMasivo() {
  return (
    <AppLayout>
      <Head title="Crear Fraccionamiento Masivo" />

      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fraccionamiento Masivo</h1>
          <p className="text-gray-600 mb-8">Registra múltiples fraccionamientos en una sola operación</p>

          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Este componente está en desarrollo.</p>
            <p className="text-gray-500 text-sm">Sistema completo disponible en el backend (API REST)</p>
            <p className="text-blue-600 mt-4">Endpoints disponibles:</p>
            <ul className="mt-2 text-sm text-gray-600">
              <li>POST /api/fraccionamientos-masivos - Registrar</li>
              <li>GET /api/fraccionamientos-masivos - Listar</li>
              <li>GET /api/fraccionamientos-masivos/{'{id}'} - Detalle</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
