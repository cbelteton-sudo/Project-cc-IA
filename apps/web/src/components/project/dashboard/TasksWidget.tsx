import React from 'react';
import { WidgetCard } from './WidgetCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { ProjectDashboardOverview } from '../../../hooks/useProjectDashboard';

interface TasksWidgetProps {
  data?: ProjectDashboardOverview['tasks'];
}

export const TasksWidget: React.FC<TasksWidgetProps> = ({ data }) => {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <WidgetCard title="Tareas">
        <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
          No hay tareas en el proyecto
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Tareas">
      <div className="flex items-center justify-center space-x-4 mb-6 text-xs text-gray-600">
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            {entry.name} ({entry.value})
          </div>
        ))}
      </div>
      <div className="flex-1 w-full relative min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              label={({ cx, cy, midAngle, outerRadius, value, index }) => {
                if (midAngle === undefined) return null;
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 20;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    fill={data[index].color}
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize={14}
                    fontWeight="bold"
                  >
                    {value}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#1e293b',
              }}
              itemStyle={{ color: '#1e293b' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
};
