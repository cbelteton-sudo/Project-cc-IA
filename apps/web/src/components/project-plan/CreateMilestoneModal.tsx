import React, { useState } from 'react';
import { format } from 'date-fns';
import type { Activity } from './ActivitiesTree';

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    date: string;
    description: string;
    activityId: string;
  }) => void;
  isLoading: boolean;
  activities: Activity[];
}

export const CreateMilestoneModal: React.FC<CreateMilestoneModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  activities,
}) => {
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  
  if (!isOpen) return null;

  // Flatten tree for select
  const flatten = (nodes: Activity[], depth = 0): (Activity & { depth: number })[] => {
    if (!nodes) return [];
    return nodes.reduce((acc, node) => {
      acc.push({ ...node, depth });
      if (node.children) acc.push(...flatten(node.children, depth + 1));
      return acc;
    }, [] as (Activity & { depth: number })[]);
  };
  const flatActivities = flatten(activities);

  // Find selected activity to display dates
  const selectedActivity = flatActivities.find(a => a.id === selectedActivityId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl animate-fade-in">
        <h3 className="text-lg font-bold mb-6 text-gray-800">Nuevo Hito Clave</h3>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            onSubmit({
              name: formData.get('name') as string,
              date: formData.get('date')
                ? `${formData.get('date') as string}T12:00:00.000Z`
                : (formData.get('date') as string),
              description: formData.get('description') as string,
              activityId: formData.get('activityId') as string,
            });
          }}
          className="space-y-4"
        >
          {/* 1. Relacionar con actividad (Mandatory) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relacionar con Actividad
            </label>
            <select
              name="activityId"
              required
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="">-- Seleccione una actividad --</option>
              {flatActivities.map((act) => (
                <option key={act.id} value={act.id}>
                  {'-'.repeat(act.depth * 2)} {act.name}
                </option>
              ))}
            </select>
            
            {/* 2. Fechas de la actividad padre */}
            {selectedActivity && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-800">
                <span className="font-semibold block mb-1">Rango de ejecución de la actividad:</span>
                Del <b>{selectedActivity.startDate ? format(new Date(selectedActivity.startDate), 'dd/MM/yyyy') : 'N/A'}</b> al <b>{selectedActivity.endDate ? format(new Date(selectedActivity.endDate), 'dd/MM/yyyy') : 'N/A'}</b>
              </div>
            )}
          </div>

          {/* 3. Nombre del Hito */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Hito
            </label>
            <input
              name="name"
              required
              placeholder="Ej. Entrega de Antenas y conexión WiFi"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* 4. Fecha de Cumplimiento esperado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Cumplimiento esperado:
            </label>
            <input
              name="date"
              type="date"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* 5. Descripción (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción  (Opcional)
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Detalles adicionales..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-brand-ambar text-white rounded-lg hover:bg-brand-oro font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creando...' : 'Crear Hito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
