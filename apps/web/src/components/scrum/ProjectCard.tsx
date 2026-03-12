import {
  CalendarClock,
  MoreVertical,
  Calendar,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    status: string;
    startDate?: string;
    endDate?: string;
    sprints?: { id: string; name: string }[];
    _count?: {
      sprints?: number;
      backlogItems?: number;
    };
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
      case 'CLOSED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DONE':
      case 'CLOSED':
        return 'Completado';
      case 'ACTIVE':
        return 'Activo';
      default:
        return 'Planificación';
    }
  };

  const activeSprint = project.sprints?.[0]; // Assuming first is active if sorted, as per ScrumProjects logic

  return (
    <div
      className="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 transition-all duration-200 flex flex-col h-full cursor-pointer hover:border-field-blue/30"
      onClick={() => navigate(`/projects/${project.id}/scrum`)}
    >
      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-2 items-center">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(
                project.status,
              )}`}
            >
              {getStatusLabel(project.status)}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-600 -mr-2"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/projects/${project.id}/scrum`);
                }}
              >
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/projects/${project.id}/settings`);
                }}
              >
                Configuración
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title & Desc */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-field-blue transition-colors line-clamp-1">
          {project.name}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">
          {project.description || 'Sin descripción'}
        </p>

        {/* Stats / Info */}
        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={14} className="text-gray-400" />
            <span className="font-medium">Inicio:</span>
            <span>
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : '---'}
            </span>
          </div>

          {project._count && (
            <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
              {project._count.sprints !== undefined && (
                <div className="flex items-center gap-1">
                  <CalendarClock size={12} />
                  <span>{project._count.sprints} Sprints</span>
                </div>
              )}
              {project._count.backlogItems !== undefined && (
                <div className="flex items-center gap-1">
                  <Briefcase size={12} />
                  <span>{project._count.backlogItems} Items</span>
                </div>
              )}
            </div>
          )}

          {/* Active Sprint Badge */}
          {activeSprint && (
            <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <div className="text-xs">
                <span className="text-emerald-800 font-bold block">Sprint Activo</span>
                <span className="text-emerald-600 truncate max-w-[180px] block">
                  {activeSprint.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-between items-center">
        <span className="text-xs text-gray-400 font-mono">ID: {project.id.slice(0, 8)}</span>
        <div className="text-xs font-bold text-field-blue flex items-center gap-1 group-hover:underline">
          Abrir Proyecto <ExternalLink size={12} />
        </div>
      </div>
    </div>
  );
}
