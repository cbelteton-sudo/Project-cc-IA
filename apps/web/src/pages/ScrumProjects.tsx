import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Search, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { CreateProjectModal } from '../components/scrum/CreateProjectModal'; // Import
import { ProjectCard, type ProjectCardProps } from '../components/scrum/ProjectCard';

// Types (Mirrored from Projects.tsx)
interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  description?: string;
  globalBudget?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  managerName?: string;
  sprints?: { id: string; name: string }[];
  _count?: {
    sprints?: number;
    backlogItems?: number;
  };
}

export const ScrumProjects = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get(`/projects`)).data,
    enabled: !!token,
  });

  const filteredProjects = projects?.filter(
    (p: Project) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="flex justify-between items-center mb-8 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 min-h-screen">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CalendarClock className="text-field-orange" />
            Semanas de Obra (Agile)
          </h2>
          <p className="text-gray-500 mt-1">
            Gestiona Sprints, Backlogs y Tableros Kanban de tus proyectos.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar proyecto..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-field-blue outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <CreateProjectModal />
        </div>
      </div>

      {/* Projects Grid View */}
      {filteredProjects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
            <FolderOpen size={40} className="text-field-blue" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay proyectos aún</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Crea tu primer proyecto Scrum para comenzar a gestionar sprints, backlogs y métricas de
            tus obras.
          </p>
          <CreateProjectModal />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects?.map((project: Project) => (
            <ProjectCard key={project.id} project={project as ProjectCardProps['project']} />
          ))}
        </div>
      )}
    </div>
  );
};
