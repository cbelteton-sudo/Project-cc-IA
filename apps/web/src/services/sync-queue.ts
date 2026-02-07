import { getDB } from './db';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

export const SyncQueue = {
    isSyncing: false,

    async add(url: string, method: string, body: any) {
        const db = await getDB();
        await db.add('syncQueue', {
            url,
            method,
            body,
            timestamp: Date.now()
        });
        window.dispatchEvent(new Event('sync-pending'));

        // Try to sync immediately if online
        if (navigator.onLine) {
            this.process();
        }
    },

    async process() {
        if (!navigator.onLine || this.isSyncing) return;

        this.isSyncing = true;
        window.dispatchEvent(new Event('sync-start'));

        try {
            const db = await getDB();
            const queue = await db.getAll('syncQueue'); // In order of id (autoIncrement)
            const keys = await db.getAllKeys('syncQueue');

            if (queue.length === 0) {
                this.isSyncing = false;
                return;
            }

            for (let i = 0; i < queue.length; i++) {
                const item = queue[i];
                const key = keys[i];

                try {
                    console.log(`Processing sync item: ${item.method} ${item.url}`);
                    await axios({
                        method: item.method,
                        url: `${API_URL}${item.url}`,
                        data: item.body
                    });
                    // Remove from queue if successful
                    await db.delete('syncQueue', key);
                } catch (error) {
                    console.error('Sync failed for item', item, error);
                    // Critical Error (4xx that isn't 408/429) -> Remove to unblock queue?
                    // For now, break loop on any error to preserve order.
                    // effectively "head-of-line blocking" which is safer for data integrity
                    break;
                }
            }

            // Check if queue is empty now
            const remaining = await db.count('syncQueue');
            if (remaining === 0) {
                window.dispatchEvent(new Event('sync-complete'));
            } else {
                window.dispatchEvent(new Event('sync-error'));
            }

        } catch (err) {
            console.error("SyncQueue process error:", err);
            window.dispatchEvent(new Event('sync-error'));
        } finally {
            this.isSyncing = false;
        }
    }
};
