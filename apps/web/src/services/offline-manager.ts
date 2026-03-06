import { getDB } from './db';
import { compressImage } from '../utils/imageCompression';
import { api } from '../lib/api';
import { toast } from 'sonner';
import {
  isFieldRecordsV1Enabled,
  fieldRecordsService,
  mapOfflinePayloadToV1,
} from './field-records';

export interface QuickCapturePayload {
  projectId: string;
  activityId: string;
  activityName: string; // Needed for offline display/fallback
  status: string;
  note?: string;
  photos: File[]; // Or Blobs
  date?: string; // Target date (defaults to today)
}

// Ensure base64ToBlob helper is available
function base64ToBlob(base64: string, mimeType = 'image/jpeg'): Blob {
  const byteString = atob(base64.split(',')[1] || base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

export interface QueueItem {
  localId: string;
  projectId: string;
  payload: {
    activityId?: string;
    activityName?: string;
    status?: string;
    note?: string;
    date?: string;
    type?: string;
    title?: string;
    description?: string;
  };
  photos: {
    id: string; // UUID
    blob: Blob;
    previewUrl?: string; // Storing original base64 for fast optimistic UI loading when offline
  }[];
  createdAt: number;
  retries: number;
  lastError?: string;
}

class OfflineManagerService {
  private isSyncing = false;

  /**
   * Add item to offline queue with compressed images.
   */
  async addToQueue(data: QuickCapturePayload) {
    try {
      const db = await getDB();
      const localId = crypto.randomUUID();
      const now = Date.now();

      // 1. Compress Photos
      const processedPhotos = await Promise.all(
        data.photos.map(async (file) => ({
          id: crypto.randomUUID(),
          blob: await compressImage(file, { maxWidth: 1200, quality: 0.7 }),
        })),
      );

      // 2. Create Queue Item
      const item: QueueItem = {
        localId,
        projectId: data.projectId,
        payload: {
          activityId: data.activityId,
          activityName: data.activityName,
          status: data.status,
          note: data.note,
          date: data.date || new Date().toISOString(),
        },
        photos: processedPhotos,
        createdAt: now,
        retries: 0,
      };

      await db.put('offline_queue', item);

      // 3. Trigger Sync (if online)
      if (navigator.onLine) {
        this.processQueue();
      }

      return localId;
    } catch (error) {
      console.error('Failed to add to offline queue', error);
      throw error;
    }
  }

  /**
   * Add V2 record to offline queue.
   * Photos are already compressed as base64 in payload.content.photos
   */
  async addV2ToQueue(payload: import('./field-records').FieldRecordPayload) {
    try {
      const db = await getDB();
      const localId = payload.id || crypto.randomUUID();
      const now = Date.now();

      // Extract and convert photos from base64 to Blob if needed
      const photosArray = (payload.content?.photos as any[]) || [];
      const processedPhotos = photosArray.map((p) => {
        return {
          id: p.id || crypto.randomUUID(),
          blob: base64ToBlob(p.urlMain || p.urlThumb),
          previewUrl: p.urlThumb || p.urlMain, // Keep original base64 to restore preview easily
        };
      });

      const item: QueueItem = {
        localId,
        projectId: payload.projectId,
        payload: {
          type: payload.type,
          title: payload.content?.title as string,
          description: payload.content?.description as string,
          activityId: (payload.content?.activityId as string) || '',
          activityName: '',
          status: payload.status,
          date: payload.createdAt || new Date().toISOString(),
        },
        photos: processedPhotos,
        createdAt: now,
        retries: 0,
      };

      await db.put('offline_queue', item);

      if (navigator.onLine) {
        this.processQueue();
      }

      return localId;
    } catch (error) {
      console.error('Failed to add V2 to offline queue', error);
      throw error;
    }
  }

  /**
   * Process the offline queue.
   */
  async processQueue() {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    window.dispatchEvent(new Event('sync-start'));

    try {
      const db = await getDB();
      const queue = await db.getAll('offline_queue');

      if (queue.length === 0) {
        this.isSyncing = false;
        window.dispatchEvent(new Event('sync-complete'));
        return;
      }

      console.log(`[OfflineManager] Processing ${queue.length} items...`);

      for (const item of queue) {
        try {
          await this.syncItem(item);
          // On success, remove from queue
          await db.delete('offline_queue', item.localId);
          // Notify UI of progress?
        } catch (error: unknown) {
          console.error(`[OfflineManager] Failed item ${item.localId}`, error);

          // Update error state
          item.retries += 1;
          const e = error as Error;
          item.lastError = e?.message || 'Unknown error';
          await db.put('offline_queue', item);

          // If 4xx (Client Error), maybe stop to prevent loop?
          // But 5xx (Server) or Network -> Retry later.
          // For now, continue to next item (don't block queue for one bad item)
        }
      }

      // Final check
      const remaining = await db.count('offline_queue');
      if (remaining === 0) {
        window.dispatchEvent(new Event('sync-complete'));
        toast.success('Sincronización completada');
      } else {
        window.dispatchEvent(new Event('sync-error')); // Has remaining items
      }
    } catch (globalError) {
      console.error('[OfflineManager] Global sync error', globalError);
      window.dispatchEvent(new Event('sync-error'));
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single item: Upsert Entry -> Upload Photos
   */
  private async syncItem(item: QueueItem) {
    // Check if it's a V2 Item
    if (item.payload.type) {
      console.log(`[OfflineManager] Syncing item ${item.localId} via Canonical V2 endpoint...`);

      // Reconstruct payload without raw base64 photos to save bandwidth if uploading separately
      // or keep them if backend expects inline base64
      const recordPayload: import('./field-records').FieldRecordPayload = {
        type: item.payload.type as any,
        projectId: item.projectId,
        status: item.payload.status || 'PENDING',
        content: {
          title: item.payload.title,
          description: item.payload.description,
          activityId: item.payload.activityId,
          // Convert blobs back to base64 if needed, or pass empty and rely on formData upload below
          photos: item.photos.map((p) => ({
            id: p.id,
            urlMain: p.previewUrl, // We attach original previewUrl which is base64 for optimistic UI reconstruction
            urlThumb: p.previewUrl,
          })),
        },
      };

      const record = await fieldRecordsService.createRecord(recordPayload);

      // Photos upload natively missing in V2 backend but using `/photos/upload` for now works.
      // We upload the blobs.
      if (item.photos && item.photos.length > 0) {
        for (const photo of item.photos) {
          const formData = new FormData();
          formData.append('file', photo.blob, `photo-${photo.id}.jpg`);
          formData.append('projectId', item.projectId);
          formData.append('recordId', record.id);
          formData.append('fieldUpdateId', record.id); // fallback
          if (item.payload.activityId) {
            formData.append('activityId', item.payload.activityId);
          }
          await api.post('/photos/upload', formData);
        }
      }

      console.log(`[OfflineManager] Synced item ${item.localId} successfully (V2).`);
      return;
    }

    if (isFieldRecordsV1Enabled()) {
      console.log(`[OfflineManager] Syncing item ${item.localId} via Canonical V1 endpoint...`);
      // 1. Submit Entry (Canonical V1)
      const payload = mapOfflinePayloadToV1(item.payload, item.projectId);

      const recordEnvelope = await fieldRecordsService.createRecord(payload);

      // Ensure we extract the canonical record safely (handles envelope vs flat response)
      const record = recordEnvelope.data || recordEnvelope;

      if (!record || !record.id) {
        throw new Error('Server returned invalid canonical entry response');
      }

      // 2. Upload Photos
      if (item.photos && item.photos.length > 0) {
        for (const photo of item.photos) {
          const formData = new FormData();
          formData.append('file', photo.blob, `photo-${photo.id}.jpg`);
          formData.append('projectId', item.projectId);
          formData.append('recordId', record.id); // Canonical ID linking

          // Fallbacks for current legacy backend fields so old interceptors don't break
          formData.append('fieldUpdateId', record.id);
          formData.append('activityId', item.payload.activityId || '');

          await api.post('/photos/upload', formData);
        }
      }

      console.log(`[OfflineManager] Synced item ${item.localId} successfully (V1 Contract).`);
    } else {
      console.log(`[OfflineManager] Syncing item ${item.localId} via Legacy endpoint...`);
      // 1. Submit Entry (Create or Update)
      const entryData = {
        projectId: item.projectId,
        scheduleActivityId: item.payload.activityId,
        activityName: item.payload.activityName,
        status: item.payload.status,
        note: item.payload.note,
        dateString: item.payload.date,
        // We let backend handle 'dailyReportId', 'createdBy' from token
      };

      const entryRes = await api.post('/field/reports/entries', entryData);
      const entry = entryRes.data; // Should contain .id

      if (!entry || !entry.id) {
        throw new Error('Server returned invalid entry response');
      }

      // 2. Upload Photos
      if (item.photos && item.photos.length > 0) {
        for (const photo of item.photos) {
          const formData = new FormData();
          formData.append('file', photo.blob, `photo-${photo.id}.jpg`);
          formData.append('projectId', item.projectId);
          formData.append('activityId', item.payload.activityId || '');
          formData.append('fieldUpdateId', entry.id); // Valid Entry ID

          await api.post('/photos/upload', formData);
        }
      }

      console.log(`[OfflineManager] Synced item ${item.localId} successfully (Legacy).`);
    }
  }

  /**
   * Get queue statistics
   */
  async getStatus() {
    const db = await getDB();
    const count = await db.count('offline_queue');
    return { count, isSyncing: this.isSyncing };
  }

  /**
   * Retry specific item
   */
  async retryItem(localId: string) {
    const db = await getDB();
    const item = await db.get('offline_queue', localId);
    if (item) {
      try {
        this.isSyncing = true;
        await this.syncItem(item);
        await db.delete('offline_queue', localId);
        toast.success('Item sincronizado');
      } catch (e: any) {
        toast.error('Fallo al reintentar: ' + e.message);
        // Update error
        item.retries += 1;
        item.lastError = e.message;
        await db.put('offline_queue', item);
      } finally {
        this.isSyncing = false;
      }
    }
  }

  /**
   * Remove item
   */
  async deleteItem(localId: string) {
    const db = await getDB();
    await db.delete('offline_queue', localId);
  }
}

export const OfflineManager = new OfflineManagerService();
