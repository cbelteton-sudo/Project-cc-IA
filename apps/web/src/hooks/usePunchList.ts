import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetwork } from '../context/NetworkContext';
import { getDB } from '../services/db';
import { SyncQueue } from '../services/sync-queue';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { api } from '../lib/api';

export interface PunchItem {
  id: string;
  projectId: string;
  code?: number;
  title: string;
  description?: string;
  status:
    | 'OPEN'
    | 'IN_PROGRESS'
    | 'READY_FOR_VALIDATION'
    | 'BLOCKED'
    | 'DONE'
    | 'CLOSED'
    | 'REOPENED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // Punch List Pro
  type?: string;
  trade?: string;
  locationBuilding?: string;
  locationLevel?: string;
  locationZone?: string;
  contractorId?: string;

  ownerUserId?: string;
  dueDate?: string;

  createdAt: string; // ISO
  updatedAt: string; // ISO

  syncStatus: 'DRAFT' | 'SYNCED' | 'PENDING_SYNC';
  comments?: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
}

export const usePunchList = (projectId: string) => {
  const { isOnline } = useNetwork();
  const queryClient = useQueryClient();
  const queryKey = ['punch-list', projectId];

  // Fetch Items
  const { data: items = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        // 1. Try Local DB first
        let localItems: PunchItem[] = [];
        try {
          const db = await getDB();
          localItems = (await db.getAllFromIndex(
            'issues',
            'by-project',
            projectId,
          )) as unknown as PunchItem[];
        } catch (e) {
          console.warn('IDB read failed', e);
        }

        if (!isOnline) return localItems;

        const { data: remoteItems } = await api.get(`/issues?projectId=${projectId}`);

        // Update Local DB (Fire and forget)
        (async () => {
          const db = await getDB();
          const tx = db.transaction('issues', 'readwrite');
          for (const item of remoteItems) {
            await tx.store.put(item);
          }
          await tx.done;
        })();

        return remoteItems;
      } catch (error) {
        console.error('Fetch error:', error);
        const db = await getDB();
        return (await db.getAllFromIndex(
          'issues',
          'by-project',
          projectId,
        )) as unknown as PunchItem[];
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Create Item
  const createMutation = useMutation({
    mutationFn: async (data: Partial<PunchItem>) => {
      const newItem: PunchItem = {
        id: uuidv4(),
        projectId: data.projectId || projectId,
        title: data.title || '',
        status: 'OPEN',
        severity: data.severity || 'MEDIUM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: isOnline ? 'SYNCED' : 'PENDING_SYNC',
        ...data,
      };

      // Local DB Save
      const db = await getDB();
      await db.put('issues', newItem);

      if (isOnline) {
        const { data } = await api.post(`/issues`, newItem);
        return data;
      } else {
        await SyncQueue.add('/issues', 'POST', newItem);
        toast.info('Guardado offline');
        return newItem;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Punch creado');
    },
    onError: (err) => toast.error(`Error al crear punch: ${err.message}`),
  });

  // Update Item
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PunchItem> }) => {
      // Local DB Update
      const db = await getDB();
      const item = await db.get('issues', id);
      if (item) {
        await db.put('issues', { ...item, ...updates } as any);
      }

      if (isOnline) {
        const { data } = await api.patch(`/issues/${id}`, updates);
        return data;
      } else {
        return { ...item, ...updates };
      }
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousItems = queryClient.getQueryData<PunchItem[]>(queryKey);

      queryClient.setQueryData<PunchItem[]>(queryKey, (old) =>
        old ? old.map((i) => (i.id === id ? { ...i, ...updates } : i)) : [],
      );

      return { previousItems };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(queryKey, context?.previousItems);
      toast.error('Error al actualizar');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Create Comment
  const createCommentMutation = useMutation({
    mutationFn: async ({ issueId, text }: { issueId: string; text: string }) => {
      if (isOnline) {
        const { data } = await api.post(`/issues/${issueId}/comments`, { text });
        return data;
      } else {
        toast.error('Comentarios solo online por ahora');
        throw new Error('Offline');
      }
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Comentario agregado');
    },
  });

  return {
    items: Array.isArray(items) ? items : [],
    loading,
    createItem: createMutation.mutateAsync,
    updateItem: (id: string, updates: Partial<PunchItem>) =>
      updateMutation.mutateAsync({ id, updates }),
    createComment: (issueId: string, text: string) =>
      createCommentMutation.mutateAsync({ issueId, text }),
    refresh: () => queryClient.invalidateQueries({ queryKey }),
  };
};
