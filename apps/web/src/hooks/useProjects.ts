import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export interface Project {
    id: string;
    name: string;
    code: string;
    status: string;
}

export const useProjects = () => {
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

    return useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data as Project[];
        },
        enabled: !!token,
    });
};
