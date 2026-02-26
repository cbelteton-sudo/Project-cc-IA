import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Project {
  id: string;
  name: string;
  code?: string;
}

export const ContextSwitcher = () => {
  const navigate = useNavigate();
  const { id: currentProjectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine context based on URL param
    // If we have a projectId in URL, we are in project context
  }, [currentProjectId]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        // Fetch projects where user is a member (or all if admin)
        // Adjust endpoint if needed to ensure we get a simple list
        const { data } = await api.get('/projects');
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects', error);
      }
    };
    fetchProjects();
  }, [user]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOrgClick = () => {
    setIsOpen(false);
    navigate('/'); // Or /org/dashboard
  };

  const handleProjectClick = (project: Project) => {
    setIsOpen(false);
    navigate(`/projects/${project.id}/overview`); // Default project landing
  };

  const currentProject = projects.find((p) => p.id === currentProjectId);

  return (
    <div className="flex items-center text-sm font-medium text-gray-500">
      <button
        onClick={handleOrgClick}
        className="hover:text-blue-600 transition-colors flex items-center gap-1"
      >
        <Building2 size={16} />
        <span className="hidden sm:inline">Inicio</span>
      </button>

      {currentProjectId && (
        <>
          <span className="mx-2 text-gray-300">/</span>
          <span className="hidden sm:inline text-gray-400">Proyectos</span>
          <span className="mx-2 text-gray-300">/</span>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded hover:bg-gray-100 text-gray-800 transition-colors"
            >
              <span className="font-semibold truncate max-w-[200px]">
                {currentProject ? currentProject.name : 'Cargando...'}
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Cambiar Proyecto
                </div>

                <div className="max-h-60 overflow-y-auto">
                  {projects.length > 0 ? (
                    projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectClick(project)}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${currentProjectId === project.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                      >
                        <span className="truncate">{project.name}</span>
                        {currentProjectId === project.id && (
                          <Check size={14} className="text-blue-600" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-xs text-gray-400 italic">
                      No project memberships found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
