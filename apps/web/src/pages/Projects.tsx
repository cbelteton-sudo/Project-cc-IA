import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Folder,
  ArrowRight,
  AlertTriangle,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  Calendar,
  TrendingUp,
  Building2,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Types
interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  globalBudget?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  _count?: {
    budgets: number;
  };
  thumbnail?: string; // Mock for now
  managerName?: string;
}

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

export const Projects = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Create Project Mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectForm) => {
      const payload = {
        ...data,
        currency: 'USD',
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      };
      return axios.post(`${API_URL}/projects`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    <div className="container mx-auto max-w-7xl p-6 min-h-screen">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t('projects.title')}</h2>
          <p className="text-gray-500 mt-1">Gestiona tus proyectos, presupuestos y avances.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-field-blue outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => {
              reset();
              setIsModalOpen(true);
            }}
            className="bg-field-orange text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-orange-700 transition shadow-md shadow-orange-200 font-bold whitespace-nowrap active:scale-95"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">{t('projects.newProject')}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {/* Projects Table List View */}
      {filteredProjects?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No se encontraron proyectos</h3>
          <p className="text-gray-500 mb-6">Prueba con otra búsqueda o crea uno nuevo.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden ring-1 ring-black/5">
          <table className="w-full text-left border-collapse">
            <thead className="bg-field-blue text-white shadow-md z-10 relative">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/80">
                  Proyecto
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/80">
                  Construye
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-white/80">
                  Estado
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/80">
                  Presupuesto
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/80">
                  Entrega
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-white/80">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProjects?.map((project: Project) => {
                const status = getProjectStatus(project);
                return (
                  <tr key={project.id} className="hover:bg-field-gray/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 group-hover:text-field-blue transition-colors text-base py-2">
                        {project.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {/* Mocking Client/Manager for now if not available, or use managerName if added to interface */}
                        {(project as any).managerName || (
                          <span className="text-gray-400 italic">No asignado</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                          {project.globalBudget ? (
                            new Intl.NumberFormat('es-GT', {
                              style: 'currency',
                              currency: project.currency || 'USD',
                            }).format(project.globalBudget)
                          ) : (
                            <span className="text-gray-400 italic">---</span>
                          )}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase">Global</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {project.endDate ? (
                          new Date(project.endDate).toLocaleDateString()
                        ) : (
                          <span className="text-gray-400 italic">---</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/projects/${project.id}/plan`}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-field-orange bg-orange-50 hover:bg-orange-100 rounded-md transition-colors border border-orange-100/50"
                          title="Actividades"
                        >
                          <ListIcon size={16} />
                          <span>Plan</span>
                        </Link>
                        <Link
                          to={`/projects/${project.id}`}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-field-blue bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-100/50"
                          title="Ver Detalles"
                        >
                          <span>Detalles</span>
                          <ArrowRight size={16} />
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
