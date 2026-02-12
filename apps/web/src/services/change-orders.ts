import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

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
        const response = await axios.get<ChangeOrder[]>(`${API_URL}/change-orders`);
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await axios.get<ChangeOrder>(`${API_URL}/change-orders/${id}`);
        return response.data;
    },

    create: async (data: CreateChangeOrderDto) => {
        const response = await axios.post<ChangeOrder>(`${API_URL}/change-orders`, data);
        return response.data;
    },

    approve: async (id: string) => {
        const response = await axios.post<ChangeOrder>(`${API_URL}/change-orders/${id}/approve`);
        return response.data;
    },

    delete: async (id: string) => {
        await axios.delete(`${API_URL}/change-orders/${id}`);
    }
};
