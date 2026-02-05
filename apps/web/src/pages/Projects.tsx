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
    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/projects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token,
    });

    // Create Project Mutation
    const createMutation = useMutation({
        mutationFn: async (data: CreateProjectForm) => {
            return axios.post('http://localhost:4180/projects', {
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

    if (isLoading) return <div className="p-8">{t('common.loading')}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('projects.title')}</h2>
                <button
                    onClick={() => { reset(); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    {t('projects.newProject')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects?.map((project: Project) => (
                    <div key={project.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <Folder size={24} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {project.status === 'ACTIVE' ? t('projects.active') : project.status}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1">{project.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{t('projects.code')}: {project.code || 'N/A'}</p>

                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                            <span>{project._count?.budgets || 0} {t('projects.budgets')}</span>
                            <div className="flex gap-3">
                                <Link to={`/projects/${project.id}/plan`} className="flex items-center text-gray-600 hover:text-gray-900 font-medium bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 transition">
                                    Plan de Proyecto
                                </Link>
                                <Link to={`/projects/${project.id}`} className="flex items-center text-blue-600 hover:underline font-medium">
                                    {t('projects.open')} <ArrowRight size={16} className="ml-1" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {projects?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        {t('common.noData')}
                    </div>
                )}
            </div>

            {/* Zod Validated Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{t('projects.newProject')}</h3>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.title')}</label>
                                <input
                                    type="text"
                                    {...register('name')}
                                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g. Torre Reforma"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.code')}</label>
                                <input
                                    type="text"
                                    {...register('code')}
                                    className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g. TR-001"
                                />
                                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? t('common.loading') : t('common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
