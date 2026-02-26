import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNetwork } from '../../context/NetworkContext';
import { SyncQueue } from '../../services/sync-queue';
import { saveDraft } from '../../services/db';
import { api } from '../../lib/api';
import { ArrowLeft, Save, Camera, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { ActivityLogTimeline } from './ActivityLogTimeline';
import { PhotoLightbox } from './PhotoLightbox';
import { toast } from 'sonner';

// API_URL handled by api instance

export interface UpdateActivity {
  id: string;
  name: string;
  code: string;
  projectId: string;
  measurementType?: string;
  percent?: number;
  unit?: string;
}

export const ActivityUpdate: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOnline } = useNetwork();

  // State
  const [activity, setActivity] = useState<UpdateActivity | null>(null);
  const [qtyDone, setQtyDone] = useState<number>(0);
  const [manualPercent, setManualPercent] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isRisk, setIsRisk] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  // Log State
  const [activeTab, setActiveTab] = useState<'UPDATE' | 'LOG'>('UPDATE');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logItems, setLogItems] = useState<any[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');

  useEffect(() => {
    // Fetch activity details (Network only for MVP)
    if (id) {
      api
        .get(`/activities/${id}`)
        .then((res) => {
          setActivity(res.data);
          setManualPercent(res.data.percent || 0); // Default to current
        })
        .finally(() => setLoading(false));

      // Fetch Log (Parallel)
      // In real app, fetch when tab changes or parallel
      api
        .get(`/field/reports/activities/${id}/log?limit=20`)
        .then((res) => setLogItems(res.data.items))
        .catch((err) => console.error('Failed to fetch log', err));
    }
  }, [id]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (!activity) return;

    const updateData = {
      projectId: activity.projectId,
      date: new Date().toISOString(), // Today
      items: [
        {
          activityId: activity.id,
          qtyDone: activity.measurementType === 'QUANTITY' ? qtyDone : undefined,
          manualPercent,
          notes,
          isRisk,
          // checklist/milestone state handling omitted for MVP brevity, can add later
        },
      ],
    };

    if (status === 'DRAFT' || !isOnline) {
      // Save to IDB
      const draftId = uuidv4();
      await saveDraft({
        id: draftId,
        projectId: activity.projectId,
        date: updateData.date,
        items: updateData.items,
        status: 'DRAFT',
        updatedAt: Date.now(),
      });
      // Also queue sync if online capability comes back?
      // SyncQueue handles API calls, saveDraft handles IDB.
      // Logic: If user hits "Submit" but uses SyncQueue due to offline,
      // we add to SyncQueue.
      if (status === 'SUBMITTED') {
        await SyncQueue.add('/field/reports/sync-draft', 'POST', updateData); // "draft" endpoint handles offline packets
      }
    } else {
      // Online Submit
      try {
        await api.post(`/field/reports/sync-draft`, updateData);
        // Also upload photos
        if (photos.length > 0) {
          // Uploads are parallel usually
          for (const photo of photos) {
            const formData = new FormData();
            formData.append('file', photo);
            formData.append('projectId', activity.projectId);
            formData.append('activityId', activity.id);
            await api.post(`/photos/upload`, formData);
          }
        }
      } catch (e) {
        console.error('Submit failed', e);
        toast.error('Error al enviar. Guardado en cola offline.');
        await SyncQueue.add('/field/reports/sync-draft', 'POST', updateData);
      }
    }

    toast.success('Actualización guardada con éxito.');
    navigate(-1);
  };

  const openLightbox = (src: string) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!activity) return <div className="p-10 text-center">Activity not found</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 pb-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border-b border-gray-100 z-10 flex flex-col">
        <div className="flex items-center mb-4 gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors shrink-0 group"
          >
            <ArrowLeft
              size={22}
              className="text-gray-500 group-hover:text-black transition-colors"
            />
          </button>
          <div className="overflow-hidden min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 truncate tracking-tight">
              {activity.name}
            </h1>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              {activity.code}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('UPDATE')}
            className={`pb-3 pt-2 text-sm font-bold relative transition-colors ${activeTab === 'UPDATE' ? 'text-black' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Actualizar
            {activeTab === 'UPDATE' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full shadow-[0_-2px_4px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-1 fade-in duration-300" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('LOG')}
            className={`pb-3 pt-2 text-sm font-bold relative transition-colors ${activeTab === 'LOG' ? 'text-black' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Historial
            {activeTab === 'LOG' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full shadow-[0_-2px_4px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-1 fade-in duration-300" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6 max-w-3xl mx-auto w-full">
        {activeTab === 'UPDATE' ? (
          <>
            {/* Progress Input */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-500 mb-5 uppercase tracking-wider">
                Progreso
              </h2>

              {activity.measurementType === 'QUANTITY' && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Cantidad Ejecutada (Hoy)
                  </label>
                  <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200 focus-within:bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                    <input
                      type="number"
                      className="bg-transparent p-3 outline-none w-full text-lg font-bold text-gray-900"
                      value={qtyDone}
                      onChange={(e) => setQtyDone(Number(e.target.value))}
                    />
                    <span className="pr-4 font-bold text-gray-400 uppercase tracking-wider text-xs">
                      {activity.unit || 'UNIDADES'}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-gray-700">Porcentaje de Avance</label>
                  <span className="text-xl font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                    {manualPercent}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={manualPercent}
                  onChange={(e) => setManualPercent(Number(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #2563eb ${manualPercent}%, #e5e7eb ${manualPercent}%)`,
                  }}
                  className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md transition-all shadow-inner mb-2"
                />

                {/* Suggestion Placeholder */}
                <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 flex items-center justify-between">
                  <span>Sugerencia Offline:</span>
                  <span className="bg-white px-2 py-0.5 rounded shadow-sm">{manualPercent}%</span>
                </div>
              </div>
            </div>

            {/* Evidence */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                Evidencia
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-1">
                {photos.map((p, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] relative rounded-xl overflow-hidden group shadow-sm ring-1 ring-gray-100"
                  >
                    <img
                      src={URL.createObjectURL(p)}
                      alt="preview"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ))}
                <label className="aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-blue-50/50 hover:border-blue-400 hover:scale-[1.01] active:scale-[0.98] transition-all text-gray-400 bg-gray-50/50 group">
                  <Camera
                    size={32}
                    className="mb-2 opacity-50 group-hover:text-blue-500 group-hover:opacity-100 transition-all"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                    Agregar Foto
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </label>
              </div>
            </div>

            {/* Notes & Risk */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Notas</h2>
              </div>

              <div className="mb-4">
                <label
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${isRisk ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20' : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`p-2 rounded-lg ${isRisk ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}
                    >
                      <AlertTriangle size={20} />
                    </span>
                    <div>
                      <span
                        className={`font-bold block ${isRisk ? 'text-red-900' : 'text-gray-700'}`}
                      >
                        Reportar Riesgo/Bloqueo
                      </span>
                      <span
                        className={`text-[11px] font-medium block ${isRisk ? 'text-red-700' : 'text-gray-500'}`}
                      >
                        Marca si esta actividad requiere atención urgente
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRisk}
                    onChange={(e) => setIsRisk(e.target.checked)}
                    className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                  />
                </label>
              </div>

              <textarea
                className={`w-full p-4 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 outline-none transition-all text-gray-700 leading-relaxed ${isRisk ? 'focus:ring-red-200 focus:bg-red-50/30 ring-1 ring-red-200 placeholder:text-red-300' : 'focus:ring-blue-100 focus:bg-white placeholder:text-gray-400'}`}
                rows={4}
                placeholder={
                  isRisk
                    ? 'Explica el motivo del bloqueo o riesgo (Requerido)...'
                    : 'Escribe tus observaciones o notas del día...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </>
        ) : (
          <ActivityLogTimeline
            items={logItems}
            onPhotoClick={openLightbox}
            onReportToday={() => setActiveTab('UPDATE')}
          />
        )}
      </div>

      {/* Footer - Only show in UPDATE mode */}
      {activeTab === 'UPDATE' && (
        <div className="p-5 bg-white border-t border-gray-100 z-30 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] flex-none">
          <div className="max-w-3xl mx-auto flex gap-3">
            <button
              onClick={() => handleSave('DRAFT')}
              className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold active:scale-[0.98] hover:bg-gray-200 transition-all shadow-sm"
            >
              Guardar Borrador
            </button>
            <button
              onClick={() => handleSave('SUBMITTED')}
              className="flex-1 bg-black text-white py-4 rounded-xl font-bold active:scale-[0.98] shadow-xl shadow-gray-300 hover:bg-gray-800 transition-all flex justify-center items-center gap-2"
            >
              <Save size={18} />
              Enviar Actualización
            </button>
          </div>
        </div>
      )}

      <PhotoLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageSrc={lightboxSrc}
      />
    </div>
  );
};
