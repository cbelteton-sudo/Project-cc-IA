import { useQuery } from '@tanstack/react-query';
import { fieldRecordsService } from '../../../services/field-records';

export function useFieldRecordV2(id: string) {
  return useQuery({
    queryKey: ['field-record-v2', id],
    queryFn: async () => {
      return await fieldRecordsService.getRecord(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    throwOnError: true,
  });
}
