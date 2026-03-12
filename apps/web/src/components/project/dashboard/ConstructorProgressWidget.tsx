import React from 'react';
import { WidgetCard } from './WidgetCard';
import type { ProjectDashboardOverview } from '../../../hooks/useProjectDashboard';

interface ConstructorProgressWidgetProps {
  data?: ProjectDashboardOverview['constructorProgress'];
}

export const ConstructorProgressWidget: React.FC<ConstructorProgressWidgetProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <WidgetCard title="Avance por Contratista">
        <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
          Sin contratistas asignados
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Avance por Contratista">
      <div className="flex flex-col space-y-4 mt-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
              <span className="text-sm font-semibold text-gray-900">{item.progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ width: `${item.progress}%`, backgroundColor: item.color }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
};
