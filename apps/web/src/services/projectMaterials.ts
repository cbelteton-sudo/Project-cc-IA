import { api } from '../lib/api';

export interface ProjectMaterial {
  id: string;
  projectId: string;
  materialId: string;
  projectSKU?: string;
  costCenter?: string;
  plannedQty: number;
  plannedPrice: number;
  stockAvailable: number;
  stockConsumed: number;
  material?: {
    id: string;
    name: string;
    description?: string;
    unit: string;
    costParam: number;
  };
}
export interface FinancialVariance {
  id: string;
  materialName: string;
  unit: string;
  plannedQty: number;
  stockConsumed: number;
  qtyPurchased: number;
  plannedPrice: number;
  wac: number;
  marketCostParam: number;
  priceVariance: number;
  quantityVariance: number;
  totalVariance: number;
  benchmarkIndex: number;
  eac: number;
  budgetAtCompletion: number;
}

export interface CreateProjectMaterialDTO {
  projectId: string;
  materialId: string;
  projectSKU?: string;
  costCenter?: string;
  plannedQty?: number;
  plannedPrice?: number;
}

export interface ReceiveProjectMaterialDTO {
  quantity: number;
  price?: number;
  date?: string;
  notes?: string;
  poNumber?: string;
  poDocumentUrl?: string;
}

export interface KardexMovement {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  quantity: number;
  amount: number;
  reference: string;
  notes?: string;
  documentNumber?: string | null;
  documentUrl?: string | null;
  activity?: {
    id: string;
    name: string;
  } | null;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export const projectMaterialsService = {
  getAllByProject: async (projectId: string) => {
    const { data } = await api.get<ProjectMaterial[]>('/project-materials', {
      params: { projectId },
    });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ProjectMaterial>(`/project-materials/${id}`);
    return data;
  },

  create: async (payload: CreateProjectMaterialDTO) => {
    const { data } = await api.post<ProjectMaterial>('/project-materials', payload);
    return data;
  },

  update: async (id: string, payload: Partial<CreateProjectMaterialDTO>) => {
    const { data } = await api.patch<ProjectMaterial>(`/project-materials/${id}`, payload);
    return data;
  },

  receive: async (id: string, payload: ReceiveProjectMaterialDTO) => {
    const { data } = await api.post<ProjectMaterial>(`/project-materials/${id}/receive`, payload);
    return data;
  },

  getKardex: async (id: string) => {
    const { data } = await api.get<KardexMovement[]>(`/project-materials/${id}/kardex`);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/project-materials/${id}`);
    return data;
  },

  getFinancialVariance: async (projectId: string) => {
    const { data } = await api.get<FinancialVariance[]>('/project-materials/financial-variance', {
      params: { projectId },
    });
    return data;
  },
};
