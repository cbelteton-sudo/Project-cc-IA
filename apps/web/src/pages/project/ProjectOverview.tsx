import React from 'react';
import { useParams } from 'react-router-dom';
import { ProgressWidget } from '../../components/project/dashboard/ProgressWidget';
import { SprintWidget } from '../../components/project/dashboard/SprintWidget';
import { CostWidget } from '../../components/project/dashboard/CostWidget';
import { MilestonesWidget } from '../../components/project/dashboard/MilestonesWidget';
import { ConstructorProgressWidget } from '../../components/project/dashboard/ConstructorProgressWidget';
import { BlockersWidget } from '../../components/project/dashboard/BlockersWidget';
import { useProjectDashboard } from '../../hooks/useProjectDashboard';
import { useProjects } from '../../hooks/useProjects';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ProjectOverview = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useProjectDashboard(id);
  const { data: projects } = useProjects();

  const currentProject = projects?.find((p) => p.id === id);
  const reportDate = format(new Date(), "dd 'de' MMMM 'del' yyyy", { locale: es });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mt-4 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <span>Cargando datos del proyecto...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mt-4 flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">Error al cargar el resumen del proyecto.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl text-gray-800 font-semibold tracking-wide">
            Dashboard Resumen {currentProject?.name ? `- ${currentProject.name}` : ''}
          </h2>
        </div>
        <div className="flex items-center text-xs text-gray-600">
          <span className="bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
            Reporte al: {reportDate}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MilestonesWidget data={data?.milestones} />
        <ConstructorProgressWidget data={data?.constructorProgress} />
        <BlockersWidget data={data?.blockers} />
        <ProgressWidget data={data?.progress} />
        <SprintWidget data={data?.activeSprint || null} />
        <CostWidget data={data?.costs} />
      </div>
    </div>
  );
};

export default ProjectOverview;
