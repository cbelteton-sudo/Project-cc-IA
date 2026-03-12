import React from 'react';
import { WidgetCard } from './WidgetCard';
import type { ProjectDashboardOverview } from '../../../hooks/useProjectDashboard';

interface ProgressWidgetProps {
  data?: ProjectDashboardOverview['progress'];
}

export const ProgressWidget: React.FC<ProgressWidgetProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <WidgetCard title="Progreso">
        <div className="flex flex-col mt-4 w-full px-2 h-[150px] items-center justify-center text-sm text-gray-400">
          No hay fases de progreso
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Progreso">
      <div className="flex flex-col mt-4 w-full px-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex flex-col w-full mb-4 last:mb-0">
            <div className="flex justify-between items-end mb-1">
              <span className="text-gray-700 font-medium text-xs">{item.name}</span>
              <span className="text-gray-400 text-[10px] font-medium">
                <span className={item.percentage > 0 ? 'text-gray-700 font-bold' : ''}>
                  {item.percentage}%
                </span>{' '}
                / 100%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              {item.percentage > 0 && (
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                ></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
};
