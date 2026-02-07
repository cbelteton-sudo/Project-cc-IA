import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, Save, Calendar, DollarSign } from 'lucide-react';

interface ProjectSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    token: string;
}

interface SettingsForm {
    startDate: string;
    endDate: string;
    globalBudget: number;
    currency: string;
}

export const ProjectSettingsModal = ({ isOpen, onClose, project, token }: ProjectSettingsModalProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm<SettingsForm>();

    useEffect(() => {
        if (project) {
            reset({
                startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
                endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
                globalBudget: project.globalBudget || 0,
                currency: project.currency || 'USD'
            });
        }
    }, [project, reset, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: SettingsForm) => {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
            return axios.patch(`${API_URL}/projects/${project.id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            toast.success(t('common.saved_success', 'Configuración guardada'));
            queryClient.invalidateQueries({ queryKey: ['project', project.id] });
            onClose();
        },
        onError: () => {
            toast.error(t('common.error_generic', 'Error al guardar'));
        }
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
                            <Calendar size={12} /> Fechas Generales
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Inicio Proyecto</label>
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
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign size={12} /> Presupuesto
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Presupuesto Global</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                                    <input
                                        type="number"
                                        {...register('globalBudget')}
                                        className="w-full pl-7 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                                    <option value="USD">USD ($)</option>
                                    <option value="GTQ">GTQ (Q)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="MXN">MXN ($)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2"
                        >
                            {mutation.isPending ? 'Guardando...' : (
                                <>
                                    <Save size={16} />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
