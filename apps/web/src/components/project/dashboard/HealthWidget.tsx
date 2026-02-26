import React from 'react';
import { WidgetCard } from './WidgetCard';
import type { ProjectDashboardOverview } from '../../../hooks/useProjectDashboard';

interface HealthWidgetProps {
  data?: ProjectDashboardOverview['health'];
}

export const HealthWidget: React.FC<HealthWidgetProps> = ({ data }) => {
  if (!data) {
    return (
      <WidgetCard title="General">
        <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
          No hay información general disponible
        </div>
      </WidgetCard>
    );
  }

  const metrics = [
    {
      label: 'Tiempo',
      text: `${data.timeElapsedPercent}% del tiempo transcurrido.`,
      highlight: false,
    },
    {
      label: 'Tareas',
      text: `${data.tasksCompletionPercent}% tareas completadas.`,
      highlight: false,
    },
    {
      label: 'Carga',
      text: `${data.workloadOverdueTasks} tareas vencidas.`,
      highlight: data.workloadOverdueTasks > 0,
    },
    { label: 'Progreso', text: `${data.progressPercent}% de avance promedio.`, highlight: true },
    {
      label: 'Financiero',
      text: `${data.costBudgetPercent}% del presupuesto ejecutado.`,
      highlight: true,
    },
  ];

  return (
    <WidgetCard title="General">
      <div className="flex flex-col space-y-6 mt-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex grid grid-cols-[100px_1fr] text-sm items-center">
            <span className="text-gray-700 font-medium">{metric.label}</span>
            <span className="text-gray-600">{metric.text}</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
};
