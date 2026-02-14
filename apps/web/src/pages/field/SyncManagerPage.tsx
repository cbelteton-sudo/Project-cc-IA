import React, { useEffect, useState } from 'react';
import { useBackgroundSync } from '../../hooks/useBackgroundSync';
import { OfflineManager, type QueueItem } from '../../services/offline-manager';
import { getDB } from '../../services/db';
import { ArrowLeft, RefreshCw, Trash2, AlertTriangle, CheckCircle2, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SyncManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const { queueCount, processQueue } = useBackgroundSync();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      const queue = await db.getAll('offline_queue');
      setItems(queue.sort((a, b) => b.createdAt - a.createdAt));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // Refresh every 5s to see progress
    const interval = setInterval(loadItems, 5000);
    return () => clearInterval(interval);
  }, [queueCount]); // Reload when count changes

  const handleRetry = async (id: string) => {
    await OfflineManager.retryItem(id);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este reporte pendiente?')) {
      await OfflineManager.deleteItem(id);
      loadItems();
    }
  };

  const handlesyncAll = async () => {
    await processQueue();
    loadItems();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold flex-1">Sincronización</h1>
        <div className="text-xs font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-600">
          {items.length} Pendientes
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handlesyncAll}
            disabled={items.length === 0}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-300"
          >
            <RefreshCw size={18} />
            Sincronizar Todo
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading && items.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="font-bold text-gray-800">Todo sincronizado</h3>
              <p className="text-gray-400 text-sm">No hay reportes pendientes.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.localId}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-900">{item.payload.activityName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.lastError && <AlertTriangle size={16} className="text-red-500" />}
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-md ${item.lastError ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}
                    >
                      {item.lastError ? 'Error' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                {/* Content Preview */}
                {item.photos && item.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {item.photos.map((p) => (
                      <div
                        key={p.id}
                        className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 overflow-hidden"
                      >
                        {/* In a real app we'd convert blob back to URL. For simplicity, just showing placeholder count if complex */}
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-100">
                          IMG
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {item.payload.note && (
                  <div className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded-lg">
                    "{item.payload.note}"
                  </div>
                )}

                {/* Error Message */}
                {item.lastError && (
                  <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                    {item.lastError}
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleDelete(item.localId)}
                    className="text-gray-400 hover:text-red-500 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => handleRetry(item.localId)}
                    className="text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
