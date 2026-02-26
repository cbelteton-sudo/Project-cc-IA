import { api } from '../lib/api';

export interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  globalBudget?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  _count?: {
    budgets: number;
  };
  thumbnail?: string;
  managerName?: string;
  enablePMDashboard?: boolean;
  enablePunchListPro?: boolean;
}

export interface CreateProjectDTO {
  name: string;
  code: string;
  managerName?: string;
  startDate?: string;
  endDate?: string;
  globalBudget?: number;
  enablePMDashboard?: boolean;
  enablePunchListPro?: boolean;
  currency?: string;
}

export const projectsService = {
  getAll: async () => {
    const { data } = await api.get<Project[]>('/projects');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },

  create: async (project: CreateProjectDTO) => {
    const { data } = await api.post<Project>('/projects', project);
    return data;
  },

  update: async (id: string, project: Partial<CreateProjectDTO>) => {
    const { data } = await api.patch<Project>(`/projects/${id}`, project);
    return data;
  },
};
