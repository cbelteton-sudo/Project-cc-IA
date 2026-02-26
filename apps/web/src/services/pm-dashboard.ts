import { api } from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../context/AuthContext';

export interface PMDashboardData {
  stalled: any[];
  blocked: any[];
  issues: {
    total: number;
    overdue: any[];
    atRisk: any[];
  };
  topContractors: any[];
  projectName: string;
}

export const usePMDashboard = (projectId: string) => {
  const { token } = useAuth();
  return useQuery<PMDashboardData>({
    queryKey: ['pm-dashboard', projectId],
    queryFn: async () => {
      const { data } = await api.get(`/pm-dashboard/project/${projectId}`);
      return data;
    },
    enabled: !!projectId && !!token,
  });
};

export const useBlockActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ activityId, reason, comment, eta, ownerId }: any) => {
      const { data } = await api.patch(`/pm-dashboard/activity/${activityId}/block`, {
        reason,
        comment,
        eta,
        ownerId,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pm-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['project-activities'] });
    },
  });
};

export const useCommitActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ activityId, date }: any) => {
      const { data } = await api.patch(`/pm-dashboard/activity/${activityId}/commit`, {
        date,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['project-activities'] });
    },
  });
};

export const useRequestUpdate = () => {
  return useMutation({
    mutationFn: async ({ activityId }: any) => {
      const { data } = await api.post(`/pm-dashboard/activity/${activityId}/request-update`, {});
      return data;
    },
  });
};
