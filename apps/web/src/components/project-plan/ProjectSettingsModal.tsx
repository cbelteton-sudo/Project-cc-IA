import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, Calendar } from 'lucide-react';
import type { Project } from '../../hooks/useProjects';
import { useNavigate } from 'react-router-dom';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

interface SettingsForm {
  startDate: string;
  endDate: string;
  globalBudget: number;
  currency: string;
  projectManagerId?: string;
  mainContractorId?: string;
  enableScrum?: boolean;
  enableBudget?: boolean;
  enableFieldManagement?: boolean;
}

export const ProjectSettingsModal = ({ isOpen, onClose, project }: ProjectSettingsModalProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, watch } = useForm<SettingsForm>({
    defaultValues: {
      currency: 'GTQ',
      enableBudget: false,
      enableFieldManagement: false,
    },
  });

  const isBudgetEnabled = watch('enableBudget');

  // Use watch for currency symbol
  const selectedCurrency = watch('currency') || project?.currency || 'GTQ';
  const currencySymbol =
    selectedCurrency === 'GTQ'
      ? 'Q'
      : selectedCurrency === 'EUR'
        ? '€'
        : selectedCurrency === 'MXN'
          ? '$'
          : '$';

  // Fetch lists
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
    enabled: isOpen,
  });

  const { data: contractors } = useQuery({
    queryKey: ['contractors'],
    queryFn: async () => (await api.get('/contractors')).data,
    enabled: isOpen,
  });

  useEffect(() => {
    if (project) {
      const safeDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return '';
          return d.toISOString().split('T')[0];
        } catch (e) {
          console.error('Error parsing date:', dateStr, e);
          return '';
        }
      };

      reset({
        startDate: safeDate(project.startDate),
        endDate: safeDate(project.endDate),
        globalBudget: project.globalBudget || 0,
        currency: project.currency || 'GTQ',
        projectManagerId: project.projectManagerId || '',
        mainContractorId: project.mainContractorId || '',
        enableScrum: project.enableScrum || false,
        enableBudget: project.enableBudget || false,
        enableFieldManagement: project.enableFieldManagement || false,
      });
    }
  }, [project, reset, isOpen, users, contractors]);

  const mutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      // Sanitize data
      const payload = {
        ...data,
        // Handle empty dates (send null or undefined if empty string)
        startDate: data.startDate ? data.startDate : null,
        endDate: data.endDate ? data.endDate : null,
        // Ensure number
        globalBudget: data.globalBudget ? Number(data.globalBudget) : 0,
        projectManagerId: data.projectManagerId || null,
        mainContractorId: data.mainContractorId || null,
        enableScrum: data.enableScrum,
        enableBudget: data.enableBudget,
        enableFieldManagement: data.enableFieldManagement,
      };

      return api.patch(`/projects/${project.id}`, payload);
    },
    onSuccess: () => {
      toast.success(t('common.saved_success', 'Configuración guardada'));
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
    onError: () => {
      toast.error(t('common.error_generic', 'Error al guardar'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/projects/${project.id}`),
    onSuccess: () => {
      toast.success('Proyecto eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
      navigate('/projects');
    },
    onError: () => toast.error('Error al eliminar proyecto'),
  });

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in relative overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">Configuración del Proyecto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-5">
          {/* Dates Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={12} /> Fechas de Ejecución
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Inicio Proyecto
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fin Proyecto</label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Budget Section */}
          {isBudgetEnabled && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Presupuesto
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Presupuesto Global
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 font-semibold text-sm">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      readOnly
                      {...register('globalBudget', { valueAsNumber: true })}
                      className="w-full pl-8 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Moneda</label>
                  <select
                    {...register('currency')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="GTQ">Q (Quetzales)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="MXN">MXN ($)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Modules Section */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Módulos</h4>

            {/* Agile / Scrum Toggle */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div>
                <span className="block text-sm font-medium text-gray-900">Scrum / Agile</span>
                <span className="block text-xs text-gray-500">
                  Habilitar tablero Kanban y Backlog
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('enableScrum')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Budget Toggle */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div>
                <span className="block text-sm font-medium text-gray-900">Presupuesto</span>
                <span className="block text-xs text-gray-500">
                  Habilitar control de costos y finanzas
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('enableBudget')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Field Management Toggle */}
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div>
                <span className="block text-sm font-medium text-gray-900">Gestión de Campo</span>
                <span className="block text-xs text-gray-500">
                  Habilitar reportes diarios, punch list y fotos
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('enableFieldManagement')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
          </div>

          {/* Responsables Section */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Constructora responsable:
                </label>
                <select
                  {...register('mainContractorId')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">-- Sin asignar --</option>
                  {contractors?.map((c: { id: string; name: string }) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Asignar Project Manager
                </label>
                <select
                  {...register('projectManagerId')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">-- Sin asignar --</option>
                  {users?.map((u: { id: string; name: string; email: string }) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between gap-3 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    '¿Está seguro de que desea eliminar este proyecto? Esta acción no se puede deshacer.',
                  )
                ) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Proyecto'}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
              >
                {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
