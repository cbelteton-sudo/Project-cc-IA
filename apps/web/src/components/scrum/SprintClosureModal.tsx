import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { X, CheckCircle, AlertTriangle, Play } from 'lucide-react';

interface SprintClosureModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    sprintId: string;
    sprintName: string;
    completedCount: number;
    totalCount: number;
}

export const SprintClosureModal = ({
    isOpen,
    onClose,
    projectId,
    sprintId,
    sprintName,
    completedCount,
    totalCount
}: SprintClosureModalProps) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const queryClient = useQueryClient();

    const [keep, setKeep] = useState('');
    const [improve, setImprove] = useState('');
    const [stop, setStop] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const closeMutation = useMutation({
        mutationFn: async () => {
            return axios.patch(`${API_URL}/scrum/sprints/${sprintId}/close`, {
                keep,
                improve,
                stop
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrum', 'sprints', projectId] });
            // Ideally trigger toast
            onClose();
        }
    });

    if (!isOpen) return null;

    const completionPercentage = Math.round((completedCount / totalCount) * 100) || 0;
    const pendingCount = totalCount - completedCount;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 bg-indigo-50 flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-xl text-indigo-900">Sprint Review: {sprintName}</h3>
                        <p className="text-sm text-indigo-600 mt-1">Cierra el ciclo y documenta aprendizajes.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-indigo-100 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    {/* Metrics Summary */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-green-600 mb-1">{completedCount}</div>
                            <div className="text-xs font-bold text-green-700 uppercase tracking-wide">Completados</div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-amber-600 mb-1">{pendingCount}</div>
                            <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">Pendientes</div>
                            <div className="text-[10px] text-amber-600 mt-1">(Vuelven al Backlog)</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-100/30" style={{ width: `${completionPercentage}%` }}></div>
                            <div className="text-3xl font-bold text-blue-600 mb-1 relative">{completionPercentage}%</div>
                            <div className="text-xs font-bold text-blue-700 uppercase tracking-wide relative">Eficiencia</div>
                        </div>
                    </div>

                    {/* Retrospective Form */}
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Play size={18} className="text-indigo-600" /> Retrospectiva
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span> Qué mantener
                            </label>
                            <textarea
                                value={keep}
                                onChange={(e) => setKeep(e.target.value)}
                                className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-green-50/20"
                                placeholder="Lo que funcionó bien..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Qué mejorar
                            </label>
                            <textarea
                                value={improve}
                                onChange={(e) => setImprove(e.target.value)}
                                className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none bg-yellow-50/20"
                                placeholder="Problemas o bloqueos..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Qué dejar
                            </label>
                            <textarea
                                value={stop}
                                onChange={(e) => setStop(e.target.value)}
                                className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none bg-red-50/20"
                                placeholder="Prácticas que no ayudan..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 items-center">
                    <p className="text-xs text-gray-400 mr-auto italic">
                        Al cerrar, los ítems pendientes volverán al Backlog con alta prioridad.
                    </p>
                    <button
                        onClick={onClose}
                        disabled={closeMutation.isPending}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => closeMutation.mutate()}
                        disabled={closeMutation.isPending}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-200 disabled:opacity-50"
                    >
                        {closeMutation.isPending ? 'Cerrando...' : 'Cerrar Sprint'}
                    </button>
                </div>
            </div>
        </div>
    );
};
