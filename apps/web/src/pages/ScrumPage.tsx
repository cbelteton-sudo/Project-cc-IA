import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ScrumDashboard } from '../components/scrum/ScrumDashboard';
import { ChevronLeft } from 'lucide-react';

export const ScrumPage = () => {
  const { projectId } = useParams();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => (await axios.get(`${API_URL}/projects/${projectId}`)).data,
    enabled: !!projectId,
  });

  if (!projectId) return <div>Project ID missing</div>;

  return (
    <div className="space-y-4">
      <nav className="flex items-center text-sm text-gray-500 mb-4">
        <Link to="/scrum" className="hover:text-blue-600 transition-colors">
          Proyectos
        </Link>
        <ChevronLeft className="w-4 h-4 mx-1 rotate-180" />
        {project ? (
          <span className="font-semibold text-gray-900">{project.name}</span>
        ) : (
          <span className="animate-pulse bg-gray-200 h-4 w-24 rounded"></span>
        )}
      </nav>
      <ScrumDashboard projectId={projectId} />
    </div>
  );
};
