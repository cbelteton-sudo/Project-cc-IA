import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Activity, AlertCircle, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

type DashboardMetrics = {
  activeSprintName: string;
  activeSprintProgress: number;
  velocity: number;
  totalBacklogItems: number;
  itemsByStatus: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  };
  openImpediments: number;
  sprintHealth: 'on_track' | 'ahead' | 'behind';
  recentSprints: {
    name: string;
    planned: number;
    completed: number;
    startDate: string;
    endDate: string;
  }[];
  teamSize: number;
  projectBudget: number;
  spi: number;
  cpi: number;
};

export function ScrumMetricsTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['scrum-dashboard', projectId],
    queryFn: async () => {
      const res = await api.get(`/scrum/projects/${projectId}/dashboard`);
      return res.data;
    },
  });

  const kpiCards = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: 'Sprint Activo',
        value: data.activeSprintName,
        subtext: `${data.activeSprintProgress}% Completado`,
        icon: Calendar,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
      },
      {
        label: 'SPI (Cronograma)',
        value: data.spi.toFixed(2),
        subtext: data.spi >= 1 ? 'Adelantado/A tiempo' : 'Atrasado',
        icon: Clock,
        color: data.spi >= 1 ? 'text-green-600' : 'text-red-500',
        bg: data.spi >= 1 ? 'bg-green-50' : 'bg-red-50',
      },
      {
        label: 'CPI (Costo)',
        value: data.cpi.toFixed(2),
        subtext: data.cpi >= 1 ? 'Eficiente' : 'Sobrecosto',
        icon: Activity,
        color: data.cpi >= 1 ? 'text-green-600' : 'text-orange-500',
        bg: data.cpi >= 1 ? 'bg-green-50' : 'bg-orange-50',
      },
      {
        label: 'Bloqueos activos',
        value: data.openImpediments,
        subtext: data.openImpediments > 0 ? 'Requiere atención' : 'Sin bloqueos',
        icon: AlertCircle,
        color: data.openImpediments > 0 ? 'text-red-500' : 'text-gray-400',
        bg: data.openImpediments > 0 ? 'bg-red-50' : 'bg-gray-50',
        urgent: data.openImpediments > 0,
      },
    ];
  }, [data]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) return <div>No data</div>;

  return (
    <div className="space-y-6 pt-4">
      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => (
          <Card
            key={idx}
            className={`shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-l-4 ${
              card.urgent ? 'border-l-red-500' : 'border-l-transparent'
            }`}
          >
            <CardContent className="p-6 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
                <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
                <p className="text-xs text-gray-500 mt-1">{card.subtext}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STATUS DISTRIBUTION */}
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              Estado del Sprint Activo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Por Hacer</span>
                <span className="text-lg font-bold text-gray-900">{data.itemsByStatus.todo}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-700">En Progreso</span>
                <span className="text-lg font-bold text-blue-900">
                  {data.itemsByStatus.inProgress}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-yellow-700">En Revisión</span>
                <span className="text-lg font-bold text-yellow-900">
                  {data.itemsByStatus.review}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-700">Completado</span>
                <span className="text-lg font-bold text-green-900">{data.itemsByStatus.done}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6">
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    </div>
  );
}
