import { useQuery } from '@tanstack/react-query';
import { fieldRecordsService } from '../../../services/field-records';

export function useFieldRecordV2(id: string, projectId: string) {
  return useQuery({
    queryKey: ['field-record-v2', id, projectId],
    queryFn: async () => {
      return await fieldRecordsService.getRecord(id, projectId);
    },
    enabled: !!id && !!projectId,
    staleTime: 5 * 60 * 1000,
    throwOnError: true,
  });
}
