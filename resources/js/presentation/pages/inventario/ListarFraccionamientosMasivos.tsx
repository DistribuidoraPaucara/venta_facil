import { useState } from 'react';

export default function ListarFraccionamientosMasivos() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Fraccionamientos Masivos</h1>
          <p className="text-gray-600 mt-2">Historial de operaciones de fraccionamiento múltiple</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">Este componente está en desarrollo.</p>
          <p className="text-gray-500 text-sm">Sistema completo disponible en el backend (API REST)</p>
          <p className="text-blue-600 mt-4">Para ver fraccionamientos masivos, usar:</p>
          <code className="block text-sm text-gray-600 mt-2 p-2 bg-gray-100 rounded">
            GET /api/fraccionamientos-masivos
          </code>
        </div>
      </div>
    </div>
  );
}
