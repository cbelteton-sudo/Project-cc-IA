import React from 'react';
import { WidgetCard } from './WidgetCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import type { ProjectDashboardOverview } from '../../../hooks/useProjectDashboard';

interface WorkloadWidgetProps {
  data?: ProjectDashboardOverview['workload'];
}

export const WorkloadWidget: React.FC<WorkloadWidgetProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <WidgetCard title="Carga de Trabajo">
        <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
          Sin tareas asignadas
        </div>
      </WidgetCard>
    );
  }

  // Renombrar keys para matchear con los dataKeys de las barras (completadas, restantes, atrasadas)
  const chartData = data.map((d) => ({
    name: d.name,
    completadas: d.completed,
    restantes: d.remaining,
    atrasadas: d.overdue,
  }));

  return (
    <WidgetCard title="Carga de Trabajo">
      <div className="flex items-center space-x-4 mb-2 text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-1 bg-[#22c55e]"></div> Completadas
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-1 bg-[#06b6d4]"></div> Restantes
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-1 bg-[#f97316]"></div> Atrasadas
        </div>
      </div>
      <div className="flex-1 w-full ml-[-20px] min-h-[150px]">
        <ResponsiveContainer width={400} height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: '#f1f5f9', opacity: 0.8 }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#1e293b',
              }}
              itemStyle={{ color: '#1e293b' }}
            />
            <Bar dataKey="completadas" stackId="a" fill="#22c55e" barSize={12} />
            <Bar dataKey="restantes" stackId="a" fill="#06b6d4" />
            <Bar dataKey="atrasadas" stackId="a" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
};
