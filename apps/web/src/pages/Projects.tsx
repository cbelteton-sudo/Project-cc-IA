import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Folder, Search, Building2, Briefcase, FileText, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Types
import { projectsService, type Project, type CreateProjectDTO } from '../services/projects';

// Zod Schema
const createProjectSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(50),
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'El código debe ser alfanumérico (Mayúsculas)'),
  managerName: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  globalBudget: z.coerce.number().optional(),
  enablePMDashboard: z.boolean().optional(),
  enablePunchListPro: z.boolean().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

const FilterPill = ({
  label,
  active,
  hasDropdown,
}: {
  label: string;
  active?: boolean;
  hasDropdown?: boolean;
}) => (
  <button
    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5
      ${
        active
          ? 'bg-gray-100 border-gray-200 text-gray-900'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
  >
    {label}
    {hasDropdown && <ChevronDown size={14} className="text-gray-400" />}
  </button>
);

const TabOption = ({
  label,
  count,
  active,
  color,
}: {
  label: string;
  count: number;
  active?: boolean;
  color?: string;
}) => (
  <button
    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
      ${
        active
          ? 'border-gray-900 text-gray-900'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
  >
    {label}
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-bold ${color || 'bg-gray-100 text-gray-700'}`}
    >
      {count}
    </span>
  </button>
);

export const Projects = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  // Form Hooks
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      code: '',
      managerName: '',
      globalBudget: undefined,
      enablePMDashboard: true,
      enablePunchListPro: false,
    },
  });

  // Fetch Projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.getAll,
    enabled: !!token,
  });

  // Create Project Mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectForm) => {
      const payload: CreateProjectDTO = {
        ...data,
        currency: 'USD',
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      };
      return projectsService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      reset();
      toast.success(t('common.save'));
    },
    onError: (err: any) => {
      console.error('Create failed', err);
      toast.error(err.response?.data?.message || t('common.error'));
    },
  });

  const onSubmit = (data: CreateProjectForm) => {
    createMutation.mutate(data);
  };

  const getProjectStatus = (project: Project) => {
    // 1. Projects marked as finished
    if (project.status === 'DONE' || project.status === 'CLOSED') {
      return { label: 'Terminado', color: 'bg-green-100 text-green-700 border-green-200' };
    }

    // 2. Projects without start date (Newly created) -> "No iniciado"
    if (!project.startDate) {
      return { label: 'No iniciado', color: 'bg-gray-100 text-gray-500 border-gray-200' };
    }

    // 3. Status checks based on endDate
    if (!project.endDate) {
      // Default active status (homologated from "En Progreso") -> "En Tiempo" (Optimistic)
      return { label: 'En Tiempo', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }

    const now = new Date();
    const end = new Date(project.endDate);
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Atrasado', color: 'bg-red-100 text-red-700 border-red-200' };
    } else if (diffDays < 14) {
      // Less than 2 weeks warning
      return { label: 'En Riesgo', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    } else {
      return { label: 'En Tiempo', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
  };
  const filteredProjects = projects?.filter(
    (p: Project) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Derive counts for tabs based on status
  const allCount = projects?.length || 0;
  const activeCount =
    projects?.filter((p: Project) => {
      const status = getProjectStatus(p);
      return status.label === 'En Tiempo' || status.label === 'En Riesgo';
    }).length || 0;
  const atRiskCount =
    projects?.filter((p: Project) => {
      const status = getProjectStatus(p);
      return status.label === 'En Riesgo' || status.label === 'Atrasado';
    }).length || 0;
  const doneCount =
    projects?.filter((p: Project) => {
      const status = getProjectStatus(p);
      return status.label === 'Terminado';
    }).length || 0;

  if (isLoading)
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="flex justify-between items-center mb-8 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="container mx-auto max-w-7xl p-6 min-h-screen bg-gray-50/30">
      {/* Action Center Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 mt-2">
        <div className="flex items-center gap-3">
          <Briefcase className="text-gray-700" size={28} />
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{t('projects.title')}</h2>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => {
              reset();
              setIsModalOpen(true);
            }}
            className="bg-gray-900 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-gray-800 transition shadow-sm font-medium text-sm whitespace-nowrap active:scale-95"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* Pill Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <FilterPill label="Mis proyectos" active />
        <FilterPill label="Responsable" hasDropdown />
        <FilterPill label="Estado" hasDropdown />
        <FilterPill label="Facturados" />
        <FilterPill label="Atrasados" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
        <TabOption label="Todos" count={allCount} active />
        <TabOption
          label="Activos"
          count={activeCount}
          active={false}
          color="bg-blue-100 text-blue-700"
        />
        <TabOption
          label="En Riesgo"
          count={atRiskCount}
          active={false}
          color="bg-orange-100 text-orange-700"
        />
        <TabOption
          label="Terminados"
          count={doneCount}
          active={false}
          color="bg-green-100 text-green-700"
        />
      </div>

      {/* Data Table */}
      {filteredProjects?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No se encontraron proyectos</h3>
          <p className="text-gray-500 mb-6">Prueba con otra búsqueda o crea uno nuevo.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 w-1/3">Proyecto</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700">Responsable</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700">Entrega</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700">Estado</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProjects?.map((project: Project) => {
                const status = getProjectStatus(project);
                const isLate = status.label === 'Atrasado';

                // Map status label to dot color (Action Center style)
                let dotColor = 'bg-gray-400';
                if (status.label === 'Terminado') dotColor = 'bg-green-500';
                else if (status.label === 'En Tiempo') dotColor = 'bg-blue-400';
                else if (status.label === 'En Riesgo') dotColor = 'bg-orange-400';
                else if (isLate) dotColor = 'bg-red-500';

                return (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-gray-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-800">
                          {project.code} - {project.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {/* Mocking Manager for now if not available */}
                        {(project as any).managerName || (
                          <span className="text-gray-400 italic">Sin asignar</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`text-sm ${isLate ? 'text-red-500 font-medium' : 'text-gray-600'}`}
                      >
                        {project.endDate ? (
                          new Date(project.endDate).toLocaleDateString('es-GT', {
                            month: '2-digit',
                            day: '2-digit',
                            year: '2-digit',
                          })
                        ) : (
                          <span className="text-gray-400 italic">No definida</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                        <span className="text-sm text-gray-700">{status.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/projects/${project.id}/plan`}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                        >
                          Plan
                        </Link>
                        <Link
                          to={`/projects/${project.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-100"
                        >
                          Detalle
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal remains mostly the same, just styled a bit if needed. Keeping original modal logic. */}
      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all scale-100 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{t('projects.newProject')}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Ingresa los detalles para iniciar un nuevo proyecto.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-50 p-2.5 rounded-full hover:bg-gray-100 transition-colors border border-gray-100"
              >
                <Plus size={24} className="rotate-45 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('projects.title')}
                  </label>
                  <div className="relative">
                    <Building2
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      {...register('name')}
                      className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                      placeholder="Ej. Torre Reforma Residencial"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.name.message}</p>
                  )}
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('projects.code')}
                  </label>
                  <input
                    type="text"
                    {...register('code')}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all ${errors.code ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                    placeholder="Ej. TR-001"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Identificador único (Mayúsculas).</p>
                  {errors.code && (
                    <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.code.message}</p>
                  )}
                </div>

                {/* Manager */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Responsable / PM
                  </label>
                  <input
                    type="text"
                    {...register('managerName')}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ej. Arq. Sofia Lopez"
                  />
                </div>

                {/* Dates */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Fecha Inicio</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Fecha Entrega
                  </label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-600"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Presupuesto Global
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('globalBudget')}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Moneda base: USD</p>
                </div>

                {/* Settings */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Configuración Inicial
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        {...register('enablePMDashboard')}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Habilitar Dashboard PM
                      </span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        {...register('enablePunchListPro')}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Activar Punch List Pro
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3.5 text-gray-700 hover:bg-gray-100 rounded-xl font-bold transition-colors border border-transparent hover:border-gray-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      <span>Crear Proyecto</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
