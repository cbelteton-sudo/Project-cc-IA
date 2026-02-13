import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Activity,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { KPICard } from '../dashboard/KPICard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

interface DashboardMetrics {
  activeSprintProgress: number;
  velocity: number;
  totalBacklogItems: number;
  itemsCompletedThisMonth: number;
  openImpediments: number;
  sprintHealth: number;
  recentSprints: {
    name: string;
    planned: number;
    completed: number;
  }[];
}

interface ScrumKPIsProps {
  projectId: string;
}

export const ScrumKPIs: React.FC<ScrumKPIsProps> = ({ projectId }) => {
  // 1. Fetch High-Level Metrics (New Endpoint)
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery<DashboardMetrics>({
    queryKey: ['scrum-dashboard', projectId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/scrum/projects/${projectId}/dashboard`);
      return response.data;
    },
  });

  // 2. Fetch Detailed Sprints for Lists (Legacy/Detail View)
  // We keep this to show Retrospectives and specific finished tasks, which aren't in the summary DTO yet.
  const { data: sprints, isLoading: isLoadingSprints } = useQuery({
    queryKey: ['scrum', 'sprints', projectId],
    queryFn: async () => (await axios.get(`${API_URL}/scrum/sprints/${projectId}`)).data,
  });

  if (isLoadingMetrics || isLoadingSprints) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Default values if data is missing
  const stats = metrics || {
    activeSprintProgress: 0,
    velocity: 0,
    totalBacklogItems: 0,
    itemsCompletedThisMonth: 0,
    openImpediments: 0,
    sprintHealth: 100,
    recentSprints: [],
  };

  return (
    <div className="space-y-8 p-2 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">Dashboard & Analytics</h2>
        <p className="text-sm text-gray-500">Resumen de rendimiento del proyecto Scrum</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Progreso Sprint Actual"
          value={stats.activeSprintProgress}
          icon={Clock}
          color="blue"
          suffix="%"
        />
        <KPICard
          title="Velocidad (Prom. 3 Sprints)"
          value={stats.velocity}
          icon={TrendingUp}
          color="purple"
          decimals={1}
          suffix=" pts"
        />
        <KPICard
          title="Backlog Total"
          value={stats.totalBacklogItems}
          icon={ListTodo}
          color="indigo"
          suffix=" ítems"
        />
        <KPICard
          title="Completados (Mes)"
          value={stats.itemsCompletedThisMonth}
          icon={CheckCircle2}
          color="green"
          suffix=" ítems"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Velocity Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-indigo-600" />
            Historial de Velocidad (Puntos de Historia)
          </h3>
          <div className="h-[300px] w-full">
            {stats.recentSprints.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.recentSprints}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend iconType="circle" />
                  <Bar
                    dataKey="planned"
                    name="Planificado"
                    fill="#E5E7EB"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completado"
                    fill="#4F46E5"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 italic">
                No hay suficientes datos de sprints cerrados.
              </div>
            )}
          </div>
        </div>

        {/* Health & Risks */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 w-full text-left">
              Salud del Sprint
            </h3>
            <div className="relative h-48 w-48">
              <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={
                    stats.sprintHealth >= 80
                      ? '#10B981'
                      : stats.sprintHealth > 50
                        ? '#F59E0B'
                        : '#EF4444'
                  }
                  strokeWidth="3"
                  strokeDasharray={`${stats.sprintHealth}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute top-0 left-0 h-full w-full flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">{stats.sprintHealth}</span>
                <span className="text-xs text-gray-500 uppercase font-semibold mt-1">
                  Puntuación
                </span>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4 px-4">
              {stats.sprintHealth >= 80
                ? 'El ritmo del equipo es saludable y constante.'
                : 'Se detectan riesgos en el cumplimiento de objetivos.'}
            </p>
          </div>

          <KPICard
            title="Impedimentos Abiertos"
            value={stats.openImpediments}
            icon={AlertCircle}
            color={stats.openImpediments > 2 ? 'red' : 'amber'}
          />
        </div>
      </div>

      {/* Retrospectives Section (Legacy Support) */}
      <div className="space-y-4 pt-4">
        <h3 className="font-bold text-gray-800 text-lg">Retrospectivas Recientes</h3>
        {sprints
          ?.filter((s: any) => s.status === 'CLOSED' && s.retros && s.retros.length > 0)
          .map((sprint: any) => (
            <div
              key={sprint.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex justify-between items-center">
                <h4 className="font-bold text-indigo-900">{sprint.name}</h4>
                <span className="text-xs text-indigo-600 font-medium bg-white px-2 py-1 rounded-md border border-indigo-100">
                  {new Date(sprint.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="p-6">
                {sprint.retros.map((retro: any) => (
                  <div key={retro.id} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-green-700 uppercase tracking-wide">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> Qué mantener
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-sm text-gray-700 min-h-[80px] whitespace-pre-wrap border border-green-100 shadow-sm">
                        {retro.keep || (
                          <span className="text-gray-400 italic">Nada registrado</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-amber-700 uppercase tracking-wide">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Qué mejorar
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg text-sm text-gray-700 min-h-[80px] whitespace-pre-wrap border border-amber-100 shadow-sm">
                        {retro.improve || (
                          <span className="text-gray-400 italic">Nada registrado</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-red-700 uppercase tracking-wide">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span> Qué dejar
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg text-sm text-gray-700 min-h-[80px] whitespace-pre-wrap border border-red-100 shadow-sm">
                        {retro.stop || (
                          <span className="text-gray-400 italic">Nada registrado</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
