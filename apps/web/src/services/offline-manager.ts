
import { getDB } from './db';
import { compressImage } from '../utils/imageCompression';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

export interface QuickCapturePayload {
    projectId: string;
    activityId: string;
    activityName: string; // Needed for offline display/fallback
    status: string;
    note?: string;
    photos: File[]; // Or Blobs
    date?: string; // Target date (defaults to today)
}

export interface QueueItem {
    localId: string;
    projectId: string;
    payload: {
        activityId: string;
        activityName: string;
        status: string;
        note?: string;
        date: string;
    };
    photos: {
        id: string; // UUID
        blob: Blob;
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
                    blob: await compressImage(file, { maxWidth: 1200, quality: 0.7 })
                }))
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
                    date: data.date || new Date().toISOString()
                },
                photos: processedPhotos,
                createdAt: now,
                retries: 0
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
                } catch (error: any) {
                    console.error(`[OfflineManager] Failed item ${item.localId}`, error);

                    // Update error state
                    item.retries += 1;
                    item.lastError = error.message || 'Unknown error';
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
                toast.success("Sincronización completada");
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
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No authentication token");

        const headers = { Authorization: `Bearer ${token}` };

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

        const entryRes = await axios.post(`${API_URL}/field/reports/entries`, entryData, { headers });
        const entry = entryRes.data; // Should contain .id

        if (!entry || !entry.id) {
            throw new Error("Server returned invalid entry response");
        }

        // 2. Upload Photos
        if (item.photos && item.photos.length > 0) {
            for (const photo of item.photos) {
                const formData = new FormData();
                formData.append('file', photo.blob, `photo-${photo.id}.jpg`);
                formData.append('projectId', item.projectId);
                formData.append('activityId', item.payload.activityId);
                formData.append('fieldUpdateId', entry.id); // Valid Entry ID

                await axios.post(`${API_URL}/photos/upload`, formData, { headers });
            }
        }

        console.log(`[OfflineManager] Synced item ${item.localId} successfully.`);
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
                toast.success("Item sincronizado");
            } catch (e: any) {
                toast.error("Fallo al reintentar: " + e.message);
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
