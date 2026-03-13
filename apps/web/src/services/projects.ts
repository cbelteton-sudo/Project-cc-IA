import { api } from '../lib/api';
import type { UserDTO } from './users';

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
  enableScrum?: boolean;
  enableBudget?: boolean;
  enableFieldManagement?: boolean;
  enableMaterials?: boolean;
  costCenters?: { code: string; name: string }[];
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
  enableScrum?: boolean;
  enableBudget?: boolean;
  enableFieldManagement?: boolean;
  enableMaterials?: boolean;
  currency?: string;
  costCenters?: { code: string; name: string }[];
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

  getMembers: async (id: string) => {
    const { data } = await api.get<{ user: UserDTO }[]>(`/projects/${id}/members`);
    // Extract the user object from the ProjectMember relation
    return data.map((member) => member.user);
  },
};
