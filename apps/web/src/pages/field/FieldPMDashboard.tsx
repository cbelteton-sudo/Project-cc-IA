import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    AlertTriangle, Clock, Camera, AlertCircle, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

interface DashboardMetrics {
    stalled: {
        count: number;
        items: {
            id: string,
            name: string,
            code: string,
            isBlocked: boolean,
            highIssues: number,
            medIssues: number
        }[];
    };
    blocked: {
        count: number;
        items: { id: string, name: string, date: string, note?: string }[];
    };
    // topEvidence removed
    issues: { HIGH: number, MEDIUM: number, LOW: number };
}

export const FieldPMDashboard: React.FC = () => {
    const { token } = useAuth();
    const [projectId, setProjectId] = useState<string>(localStorage.getItem('lastProjectId') || '');
    const [projects, setProjects] = useState<any[]>([]);

    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const authAxios = React.useMemo(() => {
        const instance = axios.create({ baseURL: API_URL });
        if (token) {
            instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        return instance;
    }, [token]);

    useEffect(() => {
        if (!token) return;
        authAxios.get(`/projects`)
            .then(res => {
                setProjects(res.data);
                if (!projectId && res.data.length > 0) {
                    setProjectId(res.data[0].id);
                }
            })
            .catch(console.error);
    }, [token, authAxios]);

    useEffect(() => {
        if (!projectId || !token) return;
        localStorage.setItem('lastProjectId', projectId);

        setLoading(true);
        console.log('[FieldPMDashboard] Requesting metrics for project:', projectId);
        authAxios.get(`/field/reports/pm/dashboard?projectId=${projectId}&days=3`)
            .then(res => {
                console.log('[FieldPMDashboard] Metrics received:', res.data);
                setMetrics(res.data);
            })
            .catch(err => {
                console.error('[FieldPMDashboard] Error fetching metrics:', err);
                setError(err.message || 'Error desconocido al cargar el dashboard');
            })
            .finally(() => setLoading(false));
    }, [projectId, token, authAxios]);

    if (!projectId && projects.length === 0) return <div className="p-8 text-gray-400">Cargando proyectos...</div>;

    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Centro de Comando</h1>
                    <p className="text-sm text-gray-500 capitalize">{today}</p>
                </div>

                <div className="relative group">
                    <select
                        value={projectId}
                        onChange={e => setProjectId(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium min-w-[240px]"
                    >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <ChevronRight className="rotate-90 h-4 w-4" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
                    <div className="md:col-span-1 h-96 bg-gray-200 rounded-xl"></div>
                    <div className="md:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
                </div>
            ) : error ? (
                <div className="p-8 text-center text-red-500 bg-white rounded-xl border border-red-100 shadow-sm">
                    <AlertTriangle className="mx-auto mb-3 w-12 h-12 text-red-400" />
                    <h3 className="font-bold text-lg text-gray-900">Error de Conexión</h3>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <button onClick={() => window.location.reload()} className="px-5 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors">Reintentar</button>
                </div>
            ) : metrics ? (
                <>
                    {/* Top Stats Row - The "Pulse" */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <StatCard
                            label="Bloqueos"
                            value={metrics.blocked.count}
                            trend={metrics.blocked.count > 0 ? "Crítico" : "Estable"}
                            trendColor={metrics.blocked.count > 0 ? "text-red-500" : "text-green-500"}
                            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                            bg="bg-white"
                        />
                        <StatCard
                            label="Sin Avance (3d)"
                            value={metrics.stalled.count}
                            trend="Atención"
                            trendColor="text-orange-500"
                            icon={<Clock className="w-5 h-5 text-orange-500" />}
                            bg="bg-white"
                        />
                        <StatCard
                            label="Issues Abiertos"
                            value={metrics.issues.HIGH + metrics.issues.MEDIUM + metrics.issues.LOW}
                            trend={`${metrics.issues.HIGH} Alta Prioridad`}
                            trendColor={metrics.issues.HIGH > 0 ? "text-red-600" : "text-gray-500"}
                            icon={<AlertCircle className="w-5 h-5 text-purple-500" />}
                            bg="bg-white"
                        />
                    </div>

                    {/* Bento Grid Layout - Refined for Focus */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

                        {/* Column 1: Critical Focus (Blockers & Issues) */}
                        <div className="lg:col-span-1 space-y-6">
                            <DashboardCard title="Bloqueos Activos" icon={<AlertTriangle className="text-red-500" />} className="border-red-100 ring-4 ring-red-50">
                                <div className="space-y-3">
                                    {metrics.blocked.items.length === 0 ? (
                                        <EmptyState message="Sin bloqueos activos" />
                                    ) : (
                                        metrics.blocked.items.map((item, idx) => (
                                            <div key={idx} className="group p-3 bg-red-50/50 rounded-lg border border-red-100 hover:bg-red-50 transition-colors cursor-default">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</div>
                                                    <span className="text-[10px] uppercase font-bold text-red-700 bg-white px-1.5 py-0.5 rounded border border-red-100 shadow-sm">
                                                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-red-800/80 line-clamp-2 mt-1 font-medium">
                                                    {item.note || 'Sin detalles registrados'}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </DashboardCard>

                            <DashboardCard title="Problemas por Severidad" icon={<AlertCircle className="text-purple-500" />}>
                                <div className="space-y-4">
                                    <SeverityRow label="Alta" count={metrics.issues.HIGH} color="bg-red-500" />
                                    <SeverityRow label="Media" count={metrics.issues.MEDIUM} color="bg-orange-400" />
                                    <SeverityRow label="Baja" count={metrics.issues.LOW} color="bg-blue-400" />
                                </div>
                            </DashboardCard>
                        </div>

                        {/* Column 2 & 3: Activity Monitor (Stalled - Expanded) */}
                        <div className="lg:col-span-2">
                            <DashboardCard title="Actividades Estancadas (Sin reporte > 3 días)" icon={<Clock className="text-orange-500" />} className="h-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {metrics.stalled.items.length === 0 ? (
                                        <div className="col-span-2"><EmptyState message="El ritmo de obra es óptimo" /></div>
                                    ) : (
                                        metrics.stalled.items.map((item, idx) => (
                                            <div
                                                key={item.id}
                                                onClick={() => navigate(`/field/entries/${projectId}/${item.id}`)}
                                                className="group flex flex-col p-3 hover:bg-gray-50 rounded-lg transition-all cursor-pointer border border-gray-100 hover:border-blue-200 relative overflow-hidden"
                                            >
                                                {/* Left Border Status Indicator */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.isBlocked ? 'bg-red-500' : (item.highIssues > 0 ? 'bg-red-400' : 'bg-transparent transition-colors group-hover:bg-blue-400')}`}></div>

                                                <div className="flex justify-between items-start gap-2 pl-2">
                                                    <div>
                                                        <div className="font-medium text-gray-800 text-sm group-hover:text-blue-700 transition-colors line-clamp-2" title={item.name}>{item.name}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.code}</div>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" />
                                                </div>

                                                {/* Status Badges Row */}
                                                {(item.isBlocked || item.highIssues > 0 || item.medIssues > 0) && (
                                                    <div className="flex flex-wrap gap-1 mt-2 pl-2">
                                                        {item.isBlocked && (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                                                BLOQUEADO
                                                            </span>
                                                        )}
                                                        {item.highIssues > 0 && (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-red-600 border border-red-200 flex items-center gap-1">
                                                                <AlertCircle size={10} /> {item.highIssues} ISSUE CRÍTICO
                                                            </span>
                                                        )}
                                                        {item.medIssues > 0 && (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-orange-600 border border-orange-200">
                                                                {item.medIssues} Issue Med
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </DashboardCard>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
};

// --- Subcomponents for Bento UI ---

const DashboardCard = ({ title, icon, children, className = '' }: any) => (
    <div className={`bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
            {icon}
            <h3 className="font-bold text-gray-800 text-sm tracking-wide uppercase">{title}</h3>
        </div>
        {children}
    </div>
);

const StatCard = ({ label, value, trend, trendColor, icon, bg }: any) => (
    <div className={`${bg} p-5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between h-28`}>
        <div className="flex justify-between items-start">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</span>
            <div className={`p-1.5 rounded-lg bg-gray-50`}>{icon}</div>
        </div>
        <div>
            <div className="text-3xl font-bold text-gray-900 tracking-tight">{value}</div>
            <div className={`text-xs font-medium mt-1 ${trendColor} flex items-center gap-1`}>
                {trend}
            </div>
        </div>
    </div>
);

const SeverityRow = ({ label, count, color }: any) => (
    <div className="flex items-center gap-3">
        <div className="w-20 text-xs font-medium text-gray-500">{label}</div>
        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min((count / 10) * 100, 100)}%` }}></div>
        </div>
        <div className="w-6 text-right text-xs font-bold text-gray-700">{count}</div>
    </div>
);

const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-8 text-gray-300">
        <div className="w-10 h-1 bg-gray-100 rounded-full mb-2"></div>
        <span className="text-xs italic">{message}</span>
    </div>
);
