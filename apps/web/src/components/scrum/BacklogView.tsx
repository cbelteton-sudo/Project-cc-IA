import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Plus,
  Filter,
  ArrowRight,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Hash,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useContractors } from '../../hooks/useContractors';

interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  type: string;
  contractor?: { name: string };
  contractorId?: string | null;

  dueDate?: string;
  isVirtual?: boolean;
  linkedWbsActivityId?: string;

  // New fields
  parentId?: string | null;
  children?: BacklogItem[];
  storyPoints?: number | null;
  estimatedHours?: number | null;
}

export const BacklogView = ({ projectId }: { projectId: string }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedStories, setExpandedStories] = useState<Record<string, boolean>>({});
  const [newItemParentId, setNewItemParentId] = useState<string | null>(null); // For "Add Task" directly

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
  const queryClient = useQueryClient();

  const { contractors } = useContractors();
  const [contractorFilter, setContractorFilter] = useState<string | null>(null);

  const { data: backlogItems, isLoading } = useQuery({
    queryKey: ['scrum', 'backlog', projectId],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/scrum/backlog/${projectId}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: Partial<BacklogItem>) => {
      return axios.post(`${API_URL}/scrum/backlog`, { ...newItem, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrum', 'backlog', projectId] });
      setIsCreateModalOpen(false);
      setNewItemParentId(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: async (activityId: string) => {
      return axios.post(`${API_URL}/scrum/backlog/convert`, { activityId, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrum', 'backlog', projectId] });
    },
  });

  const toggleStory = (storyId: string) => {
    setExpandedStories((prev) => ({ ...prev, [storyId]: !prev[storyId] }));
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando backlog...</div>;

  // Hierarchy Logic: Filter roots
  const rootItems = (backlogItems || [])
    .filter((item: BacklogItem) => !item.parentId)
    .filter((item: BacklogItem) => {
      if (!contractorFilter) return true;

      // Match if item or any of its children has the contractor
      const matchesSelf =
        item.contractorId === contractorFilter || (item.contractor as any)?.id === contractorFilter;
      const matchesChildren = item.children?.some(
        (child: any) =>
          child.contractorId === contractorFilter ||
          (child.contractor as any)?.id === contractorFilter,
      );

      return matchesSelf || matchesChildren;
    });

  const renderItem = (item: BacklogItem, level = 0) => {
    const isStory = item.type === 'STORY';
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedStories[item.id];

    return (
      <div key={item.id} className={`group`}>
        <div
          className={`
                    relative p-4 border rounded-lg hover:shadow-md transition-shadow 
                    ${item.isVirtual ? 'bg-slate-50 border-slate-200 border-dashed' : 'bg-white border-gray-200'}
                    ${level > 0 ? 'ml-8 mt-2 border-l-4 border-l-gray-300' : ''}
                `}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              {/* Expand Toggle for Stories */}
              {isStory && (
                <button
                  onClick={() => toggleStory(item.id)}
                  className="mt-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
              )}

              <div
                className={`mt-1 w-2 h-2 rounded-full ${
                  item.isVirtual
                    ? 'bg-slate-400'
                    : item.status === 'READY'
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                }`}
              />

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      item.isVirtual ? 'bg-slate-200 text-slate-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.type}
                  </span>
                  <h3
                    className={`font-medium ${item.isVirtual ? 'text-slate-700 italic' : 'text-gray-900'}`}
                  >
                    {item.title}
                  </h3>

                  {/* Estimation Badges */}
                  {item.storyPoints && (
                    <span
                      className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100"
                      title="Story Points"
                    >
                      <Hash size={10} /> {item.storyPoints} pts
                    </span>
                  )}
                  {item.estimatedHours && (
                    <span
                      className="flex items-center gap-1 text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded border border-cyan-100"
                      title="Horas Estimadas"
                    >
                      <Clock size={10} /> {item.estimatedHours}h
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  {item.isVirtual && (
                    <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">
                      Sugerido del Cronograma
                    </span>
                  )}
                  {item.contractor && (
                    <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      🏢 {item.contractor.name}
                    </span>
                  )}
                  {item.dueDate && (
                    <span className="flex items-center gap-1">
                      📅 {format(new Date(item.dueDate), 'd MMM', { locale: es })}
                    </span>
                  )}
                  {!item.isVirtual && (
                    <span
                      className={`priority-badge ${item.priority >= 4 ? 'text-red-600 font-bold' : ''}`}
                    >
                      Prioridad: {item.priority}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {isStory && !item.isVirtual && (
                <button
                  onClick={() => {
                    setNewItemParentId(item.id);
                    setIsCreateModalOpen(true);
                  }}
                  className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs rounded border border-gray-200"
                  title="Añadir Tarea a esta Historia"
                >
                  + Tarea
                </button>
              )}

              {item.isVirtual ? (
                <button
                  onClick={() => importMutation.mutate(item.linkedWbsActivityId!)}
                  disabled={importMutation.isPending}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-md hover:bg-blue-200 transition-colors"
                >
                  {importMutation.isPending ? '...' : 'Añadir al Backlog'}
                </button>
              ) : (
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Render Children */}
        {isExpanded && hasChildren && (
          <div className="bg-gray-50/50 rounded-b-lg border-x border-b border-gray-100 mb-4 pb-2">
            {item.children?.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="text-blue-600" size={20} />
            Product Backlog
          </h2>
          <p className="text-xs text-gray-500">{rootItems.length} ítems raíz</p>
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={contractorFilter || ''}
            onChange={(e) => setContractorFilter(e.target.value || null)}
          >
            <option value="">Todos los Contratistas</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">
            <Filter size={14} /> Filtros
          </button> */}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={16} /> Crear Ítem
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {rootItems.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>No hay ítems en el backlog {contractorFilter ? 'para este contratista' : ''}.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 text-blue-600 hover:underline text-sm font-medium"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          rootItems.map((item: BacklogItem) => renderItem(item))
        )}
      </div>

      {/* Create Item Modal */}
      {isCreateModalOpen && (
        <CreateItemModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setNewItemParentId(null);
          }}
          onSave={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          stories={backlogItems.filter((i: BacklogItem) => i.type === 'STORY') || []}
          initialParentId={newItemParentId}
        />
      )}
    </div>
  );
};

// Extracted for cleaner code, usually in separate file but keeping here for simplicity as requested
interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<BacklogItem>) => void;
  isLoading: boolean;
  stories: BacklogItem[];
  initialParentId: string | null;
}

const CreateItemModal = ({
  onClose,
  onSave,
  isLoading,
  stories,
  initialParentId,
}: CreateItemModalProps) => {
  const [type, setType] = useState(initialParentId ? 'TASK' : 'STORY');
  const { contractors } = useContractors();

  // If initialParentId is set, lock to TASK and that parent
  const isTaskMode = type === 'TASK';
  const isStoryMode = type === 'STORY';

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">
            {initialParentId ? 'Nueva Tarea (Hija)' : 'Nuevo Ítem de Backlog'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <div className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              onSave({
                title: formData.get('title') as string,
                type: formData.get('type') as string,
                priority: Number(formData.get('priority')),
                parentId: (formData.get('parentId') as string) || null,
                storyPoints: formData.get('storyPoints')
                  ? Number(formData.get('storyPoints'))
                  : null,
                estimatedHours: formData.get('estimatedHours')
                  ? Number(formData.get('estimatedHours'))
                  : null,
                contractorId: (formData.get('contractorId') as string) || null,
                status: 'BACKLOG',
              });
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  name="title"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: Instalar luminarias"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    name="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="STORY">Historia</option>
                    <option value="TASK">Tarea</option>
                    <option value="BUG">Problema (Bug)</option>
                    <option value="RISK">Riesgo</option>
                    <option value="EPIC">Épica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select
                    name="priority"
                    defaultValue="3"
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="5">Alta (5)</option>
                    <option value="3">Media (3)</option>
                    <option value="1">Baja (1)</option>
                  </select>
                </div>
              </div>

              {/* Contractor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contratista / Recurso (Opcional)
                </label>
                <select name="contractorId" className="w-full px-3 py-2 border rounded-md bg-white">
                  <option value="">-- Sin asignar --</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Fields */}

              {/* Parent Story Selection */}
              {type === 'TASK' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Historia Padre (Opcional)
                  </label>
                  <select
                    name="parentId"
                    defaultValue={initialParentId || ''}
                    className="w-full px-3 py-2 border rounded-md bg-gray-50"
                  >
                    <option value="">-- Sin padre --</option>
                    {stories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Estimation */}
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Estimación
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {isStoryMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Story Points
                      </label>
                      <input
                        type="number"
                        name="storyPoints"
                        min="1"
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="1, 2, 3, 5, 8..."
                      />
                    </div>
                  )}
                  {isTaskMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horas Estimadas
                      </label>
                      <input
                        type="number"
                        name="estimatedHours"
                        step="0.5"
                        min="0"
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Ej: 4.5"
                      />
                    </div>
                  )}
                  {!isStoryMode && !isTaskMode && (
                    <div className="col-span-2 text-xs text-gray-400 italic">
                      Selecciona Historia o Tarea para estimar.
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                {isLoading ? 'Guardando...' : 'Guardar Ítem'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
