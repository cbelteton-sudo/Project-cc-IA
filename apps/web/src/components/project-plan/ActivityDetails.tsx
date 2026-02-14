import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PhotoLightbox } from '../../pages/field/PhotoLightbox';
import axios from 'axios';
import {
  CheckCircle,
  Calendar,
  User,
  TrendingUp,
  Clock,
  AlertTriangle,
  Flag,
  X,
  GitMerge,
  History,
  ChevronDown,
  ArrowRight,
  Trash2,
  Link as LinkIcon,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { CloseActivityModal } from './CloseActivityModal';

interface ActivityDetailsProps {
  activityId: string;
  token: string;
  onUpdate: () => void;
  onCreateSubActivity: (parentId: string) => void;
  onClose?: () => void;
}

export const ActivityDetails = ({
  activityId,
  token,
  onUpdate,
  onCreateSubActivity,
  onClose,
}: ActivityDetailsProps) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [showCloseModal, setShowCloseModal] = useState(false);

  // UI State for inputs
  const [percentInput, setPercentInput] = useState(0);
  const [notes, setNotes] = useState('');

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);

  const openLightbox = (src: string) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
  };

  // Fetch full details
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/activities/${activityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Derived state
  const currentPercent = activity?.percent || 0;
  const children = activity?.children || [];

  // Initialize inputs when activity loads
  useEffect(() => {
    if (activity) {
      setPercentInput(activity.percent);
    }
  }, [activity]);

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () =>
      (await axios.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } })).data,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return axios.patch(`${API_URL}/activities/${activityId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      toast.success('Activity updated');
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] });
      onUpdate(); // Refresh tree
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update';
      toast.error(msg);
    },
  });

  // Fetch Budget Lines (Project Level)
  const { data: budgetLines } = useQuery({
    queryKey: ['budget-lines', (activity as any)?.projectId],
    queryFn: async () => {
      const pid = (activity as any)?.projectId;
      if (!pid) return [];
      const res = await axios.get(`${API_URL}/budgets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const projectBudget = res.data.find((b: any) => b.projectId === pid);
      if (!projectBudget) return [];

      // Now fetch details (lines) for this budget
      const resDetails = await axios.get(`${API_URL}/budgets/${projectBudget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return resDetails.data.budgetLines || [];
    },
    enabled: !!activity,
  });

  const handleProgressUpdate = (e: any) => {
    e.preventDefault();
    // This function is implemented inline in the JSX below for the new UI
  };

  // Dependency Management
  const [selectedDependencyId, setSelectedDependencyId] = useState('');

  // Fetch All Activities for Dropdown
  const { data: allActivities } = useQuery({
    queryKey: ['activities-flat', (activity as any)?.projectId],
    queryFn: async () => {
      const pid = (activity as any)?.projectId;
      if (!pid) return [];
      const res = await axios.get(`${API_URL}/activities/project/${pid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!activity,
  });

  const addDependencyMutation = useMutation({
    mutationFn: async () => {
      return axios.post(
        `${API_URL}/activities/${activityId}/dependencies`,
        {
          dependsOnActivityId: selectedDependencyId,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] });
      queryClient.invalidateQueries({ queryKey: ['activities', (activity as any)?.projectId] });
      setSelectedDependencyId('');
      toast.success('Dependencia agregada');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Error al agregar dependencia'),
  });

  const removeDependencyMutation = useMutation({
    mutationFn: async (depId: string) => {
      return axios.delete(`${API_URL}/activities/${activityId}/dependencies/${depId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] });
      queryClient.invalidateQueries({ queryKey: ['activities', (activity as any)?.projectId] });
      toast.success('Dependencia eliminada');
    },
    onError: () => toast.error('Error al eliminar dependencia'),
  });

  const handleAddDependency = () => {
    if (!selectedDependencyId) return;
    addDependencyMutation.mutate();
  };

  const handleRemoveDependency = (depId: string) => {
    if (confirm('¿Eliminar esta dependencia?')) {
      removeDependencyMutation.mutate(depId);
    }
  };

  // Helper for safe dates
  const safeDate = (dateVal: any) => {
    if (!dateVal) return '--';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '--';
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch (e) {
      return '--';
    }
  };

  // Helper for history dates (includes time)
  const safeDateTime = (dateVal: any) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">{t('common.loading')}</div>;
  if (!activity) return <div className="p-8 text-center">{t('activities.not_found')}</div>;

  // Build History Array
  const historyItems = activity
    ? [
        ...(activity.progressRecords || []),
        ...(activity.dailyUpdates || []),
        ...(activity.fieldUpdates || []).map((u: any) => ({
          ...u,
          isFieldUpdate: true,
          date: u?.fieldUpdate?.date || u?.fieldUpdate?.createdAt || new Date(),
          user: { name: 'Reporte de Campo' },
        })),
        ...(activity.fieldDailyEntries || []).map((e: any) => ({
          ...e,
          isDailyEntry: true,
          date: e?.dailyReport?.date || e?.dailyReport?.createdAt || new Date(),
          user: { name: 'Bitácora' },
        })),
      ].sort((a: any, b: any) => {
        const tA = new Date(a.date || a.createdAt || a.weekStartDate).getTime();
        const tB = new Date(b.date || b.createdAt || b.weekStartDate).getTime();
        return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
      })
    : [];

  const displayedHistory = showAllHistory ? historyItems : historyItems.slice(0, 3);

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* 1. HEADER - STICKY - Compact */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-sm shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">{activity.name}</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* 2. MAIN SCROLLABLE CONTENT - Compact Column */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* BLOCK A: PROGRESS STATUS (Visual) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-end mb-3">
              <div>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                  Progreso Actual
                </h3>
                <div className="text-3xl font-extrabold text-blue-600">{activity.percent}%</div>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                      activity.status === 'DONE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activity.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : activity.status === 'BLOCKED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t(`activities.status_${activity.status}`) || activity.status}
                  </span>
                </div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  Fechas
                </h3>
                <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 justify-end">
                  <Calendar size={14} className="text-gray-400" />
                  {safeDate(activity.startDate)}
                  <span className="text-gray-300">→</span>
                  {safeDate(activity.endDate)}
                </div>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-1000 ease-out"
                style={{ width: `${activity.percent || 0}%` }}
              />
            </div>
          </div>

          {/* BLOCK B: UPDATE ACTION (Interactive) - REFACTORED */}
          <div className="bg-blue-50/50 rounded-lg shadow-sm border border-blue-100 p-4">
            <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-1.5">
              <Clock size={16} /> Comentario de Alto Nivel
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-blue-800 mb-1">
                  Nota / Comentario <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escribe un comentario o actualización..."
                  className="w-full text-xs py-2 px-3 border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 shadow-sm bg-white resize-none"
                />
              </div>

              <button
                onClick={() => {
                  if (!notes || notes.trim() === '')
                    return toast.error(t('activities.notes_required'));
                  // Send current percent (no change) and notes
                  updateMutation.mutate({ percent: activity.percent, notes });
                  setNotes(''); // Clear after send
                }}
                disabled={updateMutation.isPending || !notes}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md shadow-sm transition-transform active:scale-[0.99] text-xs"
              >
                {updateMutation.isPending ? 'Guardando...' : 'Agregar comentario'}
              </button>
            </div>
          </div>

          {/* BLOCK C: TEAM & EXECUTION */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-100 pb-1.5">
              Equipo responsable de ejecución
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Contractor */}
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">
                  Contratista
                </span>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-base shadow-sm">
                    🏢
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-xs truncate">
                      {activity.contractor?.name || 'No asignado'}
                    </div>
                    <div className="text-[10px] text-gray-500">Externo</div>
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">
                  Supervisor
                </span>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-base shadow-sm">
                    👷
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-xs truncate">
                      {(activity as any).assignedUser?.name ||
                        (activity as any).backlogItems?.[0]?.assigneeUser?.name ||
                        'No asignado'}
                    </div>
                    <div className="text-[10px] text-gray-400 italic">
                      Asignar en Sprint Backlog
                    </div>
                  </div>
                </div>
              </div>

              {/* Crew Leader */}
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">
                  Líder de Cuadrilla (Campo)
                </span>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-base shadow-sm">
                    👷‍♂️
                  </div>
                  <div className="min-w-0 flex-1">
                    <select
                      className="w-full bg-transparent text-xs font-bold text-gray-900 outline-none border-none p-0 focus:ring-0 cursor-pointer"
                      value={(activity as any).crewLeaderId || ''}
                      onChange={(e) =>
                        updateMutation.mutate({ crewLeaderId: e.target.value || null })
                      }
                    >
                      <option value="">-- Sin Asignar --</option>
                      {users
                        ?.filter((u: any) => u.role !== 'ADMIN')
                        .map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                    <div className="text-[10px] text-blue-500">Responsable de Reportes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BLOCK D: DEPENDENCIES & BUDGET */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-100 pb-1.5">
              Lógica y Presupuesto
            </h3>

            <div className="space-y-4">
              {/* Dependencies */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1.5">
                  Predecesoras
                </label>
                <div className="space-y-1.5 mb-2">
                  {activity.dependencies?.map((dep: any) => (
                    <div
                      key={dep.id}
                      className="flex justify-between items-center text-xs bg-orange-50 text-orange-900 px-3 py-1.5 rounded border border-orange-100"
                    >
                      <span className="font-medium flex items-center gap-1.5">
                        <AlertTriangle size={12} /> {dep.dependsOn?.name}
                      </span>
                      <button
                        onClick={() => handleRemoveDependency(dep.id)}
                        className="text-orange-400 hover:text-orange-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {!activity.dependencies?.length && (
                    <p className="text-xs text-gray-400 italic">Sin dependencias.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <select
                    className="flex-1 bg-white border border-gray-300 text-gray-900 text-xs rounded-md p-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                    value={selectedDependencyId}
                    onChange={(e) => setSelectedDependencyId(e.target.value)}
                  >
                    <option value="">+ Agregar...</option>
                    {allActivities?.map(
                      (act: any) =>
                        act.id !== activity.id && (
                          <option key={act.id} value={act.id}>
                            {act.name}
                          </option>
                        ),
                    )}
                  </select>
                  <button
                    onClick={handleAddDependency}
                    disabled={!selectedDependencyId}
                    className="bg-gray-800 text-white px-3 py-1.5 rounded-md hover:bg-black disabled:opacity-50"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1.5">
                  Renglón Presupuestario
                </label>
                <select
                  className="w-full bg-white border border-gray-300 text-gray-900 text-xs rounded-md p-2 outline-none focus:ring-1 focus:ring-blue-500"
                  value={(activity as any).budgetLineId || ''}
                  onChange={(e) => updateMutation.mutate({ budgetLineId: e.target.value || null })}
                >
                  <option value="">-- Sin Vincular --</option>
                  {budgetLines?.map((line: any) => (
                    <option key={line.id} value={line.id}>
                      {line.code} - {line.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* BLOCK E: HISTORY */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-1.5">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Historial
              </h3>
              {historyItems.length > 3 && (
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  {showAllHistory ? 'Ver menos' : `Ver todos (${historyItems.length})`}
                </button>
              )}
            </div>

            <div className="relative pl-3 space-y-4">
              <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-gray-200"></div>

              {displayedHistory.map((record: any, idx: number) => {
                const isDailyUpdate = !!record.text;
                const isFieldUpdate = record.isFieldUpdate;
                const isDailyEntry = record.isDailyEntry;

                const dateStr = safeDateTime(
                  record.date || record.createdAt || record.weekStartDate,
                );

                let badgeColor = 'bg-blue-500';
                let titleColor = 'text-blue-700';
                let titleText = `Avance: ${record.percent}%`;
                let contentText = record.notes || 'Sin notas';
                let userText = record.user?.name || 'Usuario';

                if (isDailyUpdate) {
                  badgeColor = 'bg-purple-500';
                  titleColor = 'text-purple-700';
                  titleText = 'Comentario / Bitácora';
                  contentText = record.text;
                } else if (isFieldUpdate) {
                  badgeColor = 'bg-orange-500';
                  titleColor = 'text-orange-700';
                  titleText = `Reporte Campo - ${record.fieldUpdate?.status || 'Borrador'}`;
                  contentText =
                    record.notes ||
                    (record.qtyDone ? `Cant: ${record.qtyDone}` : 'Estado actualizado');
                  if (record.suggestedPercent) titleText += ` [${record.suggestedPercent}%]`;
                  userText = 'Gestión Campo';
                } else if (isDailyEntry) {
                  badgeColor = 'bg-amber-500';
                  titleColor = 'text-amber-700';
                  titleText = 'Diario Obra';
                  contentText = record.note || `WBS: ${record.wbs || '--'}. ${record.status}`;
                  userText = 'Reporte Diario';
                }

                const hasPhotos = record.photos && record.photos.length > 0;

                return (
                  <div key={idx} className="relative flex gap-3">
                    <div
                      className={`relative z-10 w-3 h-3 mt-1 rounded-full border-2 border-white shadow-sm shrink-0 ${badgeColor}`}
                    ></div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                        <span className={`text-xs font-bold uppercase ${titleColor}`}>
                          {titleText}
                        </span>
                        <span className="text-[10px] text-gray-400 capitalize">{dateStr}</span>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-gray-700 text-xs leading-relaxed whitespace-pre-wrap">
                        {contentText}
                      </div>

                      <div className="flex justify-between items-center mt-1.5">
                        {hasPhotos && (
                          <button
                            onClick={() => {
                              const url = record.photos[0].urlMain || record.photos[0].urlThumb;
                              const baseUrl = API_URL.replace('/api', '');
                              const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
                              openLightbox(fullUrl);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-1.5 py-0.5 rounded"
                          >
                            <Camera size={12} />
                            {record.photos.length} Foto{record.photos.length !== 1 ? 's' : ''}
                          </button>
                        )}
                        <div className="text-[10px] text-gray-400 font-medium ml-auto">
                          Por: {userText}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!activity.progressRecords?.length &&
                !activity.dailyUpdates?.length &&
                !activity.fieldUpdates?.length && (
                  <p className="text-center text-xs text-gray-400 italic py-2">Sin historial.</p>
                )}
            </div>
          </div>

          {/* BLOCK F: ACTIONS */}
          <div className="pt-2 pb-6">
            {currentPercent === 100 && activity.status !== 'CLOSED' ? (
              <button
                onClick={() => setShowCloseModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-lg shadow shadow-emerald-200 transition-all transform hover:-translate-y-0.5"
              >
                <CheckCircle size={18} /> {t('activities.validate_close')}
              </button>
            ) : activity.status === 'CLOSED' ? (
              <button
                onClick={() => setShowCloseModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold py-2.5 rounded-lg transition-colors"
              >
                <User size={18} /> Ver Acta de Cierre
              </button>
            ) : (
              <button className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-transparent hover:border-red-100">
                <Trash2 size={14} /> {t('activities.delete_activity')}
              </button>
            )}
          </div>
        </div>
      </div>

      <CloseActivityModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        activity={activity}
        token={token}
        existingRecord={activity.closureRecord}
      />

      <PhotoLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageSrc={lightboxSrc}
      />
    </div>
  );
};
