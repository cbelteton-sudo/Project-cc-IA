import React from 'react';
import { KpiCard } from './KpiCard';
import type { KpiColor } from './KpiCard';
import { AlertCircle, Clock, CheckCircle2, MoreHorizontal } from 'lucide-react';

interface KpiData {
  id: string;
  title: string;
  value: number | string;
  color: KpiColor;
  iconType: 'urgent' | 'progress' | 'done' | 'pending';
}

interface KpiCardGroupProps {
  kpis: KpiData[];
  onKpiClick?: (id: string) => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'urgent':
      return <AlertCircle className="w-5 h-5" />;
    case 'progress':
      return <Clock className="w-5 h-5" />;
    case 'done':
      return <CheckCircle2 className="w-5 h-5" />;
    case 'pending':
    default:
      return <MoreHorizontal className="w-5 h-5" />;
  }
};

export function KpiCardGroup({ kpis, onKpiClick }: KpiCardGroupProps) {
  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-4 sm:grid sm:grid-cols-2 md:grid-cols-4 min-w-max sm:min-w-0">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            color={kpi.color}
            icon={getIcon(kpi.iconType)}
            onClick={onKpiClick ? () => onKpiClick(kpi.id) : undefined}
            className="w-40 sm:w-auto flex-shrink-0"
          />
        ))}
      </div>
    </div>
  );
}
