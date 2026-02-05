import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// Components
import { ActivitiesTree } from '../components/project-plan/ActivitiesTree';
import type { Activity } from '../components/project-plan/ActivitiesTree';
import { ActivityDetails } from '../components/project-plan/ActivityDetails';

export const ProjectPlan = () => {
    const { id: projectId } = useParams();
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'schedule' | 'milestones'>('schedule');
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateMilestoneModalOpen, setIsCreateMilestoneModalOpen] = useState(false);

    // Milestones Query
    const { data: milestones, refetch: refetchMilestones } = useQuery({
        queryKey: ['milestones', projectId],
        queryFn: async () => {
            const res = await axios.get(`http://localhost:4180/projects/${projectId}/milestones`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: activeTab === 'milestones'
    });

    // Create Milestone Mutation
    const createMilestoneMutation = useMutation({
        mutationFn: async (data: any) => {
            return axios.post(`http://localhost:4180/projects/${projectId}/milestones`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            refetchMilestones();
            setIsCreateMilestoneModalOpen(false);
            toast.success('Hito creado');
        },
        onError: () => toast.error('Error al crear hito')
    });

    // ...
    // ... (UseQuery logic for projects and activities stays here but omitted in this specific replacement block for brevity if not overlapping, but I must match exact target content so I will include context)
    // Actually, I should target the state declaration and the button specifically.

    // Let's split this into two simpler Replacements or one large one.
    // I will replace the top state section to add the new state variable
    // And I will replace the button section to update the onClick.

    // WAITING: I'll use the proper tool calling pattern. I will do this in 2 chunks using multi_replace_file_content if possible, or sequential replace_file_content.
    // I already used replace_file_content for the modal HTML at the bottom.
    // Now I need to update the top state and the button.

    // I will use multi_replace for this to be efficient.

    // Fetch Project Info
    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            const res = await axios.get(`http://localhost:4180/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        }
    });

    // Fetch Activities Tree
    const { data: activities, isLoading } = useQuery({
        queryKey: ['activities', projectId],
        queryFn: async () => {
            const res = await axios.get(`http://localhost:4180/activities/project/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return buildTree(res.data);
        }
    });

    // Helper to build tree from flat list
    const buildTree = (items: Activity[]) => {
        const rootItems: any[] = [];
        const lookup: any = {};
        items.forEach((item: any) => {
            item.children = [];
            lookup[item.id] = item;
        });
        items.forEach((item: any) => {
            if (item.parentId && lookup[item.parentId]) {
                lookup[item.parentId].children.push(item);
            } else {
                rootItems.push(item);
            }
        });
        return rootItems;
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando plan de proyecto...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
            {/* Toolbar */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Link to={`/projects/${projectId}`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            {project?.name || 'Project Plan'}
                        </h1>
                        <div className="flex gap-4 mt-1">
                            <button
                                onClick={() => setActiveTab('schedule')}
                                className={`text-xs font-medium px-2 py-0.5 rounded-md transition-colors ${activeTab === 'schedule' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Cronograma
                            </button>
                            <button
                                onClick={() => setActiveTab('milestones')}
                                className={`text-xs font-medium px-2 py-0.5 rounded-md transition-colors ${activeTab === 'milestones' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Hitos
                            </button>
                        </div>
                    </div>
                </div>
                {activeTab === 'schedule' ? (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all text-sm font-medium"
                    >
                        <Plus size={18} />
                        Nueva Actividad
                    </button>
                ) : (
                    <button
                        onClick={() => setIsCreateMilestoneModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm transition-all text-sm font-medium"
                    >
                        <Plus size={18} />
                        Nuevo Hito
                    </button>
                )}
            </div>

            {/* Main Content Split */}
            <div className="flex-1 overflow-hidden p-4 flex gap-4">
                {activeTab === 'schedule' ? (
                    <>
                        {/* Left: Tree */}
                        <div className={`${selectedActivityId ? 'w-2/3' : 'w-full'} transition-all duration-300 ease-in-out`}>
                            <ActivitiesTree
                                activities={activities || []}
                                selectedId={selectedActivityId}
                                onSelect={setSelectedActivityId}
                            />
                        </div>

                        {/* Right: Details */}
                        {selectedActivityId && (
                            <div className="w-1/3 bg-white rounded-xl shadow-lg border border-gray-200 p-5 overflow-hidden animate-slide-in-right">
                                <ActivityDetails
                                    activityId={selectedActivityId}
                                    token={token!}
                                    onUpdate={() => {
                                        queryClient.invalidateQueries({ queryKey: ['activities'] });
                                        queryClient.invalidateQueries({ queryKey: ['activity', selectedActivityId] });
                                    }}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    // Milestones View
                    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-auto">
                        <h2 className="text-lg font-bold mb-4">Hitos del Proyecto</h2>
                        <div className="space-y-4">
                            {milestones?.map((m: any) => (
                                <div key={m.id} className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs mr-4">
                                        {new Date(m.date).getDate()}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800">{m.name}</h4>
                                        <p className="text-sm text-gray-500">{m.description || 'Sin descripción'}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${m.status === 'ACHIEVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {m.status}
                                    </div>
                                </div>
                            ))}
                            {milestones?.length === 0 && (
                                <p className="text-center text-gray-400 py-10">No hay hitos registrados aún.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for Creating Activity */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl animate-fade-in">
                        <h3 className="text-lg font-bold mb-6 text-gray-800">Nueva Actividad</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            createActivityMutation.mutate({
                                projectId: projectId!,
                                name: formData.get('name') as string,
                                startDate: formData.get('startDate') as string,
                                endDate: formData.get('endDate') as string,
                                parentId: formData.get('parentId') as string || undefined,
                                contractorId: formData.get('contractorId') as string || undefined,
                                plannedWeight: 1,
                            });
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Actividad</label>
                                <input name="name" required placeholder="Ej. Cimentación Torre A" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                                    <input name="startDate" type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                                    <input name="endDate" type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Actividad Padre (Agrupadora)</label>
                                    <select name="parentId" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                        <option value="">-- Ninguna (Nivel Raíz) --</option>
                                        <option disabled>Selección simplificada (usar árbol luego)</option>
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">Las actividades raíz suelen ser fases grandes (Ej. Estructura, Acabados).</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors">Crear Actividad</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal for Creating Milestone */}
            {isCreateMilestoneModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl animate-fade-in">
                        <h3 className="text-lg font-bold mb-6 text-gray-800">Nuevo Hito Clave</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            createMilestoneMutation.mutate({
                                name: formData.get('name') as string,
                                date: formData.get('date') as string,
                                description: formData.get('description') as string,
                                activityId: formData.get('activityId') as string || undefined,
                            });
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Hito</label>
                                <input name="name" required placeholder="Ej. Fin de Cimentación" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Objetivo</label>
                                <input name="date" type="date" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Relacionar con Actividad (Opcional)</label>
                                <select name="activityId" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                                    <option value="">-- Ninguna --</option>
                                    {/* Flatten tree for select */}
                                    {(() => {
                                        const flatten = (nodes: any[], depth = 0): any[] => {
                                            return nodes.reduce((acc, node) => {
                                                acc.push({ ...node, depth });
                                                if (node.children) acc.push(...flatten(node.children, depth + 1));
                                                return acc;
                                            }, []);
                                        };
                                        const flatActivities = flatten(activities || []);
                                        return flatActivities.map((act: any) => (
                                            <option key={act.id} value={act.id}>
                                                {'-'.repeat(act.depth * 2)} {act.name}
                                            </option>
                                        ));
                                    })()}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                                <textarea name="description" rows={3} placeholder="Detalles adicionales..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none resize-none"></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
                                <button type="button" onClick={() => setIsCreateMilestoneModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-sm transition-colors">Crear Hito</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
