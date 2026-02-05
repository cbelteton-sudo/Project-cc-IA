import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Upload, Loader, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Zod Schema
const createInvoiceSchema = z.object({
    projectId: z.string().min(1, 'Project is required'),
    vendor: z.string().min(1, 'Vendor is required'),
    total: z.string().min(1, 'Total is required').refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Must be a valid positive amount'),
    currency: z.string().default('USD'),
    simulatedFile: z.string().min(1, 'File is required (simulate upload)'),
});

type CreateInvoiceForm = z.infer<typeof createInvoiceSchema>;

export const Invoices = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { t } = useTranslation();

    // Form Hooks
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<CreateInvoiceForm>({
        resolver: zodResolver(createInvoiceSchema) as any, // Temporary cast to fix strictly typed resolver mismatch
        defaultValues: {
            projectId: '',
            vendor: '',
            total: '',
            currency: 'USD',
            simulatedFile: ''
        }
    });

    const simulatedFile = watch('simulatedFile');

    // Fetch Projects for dropdown
    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/projects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        }
    });

    // Fetch Invoices
    const { data: invoices, isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/invoices', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        }
    });

    const createInvoiceMutation = useMutation({
        mutationFn: async (data: CreateInvoiceForm) => {
            return axios.post('http://localhost:4180/invoices', {
                ...data,
                invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
                total: parseFloat(data.total),
                date: new Date().toISOString(),
                fileUrl: data.simulatedFile
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setIsUploadModalOpen(false);
            reset();
            toast.success('Invoice uploaded and processed successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to process invoice');
        }
    });

    const handleSimulatedUpload = () => {
        // Simulate picking a file that triggers OCR
        setValue("simulatedFile", "https://example.com/invoice_scan_001.pdf");
        // Auto-fill some data to simulate OCR extraction (Mock)
        setValue("vendor", "Materiales Express SA");
        setValue("total", "15400.50");
        toast.info(t('invoices.mockTriggered'));
    };

    const onSubmit = (data: CreateInvoiceForm) => {
        createInvoiceMutation.mutate(data);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{t('invoices.title')}</h1>
                    <p className="text-gray-500">{t('invoices.subtitle')}</p>
                </div>
                <button
                    onClick={() => { reset(); setIsUploadModalOpen(true); }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition shadow-lg"
                >
                    <Upload size={20} />
                    {t('invoices.upload')}
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader className="animate-spin text-purple-600" size={48} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {invoices?.map((inv: any) => {
                        // Helper for status badge class
                        let statusClass = "bg-yellow-100 text-yellow-700";
                        if (inv.status === 'APPROVED') statusClass = "bg-green-100 text-green-700";
                        if (inv.status === 'PAID') statusClass = "bg-blue-100 text-blue-700";

                        return (
                            <div key={inv.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{inv.vendor}</h3>
                                            <p className="text-xs text-gray-500">{inv.invoiceNumber}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass}`}>
                                        {inv.status}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">{t('orders.table.project')}</span>
                                        <span className="font-medium text-gray-700 truncate max-w-[150px]">
                                            {inv.project?.name || 'Unknown Project'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">{t('common.date')}</span>
                                        <span className="text-gray-700">
                                            {inv.date ? new Date(inv.date).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-gray-500">{t('orders.table.total')}</span>
                                        <span className="font-bold text-lg text-gray-900">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency }).format(inv.total)}
                                        </span>
                                    </div>
                                </div>

                                {/* OCR Data Preview Block */}
                                {inv.ocrData && (
                                    <div className="bg-gray-50 p-3 rounded text-xs border border-gray-200 mt-2">
                                        <div className="flex items-center gap-1 mb-1 text-green-600 font-semibold">
                                            <CheckCircle size={12} />
                                            <span>{t('invoices.ocrExtracted')}</span>
                                        </div>
                                        <p className="text-gray-500 truncate">{inv.ocrData}</p>
                                    </div>
                                )}

                                {/* Actions (Mock) */}
                                <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                                    <button className="flex-1 text-sm bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200">
                                        {t('invoices.viewPDF')}
                                    </button>
                                    {inv.status === 'PENDING' && (
                                        <button className="flex-1 text-sm bg-green-600 text-white py-2 rounded hover:bg-green-700">
                                            {t('invoices.approve')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {invoices?.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <div className="inline-block p-4 bg-white rounded-full shadow-sm mb-3">
                                <Upload className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">{t('invoices.noInvoices')}</h3>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Upload className="text-purple-600" />
                            {t('invoices.upload')} (Simulated)
                        </h2>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('orders.table.project')}</label>
                                <select
                                    {...register('projectId')}
                                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${errors.projectId ? 'border-red-500' : ''}`}
                                >
                                    <option value="">Select Project...</option>
                                    {projects?.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                    ))}
                                </select>
                                {errors.projectId && <p className="text-xs text-red-500 mt-1">{errors.projectId.message}</p>}
                            </div>

                            {/* Dropzone Simulation */}
                            <div
                                onClick={handleSimulatedUpload}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${simulatedFile ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-purple-500 hover:bg-purple-50"
                                    }`}
                            >
                                {simulatedFile ? (
                                    <div>
                                        <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
                                        <p className="text-green-700 font-medium">{t('invoices.fileSelected')}: invoice_scan.pdf</p>
                                        <p className="text-xs text-green-600 mt-1">{t('invoices.mockTriggered')}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                                        <p className="text-gray-600 font-medium">{t('invoices.dragDrop')}</p>
                                        <p className="text-xs text-gray-400 mt-1">Accepts PDF, JPG, PNG</p>
                                    </div>
                                )}
                                {errors.simulatedFile && <p className="text-xs text-red-500 mt-2 font-semibold">File upload is required</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('orders.table.vendor')} (OCR)</label>
                                    <input
                                        type="text"
                                        {...register('vendor')}
                                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 ${errors.vendor ? 'border-red-500' : ''}`}
                                        placeholder="Auto-detected..."
                                    />
                                    {errors.vendor && <p className="text-xs text-red-500 mt-1">{errors.vendor.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('orders.table.total')} (OCR)</label>
                                    <div className="flex gap-2">
                                        <select
                                            {...register('currency')}
                                            className="border border-gray-300 rounded-lg px-2 bg-gray-50"
                                        >
                                            <option value="USD">USD</option>
                                            <option value="GTQ">GTQ</option>
                                            <option value="MXN">MXN</option>
                                        </select>
                                        <input
                                            type="number"
                                            {...register('total')}
                                            className={`w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 ${errors.total ? 'border-red-500' : ''}`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.total && <p className="text-xs text-red-500 mt-1">{errors.total.message}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? t('invoices.processing') : t('invoices.uploadAndProcess')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
