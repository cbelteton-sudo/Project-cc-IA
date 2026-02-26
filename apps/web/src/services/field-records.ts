import { api } from '@/lib/api';

/**
 * Feature flag to route to Canonical V1 endpoint instead of legacy
 */
export const isFieldRecordsV1Enabled = () =>
  import.meta.env.VITE_FIELD_RECORDS_V1_FRONTEND === 'true';

export interface FieldRecordPayload {
  type: 'ISSUE' | 'INSPECTION' | 'RFI' | 'MATERIAL_REQUEST' | 'DAILY_ENTRY' | 'PHOTO';
  status: string;
  projectId: string;
  content: Record<string, unknown>;
  evidenceRefs?: string[];
  geo?: { lat: number; lng: number };
}

export const fieldRecordsService = {
  /**
   * Universal Create for Field Records
   */
  createRecord: async (payload: FieldRecordPayload) => {
    const response = await api.post('/field-records', payload);
    return response.data;
  },

  /**
   * Universal Sync (Offline Queue)
   */
  syncRecords: async (payloads: FieldRecordPayload[]) => {
    const response = await api.post('/field-records/sync', { records: payloads });
    return response.data;
  },

  /**
   * Universal List
   */
  listRecords: async (projectId: string, type?: string) => {
    const params = new URLSearchParams({ projectId });
    if (type) params.append('type', type);

    const response = await api.get(`/field-records?${params.toString()}`);
    return response.data;
  },

  /**
   * Universal Get by ID
   */
  getRecord: async (id: string) => {
    const response = await api.get(`/field-records/${id}`);
    return response.data;
  },
};

/**
 * Pure function to map the legacy OfflineManager QueueItem
 * to the Canonical V1 FieldRecord format.
 */
export function mapOfflinePayloadToV1(itemPayload: any, projectId: string): FieldRecordPayload {
  return {
    type: 'DAILY_ENTRY', // Canonical mapping for ActivityUpdates
    projectId,
    status: itemPayload.status,
    content: {
      scheduleActivityId: itemPayload.activityId,
      activityName: itemPayload.activityName,
      note: itemPayload.note,
      dateString: itemPayload.date,
    },
  };
}
