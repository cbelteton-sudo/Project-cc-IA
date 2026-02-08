
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Notification {
    id: string;
    type: string;
    entityType: string;
    entityId: string;
    message: string;
    readAt: string | null;
    createdAt: string;
}

export const useNotifications = () => {
    return useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data } = await axios.get(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            return data;
        },
        refetchInterval: 30000 // Poll every 30s
    });
};

export const useUnreadCount = () => {
    return useQuery<number>({
        queryKey: ['notifications-unread'],
        queryFn: async () => {
            const { data } = await axios.get(`${API_URL}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            return data;
        },
        refetchInterval: 30000
    });
};

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await axios.patch(`${API_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
        }
    });
};
