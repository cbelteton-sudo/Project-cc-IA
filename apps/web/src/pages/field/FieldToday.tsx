import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetwork } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import { useBackgroundSync } from '../../hooks/useBackgroundSync';
import { getDB } from '../../services/db';
import { Search, Calendar, Wifi, WifiOff, RefreshCw, Check, X, Camera, FileText, Briefcase } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

interface Activity {
    id: string;
    name: string;
    code: string;
    wbs?: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'CLOSED';
    startDate: string;
    endDate: string;
    parentId?: string;
}

interface ActivityView extends Activity {
    projectId: string;
    projectName: string;
    parentName?: string;
}

// ... imports
// ... imports

// ... Activity Interface

export const FieldToday: React.FC = () => {
    const navigate = useNavigate();
    const { isOnline } = useNetwork();
    const { user } = useAuth(); // Need user for greeting
    const { queueCount } = useBackgroundSync();
    const { token } = useAuth(); // Get token
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [projects, setProjects] = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState<string>('ALL');
    const [activities, setActivities] = useState<ActivityView[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastError, setLastError] = useState<string>('');

    // Load Projects
    useEffect(() => {
        const loadProjects = async () => {
            if (isOnline) {
                try {
                    // Add Auth Header
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    const res = await axios.get(`${API_URL}/projects`, config);
                    setProjects(res.data);
                    setLastError(''); // Clear error on success
                } catch (e: any) {
                    console.error(e);
                    setLastError(`Projects Load Error: ${e.message}`);
                }
            } else {
                try {
                    const db = await getDB();
                    const localProjects = await db.getAll('projects');
                    setProjects(localProjects);
                } catch (e: any) {
                    setLastError(`IDB Projects Error: ${e.message}`);
                }
            }
        };
        if (token || !isOnline) loadProjects();
    }, [isOnline, token]); // Add token dependency

    // Load Activities logic match existing...
    useEffect(() => {
        if (projects.length === 0) return;
        loadUnifiedActivities();
    }, [activeFilter, selectedDate, isOnline, projects, token]);

    const loadUnifiedActivities = async () => {
        setLoading(true);
        // ... (Keep existing loading logic mostly same, but ensure we get sufficient data)
        let allActs: ActivityView[] = [];
        const targets = activeFilter === 'ALL' ? projects : projects.filter(p => p.id === activeFilter);
        const config = { headers: { Authorization: `Bearer ${token}` } };

        for (const proj of targets) {
            let projectActs: Activity[] = [];
            if (isOnline) {
                try {
                    const res = await axios.get(`${API_URL}/activities/project/${proj.id}`, config);
                    projectActs = res.data;
                } catch (e: any) {
                    console.error(`Failed to load activities for project ${proj.id}`, e);
                    setLastError(`Activity API Error (${proj.name}): ${e.message}`);
                }
            }

            // Offline fallback?
            if (projectActs.length === 0) {
                // Removed complex IDB fallback for now to isolate API issue
            }

            if (projectActs.length === 0) continue;

            const actMap = new Map(projectActs.map(a => [a.id, a]));
            const parentIds = new Set(projectActs.map((a: any) => a.parentId).filter(Boolean));
            const leafActs = projectActs.filter(act => !parentIds.has(act.id));

            const merged = leafActs.map(act => {
                let parentName = undefined;
                if (act.parentId) {
                    const p = actMap.get(act.parentId);
                    if (p) parentName = p.name;
                }
                return {
                    ...act,
                    projectId: proj.id,
                    projectName: proj.name,
                    parentName
                } as ActivityView;
            });
            allActs = [...allActs, ...merged];
        }
        setActivities(allActs);
        setLoading(false);
    };

    // Calculate Stats
    const stats = React.useMemo(() => {
        const total = activities.length;
        let delayed = 0;
        let pending = 0;
        let done = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        activities.forEach(a => {
            if (a.status === 'DONE') {
                done++;
                return;
            }
            const end = new Date(a.endDate);
            end.setHours(0, 0, 0, 0);
            if (today > end) delayed++;
            else pending++;
        });
        return { total, delayed, pending, done };
    }, [activities]);

    // Grouping
    const grouped = React.useMemo(() => {
        if (activeFilter !== 'ALL') return { [activeFilter]: activities };
        const groups: Record<string, typeof activities> = {};
        activities.forEach(a => {
            if (!groups[a.projectName]) groups[a.projectName] = [];
            groups[a.projectName].push(a);
        });
        return groups;
    }, [activities, activeFilter]);

    // UI Helpers
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const getStatusColor = (act: Activity) => {
        if (act.status === 'DONE') return 'bg-green-500 border-l-4 border-l-green-500';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(act.endDate);
        end.setHours(0, 0, 0, 0);
        if (today > end) return 'border-l-4 border-l-red-500'; // Delayed
        return 'border-l-4 border-l-blue-500'; // In Progress
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col pb-20">
            {/* Smart Header */}
            <div className="bg-white px-6 pt-8 pb-6 shadow-sm z-10 sticky top-0 md:static">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">{format(selectedDate, 'EEEE, d MMMM')}</p>
                        <h1 className="text-2xl font-bold text-gray-900 mt-1">
                            {getGreeting()}, <span className="text-blue-600">{user?.name?.split(' ')[0] || 'Usuario'}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Sync Indicator */}
                        {queueCount > 0 && (
                            <button
                                onClick={() => navigate('/field/sync')}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors animate-pulse"
                            >
                                <RefreshCw size={14} className="animate-spin" />
                                {queueCount}
                            </button>
                        )}

                        <div className="bg-gray-100 p-2 rounded-full">
                            {/* User Avatar Placeholder or just Icon */}
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Daily Pulse Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex flex-col items-center">
                        <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Actividades</span>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex flex-col items-center">
                        <span className="text-2xl font-bold text-red-500">{stats.delayed}</span>
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Atrasadas</span>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex flex-col items-center">
                        <span className="text-2xl font-bold text-green-600">{stats.done}</span>
                        <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Listas</span>
                    </div>
                </div>

                {/* Project Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-6 px-6">
                    <button
                        onClick={() => setActiveFilter('ALL')}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${activeFilter === 'ALL' ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-white text-gray-500 border border-gray-200'}`}
                    >
                        Todos
                    </button>
                    {projects.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setActiveFilter(p.id)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeFilter === p.id ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-white text-gray-500 border border-gray-200'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Content */}
            <div className="px-4 py-6 space-y-8">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <RefreshCw className="animate-spin mb-2" />
                        <span className="text-sm">Sincronizando...</span>
                    </div>
                )}

                {!loading && Object.keys(grouped).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                            <Check className="text-green-500 w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">¡Todo al día!</h3>
                        <p className="text-gray-500 text-sm mt-2 max-w-[200px]">No hay actividades pendientes para hoy.</p>
                    </div>
                )}

                {!loading && Object.entries(grouped).map(([pName, acts]) => (
                    <div key={pName} className="space-y-4">
                        {activeFilter === 'ALL' && (
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">{pName}</h3>
                        )}

                        <div className="space-y-3">
                            {acts.map(act => {
                                // Calculate simple progress for bar (mock/random if not real, or based on time)
                                // If status DONE -> 100%. If NOT_STARTED -> 0%. If IN_PROGRESS -> 50% (or time based)
                                const isDone = act.status === 'DONE';
                                const progress = isDone ? 100 : (act.status === 'IN_PROGRESS' ? 50 : 0);

                                const statusClass = getStatusColor(act); // Returns border class

                                return (
                                    <div
                                        key={act.id}
                                        onClick={() => navigate(`/field/entry/${act.id}`, { state: { projectId: act.projectId } })}
                                        className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-0 overflow-hidden relative cursor-pointer group ${statusClass}`}
                                    >
                                        <div className="p-5">
                                            {/* Header: Parent Context and Date */}
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{act.parentName || 'General'}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass.includes('red') ? 'bg-red-50 text-red-600' :
                                                    isDone ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {isDone ? 'Completado' : (statusClass.includes('red') ? 'Atrasado' : 'En Curso')}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-base font-bold text-gray-800 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                                                {act.name}
                                            </h3>

                                            {/* Metadata Row */}
                                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    <span>{new Date(act.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(act.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                            </div>

                                            {/* Visual Progress Bar */}
                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-green-500' : (statusClass.includes('red') ? 'bg-red-500' : 'bg-blue-500')}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Action Button (PDF) - Smaller and cleaner */}
            {/* Floating Action Button Removed - Moved to Header */}
        </div>
    );
};
