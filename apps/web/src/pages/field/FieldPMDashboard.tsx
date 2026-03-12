import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Clock, AlertCircle, ChevronRight, Plus, Activity, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { QuickCreateModal } from '../../components/field/components/QuickCreateModal';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DashboardMetrics {
  health: {
    spi: number;
    progress: number;
    budgetBase: number;
    budgetExecuted: number;
  };
  stalled: {
    count: number;
    items: {
      id: string;
      name: string;
      code: string;
      isBlocked: boolean;
      highIssues: number;
      medIssues: number;
    }[];
  };
  blocked: {
    count: number;
    items: { id: string; name: string; date: string; note?: string }[];
  };
  issues: { HIGH: number; MEDIUM: number; LOW: number };
  sCurveData: { name: string; Planeado: number; Real: number | null }[];
}

export const FieldPMDashboard: React.FC = () => {
  const { user } = useAuth();
  const { id: urlProjectId } = useParams();
  const [projectId, setProjectId] = useState<string>(urlProjectId || '');
  const [projects, setProjects] = useState<any[]>([]);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  // Define hasTaskCreatePermission exactly like FieldDashboardV2
  const projectMembership = user?.projectMembers?.find((m) => m.projectId === projectId);
  const projectRole = projectMembership?.role;
  const isGlobalAdmin = user?.role === 'ADMIN' || user?.role === 'ADMINISTRADOR';

  const hasTaskCreatePermission =
    isGlobalAdmin ||
    [
      'PROJECT_ADMIN',
      'DIRECTOR',
      'PM',
      'PMO',
      'PROJECT_MANAGER',
      'SUPERVISOR',
      'CONTRACTOR_LEAD',
      'FIELD_OPERATOR',
    ].includes(projectRole || '');

  useEffect(() => {
    if (!user) return;
    api
      .get(`/projects`)
      .then((res) => {
        setProjects(res.data);
        
        // Use URL projectId if available, otherwise check localStorage, otherwise use first project
        if (urlProjectId) {
            setProjectId(urlProjectId);
        } else {
            const lastProjectId = localStorage.getItem('lastProjectId') || '';
            const isProjectAvailable = res.data.some((p: any) => p.id === lastProjectId);

            if (isProjectAvailable) {
                setProjectId(lastProjectId);
            } else if (res.data.length > 0) {
                setProjectId(res.data[0].id);
            }
        }
      })
      .catch(console.error);
  }, [user, urlProjectId]);

  // Navigate to standard operator dashboard if the user is strict operator without PM roles
  useEffect(() => {
    if (!user) return;
    const isHighLevel = ['ADMIN', 'ORG_ADMIN', 'PLATFORM_ADMIN', 'PM', 'DIRECTOR_PMO'].includes(
      user.role,
    );
    const isPMProjectRole = user.projectMembers?.some((m: any) =>
      ['PM', 'PROJECT_MANAGER', 'SUPERVISOR'].includes(m.role),
    );
    const isOperator = user.projectMembers?.some((m: any) =>
      ['FIELD_OPERATOR', 'RESIDENTE'].includes(m.role),
    );

    if (!isHighLevel && !isPMProjectRole && isOperator) {
      if (urlProjectId) {
         navigate(`/projects/${urlProjectId}/field-operator`, { replace: true });
      } else {
         navigate('/field/operator', { replace: true });
      }
    }
  }, [user, navigate, urlProjectId]);

  useEffect(() => {
    if (!projectId || projectId === 'undefined' || !user) return;
    localStorage.setItem('lastProjectId', projectId);

    let isMounted = true;
    
    // Defer setLoading to avoid synchronous setState cascased during initial render cycle.
    // It's already true initially. This handles subsequent refreshes.
    setTimeout(() => {
       if (isMounted) setLoading(true);
    }, 0);
    
    console.log('[FieldPMDashboard] Requesting metrics for project:', projectId);
    api
      .get(`/field/reports/pm/dashboard?projectId=${projectId}&days=3`)
      .then((res) => {
        if (!isMounted) return;
        console.log('[FieldPMDashboard] Metrics received:', res.data);
        setMetrics(res.data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[FieldPMDashboard] Error fetching metrics:', err);
        setError(err.message || 'Error desconocido al cargar el dashboard');
      })
      .finally(() => {
         if (isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [projectId, user, refreshKey]);

  if (!projectId && projects.length === 0)
    return <div className="p-8 text-gray-400">Cargando proyectos...</div>;

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getSpiColor = (spi: number) => {
      if (spi >= 1.0) return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      if (spi >= 0.85) return 'text-amber-500 bg-amber-50 border-amber-200';
      return 'text-rose-500 bg-rose-50 border-rose-200';
  };

  const getSpiStatus = (spi: number) => {
    if (spi >= 1.0) return 'A Tiempo / Adelantado';
    if (spi >= 0.85) return 'Ligero Retraso';
    return 'Retraso Crítico';
  };

  return (
    <div className="bg-slate-50 min-h-full flex flex-col w-full overflow-x-hidden">
      {/* Header Fijo */}
      <div className="sticky top-0 z-20 bg-white px-4 py-4 md:px-6 md:py-5 border-b border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight line-clamp-1">
            Centro de Comando
          </h1>
          <p className="text-sm text-slate-500 font-medium capitalize mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {today} 
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 py-2.5 px-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm w-full md:min-w-[280px] hover:border-indigo-300 transition-colors"
            >
              {projects.length === 0 ? (
                <option value="">Cargando proyectos...</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <ChevronRight className="rotate-90 h-4 w-4" />
            </div>
          </div>

          {projectId && hasTaskCreatePermission && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Actividad</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 flex-1 w-full max-w-[1600px] mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
            ))}
            <div className="md:col-span-3 h-96 bg-slate-200 rounded-2xl"></div>
            <div className="md:col-span-1 h-96 bg-slate-200 rounded-2xl"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 bg-white rounded-2xl border border-rose-100 shadow-sm">
            <AlertTriangle className="mx-auto mb-4 w-12 h-12 text-rose-400" />
            <h3 className="font-bold text-lg text-slate-900">Error de Conexión</h3>
            <p className="text-slate-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : metrics ? (
          <>
            {/* 1. KPIs de Salud Global (Top Row) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* SPI / Salud Cronograma */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> Salud Cronograma (SPI)
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{(metrics.health?.spi || 1.0).toFixed(2)}</span>
                  </div>
                  <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${getSpiColor(metrics.health?.spi || 1.0)}`}>
                    {getSpiStatus(metrics.health?.spi || 1.0)}
                  </div>
                </div>
              </div>

               {/* Avance Global */}
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Avance Real Acum.
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{metrics.health?.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                     <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${metrics.health?.progress || 0}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Presupuesto Ejecutado */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Valor Ganado Estimado
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-400 text-xl font-medium">$</span>
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                       {((metrics.health?.budgetBase || 0) * ((metrics.health?.progress || 0) / 100)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-400 mt-2">
                    De <span className="font-bold text-slate-600">${(metrics.health?.budgetBase || 0).toLocaleString()}</span> base
                  </div>
                </div>
              </div>

               {/* Alertas Críticas */}
               <div className="bg-rose-500 p-5 rounded-2xl shadow-sm border border-rose-600 flex flex-col justify-between text-white hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute -right-6 -top-6 opacity-20">
                    <AlertTriangle className="w-32 h-32" />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <span className="text-rose-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                     Riesgos Críticos (Bloqueos)
                  </span>
                </div>
                <div className="mt-4 relative z-10">
                  <div className="text-4xl font-extrabold tracking-tight">{metrics.blocked.count}</div>
                  <div className="text-xs font-medium text-rose-100 mt-2 flex items-center gap-1">
                    <span>Requieren desbloqueo urgente</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Sección Principal: Curva S y Action Items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 h-full">
              
              {/* Columna Principal: Gráfico Curva S (Ocupa más espacio) */}
              <div className="lg:col-span-2 xl:col-span-3 space-y-6 flex flex-col">
                  
                  {/* Curva S */}
                  <DashboardCard
                    title="Curva S: Progreso Acumulado (Real vs Planeado)"
                    icon={<TrendingUp className="text-indigo-500 w-4 h-4" />}
                    className="flex-1 min-h-[400px]"
                  >
                    {metrics.sCurveData && metrics.sCurveData.length > 0 ? (
                        <div className="w-full h-[320px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                            data={metrics.sCurveData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                            <defs>
                                <linearGradient id="colorPlaneado" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#64748b', fontSize: 12}} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#64748b', fontSize: 12}}
                                dx={-10}
                                tickFormatter={(val) => `${val}%`}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [`${value}%`, undefined]}
                            />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                            <Area 
                                type="monotone" 
                                dataKey="Planeado" 
                                stroke="#94a3b8" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={1} 
                                fill="url(#colorPlaneado)" 
                                name="Avance Planeado"
                                animationDuration={1500}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="Real" 
                                stroke="#4f46e5" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorReal)" 
                                name="Avance Real"
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={1500}
                            />
                            </AreaChart>
                        </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyState message="No hay suficientes datos de cronograma para generar la Curva S." />
                    )}
                  </DashboardCard>

                  {/* Actividades Estancadas (Stalled) - Importante para PMs ver por qué no hay avance */}
                  <DashboardCard
                    title="Actividades Estancadas (Sin reporte > 3 días)"
                    icon={<Clock className="text-orange-500 w-4 h-4" />}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                        {metrics.stalled.items.length === 0 ? (
                        <div className="col-span-full">
                            <EmptyState message="El ritmo de reporte en campo es óptimo." />
                        </div>
                        ) : (
                        metrics.stalled.items.map((item) => (
                            <div
                            key={item.id}
                            onClick={() => navigate(`/field/entries/${projectId}/${item.id}`)}
                            className="group flex flex-col p-4 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border border-slate-100 hover:border-indigo-200 hover:shadow-sm"
                            >
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-1">
                                <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors line-clamp-2">
                                    {item.name}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                                    {item.code}
                                </div>
                                </div>
                                <div className="shrink-0 bg-white border border-slate-200 w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                                   <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600" />
                                </div>
                            </div>
                            </div>
                        ))
                        )}
                    </div>
                  </DashboardCard>
              </div>

              {/* Columna Derecha: Atención Inmediata (Issues & Bloqueos) */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Bloqueos Activos */}
                <DashboardCard
                  title="Bloqueos Activos"
                  icon={<AlertTriangle className="text-rose-500 w-4 h-4" />}
                  className={metrics.blocked.count > 0 ? "border-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.05)]" : ""}
                >
                  <div className="space-y-3 mt-2">
                    {metrics.blocked.items.length === 0 ? (
                      <EmptyState message="Sin bloqueos reportados en campo." />
                    ) : (
                      metrics.blocked.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-rose-50/50 rounded-xl border border-rose-100"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-slate-900 text-sm leading-tight pr-2">
                              {item.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                             <span className="text-[10px] uppercase font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-100 shadow-sm flex items-center gap-1">
                               <Calendar className="w-3 h-3"/> {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                             </span>
                          </div>
                          <p className="text-xs text-rose-800/80 line-clamp-3 font-medium bg-rose-100/50 p-2 rounded-lg">
                            {item.note || 'Sin detalles registrados del bloqueo. Contactar a residente.'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </DashboardCard>

                {/* Calidad e Issues Diarios */}
                <DashboardCard
                  title="Reporte de Calidad (Issues)"
                  icon={<AlertCircle className="text-purple-500 w-4 h-4" />}
                >
                  <div className="space-y-5 mt-4">
                    <SeverityRow label="Alta Severidad" count={metrics.issues.HIGH} color="bg-rose-500" total={metrics.issues.HIGH + metrics.issues.MEDIUM + metrics.issues.LOW} />
                    <SeverityRow label="Severidad Media" count={metrics.issues.MEDIUM} color="bg-amber-400" total={metrics.issues.HIGH + metrics.issues.MEDIUM + metrics.issues.LOW} />
                    <SeverityRow label="Severidad Baja" count={metrics.issues.LOW} color="bg-sky-400" total={metrics.issues.HIGH + metrics.issues.MEDIUM + metrics.issues.LOW} />
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">Total Abiertos</span>
                      <span className="text-lg font-black text-slate-800">{metrics.issues.HIGH + metrics.issues.MEDIUM + metrics.issues.LOW}</span>
                  </div>
                </DashboardCard>

              </div>
            </div>
          </>
        ) : null}

        {/* Mobile-first Floating Action Button for Quick Create */}
        {projectId && hasTaskCreatePermission && !isCreateModalOpen && (
          <div className="fixed bottom-24 right-5 md:hidden z-[99]">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Quick Create Modal */}
        <QuickCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => setRefreshKey((prev) => prev + 1)}
          projectId={projectId}
        />
      </div>
    </div>
  );
};

// --- Subcomponents for Bento UI ---

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const DashboardCard = ({ title, icon, children, className = '' }: DashboardCardProps) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 ${className}`}
  >
    <div className="flex items-center gap-2.5 mb-2 pb-3 border-b border-slate-100">
      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
        {icon}
      </div>
      <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">{title}</h3>
    </div>
    {children}
  </div>
);

interface SeverityRowProps {
  label: string;
  count: number;
  color: string;
  total: number;
}

const SeverityRow = ({ label, count, color, total }: SeverityRowProps) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
        <div className="w-24 text-xs font-bold text-slate-600 shrink-0">{label}</div>
        <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${Math.max(percentage, count > 0 ? 5 : 0)}%` }}
        ></div>
        </div>
        <div className="w-10 text-right shrink-0 flex items-center justify-end gap-1">
            <span className="text-sm font-black text-slate-700">{count}</span>
        </div>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
    <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-3"></div>
    <span className="text-sm font-medium text-slate-500 text-center px-4">{message}</span>
  </div>
);
