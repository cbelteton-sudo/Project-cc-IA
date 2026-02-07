import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Filter, Wifi, WifiOff, X, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNetwork } from '../../context/NetworkContext';
import { getDB } from '../../services/db';
import { SyncQueue } from '../../services/sync-queue';
import { v4 as uuidv4 } from 'uuid';

interface IssueData {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    assigneeId?: string;
    createdAt: number;
    updatedAt: number;
    syncStatus: 'DRAFT' | 'SYNCED' | 'PENDING_SYNC';
}

export const IssueTracker: React.FC = () => {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const { isOnline } = useNetwork();

    // State
    const [issues, setIssues] = useState<IssueData[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Issue Form State
    const [newIssue, setNewIssue] = useState<Partial<IssueData>>({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'OPEN'
    });

    useEffect(() => {
        if (projectId) loadIssues();
    }, [projectId]);

    const loadIssues = async () => {
        setLoading(true);
        try {
            const db = await getDB();
            const projectIssues = await db.getAllFromIndex('issues', 'by-project', projectId!);
            // Sort by date desc
            projectIssues.sort((a, b) => b.updatedAt - a.updatedAt);
            setIssues(projectIssues as unknown as IssueData[]);
        } catch (err) {
            console.error("Error loading issues:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateIssue = async () => {
        if (!newIssue.title || !projectId) return;

        try {
            const issue: IssueData = {
                id: uuidv4(),
                projectId,
                title: newIssue.title,
                description: newIssue.description || '',
                status: 'OPEN',
                priority: newIssue.priority as any || 'MEDIUM',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                syncStatus: isOnline ? 'SYNCED' : 'PENDING_SYNC'
            };

            // 1. Save Local
            const db = await getDB();
            await db.put('issues', issue);

            // 2. Queue Sync
            await SyncQueue.add('/issues', 'POST', issue);

            // 3. Update UI
            setIssues([issue, ...issues]);
            setIsModalOpen(false);
            setNewIssue({ title: '', description: '', priority: 'MEDIUM', status: 'OPEN' });
        } catch (err) {
            console.error("Error creating issue:", err);
            alert("Error al crear incidencia");
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'CRITICAL': return 'bg-red-100 text-red-800';
            case 'HIGH': return 'bg-orange-100 text-orange-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-green-100 text-green-800';
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'OPEN': return 'bg-blue-100 text-blue-800';
            case 'RESOLVED': return 'bg-green-100 text-green-800';
            case 'CLOSED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-purple-100 text-purple-800';
        }
    };

    const filteredIssues = filterStatus === 'ALL'
        ? issues
        : issues.filter(i => i.status === filterStatus);

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm z-10 sticky top-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <button onClick={() => navigate(-1)} className="mr-3 p-1 rounded-full hover:bg-gray-100">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="font-bold text-gray-800 text-lg">Reporte de Incidencias</h1>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                {isOnline ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-500" />}
                                {issues.length} incidencias
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-md transition"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${filterStatus === status
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {status === 'ALL' ? 'Todos' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Cargando...</div>
                ) : filteredIssues.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-3">
                            <Filter size={24} className="text-gray-300" />
                        </div>
                        <p>No hay incidencias registradas</p>
                    </div>
                ) : (
                    filteredIssues.map(issue => (
                        <div key={issue.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.99] transition transform">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getPriorityColor(issue.priority)}`}>
                                    {issue.priority}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusColor(issue.status)}`}>
                                    {issue.status}
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-1">{issue.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{issue.description}</p>
                            <div className="mt-3 flex justify-between items-end border-t border-gray-50 pt-3">
                                <div className="text-xs text-gray-400">
                                    {new Date(issue.updatedAt).toLocaleDateString()}
                                </div>
                                {issue.syncStatus === 'PENDING_SYNC' && (
                                    <span className="text-[10px] text-orange-500 font-medium flex items-center gap-1">
                                        <WifiOff size={10} /> Pendiente
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Nueva Incidencia</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="¿Qué pasó / Qué se necesita?"
                                    value={newIssue.title}
                                    onChange={e => setNewIssue({ ...newIssue, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
                                        value={newIssue.priority}
                                        onChange={e => setNewIssue({ ...newIssue, priority: e.target.value as any })}
                                    >
                                        <option value="LOW">Baja</option>
                                        <option value="MEDIUM">Media</option>
                                        <option value="HIGH">Alta</option>
                                        <option value="CRITICAL">Crítica</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 outline-none"
                                        value={newIssue.status}
                                        disabled
                                    >
                                        <option value="OPEN">Abierto</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    rows={3}
                                    className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    placeholder="Detalles adicionales..."
                                    value={newIssue.description}
                                    onChange={e => setNewIssue({ ...newIssue, description: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleCreateIssue}
                                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition shadow-lg shadow-blue-200 mt-2"
                            >
                                Crear Incidencia
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
