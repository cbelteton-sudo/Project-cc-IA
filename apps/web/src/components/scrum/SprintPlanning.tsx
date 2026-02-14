import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, Calendar, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SprintPlanning = ({
  projectId,
  onSprintStarted,
}: {
  projectId: string;
  onSprintStarted: () => void;
}) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);

  // Fetch Backlog
  const { data: backlogItems } = useQuery({
    queryKey: ['scrum', 'backlog', projectId],
    queryFn: async () => (await axios.get(`${API_URL}/scrum/backlog/${projectId}`)).data,
  });

  // Fetch Sprints
  const { data: sprints } = useQuery({
    queryKey: ['scrum', 'sprints', projectId],
    queryFn: async () => (await axios.get(`${API_URL}/scrum/sprints/${projectId}`)).data,
  });

  const plannedSprint = sprints?.find((s: any) => s.status === 'PLANNED');
  const activeSprint = sprints?.find((s: any) => s.status === 'ACTIVE');

  // Logic: If there is a PLANNED sprint, show it. If not, and there is an ACTIVE sprint, show it (to allow scope changes).
  // If neither, show create button.
  const targetSprint = plannedSprint || activeSprint;
  const isTargetActive = targetSprint?.status === 'ACTIVE';

  const createSprintMutation = useMutation({
    mutationFn: async (data: any) =>
      axios.post(`${API_URL}/scrum/sprints`, {
        ...data,
        projectId,
        createdByUserId:
          (user as any)?.id || (user as any)?.userId || '4044f19e-764f-4109-9f73-d590b61116ca',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrum', 'sprints', projectId] });
      setIsCreateSprintOpen(false);
    },
  });

  const addToSprintMutation = useMutation({
    mutationFn: async () => {
      if (!targetSprint) return;
      return axios.post(`${API_URL}/scrum/sprints/${targetSprint.id}/items`, {
        items: selectedItems,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrum', 'sprints', projectId] });
      queryClient.invalidateQueries({ queryKey: ['scrum', 'backlog', projectId] });
      setSelectedItems([]);
    },
  });

  const startSprintMutation = useMutation({
    mutationFn: async (sprintId: string) =>
      axios.patch(`${API_URL}/scrum/sprints/${sprintId}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrum', 'sprints', projectId] });
      onSprintStarted();
    },
  });

  // We remove the blocking "Active Sprint" banner to allow management
  // if (activeSprint) { ... } -> REMOVED

  const availableBacklog =
    backlogItems?.filter((i: any) => {
      const status = i.status || 'BACKLOG';
      return (
        !['IN_SPRINT', 'PENDING_PLANNING', 'DONE', 'COMPLETED', 'ARCHIVED'].includes(status) &&
        !i.isVirtual
      );
    }) || [];

  return (
    <div className="h-full flex gap-4">
      {/* Backlog Column */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Backlog Disponible</h3>
          <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
            {availableBacklog.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {availableBacklog.map((item: any) => (
            <div
              key={item.id}
              onClick={() => {
                if (selectedItems.includes(item.id)) {
                  setSelectedItems(selectedItems.filter((id) => id !== item.id));
                } else {
                  setSelectedItems([...selectedItems, item.id]);
                }
              }}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedItems.includes(item.id) ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
            >
              <div className="flex justify-between">
                <span className="font-medium text-sm text-gray-800">{item.title}</span>
                <span className="text-xs text-gray-500 font-mono">{item.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col justify-center gap-2">
        <button
          disabled={!targetSprint || selectedItems.length === 0}
          onClick={() => addToSprintMutation.mutate()}
          className="p-3 bg-blue-600 text-white rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 shadow-md transition-all"
          title={!targetSprint ? 'No hay sprint seleccionado' : 'Mover al sprint'}
        >
          <ArrowRight />
        </button>
      </div>

      {/* Sprint Column */}
      <div
        className={`flex-1 flex flex-col rounded-xl border overflow-hidden ${isTargetActive ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
      >
        <div
          className={`p-4 border-b flex justify-between items-center ${isTargetActive ? 'bg-green-100 border-green-200' : 'bg-indigo-50 border-gray-100'}`}
        >
          <div>
            <h3 className={`font-bold ${isTargetActive ? 'text-green-900' : 'text-indigo-900'}`}>
              {isTargetActive ? 'Sprint Activo (En Curso)' : 'Sprint Planificado'}
            </h3>
            {targetSprint && (
              <p className={`text-xs ${isTargetActive ? 'text-green-700' : 'text-indigo-700'}`}>
                {targetSprint.name}
              </p>
            )}
          </div>

          {!targetSprint && (
            <button
              onClick={() => setIsCreateSprintOpen(true)}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors"
            >
              Crear Sprint
            </button>
          )}

          {targetSprint && !isTargetActive && (
            <button
              onClick={() => startSprintMutation.mutate(targetSprint.id)}
              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors shadow-sm font-bold animate-pulse"
            >
              Iniciar Sprint
            </button>
          )}

          {isTargetActive && (
            <span className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded-full border border-green-200">
              En progreso
            </span>
          )}
        </div>

        <div
          className={`flex-1 overflow-y-auto p-2 space-y-2 ${isTargetActive ? 'bg-green-50/30' : 'bg-indigo-50/30'}`}
        >
          {targetSprint?.items?.length > 0 ? (
            targetSprint.items.map((sItem: any) => (
              <div
                key={sItem.id}
                className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm"
              >
                <span className="font-medium text-sm text-gray-800">{sItem.backlogItem.title}</span>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">{sItem.backlogItem.type}</span>
                  {sItem.backlogItem.contractor && (
                    <span className="text-[10px] bg-gray-100 px-1.5 rounded text-gray-600 truncate max-w-[100px]">
                      {sItem.backlogItem.contractor.name}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm italic p-8 text-center">
              {!targetSprint
                ? 'Crea un sprint para comenzar'
                : isTargetActive
                  ? 'Este sprint no tiene ítems asignados aún.'
                  : 'Arrastra o selecciona ítems del backlog'}
            </div>
          )}
        </div>
      </div>

      {/* Create Sprint Modal */}
      {isCreateSprintOpen && (
        <CreateSprintModal
          onClose={() => setIsCreateSprintOpen(false)}
          onCreate={(data) => createSprintMutation.mutate(data)}
        />
      )}
    </div>
  );
};

const CreateSprintModal = ({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: any) => void;
}) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(addDays(new Date(), 14).toISOString().split('T')[0]); // Default 2 weeks
  const [name, setName] = useState(`Sprint ${format(new Date(), 'w')}`);
  const [goal, setGoal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      goal: goal || 'Cumplir objetivos del sprint',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'PLANNED',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Nuevo Sprint</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Sprint
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ej. Sprint 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objetivo (Opcional)
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-24"
              placeholder="¿Qué queremos lograr en este sprint?"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Crear Sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
