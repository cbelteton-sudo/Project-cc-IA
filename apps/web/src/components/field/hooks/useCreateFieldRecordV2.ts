import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldRecordsService } from '../../../services/field-records';
import type { FieldRecordPayload } from '../../../services/field-records';
import { OfflineManager } from '../../../services/offline-manager';
import { useNetwork } from '@/context/NetworkContext';
import { toast } from 'sonner';

export function useCreateFieldRecordV2() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetwork();

  return useMutation({
    mutationFn: async (payload: FieldRecordPayload) => {
      if (!isOnline) {
        // Fallback to offline storage if currently offline
        // Add a temporary local ID if none exists for offline optimistic UI
        const localPayload = {
          ...payload,
          id: `local-${Date.now()}`,
          status: 'Draft',
          createdAt: new Date().toISOString(),
        };

        await OfflineManager.addV2ToQueue(localPayload);

        return localPayload;
      }

      // Online: Call canonical service
      return await fieldRecordsService.createRecord(payload);
    },
    onSuccess: (data, variables) => {
      // Invalidate the generic list queries for this project
      queryClient.invalidateQueries({
        queryKey: ['field-records-v2', variables.projectId],
      });

      if (!isOnline) {
        toast.success('Guardado localmente. Se sincronizará cuando haya conexión.');
      } else if (variables.type === 'MATERIAL_REQUEST') {
        toast.success('Solicitud enviada a Compras exitosamente', {
          description: 'El dashboard solo muestra bloqueos y problemas.',
        });
      } else {
        toast.success('Registro creado exitosamente');
      }
    },
    onError: (error) => {
      console.error('Error creating record:', error);
      toast.error('Error al intentar guardar el registro');
    },
  });
}
