import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  description?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  globalBudget?: number;
  managerName?: string;
  constructorName?: string;
  projectManagerId?: string;
  mainContractorId?: string;
  enableScrum?: boolean;
  enableBudget?: boolean;
  enableFieldManagement?: boolean;
  enablePMDashboard?: boolean;
  enablePunchListPro?: boolean;
  enableMaterials?: boolean;
}

export const useProjects = () => {
  const { token } = useAuth();
  // API_URL handled by api instance

  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data as Project[];
    },
    enabled: !!token,
  });
};
