import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Impediment {
    id: string;
    title: string;
    description?: string;
    severity: number;
    status: string;
    ownerUser?: { name: string };
    createdAt: string;
    resolvedAt?: string;
}

export const ImpedimentTracker = ({ projectId }: { projectId: string }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: impediments, isLoading } = useQuery({
        queryKey: ['scrum', 'impediments', projectId],
        queryFn: async () => (await axios.get(`${API_URL}/scrum/impediments/${projectId}`)).data
    });

    const resolveMutation = useMutation({
        mutationFn: async (id: string) => axios.patch(`${API_URL}/scrum/impediments/${id}/resolve`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scrum', 'impediments', projectId] })
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => axios.post(`${API_URL}/scrum/impediments`, { ...data, projectId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrum', 'impediments', projectId] });
            setIsCreateOpen(false);
        }
    });

    if (isLoading) return <div className="p-8 text-center text-gray-400">Cargando impedimentos...</div>;

    const activeImpediments = impediments?.filter((i: Impediment) => i.status !== 'RESOLVED') || [];
    const resolvedImpediments = impediments?.filter((i: Impediment) => i.status === 'RESOLVED') || [];

    return (
        <div className="h-full flex gap-4">
            {/* Active List */}
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-rose-100 bg-rose-50 flex justify-between items-center">
                    <h3 className="font-bold text-rose-800 flex items-center gap-2">
                        <AlertTriangle size={18} /> Activos
                    </h3>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-rose-600 text-white px-3 py-1 text-sm rounded hover:bg-rose-700 transition"
                    >
                        + Reportar
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeImpediments.length === 0 ? (
                        <p className="text-center text-gray-400 italic py-10">No hay impedimentos activos. ¡Buen trabajo!</p>
                    ) : (
                        activeImpediments.map((imp: Impediment) => (
                            <div key={imp.id} className="p-4 border border-rose-200 bg-red-50/30 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-800">{imp.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{imp.description}</p>
                                        <div className="flex gap-4 mt-3 text-xs text-gray-500">
                                            <span>📅 {format(new Date(imp.createdAt), 'd MMM', { locale: es })}</span>
                                            {imp.ownerUser && <span>👤 Resp: {imp.ownerUser.name}</span>}
                                            <span className={`font-bold ${imp.severity > 2 ? 'text-red-600' : 'text-orange-500'}`}>
                                                Severidad: {imp.severity}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => resolveMutation.mutate(imp.id)}
                                        className="text-green-600 hover:text-green-700 font-medium text-sm border border-green-200 rounded px-2 py-1 bg-white"
                                    >
                                        Resolver
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Resolved List */}
            <div className="w-1/3 flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden opacity-80">
                <div className="p-4 border-b border-gray-200 bg-gray-100">
                    <h3 className="font-bold text-gray-600 flex items-center gap-2">
                        <CheckCircle size={18} /> Resueltos
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {resolvedImpediments.map((imp: Impediment) => (
                        <div key={imp.id} className="p-3 border border-gray-200 bg-white rounded-lg opacity-70">
                            <h4 className="font-medium text-gray-500 strike-through line-through">{imp.title}</h4>
                            <p className="text-xs text-green-600 mt-1">Resuelto el {format(new Date(imp.resolvedAt!), 'd MMM', { locale: es })}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">Reportar Impedimento</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            createMutation.mutate({
                                title: formData.get('title'),
                                description: formData.get('description'),
                                severity: Number(formData.get('severity')),
                                status: 'OPEN'
                            });
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                    <input name="title" required className="w-full px-3 py-2 border rounded-md" placeholder="Ej: Falta de material en zona norte" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                    <textarea name="description" className="w-full px-3 py-2 border rounded-md" rows={3} placeholder="Detalles del bloqueo..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Severidad</label>
                                    <select name="severity" className="w-full px-3 py-2 border rounded-md">
                                        <option value="2">Media (2)</option>
                                        <option value="3">Alta (3)</option>
                                        <option value="4">Crítica (4)</option>
                                        <option value="1">Baja (1)</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700">Reportar</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
