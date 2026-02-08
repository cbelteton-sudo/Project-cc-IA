import type { DBSchema, IDBPDatabase } from 'idb';

interface FieldDB extends DBSchema {
    updates: {
        key: string; // uuid
        value: {
            id: string;
            projectId: string;
            date: string;
            items: any[];
            status: 'DRAFT' | 'SYNCED';
            updatedAt: number;
        };
        indexes: { 'by-project': string };
    };
    photos: {
        key: string;
        value: {
            id: string;
            blob: Blob;
            projectId: string;
            activityId: string;
            fieldUpdateId: string;
            uploaded: boolean;
        };
    };
    syncQueue: {
        key: number;
        value: {
            url: string;
            method: string;
            body: any;
            timestamp: number;
        };
    };
    projects: {
        key: string;
        value: {
            id: string;
            name: string;
            code: string;
            status: string;
            location?: string;
            updatedAt: number;
        };
    };
    daily_logs: {
        key: string;
        value: {
            id: string; // uuid (temp or server)
            projectId: string;
            date: string;
            data: any; // content
            status: 'DRAFT' | 'SYNCED' | 'PENDING_SYNC';
            updatedAt: number;
        };
        indexes: { 'by-project': string; 'by-date': string };
    };
    issues: {
        key: string;
        value: {
            id: string;
            projectId: string;
            title: string;
            description?: string;
            status: string;
            priority: string;
            assigneeId?: string;
            createdAt: number;
            updatedAt: number;
            syncStatus: 'DRAFT' | 'SYNCED' | 'PENDING_SYNC';
        };
        indexes: { 'by-project': string; 'by-status': string };
    };
    field_daily_reports: {
        key: string;
        value: {
            id: string;
            projectId: string;
            date: string; // ISO Date
            status: string;
            createdAt: number;
        };
        indexes: { 'by-project-date': [string, string] };
    };
    field_daily_entries: {
        key: string;
        value: {
            id: string;
            dailyReportId: string;
            scheduleActivityId?: string;
            activityName: string;
            status: string;
            progressChip?: number;
            note?: string;
            updatedAt: number;
        };
        indexes: { 'by-report': string };
    };
    offline_queue: {
        key: string;
        value: {
            localId: string; // uuid v4
            projectId: string;
            payload: {
                activityId: string;
                activityName: string;
                status: string; // 'IN_PROGRESS', 'BLOCKED', 'DONE'
                note?: string;
                date: string; // ISO date target
            };

            photos: {
                id: string;
                blob: Blob;
                previewUrl?: string; // For UI display
            }[];

            createdAt: number;
            retries: number;
            lastError?: string;
        };
        indexes: { 'by-project': string };
    };
}

let dbPromise: Promise<IDBPDatabase<FieldDB>>;

export const getDB = async () => {
    if (!dbPromise) {
        const { openDB } = await import('idb');
        dbPromise = openDB<FieldDB>('field-db', 4, {
            upgrade(db, oldVersion, newVersion, transaction) {
                // v1 Stores
                if (oldVersion < 1) {
                    // Updates Store
                    const updateStore = db.createObjectStore('updates', { keyPath: 'id' });
                    updateStore.createIndex('by-project', 'projectId');

                    // Photos Store
                    db.createObjectStore('photos', { keyPath: 'id' });

                    // Sync Queue
                    db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                }

                // v2 Stores
                if (oldVersion < 2) {
                    // Projects Cache
                    if (!db.objectStoreNames.contains('projects')) {
                        db.createObjectStore('projects', { keyPath: 'id' });
                    }

                    // Daily Logs (Legacy)
                    if (!db.objectStoreNames.contains('daily_logs')) {
                        const dailyLogsStore = db.createObjectStore('daily_logs', { keyPath: 'id' });
                        dailyLogsStore.createIndex('by-project', 'projectId');
                        dailyLogsStore.createIndex('by-date', 'date');
                    }

                    // Issues
                    if (!db.objectStoreNames.contains('issues')) {
                        const issuesStore = db.createObjectStore('issues', { keyPath: 'id' });
                        issuesStore.createIndex('by-project', 'projectId');
                        issuesStore.createIndex('by-status', 'status');
                    }
                }

                // v3 Stores (Field Quick Reporting)
                if (oldVersion < 3) {
                    if (!db.objectStoreNames.contains('field_daily_reports')) {
                        const reportStore = db.createObjectStore('field_daily_reports', { keyPath: 'id' });
                        reportStore.createIndex('by-project-date', ['projectId', 'date']);
                    }
                    if (!db.objectStoreNames.contains('field_daily_entries')) {
                        const entryStore = db.createObjectStore('field_daily_entries', { keyPath: 'id' });
                        entryStore.createIndex('by-report', 'dailyReportId');
                    }
                }

                // v4 Stores (Field Offline Queue - Phase 18)
                if (oldVersion < 4) {
                    if (!db.objectStoreNames.contains('offline_queue')) {
                        const queueStore = db.createObjectStore('offline_queue', { keyPath: 'localId' });
                        queueStore.createIndex('by-project', 'projectId');
                    }
                }
            },
        });
    }
    return dbPromise;
};

export const saveDraft = async (draft: any) => {
    const db = await getDB();
    return db.put('updates', draft);
};

export const getProjectDrafts = async (projectId: string) => {
    const db = await getDB();
    return db.getAllFromIndex('updates', 'by-project', projectId);
};
