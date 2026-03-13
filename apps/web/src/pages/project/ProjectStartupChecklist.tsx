import React from 'react';
import { useParams } from 'react-router-dom';
import { StartupMaterialChecklist } from '../../components/materials/StartupMaterialChecklist';
import { useProjects } from '../../hooks/useProjects';
import { ClipboardCheck } from 'lucide-react';

export const ProjectStartupChecklist = () => {
  const { id } = useParams<{ id: string }>();
  const { data: projects } = useProjects();
  const currentProject = projects?.find((p) => p.id === id);

  return (
    <div className="bg-slate-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] w-full mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checklist de Materiales Iniciales</h1>
              <p className="text-gray-500 text-sm mt-1">
                {currentProject ? `Proyecto: ${currentProject.name}` : 'Cargando proyecto...'}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <StartupMaterialChecklist 
            projectId={id || ''} 
            projectName={currentProject?.name} 
            pmName={currentProject?.managerName} 
          />
        </div>
      </div>
    </div>
  );
};
