import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Camera, Save, AlertTriangle, FileText, X, Check, Clock } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { getDB } from '../../services/db';
import { SyncQueue } from '../../services/sync-queue';
import axios from 'axios';
import { format } from 'date-fns';
import { ActivityLogTimeline } from './ActivityLogTimeline';
import { PhotoLightbox } from './PhotoLightbox';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

interface ActivityDetail {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: string;
  projectId?: string;
  parentId?: string;
  parentName?: string;
  projectName?: string;
  percent?: number;
}

export const FieldEntryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const { isOnline } = useNetwork();
  const { token, user } = useAuth(); // Get user

  // Data State
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Entry State
  const [note, setNote] = useState('');
  // Simplified State
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('NOT_STARTED'); // NOT_STARTED, IN_PROGRESS, BLOCKED, DONE

  // UI State
  const [activeTab, setActiveTab] = useState<'REPORT' | 'HISTORY'>('REPORT');
  const [saving, setSaving] = useState(false);

  // Photos
  const [tempPhotos, setTempPhotos] = useState<{ id: string; blob: File }[]>([]);

  // Log History
  const [logItems, setLogItems] = useState<any[]>([]);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');

  const openLightbox = (src: string) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
  };

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // 1. Fetch Activity Details
        let act: ActivityDetail | null = null;

        if (isOnline) {
          try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/activities/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            act = res.data;

            // Enrich with Context if possible
            if (act) {
              if (act.parentId) {
                try {
                  const pRes = await axios.get(`${API_URL}/activities/${act.parentId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  act.parentName = pRes.data.name;
                } catch (e) {}
              }
              if (state?.projectId) {
                try {
                  const projRes = await axios.get(`${API_URL}/projects/${state.projectId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  act.projectName = projRes.data.name;
                  act.projectId = state.projectId; // Ensure ID is set
                } catch (e) {}
              }
            }
          } catch (e) {
            console.error('API error', e);
          }
        }

        // Offline Fallback for Activity (Simplified check)
        if (!act) {
          // In a real app, we'd query IDB 'activities' store if we synced them.
          // For now, let's minimally hydrate if we can't fetch, or show error.
          // Assuming we might have basic data passed in state? No.
          // Just fail gracefully or use a placeholder if strictly offline without sync.
        }

        if (act) {
          setActivity(act);
          // Initialize local state
          setProgress(act.percent || 0);
          setStatus(act.status || 'NOT_STARTED');
        }

        // 2. Load Log (History)
        let apiItems: any[] = [];
        try {
          const res = await axios.get(`${API_URL}/field/reports/activities/${id}/log`);
          apiItems = res.data; // Now returns { ...entry, author: { name } }
        } catch (e) {
          console.error('Log fetch error', e);
        }

        const db = await getDB();
        const allEntries = await db.getAll('field_daily_entries');
        const localEntries = allEntries.filter((e: any) => e.scheduleActivityId === id);

        const localItems = await Promise.all(
          localEntries.map(async (e: any) => {
            // Try to recover photos from IDB
            // This is tricky without an index, checking 'photos' store by fieldUpdateId
            const allPhotos = await db.getAll('photos');
            const related = allPhotos.filter((p: any) => p.fieldUpdateId === e.id);
            const photos = related.map((p: any) => ({
              id: p.id,
              urlThumb: URL.createObjectURL(p.blob),
              urlMain: URL.createObjectURL(p.blob),
            }));

            return {
              id: e.id,
              date: new Date(e.updatedAt).toISOString(),
              status: e.status,
              note: e.note,
              createdAt: new Date(e.updatedAt).toISOString(),
              author: e.createdByName || (e.createdBy === user?.userId ? user?.name : 'Usuario'),
              photos,
            };
          }),
        );

        // 3. Load Offline Queue for this Activity
        const queue = await db.getAll('offline_queue');
        const pendingItems = queue
          .filter((q: any) => q.payload.activityId === id)
          .map((q: any) => ({
            id: q.localId,
            date: q.payload.date || new Date().toISOString(),
            status: q.payload.status,
            note: q.payload.note,
            createdAt: new Date(q.createdAt).toISOString(),
            author: user?.name,
            isPending: true,
            photos: q.photos.map((p: any) => ({
              id: p.id,
              urlThumb: URL.createObjectURL(p.blob),
              urlMain: URL.createObjectURL(p.blob),
            })),
          }));

        const getImageUrl = (path: string) => {
          if (!path) return '';
          if (path.startsWith('http')) return path;

          const cleanPath = path.startsWith('/') ? path : `/${path}`;
          const cleanApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
          return `${cleanApiUrl}${cleanPath}`;
        };

        const formattedApiItems = apiItems.map((e: any) => ({
          id: e.id,
          date: e.date ? new Date(e.date).toISOString() : new Date(e.createdAt).toISOString(),
          status: e.status,
          author: e.authorName || e.author?.name || 'Usuario',
          note: e.note,
          createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
          photos:
            e.photos?.map((p: any) => ({
              id: p.id,
              urlThumb: getImageUrl(p.urlThumb || p.urlMain),
              urlMain: getImageUrl(p.urlMain),
            })) || [],
        }));

        const apiIds = new Set(formattedApiItems.map((i) => i.id));
        const uniqueLocal = localItems.filter((l) => !apiIds.has(l.id));
        const merged = [...pendingItems, ...uniqueLocal, ...formattedApiItems].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setLogItems(merged);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isOnline, state]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPhotos = files.map((f) => ({ id: crypto.randomUUID(), blob: f }));
      setTempPhotos((prev) => [...prev, ...newPhotos]);
      toast.success(`${files.length} fotos seleccionadas`);
    }
  };

  const removePhoto = (pid: string) => {
    setTempPhotos((prev) => prev.filter((p) => p.id !== pid));
  };

  const handleSave = async () => {
    if (!activity) return;
    if (!note.trim() && tempPhotos.length === 0) {
      toast.error('Agrega una nota o foto para guardar.');
      return;
    }

    setSaving(true);
    try {
      const db = await getDB();
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const projectId = activity.projectId || state?.projectId || 'UNKNOWN';

      // 1. Daily Report
      let report = await db.getFromIndex('field_daily_reports', 'by-project-date', [
        projectId,
        dateStr,
      ] as any);
      if (!report) {
        report = {
          id: crypto.randomUUID(),
          projectId,
          date: dateStr,
          status: 'DRAFT',
          createdAt: Date.now(),
        };
        await db.put('field_daily_reports', report);
      }

      // 2. Prepare Photos (Convert to Base64 for Sync)
      const photoPayloads = await Promise.all(
        tempPhotos.map(async (p) => {
          return new Promise<any>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                id: p.id,
                blob: p.blob, // Keep blob for local IDB
                base64: reader.result as string,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(p.blob);
          });
        }),
      );

      // 3. Entry Data (Include Photos)
      const entryId = crypto.randomUUID();
      const entryData = {
        id: entryId,
        dailyReportId: report.id,
        projectId,
        dateString: dateStr,
        scheduleActivityId: activity.id,
        activityName: activity.name,
        status, // Use local state
        progressChip: progress, // Use local slider
        updatedAt: Date.now(),
        createdBy: user?.userId,
        createdByName: user?.name,
        photos: photoPayloads.map((p) => ({ id: p.id, base64: p.base64 })), // Send Base64 to backend
      };
      await db.put('field_daily_entries', entryData);

      // 4. Save Photos Locally (IDB)
      for (const photo of photoPayloads) {
        await db.put('photos', {
          id: photo.id,
          blob: photo.blob,
          projectId,
          activityId: activity.id,
          fieldUpdateId: entryId,
          uploaded: false, // Mark as false until sync confirms? SyncQueue doesn't update this yet.
        });
      }

      // Sync
      await SyncQueue.add('/field/reports/entries', 'POST', entryData); // Correct Endpoint

      toast.success('Reporte guardado');

      // Optimistic Log Update
      const newItem = {
        id: entryId,
        date: new Date().toISOString(),
        status,
        progressChip: progress,
        author: user?.name || 'Usuario', // FIX: Use real user name
        note,
        createdAt: new Date().toISOString(),
        photos: tempPhotos.map((p) => ({
          id: p.id,
          urlThumb: URL.createObjectURL(p.blob),
          urlMain: URL.createObjectURL(p.blob),
        })),
      };
      setLogItems((prev) => [newItem, ...prev]);

      setNote('');
      setTempPhotos([]);
      setActiveTab('HISTORY');
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const getScheduleStatus = () => {
    if (!activity) return { text: '...', color: 'bg-gray-100 text-gray-800' };
    const today = new Date();
    const end = new Date(activity.endDate);
    const start = new Date(activity.startDate);
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (activity.status === 'DONE')
      return { text: 'COMPLETADO', color: 'bg-green-100 text-green-700 ring-green-600/20' };
    if (today > end) return { text: 'ATRASADO', color: 'bg-red-100 text-red-700 ring-red-600/20' };
    if (today >= start && today <= end)
      return { text: 'EN TIEMPO', color: 'bg-blue-100 text-blue-700 ring-blue-600/20' };
    return { text: 'PROGRAMADO', color: 'bg-gray-100 text-gray-700 ring-gray-600/20' };
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando...</div>;
  if (!activity)
    return <div className="p-10 text-center text-gray-500">Actividad no encontrada</div>;

  const schedule = getScheduleStatus();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 sticky top-0 z-20 shadow-sm border-b border-gray-100 flex-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>

          <div className="flex-1 min-w-0">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider truncate font-semibold mb-0.5">
              <span>{activity.projectName || 'PROYECTO'}</span>
              {activity.parentName && (
                <>
                  <span>/</span>
                  <span>{activity.parentName}</span>
                </>
              )}
            </div>

            {/* Title Row with Badge */}
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 truncate">{activity.name}</h1>
              <div
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-inset shrink-0 ${schedule.color}`}
              >
                {schedule.text}
              </div>
            </div>
          </div>

          {/* Date Info (Right aligned) */}
          <div className="text-right shrink-0 pl-2 border-l border-gray-100 hidden sm:block">
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              Fecha Fin
            </div>
            <div className="text-sm font-semibold text-gray-700">
              {format(new Date(activity.endDate), 'dd MMM')}
            </div>
          </div>
        </div>

        {/* Mobile Date Line (if needed for very small screens, or keep it simple) */}
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 border-b border-gray-100 flex gap-8 z-10 flex-none">
        <button
          onClick={() => setActiveTab('REPORT')}
          className={`pb-3 pt-2 text-sm font-bold transition-colors relative ${activeTab === 'REPORT' ? 'text-black' : 'text-gray-400'}`}
        >
          Reporte
          {activeTab === 'REPORT' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 pt-2 text-sm font-bold transition-colors relative ${activeTab === 'HISTORY' ? 'text-black' : 'text-gray-400'}`}
        >
          Historial
          {activeTab === 'HISTORY' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content Area - Flex Grow */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
        {activeTab === 'REPORT' ? (
          <div className="space-y-8 max-w-3xl mx-auto pb-6">
            {/* Status & Progress Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              {/* Status Selector */}
              <div>
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 block">
                  Estado
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setStatus('IN_PROGRESS')}
                    className={`p-3 rounded-xl font-bold text-sm transition-all ${status === 'IN_PROGRESS' ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-2 ring-blue-600 ring-offset-2' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    En Curso
                  </button>
                  <button
                    onClick={() => setStatus('BLOCKED')}
                    className={`p-3 rounded-xl font-bold text-sm transition-all ${status === 'BLOCKED' ? 'bg-red-600 text-white shadow-md shadow-red-200 ring-2 ring-red-600 ring-offset-2' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Bloqueado
                  </button>
                  <button
                    onClick={() => {
                      setStatus('DONE');
                      setProgress(100);
                    }}
                    className={`p-3 rounded-xl font-bold text-sm transition-all ${status === 'DONE' ? 'bg-green-600 text-white shadow-md shadow-green-200 ring-2 ring-green-600 ring-offset-2' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Terminado
                  </button>
                </div>
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Avance
                  </label>
                  <span className="text-2xl font-black text-blue-600">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 font-medium mt-2">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <label className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <FileText size={20} />
                </span>
                Notas del Día
              </label>
              <textarea
                className="w-full p-4 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all placeholder:text-gray-400 text-gray-700 leading-relaxed"
                rows={8}
                placeholder="Describe el avance de hoy..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Photos Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <label className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-purple-100 p-2 rounded-lg text-purple-600">
                  <Camera size={20} />
                </span>
                Evidencia
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {tempPhotos.map((p) => (
                  <div
                    key={p.id}
                    className="aspect-[4/3] relative rounded-xl overflow-hidden group shadow-sm ring-1 ring-gray-100"
                  >
                    <img
                      src={URL.createObjectURL(p.blob)}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <button
                      onClick={() => removePhoto(p.id)}
                      className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm active:scale-95 transition-all hover:bg-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                <label className="aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all text-gray-400 bg-gray-50/50 group">
                  <Camera
                    size={32}
                    className="mb-2 opacity-50 group-hover:text-blue-500 group-hover:opacity-100 transition-all"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider group-hover:text-blue-600">
                    Agregar Foto
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        ) : (
          // History View
          <div className="space-y-4 max-w-3xl mx-auto">
            <ActivityLogTimeline
              items={logItems}
              onPhotoClick={openLightbox}
              currentUser={user?.name || user?.email}
            />
            {logItems.length === 0 && (
              <div className="text-center text-gray-400 py-10">Sin reportes aún</div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Sibling, not Fixed */}
      {activeTab === 'REPORT' && (
        <div className="p-4 bg-white border-t border-gray-200 flex-none z-30">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {saving ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={20} />
                  Guardar Reporte
                </>
              )}
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
