import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ScrumKPIs = ({ projectId }: { projectId: string }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

    const { data: sprints, isLoading } = useQuery({
        queryKey: ['scrum', 'sprints', projectId],
        queryFn: async () => (await axios.get(`${API_URL}/scrum/sprints/${projectId}`)).data
    });

    if (isLoading) return <div className="p-8 text-center text-gray-400">Cargando métricas...</div>;

    // Calculate Velocity (Story Points or Count of completed items per closed sprint)
    const velocityData = sprints?.filter((s: any) => s.status === 'CLOSED').map((s: any) => {
        // Assuming we count items as velocity for now (since we don't strictly use points yet)
        // Or we can try to find priority as a proxy for points if needed.
        // Let's use item count for MVP.
        const completedCount = s.items?.filter((i: any) => i.boardStatus === 'DONE').length || 0;
        return {
            name: s.name,
            completados: completedCount
        };
    }).reverse() || [];

    // Calculate Current Sprint Completion Rate
    const activeSprint = sprints?.find((s: any) => s.status === 'ACTIVE');
    const activeTotal = activeSprint?.items?.length || 0;
    const activeDone = activeSprint?.items?.filter((i: any) => i.boardStatus === 'DONE')?.length || 0;
    const completionRate = activeTotal > 0 ? Math.round((activeDone / activeTotal) * 100) : 0;

    return (
        <div className="h-full overflow-y-auto space-y-6 p-2 pb-10">

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Sprint Actual</p>
                        <h3 className="text-2xl font-bold text-gray-800">{activeSprint ? activeSprint.name : 'N/A'}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <Clock size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Tasa de Cumplimiento</p>
                        <h3 className="text-2xl font-bold text-gray-800">{completionRate}%</h3>
                        <p className="text-xs text-gray-400">{activeDone}/{activeTotal} ítems</p>
                    </div>
                    <div className={`p-3 rounded-full ${completionRate > 80 ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                        <CheckCircle size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Velocidad Promedio</p>
                        <h3 className="text-2xl font-bold text-gray-800">
                            {velocityData.length > 0
                                ? Math.round(velocityData.reduce((acc: number, curr: any) => acc + curr.completados, 0) / velocityData.length)
                                : 0} <span className="text-sm font-normal text-gray-400">ítems/sprint</span>
                        </h3>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                        <TrendingUp size={24} />
                    </div>
                </div>
            </div>

            {/* Velocity Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-6">Velocidad Histórica</h3>
                <div className="h-[300px] w-full">
                    {velocityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={velocityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="completados" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 italic">
                            No hay suficientes datos de sprints cerrados aún.
                        </div>
                    )}
                </div>
            </div>

            {/* Retrospectives List */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-lg">Retrospectivas Recientes</h3>
                {sprints?.filter((s: any) => s.status === 'CLOSED' && s.retros && s.retros.length > 0).map((sprint: any) => (
                    <div key={sprint.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100">
                            <h4 className="font-bold text-indigo-900">{sprint.name} - Retrospectiva</h4>
                        </div>
                        <div className="p-6">
                            {sprint.retros.map((retro: any) => (
                                <div key={retro.id} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-green-700 uppercase tracking-wide">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Qué mantener
                                        </div>
                                        <div className="bg-green-50 p-3 rounded-lg text-sm text-gray-700 min-h-[80px] whitespace-pre-wrap border border-green-100">
                                            {retro.keep || <span className="text-gray-400 italic">Nada registrado</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-amber-700 uppercase tracking-wide">
                                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Qué mejorar
                                        </div>
                                        <div className="bg-amber-50 p-3 rounded-lg text-sm text-gray-700 min-h-[80px] whitespace-pre-wrap border border-amber-100">
                                            {retro.improve || <span className="text-gray-400 italic">Nada registrado</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-red-700 uppercase tracking-wide">
                                            <span className="w-2 h-2 bg-red-500 rounded-full"></span> Qué dejar
                                        </div>
                                        <div className="bg-red-50 p-3 rounded-lg text-sm text-gray-700 min-h-[80px] whitespace-pre-wrap border border-red-100">
                                            {retro.stop || <span className="text-gray-400 italic">Nada registrado</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {(!sprints || sprints.filter((s: any) => s.status === 'CLOSED' && s.retros?.length > 0).length === 0) && (
                    <div className="text-center py-10 bg-white rounded-xl border border-gray-200 border-dashed text-gray-400">
                        No hay retrospectivas registradas aún.
                    </div>
                )}
            </div>

            {/* Finished Tasks by Sprint */}
            <div className="space-y-4 pt-2 border-t border-gray-200">
                <h3 className="font-bold text-gray-800 text-lg">Historial de Tareas Terminadas</h3>
                {sprints?.map((sprint: any) => {
                    const doneItems = sprint.items?.filter((i: any) => i.boardStatus === 'DONE') || [];
                    if (doneItems.length === 0) return null;

                    return (
                        <div key={sprint.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-gray-800">{sprint.name}</h4>
                                    <p className="text-xs text-gray-500">
                                        {sprint.startDate && new Date(sprint.startDate).toLocaleDateString()} - {sprint.endDate && new Date(sprint.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                    {doneItems.length} terminadas
                                </span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {doneItems.map((item: any) => (
                                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-green-50 text-green-600 rounded-full">
                                                <CheckCircle size={16} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{item.backlogItem.title}</p>
                                                <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                                                    <span className="uppercase tracking-wider text-[10px] font-bold bg-gray-100 px-1 rounded">{item.backlogItem.type}</span>
                                                    {item.backlogItem.contractor && (
                                                        <span className="flex items-center gap-1">
                                                            <span>•</span>
                                                            <span>{item.backlogItem.contractor.name}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
