import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Filter, ArrowRight, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BacklogItem {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: number;
    type: string;
    contractor?: { name: string };

    dueDate?: string;
    isVirtual?: boolean;
    linkedWbsActivityId?: string;
}

export const BacklogView = ({ projectId }: { projectId: string }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const queryClient = useQueryClient();

    const { data: backlogItems, isLoading } = useQuery({
        queryKey: ['scrum', 'backlog', projectId],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/scrum/backlog/${projectId}`);
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (newItem: any) => {
            return axios.post(`${API_URL}/scrum/backlog`, { ...newItem, projectId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrum', 'backlog', projectId] });
            setIsCreateModalOpen(false);
        }
    });

    const importMutation = useMutation({
        mutationFn: async (activityId: string) => {
            return axios.post(`${API_URL}/scrum/backlog/convert`, { activityId, projectId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrum', 'backlog', projectId] });
        }
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando backlog...</div>;

    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardList className="text-blue-600" size={20} />
                        Product Backlog
                    </h2>
                    <p className="text-xs text-gray-500">
                        {backlogItems?.length || 0} ítems ({(backlogItems?.filter((i: any) => i.isVirtual)?.length || 0)} sugeridos del cronograma)
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">
                        <Filter size={14} /> Filtros
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={16} /> Crear Ítem
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {backlogItems?.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <p>No hay ítems en el backlog.</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-2 text-blue-600 hover:underline text-sm font-medium"
                        >
                            Crear el primero
                        </button>
                    </div>
                ) : (
                    backlogItems?.map((item: BacklogItem) => (
                        <div key={item.id} className={`p-4 border rounded-lg hover:shadow-md transition-shadow group relative ${item.isVirtual ? 'bg-slate-50 border-slate-200 border-dashed' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 w-2 h-2 rounded-full ${item.isVirtual ? 'bg-slate-400' :
                                        item.status === 'READY' ? 'bg-green-500' : 'bg-gray-300'
                                        }`} />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${item.isVirtual ? 'bg-slate-200 text-slate-600' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {item.type}
                                            </span>
                                            <h3 className={`font-medium ${item.isVirtual ? 'text-slate-700 italic' : 'text-gray-900'}`}>{item.title}</h3>
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                            {item.isVirtual && (
                                                <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">
                                                    Sugerido del Cronograma
                                                </span>
                                            )}
                                            {item.contractor && (
                                                <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                                                    🏢 {item.contractor.name}
                                                </span>
                                            )}
                                            {item.dueDate && (
                                                <span className="flex items-center gap-1">
                                                    📅 {format(new Date(item.dueDate), 'd MMM', { locale: es })}
                                                </span>
                                            )}
                                            {!item.isVirtual && (
                                                <span className={`priority-badge ${item.priority >= 4 ? 'text-red-600 font-bold' : ''}`}>
                                                    Prioridad: {item.priority}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.isVirtual ? (
                                        <button
                                            onClick={() => importMutation.mutate(item.linkedWbsActivityId!)}
                                            disabled={importMutation.isPending}
                                            className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-md hover:bg-blue-200 transition-colors"
                                        >
                                            {importMutation.isPending ? '...' : 'Añadir al Backlog'}
                                        </button>
                                    ) : (
                                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                                            <ArrowRight size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Component Mock */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">Nuevo Ítem de Backlog</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target as HTMLFormElement);
                                createMutation.mutate({
                                    title: formData.get('title'),
                                    type: formData.get('type'),
                                    priority: Number(formData.get('priority')),
                                    status: 'BACKLOG'
                                });
                            }}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                        <input name="title" required className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Instalar luminarias Z-2" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                            <select name="type" className="w-full px-3 py-2 border rounded-md">
                                                <option value="TASK">Tarea</option>
                                                <option value="BUG">Problema (Punch List)</option>
                                                <option value="STORY">Historia</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                                            <select name="priority" className="w-full px-3 py-2 border rounded-md">
                                                <option value="3">Media (3)</option>
                                                <option value="5">Alta (5)</option>
                                                <option value="1">Baja (1)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={createMutation.isPending} className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors">
                                        {createMutation.isPending ? 'Guardando...' : 'Guardar Ítem'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
