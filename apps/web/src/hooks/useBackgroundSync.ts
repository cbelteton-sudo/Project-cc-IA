
import { useEffect, useState } from 'react';
import { OfflineManager } from '../services/offline-manager';
import { useNetwork } from '../context/NetworkContext';

export const useBackgroundSync = () => {
    const { isOnline } = useNetwork();
    const [queueCount, setQueueCount] = useState(0);

    const updateStatus = async () => {
        try {
            const status = await OfflineManager.getStatus();
            setQueueCount(status.count);
        } catch (e) {
            console.error('Failed to get offline status', e);
        }
    };

    // Initial load
    useEffect(() => {
        updateStatus();
    }, []);

    // Listen to network changes
    useEffect(() => {
        if (isOnline) {
            console.log('[BackgroundSync] Online detected, triggering process...');
            OfflineManager.processQueue().then(updateStatus);
        }
    }, [isOnline]);

    // Listen to sync events
    useEffect(() => {
        const handleSyncComplete = () => updateStatus();
        const handleSyncError = () => updateStatus();
        const handleSyncStart = () => { }; // Optional: Set global syncing state

        window.addEventListener('sync-complete', handleSyncComplete);
        window.addEventListener('sync-error', handleSyncError);
        window.addEventListener('sync-start', handleSyncStart);

        // Polling fallback (every 60s) just in case
        const interval = setInterval(() => {
            if (navigator.onLine) {
                OfflineManager.processQueue();
            }
            updateStatus();
        }, 60000);

        return () => {
            window.removeEventListener('sync-complete', handleSyncComplete);
            window.removeEventListener('sync-error', handleSyncError);
            window.removeEventListener('sync-start', handleSyncStart);
            clearInterval(interval);
        };
    }, []);

    return { queueCount, processQueue: OfflineManager.processQueue.bind(OfflineManager) };
};
