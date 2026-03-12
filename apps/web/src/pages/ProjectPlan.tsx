import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '../context/AuthContext';
import { Plus, ArrowLeft, Settings, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useProjects } from '../hooks/useProjects';
import type { Project } from '../hooks/useProjects';

// Components
import { ActivitiesTree } from '../components/project-plan/ActivitiesTree';
import type { Activity } from '../components/project-plan/ActivitiesTree';
import { ActivityDetails } from '../components/project-plan/ActivityDetails';
import { ProjectSettingsModal } from '../components/project-plan/ProjectSettingsModal';
import { GanttChart } from '../components/project-plan/GanttChart';
import { CreateMilestoneModal } from '../components/project-plan/CreateMilestoneModal';

interface Milestone {
  id: string;
  name: string;
  date: string;
  status: string;
  description?: string;
  activityId?: string;
}

interface Contractor {
  id: string;
  name: string;
  type: string;
}

export const ProjectPlan = () => {
  const { id: projectId } = useParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { data: projects } = useProjects();
  const currentProject = projects?.find((p: Project) => p.id === projectId);
  console.log('ProjectPlan currentProject loaded:', currentProject);

  const [activeTab, setActiveTab] = useState<
    'schedule' | 'gantt' | 'milestones'
  >('schedule');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>(undefined);
  const [isCreateMilestoneModalOpen, setIsCreateMilestoneModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Assignment State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activityToAssign, setActivityToAssign] = useState<string | null>(null);

  // Create Activity Mutation
  // API_URL handled by api instance
  const createActivityMutation = useMutation({
    mutationFn: async (
      data: Partial<Activity> & { projectId: string; parentId?: string; contractorId?: string },
    ) => {
      // Remove hardcoded tenantId to rely on token
      return api.post(`/activities`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      setIsCreateModalOpen(false);
      toast.success('Actividad creada');
    },
    onError: (err: { response?: { data?: { message?: string | string[] } } }) => {
      console.error(err);
      const msg = err.response?.data?.message || 'Error al crear actividad';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  // Milestones Query
  const { data: milestones, refetch: refetchMilestones } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/milestones`);
      return res.data;
    },
    enabled: activeTab === 'milestones' || activeTab === 'gantt',
  });

  // Create Milestone Mutation
  const createMilestoneMutation = useMutation({
    mutationFn: async (data: Partial<Milestone> & { activityId?: string }) => {
      return api.post(`/projects/${projectId}/milestones`, data);
    },
    onSuccess: () => {
      refetchMilestones();
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      setIsCreateMilestoneModalOpen(false);
      toast.success('Hito creado');
    },
    onError: (err: { response?: { data?: { message?: string | string[] } } }) => {
      console.error(err);
      const msg = err.response?.data?.message || 'Error al crear hito';
      toast.error(Array.isArray(msg) ? msg[0] : msg, {
        position: 'top-center',
        duration: 8000,
        className: 'text-base font-medium px-4 py-3',
      });
    },
  });

  // Fetch Contractors
  const {
    data: contractors,
    isLoading: isLoadingContractors,
    isError: isErrorContractors,
  } = useQuery({
    queryKey: ['contractors', projectId],
    queryFn: async () => {
      const res = await api.get('/contractors', { params: { projectId } });
      return res.data;
    },
    enabled: !!token && !!projectId,
  });

  // Assign Contractor Mutation
  const assignContractorMutation = useMutation({
    mutationFn: async ({
      activityId,
      contractorId,
    }: {
      activityId: string;
      contractorId: string;
    }) => {
      return api.patch(`/activities/${activityId}`, { contractorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      setIsAssignModalOpen(false);
      setActivityToAssign(null);
      toast.success('Responsable asignado');
    },
    onError: () => toast.error('Error al asignar responsable'),
  });

  // Reorder Activity Mutation
  const reorderActivityMutation = useMutation({
    mutationFn: async ({ orderedIds }: { orderedIds: string[] }) => {
      return api.post(`/activities/reorder`, { orderedIds });
    },
    onSuccess: () => {
      // Invalidate to refetch and ensure consistency
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      toast.success('Orden actualizado');
    },
    onError: () => toast.error('Error al reordenar actividades'),
  });

  // Reorder Milestone Mutation
  const reorderMilestoneMutation = useMutation({
    mutationFn: async ({ orderedIds }: { orderedIds: string[] }) => {
      return api.post(`/projects/${projectId}/milestones/reorder`, { orderedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      toast.success('Orden de hitos actualizado');
    },
    onError: () => toast.error('Error al reordenar hitos'),
  });

  // Reorder Mixed Items Mutation (New)
  const reorderItemsMutation = useMutation({
    mutationFn: async ({ items }: { items: { id: string; type: 'ACTIVITY' | 'MILESTONE' }[] }) => {
      return api.post(`/projects/${projectId}/reorder-items`, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      toast.success('Orden actualizado');
    },
    onError: () => toast.error('Error al reordenar elementos'),
  });

  // ...
  // ... (UseQuery logic for projects and activities stays here but omitted in this specific replacement block for brevity if not overlapping, but I must match exact target content so I will include context)
  // Actually, I should target the state declaration and the button specifically.

  // Let's split this into two simpler Replacements or one large one.
  // I will replace the top state section to add the new state variable
  // And I will replace the button section to update the onClick.

  // WAITING: I'll use the proper tool calling pattern. I will do this in 2 chunks using multi_replace_file_content if possible, or sequential replace_file_content.
  // I already used replace_file_content for the modal HTML at the bottom.
  // Now I need to update the top state and the button.

  // I will use multi_replace for this to be efficient.

  // Fetch Project Info
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}`);
      return res.data;
    },
  });

  // Fetch Activities Tree
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', projectId],
    queryFn: async () => {
      try {
        const res = await api.get(`/activities/project/${projectId}`);
        return buildTree(res.data);
      } catch (err) {
        console.error('Error fetching activities:', err);
        return [];
      }
    },
  });

  // Helper to build tree from flat list
  const buildTree = (items: Activity[]) => {
    if (!Array.isArray(items)) {
      console.warn('buildTree expected array but got:', items);
      return [];
    }
    const rootItems: Activity[] = [];
    const lookup: Record<string, Activity> = {};

    // Sort items by orderIndex if available, else by startDate
    const sortedItems = [...items]
      .filter((item) => item && typeof item === 'object')
      .sort((a, b) => {
        // Use orderIndex if both have it
        if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
          return a.orderIndex - b.orderIndex;
        }
        // Fallback to start date
        const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return timeA - timeB;
      });

    sortedItems.forEach((item) => {
      item.children = [];
      lookup[item.id] = item;
    });
    sortedItems.forEach((item) => {
      if (item.parentId && lookup[item.parentId]) {
        lookup[item.parentId].children?.push(item);
      } else {
        rootItems.push(item);
      }
    });
    return rootItems;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* Toolbar */}
      {/* Toolbar - Redesigned */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-10">
        {/* Upper Row: Title & Key Meta */}
        <div className="px-6 py-4 flex justify-between items-start">
          <div className="flex items-start gap-4">
            <Link
              to={`/projects/${projectId}`}
              className="mt-1 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                {isLoadingProject ? (
                  <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                      {project?.name}
                    </h1>
                    {project?.status && (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          project.status === 'IN_PROGRESS' || project.status === 'ACTIVE'
                            ? 'bg-blue-100 text-blue-700'
                            : project.status === 'DONE' || project.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : project.status === 'BLOCKED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {project.status === 'IN_PROGRESS' || project.status === 'ACTIVE'
                          ? 'En Progreso'
                          : project.status === 'DONE' || project.status === 'COMPLETED'
                            ? 'Completado'
                            : project.status === 'BLOCKED'
                              ? 'Bloqueado'
                              : 'No Iniciado'}
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                {isLoadingProject ? (
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                ) : (
                  (project?.startDate || project?.endDate) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                      <span>
                        <span className="font-medium mr-1">Fechas de ejecución del Proyecto:</span>
                        {project.startDate
                          ? new Date(project.startDate).toLocaleDateString(undefined, {
                              dateStyle: 'medium',
                            })
                          : '?'}
                        {' - '}
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString(undefined, {
                              dateStyle: 'medium',
                            })
                          : '?'}
                      </span>
                    </div>
                  )
                )}
                {isLoadingProject ? (
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                ) : (
                  (project?.constructorName || currentProject?.constructorName) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                      <span>
                        <span className="font-medium mr-1">Constructora asignada:</span>
                        <span className="text-gray-700">{project?.constructorName || currentProject?.constructorName}</span>
                      </span>
                    </div>
                  )
                )}
                {isLoadingProject ? (
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                    <span>
                      <span className="font-medium mr-1">Project manager asignado:</span>
                      <span className="text-gray-700">{project?.managerName || currentProject?.managerName || 'Sin asignar'}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
              title="Configuración del Proyecto"
            >
              <Settings size={20} />
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1"></div>
            {activeTab === 'schedule' && (
              <button
                onClick={() => {
                  setDefaultParentId(undefined);
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-brand-ambar text-white rounded-lg hover:bg-brand-oro shadow-sm transition-all text-sm font-medium"
              >
                <Plus size={18} />
                Nueva Actividad
              </button>
            )}
            {activeTab === 'milestones' && (
              <button
                onClick={() => setIsCreateMilestoneModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm transition-all text-sm font-medium"
              >
                <Plus size={18} />
                Nuevo Hito
              </button>
            )}
          </div>
        </div>

        {/* Lower Row: Navigation Tabs */}
        <div className="px-6 flex gap-8 border-t border-gray-100">
          {[
            { id: 'schedule', label: 'Plan de Trabajo', color: 'blue' },
            { id: 'gantt', label: 'Cronograma', color: 'indigo' },
            { id: 'milestones', label: 'Hitos', color: 'purple' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? `border-${tab.color}-600 text-${tab.color}-700`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Split */}
      {/* Main Content Split */}
      <div className="flex-1 overflow-hidden p-4 flex gap-4">
        <ErrorBoundary
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-xl border border-red-200">
              <div className="text-center p-6">
                <h3 className="text-lg font-bold text-red-700 mb-2">Error en el módulo Visual</h3>
                <p className="text-sm text-red-600 mb-4">
                  Ha ocurrido un error al renderizar este componente.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Recargar Página
                </button>
              </div>
            </div>
          }
        >
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 text-sm animate-pulse">Cargando actividades...</p>
              </div>
            </div>
          ) : activeTab === 'schedule' || activeTab === 'gantt' ? (
            <>
              <div
                className={`${selectedActivityId ? 'w-2/3' : 'w-full'} h-full transition-all duration-300 ease-in-out`}
              >
                {activeTab === 'schedule' ? (
                  <ActivitiesTree
                    activities={activities || []}
                    selectedId={selectedActivityId}
                    onSelect={setSelectedActivityId}
                    onAssignContractor={(id) => {
                      setActivityToAssign(id);
                      setIsAssignModalOpen(true);
                    }}
                    onCreate={() => setIsCreateModalOpen(true)}
                    onReorder={(orderedIds) => reorderActivityMutation.mutate({ orderedIds })}
                    onReorderMilestone={(orderedIds) =>
                      reorderMilestoneMutation.mutate({ orderedIds })
                    }
                    onReorderItems={(items) => reorderItemsMutation.mutate({ items })}
                  />
                ) : (
                  <div className="w-full h-full overflow-hidden animate-fade-in">
                    <GanttChart
                      activities={activities || []}
                      milestones={milestones || []}
                      onSelect={setSelectedActivityId}
                      contractors={contractors || []}
                    />
                  </div>
                )}
              </div>

              {selectedActivityId && (
                <div className="w-1/3 bg-white rounded-xl shadow-lg border border-gray-200 p-5 overflow-hidden animate-slide-in-right">
                  <ActivityDetails
                    activityId={selectedActivityId}
                    token={token!}
                    onUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: ['activities'] });
                      queryClient.invalidateQueries({ queryKey: ['activity', selectedActivityId] });
                    }}
                    onCreateSubActivity={(parentId) => {
                      setDefaultParentId(parentId);
                      setIsCreateModalOpen(true);
                    }}
                    onClose={() => setSelectedActivityId(null)}
                  />
                </div>
              )}
            </>
          ) : (
            // Milestones View
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-auto">
              <h2 className="text-lg font-bold mb-4">Hitos del Proyecto</h2>
              <div className="space-y-4">
                {milestones?.map((m: Milestone) => (
                  <div
                    key={m.id}
                    className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs mr-4">
                      {new Date(m.date).getDate()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{m.name}</h4>
                      <p className="text-sm text-gray-500">{m.description || 'Sin descripción'}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${m.status === 'ACHIEVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {m.status}
                    </div>
                  </div>
                ))}
                {milestones?.length === 0 && (
                  <p className="text-center text-gray-400 py-10">No hay hitos registrados aún.</p>
                )}
              </div>
            </div>
          )}
        </ErrorBoundary>
      </div>

      {/* Modal for Creating Activity */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold mb-6 text-gray-800">Nueva Actividad</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const startDateStr = formData.get('startDate') as string;
                const endDateStr = formData.get('endDate') as string;
                const parentIdStr = formData.get('parentId') as string;

                // Date Boundary Validation (Only if no parent)
                if (!parentIdStr && currentProject?.startDate && currentProject?.endDate) {
                  const pStart = new Date(currentProject.startDate);
                  pStart.setHours(0, 0, 0, 0);
                  const pEnd = new Date(currentProject.endDate);
                  pEnd.setHours(23, 59, 59, 999);

                  const aStart = new Date(startDateStr);
                  aStart.setHours(0, 0, 0, 0);
                  const aEnd = new Date(endDateStr);
                  aEnd.setHours(0, 0, 0, 0);

                  if (aStart < pStart || aEnd > pEnd) {
                    const strStart = pStart.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                    const strEnd = pEnd.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                    toast.error(
                      `Las fechas de la actividad deben estar dentro del rango general del proyecto: ${strStart} al ${strEnd}`,
                    );
                    return;
                  }
                }

                // Sub-Activity Date Boundary Validation
                if (parentIdStr && activities) {
                  const findNode = (id: string, nodes: Activity[]): Activity | null => {
                    for (const node of nodes) {
                      if (node.id === id) return node;
                      if (node.children) {
                        const found = findNode(id, node.children);
                        if (found) return found;
                      }
                    }
                    return null;
                  };

                  const parentActivity = findNode(parentIdStr, activities);
                  if (parentActivity) {
                    const pStart = new Date(parentActivity.startDate);
                    pStart.setHours(0, 0, 0, 0);
                    const pEnd = new Date(parentActivity.endDate);
                    pEnd.setHours(23, 59, 59, 999);

                    const aStart = new Date(startDateStr);
                    aStart.setHours(0, 0, 0, 0);
                    const aEnd = new Date(endDateStr);
                    aEnd.setHours(0, 0, 0, 0);

                    if (aStart < pStart || aEnd > pEnd) {
                      const strStart = pStart.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      const strEnd = pEnd.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      toast.error(
                        `Las fechas de la sub-actividad deben estar dentro del rango de su actividad principal: ${strStart} al ${strEnd}`,
                      );
                      return;
                    }
                  }
                }

                createActivityMutation.mutate({
                  projectId: projectId!,
                  name: formData.get('name') as string,
                  startDate: startDateStr ? `${startDateStr}T12:00:00.000Z` : startDateStr,
                  endDate: endDateStr ? `${endDateStr}T12:00:00.000Z` : endDateStr,
                  parentId: parentIdStr || undefined,
                  contractorId: (formData.get('contractorId') as string) || undefined,
                  plannedWeight: 1,
                });
              }}
              className="space-y-4"
            >
              {(() => {
                const flatten = (
                  nodes: Activity[],
                  depth = 0,
                ): (Activity & { depth: number })[] => {
                  return nodes.reduce(
                    (acc, node) => {
                      acc.push({ ...node, depth });
                      if (node.children) acc.push(...flatten(node.children, depth + 1));
                      return acc;
                    },
                    [] as (Activity & { depth: number })[],
                  );
                };
                const flatActivities = flatten(activities || []);
                const selectedParent = flatActivities.find((a) => a.id === (defaultParentId || ''));

                return (
                  <>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Actividad Padre
                        </label>
                        <select
                          name="parentId"
                          value={defaultParentId || ''}
                          onChange={(e) => setDefaultParentId(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                          <option value="">-- Ninguna (Nivel Raíz) --</option>
                          {flatActivities.map((act) => (
                            <option key={act.id} value={act.id}>
                              {'-'.repeat(act.depth * 2)} {act.name}
                            </option>
                          ))}
                        </select>
                        {selectedParent ? (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
                            <Calendar className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                            <div className="text-sm text-blue-800">
                              <span className="font-semibold block mb-1">
                                Para programar esta sub-tarea, usa el rango de su padre:
                              </span>
                              Inicio:{' '}
                              <span className="font-bold">
                                {new Date(selectedParent.startDate).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>{' '}
                              <br />
                              Fin:{' '}
                              <span className="font-bold">
                                {new Date(selectedParent.endDate).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">
                            Las actividades raíz suelen ser fases grandes (Ej. Estructura,
                            Acabados).
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de la Actividad
                      </label>
                      <input
                        name="name"
                        required
                        placeholder="Ej. Cimentación Torre A"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha Inicio
                        </label>
                        <input
                          name="startDate"
                          type="date"
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha Fin
                        </label>
                        <input
                          name="endDate"
                          type="date"
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-ambar text-white rounded-lg hover:bg-brand-oro font-medium shadow-sm transition-colors"
                >
                  Crear Actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Creating Milestone */}
      <CreateMilestoneModal
        isOpen={isCreateMilestoneModalOpen}
        onClose={() => setIsCreateMilestoneModalOpen(false)}
        isLoading={createMilestoneMutation.isPending}
        activities={activities || []}
        onSubmit={(data) => createMilestoneMutation.mutate(data)}
      />

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Asignar Responsable</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Selecciona el responsable de esta actividad.</p>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 min-h-[100px] relative">
                {isLoadingContractors && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {isErrorContractors && (
                  <div className="p-4 text-center text-sm text-red-500">
                    Error al cargar responsables. Por favor intenta de nuevo.
                  </div>
                )}
                {contractors?.map((c: Contractor) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      assignContractorMutation.mutate({
                        activityId: activityToAssign!,
                        contractorId: c.id,
                      })
                    }
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 hover:text-blue-700 transition flex items-center group"
                  >
                    <span className="font-medium">{c.name}</span>
                  </button>
                ))}
                {!isLoadingContractors && !isErrorContractors && contractors?.length === 0 && (
                  <p className="p-4 text-center text-sm text-gray-500">
                    No hay responsables registrados.
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="w-full py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {(project || currentProject) && (
        <ProjectSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          project={(project || currentProject) as Project}
        />
      )}

    </div>
  );
};
