import React from 'react';
import { WidgetCard } from './WidgetCard';
import type { ProjectDashboardOverview } from '../../../hooks/useProjectDashboard';
import { ShieldAlert } from 'lucide-react';

interface BlockersWidgetProps {
  data?: ProjectDashboardOverview['blockers'];
}

export const BlockersWidget: React.FC<BlockersWidgetProps> = ({ data }) => {
  if (!data || data.totalBlocked === 0) {
    return (
      <WidgetCard title="Actividades Bloqueadas">
        <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
          Sin bloqueos actuales
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Actividades Bloqueadas">
      <div className="flex flex-col h-full mt-2">
        <div className="flex items-center space-x-3 mb-6 p-4 bg-orange-50 border border-orange-100 rounded-lg">
          <div className="p-2 bg-orange-100 rounded-full text-orange-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900">{data.totalBlocked}</span>
            <span className="text-xs text-gray-600">Total Bloqueadas</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Por Motivo</h4>
          {data.categories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                <span className="text-gray-700">{cat.reason}</span>
              </div>
              <span className="font-semibold text-gray-900 px-2 py-0.5 bg-gray-100 rounded text-xs">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
};
