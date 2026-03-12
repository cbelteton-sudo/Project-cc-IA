import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export interface ProjectDashboardOverview {
  health: {
    timeElapsedPercent: number;
    progressPercent: number;
    costBudgetPercent: number;
  };
  progress: {
    name: string;
    percentage: number;
    color: string;
  }[];
  activeSprint: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    goal: string;
    completedTasks: number;
    totalTasks: number;
    blockedTasks: number;
  } | null;
  costs: {
    name: string;
    planned: number;
    actual: number | null;
    budget: number;
  }[];
  milestones: {
    name: string;
    date: string;
    status: string;
  }[];
  constructorProgress: {
    name: string;
    progress: number;
    color: string;
  }[];
  blockers: {
    totalBlocked: number;
    categories: {
      reason: string;
      count: number;
      color: string;
    }[];
  };
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
