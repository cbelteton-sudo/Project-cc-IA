import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  ArrowRight,
  Loader,
  Search,
  Folder,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { CreateProjectModal } from '../components/scrum/CreateProjectModal'; // Import

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

// Types (Mirrored from Projects.tsx)
interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  globalBudget?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  managerName?: string;
  sprints?: { id: string; name: string }[];
}

export const ScrumProjects = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () =>
      (
        await axios.get(`${API_URL}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).data,
    enabled: !!token,
  });

  const getProjectStatus = (project: Project) => {
    if (project.status === 'DONE' || project.status === 'CLOSED') {
      return { label: 'Terminado', color: 'bg-green-100 text-green-700 border-green-200' };
    }
    if (!project.startDate) {
      return { label: 'No iniciado', color: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
    if (!project.endDate) {
      return { label: 'En Tiempo', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }

    const now = new Date();
    const end = new Date(project.endDate);
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Atrasado', color: 'bg-red-100 text-red-700 border-red-200' };
    } else if (diffDays < 14) {
      return { label: 'En Riesgo', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    } else {
      return { label: 'En Tiempo', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
  };

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
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
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

      {/* Projects Table List View */}
      {filteredProjects?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No se encontraron proyectos</h3>
          <p className="text-gray-500 mb-6">
            Comienza creando un nuevo proyecto para gestionar tus obras.
          </p>
          <CreateProjectModal />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden ring-1 ring-black/5">
          <table className="w-full text-left border-collapse">
            <thead className="bg-field-blue text-white shadow-md z-10 relative">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/90">
                  Proyecto
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/90">
                  Responsable
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-white/90">
                  Estado
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/90">
                  Entrega
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/90">
                  Sprint Activo
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center text-white/90">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProjects?.map((project: Project) => {
                const status = getProjectStatus(project);
                const activeSprint = project.sprints?.[0]; // Assuming backend returns [0] as the active one due to query

                return (
                  <tr
                    key={project.id}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/scrum/${project.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 group-hover:text-field-blue transition-colors text-base py-2">
                        {project.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {project.managerName || (
                          <span className="text-gray-400 italic">No asignado</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {project.endDate ? (
                          new Date(project.endDate).toLocaleDateString()
                        ) : (
                          <span className="text-gray-400 italic">---</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {activeSprint ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/scrum/${project.id}?tab=board`);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-sm font-bold cursor-pointer hover:bg-emerald-100 transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          {activeSprint.name}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">Sin Sprint Activo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/scrum/${project.id}`);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-field-orange bg-orange-50 hover:bg-orange-100 rounded-md transition-colors border border-orange-100/50 shadow-sm"
                        >
                          <span>Ver Tablero</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
