import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface StartupChecklistItem {
  id: string;
  materialName: string;
  unit: string;
  plannedQty: number;
  stockAvailable: number;
  isComplete: boolean;
  progressPercentage: number;
}

export interface StartupChecklistData {
  totalItems: number;
  completeItems: number;
  overallProgress: number;
  items: StartupChecklistItem[];
}

export const useStartupChecklist = (projectId?: string) => {
  return useQuery<StartupChecklistData>({
    queryKey: ['startup-checklist', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data } = await api.get(`/project-materials/startup-checklist`, {
        params: { projectId },
      });
      return data;
    },
    enabled: !!projectId,
  });
};
