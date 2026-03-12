import { api } from '../lib/api';

export interface Material {
  id: string;
  name: string;
  description?: string;
  unit: string;
  costParam: number;
  tenantId: string;
}

export interface CreateMaterialDTO {
  name: string;
  description?: string;
  unit: string;
  costParam: number;
}

export const materialsService = {
  getAll: async () => {
    const { data } = await api.get<Material[]>('/materials');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Material>(`/materials/${id}`);
    return data;
  },

  create: async (payload: CreateMaterialDTO) => {
    const { data } = await api.post<Material>('/materials', payload);
    return data;
  },

  update: async (id: string, payload: Partial<CreateMaterialDTO>) => {
    const { data } = await api.patch<Material>(`/materials/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/materials/${id}`);
    return data;
  },
};
