
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

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
    return useQuery<PMDashboardData>({
        queryKey: ['pm-dashboard', projectId],
        queryFn: async () => {
            const { data } = await axios.get(`${API_URL}/pm-dashboard/project/${projectId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            return data;
        },
        enabled: !!projectId
    });
};

export const useBlockActivity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ activityId, reason, comment, eta, ownerId }: any) => {
            const { data } = await axios.patch(`${API_URL}/pm-dashboard/activity/${activityId}/block`,
                { reason, comment, eta, ownerId },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pm-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['project-activities'] });
        }
    });
};

export const useCommitActivity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ activityId, date }: any) => {
            const { data } = await axios.patch(`${API_URL}/pm-dashboard/activity/${activityId}/commit`,
                { date },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pm-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['project-activities'] });
        }
    });
};

export const useRequestUpdate = () => {
    return useMutation({
        mutationFn: async ({ activityId }: any) => {
            const { data } = await axios.post(`${API_URL}/pm-dashboard/activity/${activityId}/request-update`,
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            return data;
        }
    });
};
