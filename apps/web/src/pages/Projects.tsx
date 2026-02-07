import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Folder, ArrowRight } from 'lucide-react';
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
}

// Zod Schema
const createProjectSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(50),
    code: z.string().min(3, 'Code must be at least 3 characters').regex(/^[A-Z0-9-]+$/, 'Code must be alphanumeric (uppercase)'),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

export const Projects = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t } = useTranslation();

    // Form Hooks
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<CreateProjectForm>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: '',
            code: ''
        }
    });

    // Fetch Projects
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token,
    });

    // Create Project Mutation
    const createMutation = useMutation({
        mutationFn: async (data: CreateProjectForm) => {
            return axios.post(`${API_URL}/projects`, {
                ...data,
                currency: 'USD'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setIsModalOpen(false);
            reset();
            toast.success(t('common.save'));
        },
        onError: (err: any) => {
            console.error("Create failed", err);
            toast.error(err.response?.data?.message || t('common.error'));
        }
    });

    const onSubmit = (data: CreateProjectForm) => {
        createMutation.mutate(data);
    };

    const getProjectStatus = (project: Project) => {
        // "En tiempo, En Riesgo, Atrasado, Terminado"
        if (project.status === 'DONE' || project.status === 'CLOSED') {
            return { label: 'Terminado', color: 'bg-green-100 text-green-700 border-green-200' };
        }

        if (!project.endDate) {
            return { label: 'En Tiempo', color: 'bg-blue-100 text-blue-700 border-blue-200' };
        }

        const now = new Date();
        const end = new Date(project.endDate);
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { label: 'Atrasado', color: 'bg-red-100 text-red-700 border-red-200' };
        } else if (diffDays < 14) { // Less than 2 weeks warning
            return { label: 'En Riesgo', color: 'bg-orange-100 text-orange-700 border-orange-200' };
        } else {
            return { label: 'En Tiempo', color: 'bg-blue-100 text-blue-700 border-blue-200' };
        }
    };

    if (isLoading) return <div className="p-8"><div className="animate-pulse h-10 bg-gray-200 w-1/4 rounded mb-8"></div><div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded w-full"></div>)}</div></div>;

    return (
        <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{t('projects.title')}</h2>
                    <p className="text-gray-500 text-sm mt-1">Gestiona y monitorea tus proyectos activos</p>
                </div>
                <button
                    onClick={() => { reset(); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm font-medium"
                >
                    <Plus size={18} />
                    {t('projects.newProject')}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                            <th className="px-6 py-4 w-32">{t('projects.code')}</th>
                            <th className="px-6 py-4">Nombre del Proyecto</th>
                            <th className="px-6 py-4 w-48 text-right">Presupuesto</th>
                            <th className="px-6 py-4 w-40 text-center">Estado</th>
                            <th className="px-6 py-4 w-64 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {projects?.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                    <Folder size={48} className="mx-auto mb-3 text-gray-300" />
                                    <p>{t('common.noData')}</p>
                                </td>
                            </tr>
                        ) : (
                            projects?.map((project: Project) => {
                                const status = getProjectStatus(project);
                                return (
                                    <tr key={project.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
                                                {project.code || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                    <Folder size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{project.name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{project._count?.budgets || 0} {t('projects.budgets')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {project.globalBudget ? (
                                                <span className="font-mono font-medium text-gray-900">
                                                    {new Intl.NumberFormat('es-GT', { style: 'currency', currency: project.currency || 'USD' }).format(project.globalBudget)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">Sin presupuesto</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/projects/${project.id}/plan`}
                                                    className="text-xs font-medium text-gray-700 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-md transition-all shadow-sm hover:shadow active:scale-95"
                                                >
                                                    Plan de Proyecto
                                                </Link>
                                                <Link
                                                    to={`/projects/${project.id}`}
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-all flex items-center gap-1 active:scale-95"
                                                >
                                                    Detalles Generales
                                                    <ArrowRight size={14} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Zod Validated Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-bold text-gray-800">{t('projects.newProject')}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><Plus size={24} className="rotate-45" /></button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.title')}</label>
                                <input
                                    type="text"
                                    {...register('name')}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'}`}
                                    placeholder="e.g. Torre Reforma"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.code')}</label>
                                <input
                                    type="text"
                                    {...register('code')}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${errors.code ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'}`}
                                    placeholder="e.g. TR-001"
                                />
                                <p className="text-xs text-gray-500 mt-1">Debe ser alfanumérico y único.</p>
                                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-bold shadow-md shadow-blue-200 transition-all hover:shadow-lg transform active:scale-95"
                                >
                                    {isSubmitting ? t('common.loading') : 'Crear Proyecto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
