import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, CheckCircle, Clock, PlayCircle, Camera, User } from 'lucide-react';
import { useState } from 'react';
import { DailyUpdateModal } from './DailyUpdateModal';
import { SprintClosureModal } from './SprintClosureModal';
import { DailyUpdateLogModal } from './DailyUpdateLogModal';
import { FileText } from 'lucide-react';

export const SprintBoard = ({ projectId }: { projectId: string }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const queryClient = useQueryClient();
    const [reportingItem, setReportingItem] = useState<{ id: string, title: string, backlogItemId: string } | null>(null);
    const [viewLogItem, setViewLogItem] = useState<{ id: string, title: string, backlogItemId: string } | null>(null);
    const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
    const [assigningItemId, setAssigningItemId] = useState<string | null>(null);

    const { data: sprints } = useQuery({
        queryKey: ['scrum', 'sprints', projectId],
        queryFn: async () => (await axios.get(`${API_URL}/scrum/sprints/${projectId}`)).data
    });

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: async () => (await axios.get(`${API_URL}/users`)).data
    });

    const activeSprint = sprints?.find((s: any) => s.status === 'ACTIVE');

    const assignMutation = useMutation({
        mutationFn: async ({ itemId, userId }: { itemId: string, userId: string }) => {
            return axios.patch(`${API_URL}/scrum/backlog/${itemId}/assign`, { userId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrum', 'sprints', projectId] });
            setAssigningItemId(null);
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ itemId, status }: { itemId: string, status: string }) => {
            return axios.patch(`${API_URL}/scrum/items/${itemId}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrum', 'sprints', projectId] });
        }
    });

    if (!activeSprint) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <AlertCircle size={48} className="mb-4 text-gray-300" />
                <h3 className="text-lg font-medium">No hay Sprint Activo</h3>
                <p>Ve a la pestaña de Planificación para iniciar uno.</p>
            </div>
        );
    }

    const columns = [
        { id: 'TODO', label: 'Por Hacer', icon: <Clock size={16} />, color: 'bg-gray-100 border-gray-200' },
        { id: 'IN_PROGRESS', label: 'En Progreso', icon: <PlayCircle size={16} />, color: 'bg-blue-50 border-blue-200' },
        { id: 'IN_REVIEW', label: 'Revisión / Validar', icon: <AlertCircle size={16} />, color: 'bg-yellow-50 border-yellow-200' },
        { id: 'DONE', label: 'Terminado', icon: <CheckCircle size={16} />, color: 'bg-green-50 border-green-200' }
    ];

    const getItems = (status: string) => activeSprint.items?.filter((i: any) => i.boardStatus === status) || [];

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
                <div>
                    <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                        {activeSprint.name}
                        <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Activo</span>
                    </h2>
                    <div className="text-sm text-gray-500 mt-1">
                        Objetivo: <span className="italic">{activeSprint.goal || 'Sin objetivo definido'}</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsClosureModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-colors text-sm"
                >
                    <CheckCircle size={16} />
                    Finalizar Sprint
                </button>
            </div>

            <div className="flex-1 grid grid-cols-4 gap-4 overflow-hidden min-h-0">
                {columns.map(col => (
                    <div key={col.id} className={`flex flex-col rounded-xl border ${col.color} h-full overflow-hidden`}>
                        <div className="p-3 border-b border-gray-200/50 bg-white/50 flex items-center justify-between backdrop-blur-sm">
                            <div className="flex items-center gap-2 font-bold text-gray-700 text-sm">
                                {col.icon}
                                {col.label}
                            </div>
                            <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold border border-gray-200 text-gray-500">
                                {getItems(col.id).length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {getItems(col.id).map((item: any) => (
                                <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-gray-400">{item.backlogItem.type}</span>
                                        {item.backlogItem.priority >= 4 && (
                                            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">Alta</span>
                                        )}
                                    </div>
                                    <p className="font-medium text-sm text-gray-800 mb-2">{item.backlogItem.title}</p>

                                    {item.backlogItem.contractor && (
                                        <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                            <span>🏗️</span> {item.backlogItem.contractor.name}
                                        </div>
                                    )}

                                    {/* Assignee */}
                                    <div className="mb-3 flex justify-end">
                                        <div className="relative group/assignee">
                                            {item.backlogItem.assigneeUserId ? (
                                                <div
                                                    className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-200 cursor-pointer"
                                                    title="Cambiar responsable"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAssigningItemId(item.backlogItem.id);
                                                    }}
                                                >
                                                    {users?.find((u: any) => u.id === item.backlogItem.assigneeUserId)?.name?.charAt(0) || <User size={12} />}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAssigningItemId(item.backlogItem.id);
                                                    }}
                                                    className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-200 border border-gray-200 border-dashed transition-colors"
                                                    title="Asignar responsable"
                                                >
                                                    <User size={12} />
                                                </button>
                                            )}

                                            {/* Dropdown for Assignment */}
                                            {assigningItemId === item.backlogItem.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-1">
                                                    <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1 border-b border-gray-100">Asignar a...</div>
                                                    <div className="max-h-40 overflow-y-auto">
                                                        {users?.map((u: any) => (
                                                            <div
                                                                key={u.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    assignMutation.mutate({ itemId: item.backlogItem.id, userId: u.id });
                                                                }}
                                                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 rounded cursor-pointer text-xs text-gray-700"
                                                            >
                                                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                                                                    {u.name?.charAt(0)}
                                                                </div>
                                                                <span className="truncate">{u.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAssigningItemId(null);
                                                        }}
                                                        className="w-full text-center text-[10px] text-gray-400 hover:text-gray-600 mt-1 py-1"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    <div className="pt-2 border-t border-gray-50">

                                        {(col.id === 'IN_PROGRESS' || col.id === 'IN_REVIEW') && (
                                            <div className="flex gap-1 mb-2">
                                                <button
                                                    onClick={() => setReportingItem({
                                                        id: item.id,
                                                        title: item.backlogItem.title,
                                                        backlogItemId: item.backlogItem.id
                                                    })}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded text-xs font-medium transition-colors border border-gray-200 border-dashed hover:border-solid hover:border-gray-300"
                                                >
                                                    <Camera size={12} />
                                                    Reportar
                                                </button>
                                                <button
                                                    onClick={() => setViewLogItem({
                                                        id: item.id,
                                                        title: item.backlogItem.title,
                                                        backlogItemId: item.backlogItem.id
                                                    })}
                                                    className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded text-xs transition-colors border border-gray-200 hover:border-gray-300"
                                                    title="Ver Bitácora"
                                                >
                                                    <FileText size={14} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Move Buttons */}
                                        <div className="flex justify-end opacity-100">
                                            {col.id !== 'TODO' && (
                                                <button
                                                    onClick={() => updateStatusMutation.mutate({
                                                        itemId: item.id,
                                                        status: col.id === 'DONE' ? 'IN_REVIEW' : (col.id === 'IN_REVIEW' ? 'IN_PROGRESS' : 'TODO')
                                                    })}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded mr-auto" title="Mover atrás"
                                                >
                                                    ←
                                                </button>
                                            )}
                                            {col.id !== 'DONE' && (
                                                <button
                                                    onClick={() => updateStatusMutation.mutate({
                                                        itemId: item.id,
                                                        status: col.id === 'TODO' ? 'IN_PROGRESS' : (col.id === 'IN_PROGRESS' ? 'IN_REVIEW' : 'DONE')
                                                    })}
                                                    className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded hover:bg-blue-100 transition-colors"
                                                >
                                                    {col.id === 'TODO' && 'Iniciar →'}
                                                    {col.id === 'IN_PROGRESS' && 'A Revisión →'}
                                                    {col.id === 'IN_REVIEW' && 'Terminar ✓'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {reportingItem && (
                <DailyUpdateModal
                    isOpen={!!reportingItem}
                    onClose={() => setReportingItem(null)}
                    projectId={projectId}
                    sprintId={activeSprint.id}
                    backlogItemId={reportingItem.backlogItemId}
                    backlogItemTitle={reportingItem.title}
                />
            )}

            {viewLogItem && (
                <DailyUpdateLogModal
                    isOpen={!!viewLogItem}
                    onClose={() => setViewLogItem(null)}
                    projectId={projectId}
                    backlogItemId={viewLogItem.backlogItemId}
                    backlogItemTitle={viewLogItem.title}
                />
            )}

            {isClosureModalOpen && (
                <SprintClosureModal
                    isOpen={isClosureModalOpen}
                    onClose={() => setIsClosureModalOpen(false)}
                    projectId={projectId}
                    sprintId={activeSprint.id}
                    sprintName={activeSprint.name}
                    completedCount={activeSprint.items?.filter((i: any) => i.boardStatus === 'DONE').length || 0}
                    totalCount={activeSprint.items?.length || 0}
                />
            )}
        </div>
    );
};
