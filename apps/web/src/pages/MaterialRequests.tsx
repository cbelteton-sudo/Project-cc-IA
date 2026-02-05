import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Validaton Schema
const createRequestSchema = z.object({
    projectId: z.string().min(1, 'Project is required'),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    itemsText: z.string().refine((val) => {
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) && parsed.length > 0;
        } catch {
            return false;
        }
    }, 'Must be a valid JSON array with at least one item'),
});

type CreateRequestForm = z.infer<typeof createRequestSchema>;

export const MaterialRequests = () => {
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
    } = useForm<CreateRequestForm>({
        resolver: zodResolver(createRequestSchema),
        defaultValues: {
            projectId: '',
            title: '',
            itemsText: '[{"materialId": "desc", "quantity": 1}]'
        }
    });

    // Fetch Requests
    const { data: requests, isLoading } = useQuery({
        queryKey: ['material-requests'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/material-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token
    });

    // Fetch Projects for dropdown
    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/projects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token
    });

    const createMutation = useMutation({
        mutationFn: async (data: CreateRequestForm) => {
            const items = JSON.parse(data.itemsText);
            return axios.post('http://localhost:4180/material-requests', {
                projectId: data.projectId,
                title: data.title,
                items
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['material-requests'] });
            setIsModalOpen(false);
            reset();
            toast.success(t('common.save'));
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || t('common.error'));
        }
    });

    const onSubmit = (data: CreateRequestForm) => {
        createMutation.mutate(data);
    };

    if (isLoading) return <div className="p-8">{t('common.loading')}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('requests.title')}</h2>
                <button
                    onClick={() => { reset(); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    {t('requests.newRequest')}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">{t('requests.table.title')}</th>
                            <th className="px-6 py-3">{t('requests.table.project')}</th>
                            <th className="px-6 py-3">{t('requests.table.status')}</th>
                            <th className="px-6 py-3">{t('requests.table.date')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests?.map((req: any) => (
                            <tr key={req.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-sm font-medium text-gray-900">{req.title}</td>
                                <td className="px-6 py-3 text-sm text-gray-600">{req.project?.name}</td>
                                <td className="px-6 py-3">
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-500">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {requests?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">{t('requests.noRequests')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Zod Validated Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{t('requests.newRequest')}</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('requests.table.project')}</label>
                                <select
                                    {...register('projectId')}
                                    className={`w-full border rounded px-3 py-2 ${errors.projectId ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Select Project</option>
                                    {projects?.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                {errors.projectId && <p className="text-xs text-red-500 mt-1">{errors.projectId.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('requests.table.title')}</label>
                                <input
                                    {...register('title')}
                                    className={`w-full border rounded px-3 py-2 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Items (JSON Array)</label>
                                <textarea
                                    {...register('itemsText')}
                                    className={`w-full border rounded px-3 py-2 text-sm font-mono h-24 ${errors.itemsText ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.itemsText && <p className="text-xs text-red-500 mt-1">{errors.itemsText.message}</p>}
                                <p className="text-xs text-gray-500 mt-1">Format: {`[{"materialId": "string", "quantity": 10}]`}</p>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">{t('common.cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
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
