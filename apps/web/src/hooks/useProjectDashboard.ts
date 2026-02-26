import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export interface ProjectDashboardOverview {
  health: {
    timeElapsedPercent: number;
    tasksCompletionPercent: number;
    workloadOverdueTasks: number;
    progressPercent: number;
    costBudgetPercent: number;
  };
  tasks: {
    name: string;
    value: number;
    color: string;
  }[];
  progress: {
    name: string;
    percentage: number;
    color: string;
  }[];
  time: {
    name: string;
    planned: number;
    actual: number;
  }[];
  costs: {
    name: string;
    planned: number;
    actual: number;
    budget: number;
  }[];
  workload: {
    name: string;
    completed: number;
    remaining: number;
    overdue: number;
  }[];
}

export const useProjectDashboard = (projectId: string | undefined) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['projects', projectId, 'dashboard-overview'],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await api.get(`/projects/${projectId}/dashboard-overview`);
      return res.data as ProjectDashboardOverview;
    },
    enabled: !!token && !!projectId,
  });
};
