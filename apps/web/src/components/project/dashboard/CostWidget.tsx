import React from 'react';
import { WidgetCard } from './WidgetCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { ProjectDashboardOverview } from '../../../hooks/useProjectDashboard';

interface CostWidgetProps {
  data?: ProjectDashboardOverview['costs'];
}

export const CostWidget: React.FC<CostWidgetProps> = ({ data }) => {
  if (!data || data.length === 0 || data.every((d) => d.budget === 0)) {
    return (
      <WidgetCard title="Costos">
        <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
          Sin presupuesto ni costos asignados
        </div>
      </WidgetCard>
    );
  }

  // Renombramos las propiedades de ingles a español para compatibilidad visual con el gráfico (opcional, o le cambiamos el accessor)
  const chartData = data.map((d) => ({
    name: d.name,
    real: d.actual,
    planeado: d.planned,
    presupuesto: d.budget,
  }));

  return (
    <WidgetCard title="Costos">
      <div className="flex flex-wrap items-center space-x-4 mb-2 text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-1 bg-[#84cc16]"></div> Real
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-1 bg-[#38bdf8]"></div> Planeado
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-1 bg-[#3b82f6]"></div> Presupuesto
        </div>
      </div>
      <div className="flex-1 w-full mx-[-10px] min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 10 }}
              tickFormatter={(val) => (val === 0 ? '$0' : `${val / 1000}K`)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#1e293b',
              }}
              itemStyle={{ color: '#1e293b' }}
            />
            <Line
              type="monotone"
              dataKey="real"
              stroke="#84cc16"
              strokeWidth={3}
              dot={{ r: 4, fill: '#84cc16' }}
            />
            <Line
              type="monotone"
              dataKey="planeado"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ r: 4, fill: '#38bdf8' }}
            />
            <Line
              type="monotone"
              dataKey="presupuesto"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
};
