import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { X, FolderKanban, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectData {
  id: string;
  name: string;
  status?: string;
  mainContractorId?: string | null;
}

interface ConstructorProjectsModalProps {
  constructorId: string;
  constructorName: string;
  onClose: () => void;
}

export const ConstructorProjectsModal = ({
  constructorId,
  constructorName,
  onClose,
}: ConstructorProjectsModalProps) => {
  const queryClient = useQueryClient();
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  // Fetch all projects to show in the list
  const { data: allProjects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data;
    },
    // We populate our local state once when we get the projects
    meta: {
      onSuccess: (data: ProjectData[]) => {
        if (!hasLoadedInitial) {
          const assignedIds = data
            .filter((p) => p.mainContractorId === constructorId)
            .map((p) => p.id);
          setSelectedProjectIds(assignedIds);
          setHasLoadedInitial(true);
        }
      },
    },
  });

  // Small hack: if meta.onSuccess doesn't fire depending on React Query version/setup, fallback to useEffect
  // React Query v5 removed onSuccess from useQuery, so we use an effect instead
  useEffect(() => {
    if (allProjects.length > 0 && !hasLoadedInitial) {
      const assignedIds = allProjects
        .filter((p: ProjectData) => p.mainContractorId === constructorId)
        .map((p: ProjectData) => p.id);
      setSelectedProjectIds(assignedIds);
      setHasLoadedInitial(true);
    }
  }, [allProjects, constructorId, hasLoadedInitial]);

  // Handle toggling a project
  const toggleProject = (projectId: string, isAssignedToOther: boolean) => {
    if (isAssignedToOther) {
      toast.error('Proyecto ya asignado', {
        description:
          'Este proyecto ya está asignado a otro constructor. Para reasignarlo, por favor ve al perfil del constructor actual y desasígnalo primero.',
        duration: 5000,
      });
      return;
    }

    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    );
  };

  // Mutation to save associations
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Find what needs to be added (has constructorId now, didn't before)
      // Find what needs to be removed (had constructorId before, doesn't now)
      
      const originalAssignedIds = allProjects
        .filter((p: ProjectData) => p.mainContractorId === constructorId)
        .map((p: ProjectData) => p.id);

      const toAdd = selectedProjectIds.filter((id: string) => !originalAssignedIds.includes(id));
      const toRemove = originalAssignedIds.filter((id: string) => !selectedProjectIds.includes(id));

      const updatePromises = [];

      // Add constructor
      for (const projectId of toAdd) {
        updatePromises.push(api.patch(`/projects/${projectId}`, { mainContractorId: constructorId }));
      }

      // Remove constructor (set to null)
      for (const projectId of toRemove) {
        updatePromises.push(api.patch(`/projects/${projectId}`, { mainContractorId: null }));
      }

      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Proyectos asignados exitosamente');
      onClose();
    },
    onError: () => {
      toast.error('Error al asignar proyectos. Intente nuevamente.');
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 text-left">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
              <FolderKanban size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Asignar Proyectos</h3>
              <p className="text-sm text-gray-500">Constructor: {constructorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoadingProjects ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
              <p>Cargando proyectos...</p>
            </div>
          ) : allProjects.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
              <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No hay proyectos disponibles</p>
              <p className="text-sm text-gray-400 mt-1">Crea un proyecto primero para asignarlo.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Selecciona los proyectos en los que {constructorName} estará trabajando como Constructor Principal:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allProjects.map((project: ProjectData) => {
                  const isSelected = selectedProjectIds.includes(project.id);
                  const isAssignedToOther = Boolean(
                    project.mainContractorId && project.mainContractorId !== constructorId
                  );

                  return (
                    <div
                      key={project.id}
                      onClick={() => toggleProject(project.id, isAssignedToOther)}
                      className={`
                        relative flex items-center p-4 border rounded-xl transition-all duration-200
                        ${
                          isAssignedToOther
                            ? 'opacity-60 bg-gray-100 border-gray-200 cursor-not-allowed'
                            : isSelected
                              ? 'border-purple-500 bg-purple-50 shadow-sm cursor-pointer'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50 cursor-pointer'
                        }
                      `}
                    >
                      <div
                        className={`
                        flex-shrink-0 w-5 h-5 rounded border mr-3 flex items-center justify-center transition-colors
                        ${
                          isAssignedToOther
                            ? 'bg-gray-200 border-gray-300'
                            : isSelected
                              ? 'bg-purple-600 border-purple-600'
                              : 'border-gray-300'
                        }
                      `}
                      >
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${
                            isAssignedToOther ? 'text-gray-500' : isSelected ? 'text-purple-900' : 'text-gray-900'
                          }`}
                        >
                          {project.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {isAssignedToOther ? (
                            <span className="text-amber-600 font-medium">Asignado a otro constructor</span>
                          ) : (
                            project.status || 'Sin status'
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 z-10">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isLoadingProjects}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Asignaciones'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
