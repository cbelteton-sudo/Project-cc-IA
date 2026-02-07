import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetwork } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import { getDB } from '../../services/db';
import { Search, Filter, Plus, Calendar, AlertCircle } from 'lucide-react';
import axios from 'axios';

import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

export const FieldDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { isOnline } = useNetwork();
    const [projectActivities, setProjectActivities] = useState<any[]>([]);
    const [drafts, setDrafts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const [debugError, setDebugError] = useState<string>(''); // NEW: Debug state

    // Project Selection State
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [loadingProjects, setLoadingProjects] = useState(true);

    const { logout } = useAuth();

    // 1. Load Projects on Mount
    useEffect(() => {
        if (isOnline) {
            setLoadingProjects(true);
            setDebugError('');
            axios.get(`${API_URL}/projects`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
                .then(res => {
                    setProjects(res.data);
                    if (res.data.length > 0 && !selectedProjectId) {
                        setSelectedProjectId(res.data[0].id);
                    } else if (res.data.length === 0) {
                        setDebugError("El servidor respondió correctamente pero la lista de proyectos está vacía.");
                    }
                })
                .catch(err => {
                    console.error("Failed to load projects", err);
                    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                        logout();
                        navigate('/login');
                        return;
                    }
                    setDebugError(`Error de conexión: ${err.message}`);
                })
                .finally(() => setLoadingProjects(false));
        }
    }, [isOnline]);

    // 2. Load Activities when Project or Date changes
    useEffect(() => {
        if (selectedProjectId) {
            loadActivities();
        } else {
            setLoading(false);
        }
    }, [selectedProjectId, isOnline, selectedDate]);

    const loadActivities = async () => {
        setLoading(true);

        // A. Fetch Activities
        if (isOnline) {
            try {
                const { data } = await axios.get(`${API_URL}/activities/project/${selectedProjectId}`);
                setProjectActivities(data);
            } catch (err) {
                console.error("Failed to fetch activities", err);
            }
        }

        // B. Load Local Drafts
        try {
            const db = await getDB();
            const localDrafts = await db.getAllFromIndex('updates', 'by-project', selectedProjectId);
            setDrafts(localDrafts);
        } catch (e) { console.error("Failed to load drafts", e); }

        setLoading(false);
    };

    const getStatusBadge = (activityId: string) => {
        const draft = drafts.find(d => d.items.some((i: any) => i.activityId === activityId));
        if (draft) return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">Draft</span>;
        return null; // Could check 'submitted' state if data syncs back
    };

    return (
        <div className="p-4 space-y-4">
            {/* Header / Date */}
            <div className="flex flex-col gap-3 bg-white p-3 rounded-lg shadow-sm">
                {/* Project Selector */}
                <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full text-lg font-bold text-gray-800 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
                >
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    {loadingProjects && <option>Cargando proyectos...</option>}
                    {!loadingProjects && projects.length === 0 && <option value="">Sin proyectos encontrados</option>}
                </select>

                {/* API Error Message */}
                {projects.length === 0 && !loadingProjects && (
                    <div className="text-xs text-red-500 px-1 mt-1 font-bold">
                        {debugError || (selectedProjectId ? "No se encontraron actividades." : "No se pudo conectar con el servidor.")}
                    </div>
                )}

                <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                    <div className="flex items-center space-x-2">
                        <Calendar size={18} className="text-gray-500" />
                        <span className="font-medium text-gray-700">{format(selectedDate, 'MMM dd, yyyy')}</span>
                    </div>
                    {/* Simplified Date Picker */}
                    <input
                        type="date"
                        className="border rounded p-1 text-sm"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    />
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search WBS or Activity..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading...</div>
            ) : (
                <div className="space-y-3">
                    {projectActivities.map(activity => (
                        <div
                            key={activity.id}
                            onClick={() => navigate(`/field/activity/${activity.id}/update`)}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 active:bg-gray-50 cursor-pointer"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-mono text-gray-400 block mb-1">{activity.code || 'NO-CODE'}</span>
                                    <h3 className="font-semibold text-gray-800 text-sm leading-tight">{activity.name}</h3>
                                </div>
                                {getStatusBadge(activity.id)}
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                <span>{activity.percent}% Completed</span>
                                <span className={activity.measurementType === 'QUANTITY' ? 'text-blue-600' : 'text-purple-600'}>
                                    {activity.measurementType}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-1.5 rounded-full"
                                    style={{ width: `${activity.percent}%` }}
                                />
                            </div>
                        </div>
                    ))}
                    {projectActivities.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No activities found for this project.
                        </div>
                    )}
                </div>
            )}

            {/* FAB */}
            <div className="fixed bottom-20 right-4 flex flex-col space-y-3">
                <button
                    onClick={() => navigate('/field/issues/new')}
                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-colors"
                    aria-label="Report Issue"
                >
                    <AlertCircle size={24} />
                </button>
            </div>
        </div>
    );
};
