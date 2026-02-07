import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, FileDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useRegion } from '../context/RegionContext';
import { generatePurchaseOrderPDF } from '../utils/pdf/generatePurchaseOrder';

// Validation Schema
const createPOSchema = z.object({
    projectId: z.string().min(1, 'Project is required'),
    vendor: z.string().min(3, 'Vendor name must be at least 3 characters'),
    itemsText: z.string().refine((val) => {
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) && parsed.length > 0;
        } catch {
            return false;
        }
    }, 'Must be a valid JSON array with at least one item'),
});

type CreatePOForm = z.infer<typeof createPOSchema>;

export const PurchaseOrders = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t } = useTranslation();
    const { formatCurrency, currency } = useRegion();

    // Form Hooks
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<CreatePOForm>({
        resolver: zodResolver(createPOSchema),
        defaultValues: {
            projectId: '',
            vendor: '',
            itemsText: '[{"description": "Cement", "quantity": 10, "unitPrice": 150}]'
        }
    });

    // Fetch POs
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const { data: pos, isLoading } = useQuery({
        queryKey: ['purchase-orders'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/purchase-orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token
    });

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
        mutationFn: async (data: CreatePOForm) => {
            const items = JSON.parse(data.itemsText);
            return axios.post(`${API_URL}/purchase-orders`, {
                projectId: data.projectId,
                vendor: data.vendor,
                items
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            setIsModalOpen(false);
            reset();
            toast.success(t('common.save'));
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || t('common.error'));
        }
    });

    const onSubmit = (data: CreatePOForm) => {
        createMutation.mutate(data);
    };

    if (isLoading) return <div className="p-8">{t('common.loading')}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('orders.title')}</h2>
                <button
                    onClick={() => { reset(); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    {t('orders.createPO')}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">{t('orders.table.vendor')}</th>
                            <th className="px-6 py-3">{t('orders.table.project')}</th>
                            <th className="px-6 py-3">{t('orders.table.total')}</th>
                            <th className="px-6 py-3">{t('orders.table.status')}</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {pos?.map((po: any) => (
                            <tr key={po.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-sm font-medium text-gray-900">{po.vendor}</td>
                                <td className="px-6 py-3 text-sm text-gray-600">{po.project?.name}</td>
                                <td className="px-6 py-3 text-sm font-medium">
                                    {formatCurrency(po.total)}
                                </td>
                                <td className="px-6 py-3">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                        {po.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button
                                        onClick={() => {
                                            generatePurchaseOrderPDF({
                                                ...po,
                                                project: po.project?.name || 'Project',
                                                date: new Date(po.createdAt).toLocaleDateString(),
                                                items: po.items || [],
                                                currency: currency,
                                            });
                                        }}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition"
                                    >
                                        <FileDown size={14} />
                                        PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {pos?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">{t('orders.noOrders')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Zod Validated Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">{t('orders.createPO')}</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('orders.table.project')}</label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('orders.table.vendor')}</label>
                                <input
                                    {...register('vendor')}
                                    className={`w-full border rounded px-3 py-2 ${errors.vendor ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.vendor && <p className="text-xs text-red-500 mt-1">{errors.vendor.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Items (JSON Array)</label>
                                <textarea
                                    {...register('itemsText')}
                                    className={`w-full border rounded px-3 py-2 text-sm font-mono h-24 ${errors.itemsText ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.itemsText && <p className="text-xs text-red-500 mt-1">{errors.itemsText.message}</p>}
                                <p className="text-xs text-gray-500 mt-1">
                                    Format: {`[{"description": "Item", "quantity": 1, "unitPrice": 100}]`}
                                </p>
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
