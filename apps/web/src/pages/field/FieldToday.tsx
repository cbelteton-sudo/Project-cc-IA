import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetwork } from '../../context/NetworkContext';
import { getDB } from '../../services/db';
import { Search, Calendar, Wifi, WifiOff, RefreshCw, Check, X, Camera } from 'lucide-react';
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
import { Filter, Briefcase } from 'lucide-react'; // Add new icons

// ... Activity Interface

export const FieldToday: React.FC = () => {
    const navigate = useNavigate();
    const { isOnline, syncStatus } = useNetwork();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [projects, setProjects] = useState<any[]>([]);

    // New State: filter 'ALL' or specific ID
    const [activeFilter, setActiveFilter] = useState<string>('ALL');

    // We store activities as a flat list, but with projectIdAttached
    const [activities, setActivities] = useState<ActivityView[]>([]);
    const [loading, setLoading] = useState(false);

    // Load Projects
    useEffect(() => {
        const loadProjects = async () => {
            if (isOnline) {
                try {
                    const res = await axios.get(`${API_URL}/projects`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    setProjects(res.data);
                    // Default to ALL if projects exist
                } catch (e) { console.error(e); }
            } else {
                // Load from IDB
                const db = await getDB();
                const localProjects = await db.getAll('projects');
                setProjects(localProjects);
            }
        };
        loadProjects();
    }, [isOnline]);

    // Load Activities logic
    useEffect(() => {
        if (projects.length === 0) return;
        loadUnifiedActivities();
    }, [activeFilter, selectedDate, isOnline, projects]);

    const loadUnifiedActivities = async () => {
        setLoading(true);
        const db = await getDB();
        let allActs: ActivityView[] = [];

        // Determine which projects to fetch
        const targets = activeFilter === 'ALL' ? projects : projects.filter(p => p.id === activeFilter);

        for (const proj of targets) {
            let projectActs: Activity[] = [];
            // 1. Fetch Activities
            if (isOnline) {
                try {
                    const res = await axios.get(`${API_URL}/activities/project/${proj.id}`);
                    projectActs = res.data;
                } catch (e) {
                    // Silent fail or offline fallback logic
                }
            }
            // Reuse logic for offline... (Simplified for snippet)

            if (projectActs.length === 0) continue;

            // Map for Parent Names (Before filtering leaves)
            const actMap = new Map(projectActs.map(a => [a.id, a]));

            // Filter Leaf Nodes
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

    // Helper for Traffic Light
    const getStatusColor = (act: Activity) => {
        if (act.status === 'DONE' || act.status === 'CLOSED') return 'bg-green-500';

        const today = new Date();
        const end = new Date(act.endDate);
        const start = new Date(act.startDate);

        // Normalize time
        today.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (today > end) return 'bg-red-500'; // Delayed
        if (today >= start && today <= end) return 'bg-blue-500'; // In Progress / On Time
        return 'bg-gray-400'; // Not Started / Future
    };

    const getStatusText = (act: Activity) => {
        if (act.status === 'DONE' || act.status === 'CLOSED') return 'Completado';
        const today = new Date();
        const end = new Date(act.endDate);
        today.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (today > end) return 'Atrasado';
        if (today >= new Date(act.startDate) && today <= end) return 'En Tiempo';
        return 'Programado';
    };

    // Grouping for Render
    const grouped = React.useMemo(() => {
        if (activeFilter !== 'ALL') return { [activeFilter]: activities }; // Single group key irrelevant
        // Group by Project Name
        const groups: Record<string, typeof activities> = {};
        activities.forEach(a => {
            if (!groups[a.projectName]) groups[a.projectName] = [];
            groups[a.projectName].push(a);
        });
        return groups;
    }, [activities, activeFilter]);


    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 pt-4 pb-2 shadow-sm z-10 sticky top-0 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">Field Dashboard</h1>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center text-xs gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            <Calendar size={14} />
                            <span>{format(selectedDate, 'dd/MM')}</span>
                            <input
                                type="date"
                                className="absolute opacity-0 w-8"
                                onChange={e => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
                            />
                        </div>
                        {isOnline ? <Wifi size={16} className="text-green-500" /> : <WifiOff size={16} className="text-red-500" />}
                    </div>
                </div>

                {/* Project Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    <button
                        onClick={() => setActiveFilter('ALL')}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${activeFilter === 'ALL' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
                    >
                        Todos
                    </button>
                    {projects.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setActiveFilter(p.id)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeFilter === p.id ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
                        >
                            <Briefcase size={14} />
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {loading && <div className="text-center py-10 text-gray-500">Cargando actividades...</div>}

                {!loading && Object.keys(grouped).length === 0 && (
                    <div className="text-center text-gray-400 mt-10">No hay actividades para hoy.</div>
                )}

                {!loading && Object.entries(grouped).map(([pName, acts]) => (
                    <div key={pName} className="space-y-3">
                        {activeFilter === 'ALL' && (
                            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider pl-1">
                                <Briefcase size={12} />
                                {pName}
                            </div>
                        )}
                        {acts.map(act => (
                            <div
                                key={act.id}
                                onClick={() => navigate(`/field/entry/${act.id}`, { state: { projectId: act.projectId } })}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:scale-[0.98] transition-transform flex items-center gap-4"
                            >
                                {/* Traffic Light */}
                                <div className={`w-3 h-3 rounded-full shrink-0 ${getStatusColor(act)}`} />

                                <div className="flex-1 min-w-0">
                                    {/* Hierarchy / Context */}
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1 truncate">
                                        <span className="uppercase tracking-wider font-bold">{act.projectName}</span>
                                        {act.parentName && (
                                            <>
                                                <span>•</span>
                                                <span className="truncate">{act.parentName}</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Main Title */}
                                    <div className="font-semibold text-gray-800 text-sm truncate">{act.name}</div>

                                    {/* Status Text (Optional) */}
                                    <div className="text-[10px] text-gray-400 mt-1">
                                        Estado: <span className="font-medium text-gray-600">{getStatusText(act)}</span>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="text-gray-300">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            {/* PDF Button */}
            <button
                className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg"
                onClick={() => navigate('/field/daily')}
            >
                <div className="flex flex-col items-center text-[10px] leading-tight">
                    <span className="font-bold text-lg">PDF</span>
                </div>
            </button>
        </div>
    );
};
