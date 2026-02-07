import React, { createContext, useContext, useEffect, useState } from 'react';
import { SyncQueue } from '../services/sync-queue';

interface NetworkContextType {
    isOnline: boolean;
    syncStatus: 'IDLE' | 'SYNCING' | 'ERROR';
    syncNow: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
    isOnline: true,
    syncStatus: 'IDLE',
    syncNow: async () => { },
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'ERROR'>('IDLE');

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            SyncQueue.process().catch(err => console.error("Auto-sync failed:", err));
        };
        const handleOffline = () => setIsOnline(false);

        // Sync Events
        const handleSyncStart = () => setSyncStatus('SYNCING');
        const handleSyncComplete = () => setSyncStatus('IDLE');
        const handleSyncError = () => setSyncStatus('ERROR');
        const handleSyncPending = () => {
            if (navigator.onLine) setSyncStatus('SYNCING');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Custom events from SyncQueue
        window.addEventListener('sync-start', handleSyncStart);
        window.addEventListener('sync-complete', handleSyncComplete);
        window.addEventListener('sync-error', handleSyncError);
        window.addEventListener('sync-pending', handleSyncPending);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('sync-start', handleSyncStart);
            window.removeEventListener('sync-complete', handleSyncComplete);
            window.removeEventListener('sync-error', handleSyncError);
            window.removeEventListener('sync-pending', handleSyncPending);
        };
    }, []);

    const syncNow = async () => {
        await SyncQueue.process();
    };

    return (
        <NetworkContext.Provider value={{ isOnline, syncStatus, syncNow }}>
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => useContext(NetworkContext);
