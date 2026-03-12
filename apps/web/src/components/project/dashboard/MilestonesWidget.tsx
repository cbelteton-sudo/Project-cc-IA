import React from 'react';
import { WidgetCard } from './WidgetCard';
import type { ProjectDashboardOverview } from '../../../hooks/useProjectDashboard';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface MilestonesWidgetProps {
  data?: ProjectDashboardOverview['milestones'];
}

export const MilestonesWidget: React.FC<MilestonesWidgetProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <WidgetCard title="Estado de Hitos">
        <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
          Sin hitos definidos
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Estado de Hitos">
      <div className="flex flex-col space-y-4 mt-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {item.status === 'ON_TRACK' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {item.status === 'AT_RISK' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {item.status === 'DELAYED' && <Clock className="w-5 h-5 text-rose-500" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate" title={item.name}>{item.name}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">Para el {item.date}</span>
              </div>
            </div>
            <div className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-md border whitespace-nowrap text-center uppercase tracking-wider ${
              item.status === 'ON_TRACK' ? 'bg-green-100 text-green-800 border-green-300' :
              item.status === 'AT_RISK' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              item.status === 'DELAYED' ? 'bg-red-50 text-red-700 border-red-200' :
              'bg-gray-50 text-gray-700 border-gray-200'
            }`}>
              {item.status === 'ON_TRACK' && 'En tiempo'}
              {item.status === 'AT_RISK' && 'En riesgo'}
              {item.status === 'DELAYED' && 'Atrasado'}
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
};
