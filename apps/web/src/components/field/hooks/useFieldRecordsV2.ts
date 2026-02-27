import { useQuery } from '@tanstack/react-query';
import { fieldRecordsService } from '@/services/field-records';

export interface UseFieldRecordsParams {
  projectId: string;
  type?: string;
  status?: string;
}

export function useFieldRecordsV2({ projectId, type, status }: UseFieldRecordsParams) {
  return useQuery({
    queryKey: ['field-records-v2', projectId, type, status],
    queryFn: async () => {
      // Usamos el servicio canónico ya existente
      const records = await fieldRecordsService.listRecords(projectId, type);

      // Aplicar filtro de estado en el frontend temporalmente si el backend no lo soporta en params (MVP cover)
      let filtered = records;
      if (status && status !== 'All') {
        filtered = filtered.filter((r: { status?: string }) => r.status === status);
      }
      return filtered;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 min
    // Opt-in for suspense/error boundaries based on React 19 rules
    throwOnError: true,
  });
}
