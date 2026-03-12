import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Folder, Search, Building2, Briefcase, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Types
import { projectsService, type Project } from '../services/projects';
import { CreateProjectModal } from '@/components/scrum/CreateProjectModal';

// Shared Tab/Filter State Types
type FilterTab = 'all' | 'active' | 'risk' | 'done';

const FilterPill = ({
  label,
  active,
  hasDropdown,
  onClick,
}: {
  label: string;
  active?: boolean;
  hasDropdown?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5
      ${
        active
          ? 'bg-gray-100 border-gray-200 text-gray-900'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
  >
    {label}
    {hasDropdown && <ChevronDown size={14} className="text-gray-400" />}
  </button>
);

const TabOption = ({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active?: boolean;
  color?: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
      ${
        active
          ? 'border-gray-900 text-gray-900'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
  >
    {label}
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-bold ${color || 'bg-gray-100 text-gray-700'}`}
    >
      {count}
    </span>
  </button>
);

export const Projects = () => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [activeFilters, setActiveFilters] = useState<string[]>(['mis-proyectos']);
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);

  // Fetch Projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.getAll,
    enabled: !!token,
  });

  const managers = useMemo(() => {
    if (!projects) return [];
    const allManagers = projects.map((p: Project) => (p as any).managerName).filter(Boolean);
    return Array.from(new Set(allManagers));
  }, [projects]);

  const getProjectStatus = (project: Project) => {
    // 1. Projects marked as finished
    if (project.status === 'DONE' || project.status === 'CLOSED') {
      return { label: 'Terminado', color: 'bg-green-100 text-green-700 border-green-200' };
    }

    // 2. Projects without start date (Newly created) -> "No iniciado"
    if (!project.startDate) {
      return { label: 'No iniciado', color: 'bg-gray-100 text-gray-500 border-gray-200' };
    }

    // 3. Status checks based on endDate
    if (!project.endDate) {
      // Default active status (homologated from "En Progreso") -> "En Tiempo" (Optimistic)
      return { label: 'En Tiempo', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }

    const now = new Date();
    const end = new Date(project.endDate);
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Atrasado', color: 'bg-red-100 text-red-700 border-red-200' };
    } else if (diffDays < 14) {
      // Less than 2 weeks warning
      return { label: 'En Riesgo', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    } else {
      return { label: 'En Tiempo', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
  };
  const filteredProjects = projects?.filter((p: Project) => {
    // Search text
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (p.name?.toLowerCase() || '').includes(searchLower) ||
      (p.code?.toLowerCase() || '').includes(searchLower);

    if (!matchesSearch) return false;

    // Manager filter
    const matchesManager = !selectedManager || (p as any).managerName === selectedManager;
    if (!matchesManager) return false;

    // Tab filtering
    const status = getProjectStatus(p);
    if (activeTab === 'active') {
      return (
        status.label === 'En Tiempo' ||
        status.label === 'En Riesgo' ||
        status.label === 'No iniciado'
      );
    }
    if (activeTab === 'risk') {
      return status.label === 'En Riesgo' || status.label === 'Atrasado';
    }
    if (activeTab === 'done') {
      return status.label === 'Terminado';
    }

    return true; // 'all'
  });

  // Derive counts for tabs based on status (calculate from ALL projects, not filtered ones)
  const allCount = projects?.length || 0;
  const activeCount =
    projects?.filter((p: Project) => {
      const status = getProjectStatus(p);
      return (
        status.label === 'En Tiempo' ||
        status.label === 'En Riesgo' ||
        status.label === 'No iniciado'
      );
    }).length || 0;
  const atRiskCount =
    projects?.filter((p: Project) => {
      const status = getProjectStatus(p);
      return status.label === 'En Riesgo' || status.label === 'Atrasado';
    }).length || 0;
  const doneCount =
    projects?.filter((p: Project) => {
      const status = getProjectStatus(p);
      return status.label === 'Terminado';
    }).length || 0;

  if (isLoading)
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
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

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 min-h-screen bg-gray-50/30">
      {/* Action Center Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 mt-2">
        <div className="flex items-center gap-3">
          <Briefcase className="text-gray-700" size={28} />
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Gestión de Proyectos</h2>
        </div>

        {/* Filters, Search and New Project Button */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full xl:w-auto">
          {/* Pill Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <FilterPill
              label="Mis proyectos"
              active={activeFilters.includes('mis-proyectos')}
              onClick={() =>
                setActiveFilters((prev) =>
                  prev.includes('mis-proyectos')
                    ? prev.filter((f) => f !== 'mis-proyectos')
                    : [...prev, 'mis-proyectos'],
                )
              }
            />
          </div>

          {/* Responsable Dropdown */}
          <div className="relative">
            <FilterPill
              label={selectedManager ? `Resp: ${selectedManager}` : 'Responsable'}
              active={!!selectedManager}
              hasDropdown
              onClick={() => setIsManagerDropdownOpen(!isManagerDropdownOpen)}
            />

            {isManagerDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-xl z-20 min-w-[200px] py-1 overflow-hidden">
                <div
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 font-medium border-b border-gray-100"
                  onClick={() => {
                    setSelectedManager(null);
                    setIsManagerDropdownOpen(false);
                  }}
                >
                  Todos
                </div>
                {managers.map((manager) => (
                  <div
                    key={manager as string}
                    className={`px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm ${selectedManager === manager ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                    onClick={() => {
                      setSelectedManager(manager as string);
                      setIsManagerDropdownOpen(false);
                    }}
                  >
                    {manager as string}
                  </div>
                ))}
                {managers.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500 italic">
                    No hay responsables asignados
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative flex-1 w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar proyectos..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <CreateProjectModal
            customTrigger={
              <button className="bg-brand-ambar text-white px-4 py-2 rounded-full flex justify-center items-center gap-2 hover:bg-brand-oro transition shadow-sm font-medium text-sm whitespace-nowrap active:scale-95 w-full md:w-auto">
                <Plus size={16} />
                <span className="inline">Nuevo Proyecto</span>
              </button>
            }
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 sm:gap-6 border-b border-gray-200 mb-6 overflow-x-auto hide-scrollbar pb-1">
        <TabOption
          label="Todos"
          count={allCount}
          active={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
        />
        <TabOption
          label="Activos"
          count={activeCount}
          active={activeTab === 'active'}
          color={activeTab === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-blue-50 text-blue-600'}
          onClick={() => setActiveTab('active')}
        />
        <TabOption
          label="En Riesgo"
          count={atRiskCount}
          active={activeTab === 'risk'}
          color={
            activeTab === 'risk' ? 'bg-orange-100 text-orange-800' : 'bg-orange-50 text-orange-600'
          }
          onClick={() => setActiveTab('risk')}
        />
        <TabOption
          label="Terminados"
          count={doneCount}
          active={activeTab === 'done'}
          color={
            activeTab === 'done' ? 'bg-green-100 text-green-800' : 'bg-green-50 text-green-600'
          }
          onClick={() => setActiveTab('done')}
        />
      </div>

      {/* Data Table */}
      {filteredProjects?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No se encontraron proyectos</h3>
          <p className="text-gray-500 mb-6">Prueba con otra búsqueda o crea uno nuevo.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-gray-200 w-full overflow-hidden">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-sm font-bold text-gray-700 w-1/3">Proyecto</th>
                  <th className="px-6 py-3 text-sm font-bold text-gray-700">Responsable</th>
                  <th className="px-6 py-3 text-sm font-bold text-gray-700">Entrega</th>
                  <th className="px-6 py-3 text-sm font-bold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProjects?.map((project: Project) => {
                  const status = getProjectStatus(project);

                  return (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Building2 size={16} className="text-gray-400 shrink-0" />
                          <span className="text-sm font-medium text-gray-800">{project.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {/* Mocking Manager for now if not available */}
                          {project.managerName || (
                            <span className="text-gray-400 italic">Sin asignar</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {project.endDate ? (
                          new Intl.DateTimeFormat('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          }).format(new Date(project.endDate))
                        ) : (
                          <span className="text-gray-400 italic font-light">No definida</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Link
                            to={`/projects/${project.id}/plan`}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                          >
                            Plan
                          </Link>
                          <Link
                            to={`/projects/${project.id}`}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-100"
                          >
                            Detalle
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal remains mostly the same, just styled a bit if needed. Keeping original modal logic. */}
    </div>
  );
};
