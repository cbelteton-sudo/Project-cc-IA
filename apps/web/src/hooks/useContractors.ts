import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Contractor {
  id: string;
  name: string;
  type: string;
  email?: string;
  phone?: string;
}

export function useContractors() {
  const {
    data: contractors = [],
    isLoading: loading,
    error,
    refetch: refresh,
  } = useQuery({
    queryKey: ['contractors'],
    queryFn: async () => {
      const { data } = await api.get<Contractor[]>('/contractors');
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    contractors,
    loading,
    error: error ? (error as Error).message : null,
    refresh,
  };
}
