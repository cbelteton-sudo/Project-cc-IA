import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, ArrowRight, ClipboardList, Clock, AlertCircle, User, Building2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
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
  assigneeUserId?: string | null;
  assigneeContractorResourceId?: string | null;

  endDate?: string;
  dueDate?: string;
  isVirtual?: boolean;
  linkedWbsActivityId?: string;
  linkedWbsActivity?: any;

  // New fields
  parent?: { contractor?: { id: string; name: string } };
  parentId?: string | null;
  children?: BacklogItem[];
  storyPoints?: number | null;
  estimatedHours?: number | null;
}

interface BacklogItemRowProps {
  item: BacklogItem;
  level: number;
  isViewer: boolean;
  expandedStories: Record<string, boolean>;
  toggleStory: (storyId: string) => void;
  onAddSubtask: (itemId: string) => void;
  onImport: (wbsId: string) => void;
  isImporting: boolean;
  users: any[];
  projectId: string;
}

const BacklogItemRow = ({
  item,
  level = 0,
  isViewer,
  expandedStories,
  toggleStory,
  onAddSubtask,
  onImport,
  isImporting,
  users,
  projectId,
}: BacklogItemRowProps) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const queryClient = useQueryClient();

  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedStories[item.id];

  const contractor =
    item.contractor ||
    item.linkedWbsActivity?.contractor ||
    item.linkedWbsActivity?.parent?.contractor ||
    item.parent?.contractor;

  const { data: resources, isFetching: isFetchingResources } = useQuery({
    queryKey: ['contractors', contractor?.id, 'resources'],
    queryFn: async () => (await api.get(`/contractors/${contractor?.id}/resources`)).data,
    enabled: !!contractor?.id,
  });

  const assignMutation = useMutation({
    mutationFn: async ({
      assigneeId,
      assigneeType,
    }: {
      assigneeId: string;
      assigneeType: 'USER' | 'CONTRACTOR_RESOURCE';
    }) => {
      return api.patch(`/scrum/backlog/${item.id}/assign`, { assigneeId, assigneeType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrum', 'backlog', projectId] });
      setIsAssigning(false);
    },
  });

  const onAssign = (assigneeId: string, assigneeType: 'USER' | 'CONTRACTOR_RESOURCE') => {
    setIsAssigning(false);
    assignMutation.mutate({ assigneeId, assigneeType });
  };

  return (
    <div key={item.id} className={`group`}>
      <div
        className={`
          relative transition-shadow 
          ${
            item.isVirtual
              ? 'p-4 border rounded-lg bg-slate-50 border-slate-200 border-dashed hover:shadow-md mb-2'
              : level === 0
                ? `p-4 border border-gray-200 bg-white hover:shadow-md ${isExpanded && hasChildren ? 'rounded-t-lg border-b-0' : 'rounded-lg mb-2'}`
                : 'p-3 pl-12 border-t border-gray-100 bg-gray-50/30 hover:bg-gray-50'
          }
        `}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 w-2 h-2 min-w-[8px] rounded-full ${
                item.isVirtual
                  ? 'bg-slate-400'
                  : item.status === 'READY'
                    ? 'bg-green-500'
                    : 'bg-gray-300'
              }`}
            />

            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`font-medium ${item.isVirtual ? 'text-slate-700 italic' : 'text-gray-900'}`}
                >
                  {item.title}
                </h3>
                {(item.dueDate || item.endDate || item.linkedWbsActivity?.endDate) && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                    📅 Fecha límite de fin:{' '}
                    {format(
                      new Date(
                        (item.dueDate || item.endDate || item.linkedWbsActivity?.endDate) as string,
                      ),
                      'd MMM yyyy',
                      { locale: es },
                    )}
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
                {contractor && (
                  <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                    <Building2 size={12} /> {contractor.name}
                  </span>
                )}

                {/* ASSIGNMENT DROPDOWN */}
                {!item.isVirtual && !isViewer && (
                  <div className="relative group/assignee flex items-center" title="Responsable">
                    <Popover open={isAssigning} onOpenChange={setIsAssigning} modal={false}>
                      <PopoverTrigger asChild>
                        <button className="focus:outline-none">
                          {item.assigneeUserId ? (
                            <div
                              className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1.5 text-xs font-medium border border-blue-100 hover:bg-blue-100 transition-colors"
                              title="Cambiar responsable (Usuario)"
                            >
                              <User size={12} />
                              <span className="truncate max-w-[120px]">
                                {users?.find((u: any) => u.id === item.assigneeUserId)?.name ||
                                  'Usuario'}
                              </span>
                            </div>
                          ) : item.assigneeContractorResourceId ? (
                            <div
                              className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 flex items-center gap-1.5 text-xs font-medium border border-orange-100 hover:bg-orange-100 transition-colors"
                              title="Cambiar responsable (Contratista)"
                            >
                              <Building2 size={12} />
                              <span className="truncate max-w-[120px]">
                                {resources?.find(
                                  (r: any) => r.id === item.assigneeContractorResourceId,
                                )?.name || 'Recurso'}
                              </span>
                            </div>
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 border border-gray-200 border-dashed transition-colors"
                              title="Asignar responsable"
                            >
                              <User size={12} />
                            </div>
                          )}
                        </button>
                      </PopoverTrigger>

                      <PopoverContent
                        className="w-56 p-1 bg-white rounded-lg shadow-xl border border-gray-200 z-[100]"
                        align="start"
                        onOpenAutoFocus={(e: Event) => e.preventDefault()}
                        onCloseAutoFocus={(e: Event) => e.preventDefault()}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1.5 mb-1">
                          Miembros del Proyecto
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-0.5">
                          {users?.map((u: any) => (
                            <button
                              key={u.id}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onAssign(u.id, 'USER');
                              }}
                              className="w-full text-left px-2 py-1.5 hover:bg-blue-50 focus:bg-blue-50 rounded text-sm font-medium text-gray-700 transition-colors focus:outline-none"
                            >
                              {u.name}
                            </button>
                          ))}
                        </div>

                        {contractor && (
                          <>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1.5 mt-2 mb-1 border-t border-gray-100 flex items-center justify-between">
                              <span className="truncate pr-2">Recursos: {contractor.name}</span>
                              <Building2 size={10} className="text-gray-300 shrink-0" />
                            </div>

                            {isFetchingResources ? (
                              <div className="text-xs text-gray-400 p-2 text-center animate-pulse">
                                Cargando recursos...
                              </div>
                            ) : resources && resources.length > 0 ? (
                              <div className="max-h-40 overflow-y-auto space-y-0.5 pb-1">
                                {resources.map((r: any) => (
                                  <button
                                    key={r.id}
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onAssign(
                                        r.id,
                                        r.source === 'USER' ? 'USER' : 'CONTRACTOR_RESOURCE',
                                      );
                                    }}
                                    className="w-full text-left px-2 py-1.5 hover:bg-orange-50 focus:bg-orange-50 rounded text-sm font-medium text-gray-700 transition-colors focus:outline-none"
                                  >
                                    {r.name}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-gray-400 px-2 py-2 text-center italic bg-gray-50 rounded border border-gray-100 mx-1 mb-1">
                                No hay recursos asignados a este contratista.
                              </div>
                            )}
                          </>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 transition-opacity">
            {!item.isVirtual && !isViewer && level === 0 && (
              <button
                onClick={() => onAddSubtask(item.id)}
                className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs rounded border border-gray-200"
                title="Añadir Sub-tarea a este ítem"
              >
                + Tarea
              </button>
            )}

            {item.isVirtual ? (
              <button
                onClick={() => onImport(item.linkedWbsActivityId!)}
                disabled={isImporting || isViewer}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  isViewer
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {isImporting ? '...' : 'Añadir al Backlog'}
              </button>
            ) : level === 0 ? (
              <button
                onClick={() => toggleStory(item.id)}
                className={`p-2 rounded-full transition-colors ${hasChildren ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' : 'text-transparent cursor-default'}`}
                title={hasChildren ? 'Ver subtareas' : ''}
                disabled={!hasChildren}
              >
                <ArrowRight
                  size={18}
                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${!hasChildren && 'opacity-0'}`}
                />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="border-x border-b border-gray-200 rounded-b-lg mb-2 overflow-hidden bg-gray-50/10">
          {item.children?.map((child) => (
            <BacklogItemRow
              key={child.id}
              item={child}
              level={level + 1}
              isViewer={isViewer}
              expandedStories={expandedStories}
              toggleStory={toggleStory}
              onAddSubtask={onAddSubtask}
              onImport={onImport}
              isImporting={isImporting}
              users={users}
              projectId={projectId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const BacklogView = ({ projectId }: { projectId: string }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedStories, setExpandedStories] = useState<Record<string, boolean>>({});
  const [newItemParentId, setNewItemParentId] = useState<string | null>(null); // For "Add Task" directly

  const queryClient = useQueryClient();
  const { contractors } = useContractors();
  const [contractorFilter, setContractorFilter] = useState<string | null>(null);
  const { user } = useAuth();
  const projectMember = user?.projectMembers?.find((m: any) => m.projectId === projectId);
  const isViewer =
    projectMember?.role === 'EXECUTIVE_VIEWER' || projectMember?.role === 'FIELD_OPERATOR';

  const { data: members } = useQuery({
    queryKey: ['project', 'members', projectId],
    queryFn: async () => (await api.get(`/admin/projects/${projectId}/members`)).data,
    enabled: !!projectId,
  });

  const {
    data: backlogItems,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['scrum', 'backlog', projectId],
    queryFn: async () => {
      try {
        const res = await api.get(`/scrum/backlog/${projectId}`);
        return res.data;
      } catch (err: any) {
        console.error('Backlog fetch error:', err);
        throw err;
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: Partial<BacklogItem>) => {
      return api.post(`/scrum/backlog`, { ...newItem, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrum', 'backlog', projectId] });
      setIsCreateModalOpen(false);
      setNewItemParentId(null);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      alert(typeof msg === 'object' ? JSON.stringify(msg) : msg || 'Ocurrió un error al guardar');
      console.error('MUTATION ERROR', error?.response?.data || error);
    },
  });

  const importMutation = useMutation({
    mutationFn: async (activityId: string) => {
      return api.post(`/scrum/backlog/convert`, { activityId, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrum', 'backlog', projectId] });
    },
  });

  const toggleStory = (storyId: string) => {
    setExpandedStories((prev) => ({ ...prev, [storyId]: !prev[storyId] }));
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando backlog...</div>;

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-lg border border-red-100 m-4">
        <h3 className="text-red-700 font-bold mb-2">Error al cargar el backlog</h3>
        <p className="text-red-600 text-sm mb-4">
          {(error as any)?.response?.data?.message ||
            (error as Error)?.message ||
            'Ocurrió un error inesperado'}
        </p>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ['scrum', 'backlog', projectId] })
          }
          className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Hierarchy Logic: Filter roots
  const rootItems = (backlogItems || [])
    .filter((item: BacklogItem) => !item.parentId)
    .filter((item: BacklogItem) => {
      if (!contractorFilter) return true;

      // Match if item or any of its children has the contractor
      const getContractorId = (it: any) =>
        it.contractorId ||
        it.contractor?.id ||
        it.linkedWbsActivity?.contractor?.id ||
        it.linkedWbsActivity?.parent?.contractor?.id ||
        it.parent?.contractor?.id;

      const matchesSelf = getContractorId(item) === contractorFilter;
      const matchesChildren = item.children?.some(
        (child: any) => getContractorId(child) === contractorFilter,
      );

      return matchesSelf || matchesChildren;
    });

  const users =
    members?.map((pm: any) => ({
      id: pm.user?.id || pm.id,
      name: pm.user?.name || pm.name,
      role: pm.role,
    })) || [];

  const handleAddSubtask = (itemId: string) => {
    setNewItemParentId(itemId);
    setIsCreateModalOpen(true);
  };

  const handleImport = (wbsId: string) => {
    importMutation.mutate(wbsId);
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

          {!isViewer && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={16} /> Crear Ítem
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
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
          rootItems.map((item: BacklogItem) => (
            <BacklogItemRow
              key={item.id}
              item={item}
              level={0}
              isViewer={isViewer}
              expandedStories={expandedStories}
              toggleStory={toggleStory}
              onAddSubtask={handleAddSubtask}
              onImport={handleImport}
              isImporting={importMutation.isPending}
              users={users}
              projectId={projectId}
            />
          ))
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
          stories={backlogItems || []}
          initialParentId={newItemParentId}
          members={members}
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
  members?: any[];
}

const CreateItemModal = ({
  onClose,
  onSave,
  isLoading,
  stories,
  initialParentId,
  members = [],
}: CreateItemModalProps) => {
  const [type, setType] = useState(initialParentId ? 'TASK' : 'STORY');
  const [localError, setLocalError] = useState<string | null>(null);

  const parentItem = initialParentId ? stories.find((s) => s.id === initialParentId) : null;

  const parentMaxDateRaw = parentItem
    ? parentItem.endDate || parentItem.dueDate || parentItem.linkedWbsActivity?.endDate
    : null;
  const parentMinDateRaw = parentItem ? parentItem.linkedWbsActivity?.startDate : null;

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
          {localError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 text-sm">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <p>{localError}</p>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLocalError(null);
              const formData = new FormData(e.target as HTMLFormElement);
              const submittedDueDate = formData.get('dueDate') as string;

              // Validation for sub-tasks
              if (initialParentId && parentItem && submittedDueDate) {
                if (parentMaxDateRaw) {
                  const maxDateStr = new Date(parentMaxDateRaw as string)
                    .toISOString()
                    .split('T')[0];
                  if (submittedDueDate > maxDateStr) {
                    setLocalError(
                      'La fecha límite de la sub-tarea no puede exceder la fecha de finalización de su tarea principal.',
                    );
                    return;
                  }
                }

                if (parentMinDateRaw) {
                  const minDateStr = new Date(parentMinDateRaw as string)
                    .toISOString()
                    .split('T')[0];
                  if (submittedDueDate < minDateStr) {
                    setLocalError(
                      'La fecha límite de la sub-tarea no puede ser anterior a la fecha de inicio de la tarea principal.',
                    );
                    return;
                  }
                }
              }

              onSave({
                title: formData.get('title') as string,
                type: formData.get('type') as string,
                priority: Number(formData.get('priority')),
                parentId: (formData.get('parentId') as string) || initialParentId || undefined,
                assigneeUserId: (formData.get('assigneeUserId') as string) || undefined,
                dueDate: submittedDueDate ? `${submittedDueDate}T12:00:00.000Z` : undefined,
                status: 'BACKLOG',
              });
            }}
          >
            <div className="space-y-4">
              {initialParentId && parentItem && (
                <div className="text-[12px] text-gray-500 bg-gray-50/80 p-3.5 rounded-lg border border-gray-100 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <span className="font-semibold whitespace-nowrap text-gray-600">
                      Tarea Principal:
                    </span>
                    <span
                      className="truncate flex-1 font-medium bg-white px-2 py-0.5 rounded shadow-sm border border-gray-200/50 text-gray-800"
                      title={parentItem.title}
                    >
                      {parentItem.title}
                    </span>
                  </div>
                  {(parentMinDateRaw || parentMaxDateRaw) && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60 mt-0.5">
                      {parentMinDateRaw ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-500 mb-0.5">
                            Inicio Validado
                          </span>
                          <span className="text-gray-800 font-medium">
                            {format(new Date(parentMinDateRaw as string), "d 'de' MMMM yyyy", {
                              locale: es,
                            })}
                          </span>
                        </div>
                      ) : (
                        <div />
                      )}
                      {parentMaxDateRaw ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-500 mb-0.5">
                            Límite Permitido
                          </span>
                          <span className="text-gray-800 font-medium">
                            {format(new Date(parentMaxDateRaw as string), "d 'de' MMMM yyyy", {
                              locale: es,
                            })}
                          </span>
                        </div>
                      ) : (
                        <div />
                      )}
                    </div>
                  )}
                </div>
              )}

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

              {/* Assignee and Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsable
                  </label>
                  <select
                    name="assigneeUserId"
                    className="w-full px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="">-- Sin asignar --</option>
                    {members?.map((m: any) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.name || m.user?.email} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white mb-1"
                  />
                </div>
              </div>

              {/* Conditional Fields */}

              {/* Parent Story Selection */}
              {type === 'TASK' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {initialParentId ? 'Tarea padre' : 'Tarea padre (Opcional)'}
                  </label>
                  <select
                    name="parentId"
                    defaultValue={initialParentId || ''}
                    disabled={!!initialParentId}
                    className={`w-full px-3 py-2 border rounded-md ${
                      initialParentId ? 'bg-gray-100 cursor-not-allowed opacity-80' : 'bg-gray-50'
                    }`}
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                {isLoading ? 'Guardando...' : initialParentId ? 'Crear Sub-tarea' : 'Crear Ítem'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
