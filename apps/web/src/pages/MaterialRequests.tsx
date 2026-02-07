import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Package } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { MaterialSelector } from '../components/materials/MaterialSelector';

// Validation Schema
const createRequestSchema = z.object({
    projectId: z.string().min(1, 'Project is required'),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    items: z.array(z.object({
        materialId: z.string(),
        name: z.string(), // Added for display, not sent to backend if not needed, but useful for UI state
        unit: z.string(),
        quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    })).min(1, 'Must have at least one item'),
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
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<CreateRequestForm>({
        resolver: zodResolver(createRequestSchema),
        defaultValues: {
            projectId: '',
            title: '',
            items: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items'
    });

    // Fetch Requests
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const { data: requests, isLoading } = useQuery({
        queryKey: ['material-requests'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/material-requests`, {
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
            const res = await axios.get(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token
    });

    const createMutation = useMutation({
        mutationFn: async (data: CreateRequestForm) => {
            // Clean payload to match backend expectation
            const itemsPayload = data.items.map(i => ({
                materialId: i.materialId,
                quantity: i.quantity
            }));


            return axios.post(`${API_URL}/material-requests`, {
                projectId: data.projectId,
                title: data.title,
                items: itemsPayload
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

            {/* Improved User-Friendly Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-2xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">{t('requests.newRequest')}</h3>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('requests.table.project')}</label>
                                    <select
                                        {...register('projectId')}
                                        className={`w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-500 ${errors.projectId ? 'border-red-500' : 'border-gray-200'}`}
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
                                        placeholder="e.g. Material para Cimentación"
                                        className={`w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                                </div>
                            </div>

                            {/* Dynamic Items Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Materiales Requeridos</label>

                                <div className="space-y-3 mb-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 group animate-slide-in-right">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                                                <Package size={18} />
                                            </div>

                                            <div className="flex-1">
                                                <div className="font-medium text-sm text-gray-900">{field.name}</div>
                                                <div className="text-xs text-gray-500">{field.unit}</div>
                                            </div>

                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="Qty"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}

                                    {fields.length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                                            <p className="text-sm text-gray-500">No hay materiales agregados.</p>
                                            <p className="text-xs text-gray-400">Usa el buscador abajo para agregar ítems.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Agregar Material</label>
                                    <MaterialSelector onSelect={(material) => {
                                        // Check if already exists
                                        const exists = fields.some(f => f.materialId === material.id);
                                        if (exists) {
                                            toast.error('Este material ya está en la lista');
                                            return;
                                        }
                                        append({
                                            materialId: material.id,
                                            name: material.name,
                                            unit: material.unit,
                                            quantity: 1
                                        });
                                    }} />
                                    {errors.items && <p className="text-xs text-red-500 mt-1">{errors.items.message}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">{t('common.cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium transition-colors disabled:opacity-50">
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
