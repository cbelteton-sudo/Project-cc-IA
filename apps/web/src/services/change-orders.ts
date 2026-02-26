import { api } from '../lib/api';

export interface ChangeOrderItem {
  id: string;
  budgetLineId: string;
  description: string;
  amount: number;
  budgetLine?: {
    name: string;
    code: string;
  };
}

export interface ChangeOrder {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  amount: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  items: ChangeOrderItem[];
  createdAt: string;
  approverId?: string;
  approvedAt?: string;
}

export interface CreateChangeOrderDto {
  projectId: string;
  title: string;
  description?: string;
  items: {
    budgetLineId: string;
    description: string;
    amount: number;
  }[];
}

export const changeOrdersService = {
  getAll: async () => {
    const response = await api.get<ChangeOrder[]>('/change-orders');
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get<ChangeOrder>(`/change-orders/${id}`);
    return response.data;
  },

  create: async (data: CreateChangeOrderDto) => {
    const response = await api.post<ChangeOrder>('/change-orders', data);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.post<ChangeOrder>(`/change-orders/${id}/approve`);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/change-orders/${id}`);
  },
};
