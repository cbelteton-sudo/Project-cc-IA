import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, ChevronDown, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { KpiCardGroup } from './components/KpiCardGroup';
import { FilterBar } from './components/FilterBar';
import { RecordList } from './components/RecordList';
import { QuickCreateModal } from './components/QuickCreateModal';
import type { FieldRecordPayload } from '../../services/field-records';
// Hooks
import { useFieldRecordsV2 } from './hooks/useFieldRecordsV2';

export function FieldDashboardV2() {
  const navigate = useNavigate();
  const { isOnline } = useNetwork();
  const { user, logout } = useAuth(); // For 401 handling

  // Project State
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [apiError, setApiError] = useState('');

  const [activeFilter, setActiveFilter] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load Projects on Mount
  useEffect(() => {
    const fetchProjects = async () => {
      if (!isOnline) return;
      setLoadingProjects(true);
      setApiError('');
      try {
        const res = await api.get(`/projects`);
        setProjects(res.data);
        if (res.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(res.data[0].id);
        } else if (res.data.length === 0) {
          setApiError('No se encontraron proyectos activos.');
        }
      } catch (err) {
        console.error('Failed to load projects', err);
        const e = err as { response?: { status: number } };
        if (e.response && (e.response.status === 401 || e.response.status === 403)) {
          logout();
          return;
        }
        setApiError(`Error de conexión al cargar proyectos.`);
        toast.error(`Error de conexión al obtener proyectos.`);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Generic Field Records Offline Sync
  useEffect(() => {
    const syncOfflineGenericRecords = async () => {
      if (!isOnline || !selectedProjectId) return;

      try {
        const { getDB } = await import('@/services/db');
        const db = await getDB();
        const drafts = await db.getAllFromIndex('updates', 'by-project', selectedProjectId);

        const genericDrafts = drafts.filter((d) => (d as any).type === 'FIELD_RECORD_V2');
        if (genericDrafts.length === 0) return;

        console.log(
          `[Field Sync] Encontrados ${genericDrafts.length} registros offline para sincronizar.`,
        );

        // Import canonical service dynamically to avoid circular dependency issues at the top
        // (usually fine, but we'll import if needed or use api)
        const { fieldRecordsService } = await import('../../services/field-records');
        let successCount = 0;

        for (const draft of genericDrafts) {
          try {
            // Strip the local-specific ID before sending
            const payloadToSync = { ...(draft as any).payload };
            delete payloadToSync.id;
            delete payloadToSync.createdAt;

            payloadToSync.status = 'PENDING'; // Or standard default

            await fieldRecordsService.createRecord(payloadToSync);
            await db.delete('updates', draft.id);
            successCount++;
          } catch (e) {
            console.error(`Error syncing draft ${draft.id}`, e);
          }
        }

        if (successCount > 0) {
          toast.success(`Se sincronizaron exitosamente ${successCount} registros creados offline.`);
          // Trigger a window event or let user refresh manually for now since we can't easily access queryClient inside an isolated async effect without adding it to deps.
          window.dispatchEvent(new Event('focus')); // This triggers windowFocus refetch in react-query
        }
      } catch (err) {
        console.error('Error during generic offline sync', err);
      }
    };

    syncOfflineGenericRecords();
  }, [isOnline, selectedProjectId]);

  // Data Fetching
  const {
    data: records,
    isLoading,
    isError,
    refetch,
  } = useFieldRecordsV2({
    projectId: selectedProjectId,
  });

  // Dynamic KPI aggregation logic
  const safeRecords = records || [];

  const pendientesCount = safeRecords.filter(
    (r: FieldRecordPayload) =>
      r.status === 'PENDING' || r.status === 'Draft' || r.status === 'DRAFT',
  ).length;

  const urgentesCount = safeRecords.filter((r: FieldRecordPayload) => {
    const content = r.content as Record<string, unknown>;
    const isHighPriority = content?.priority === 'HIGH' || content?.priority === 'URGENT';
    const isIssue = r.type === 'ISSUE';
    // Consider urgents if they are issues or high priority and not yet closed/resolved
    const isOpen = r.status !== 'CLOSED' && r.status !== 'RESOLVED';
    return isOpen && (isHighPriority || isIssue);
  }).length;

  const enRevisionCount = safeRecords.filter(
    (r: FieldRecordPayload) => r.status === 'IN_PROGRESS' || r.status === 'REVIEW',
  ).length;

  const completadasCount = safeRecords.filter(
    (r: FieldRecordPayload) => r.status === 'CLOSED' || r.status === 'RESOLVED',
  ).length;

  const kpis = [
    {
      id: 'open',
      title: 'Pendientes',
      value: pendientesCount,
      color: 'blue' as const,
      iconType: 'pending' as const,
    },
    {
      id: 'urgent',
      title: 'Urgentes',
      value: urgentesCount,
      color: 'red' as const,
      iconType: 'urgent' as const,
    },
    {
      id: 'progress',
      title: 'En Revisión',
      value: enRevisionCount,
      color: 'purple' as const,
      iconType: 'progress' as const,
    },
    {
      id: 'closed',
      title: 'Completadas',
      value: completadasCount,
      color: 'green' as const,
      iconType: 'done' as const,
    },
  ];

  if (!selectedProjectId && !loadingProjects) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">
          {apiError || 'Selecciona un Proyecto'}
        </h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          No tienes proyectos asignados o debes seleccionar uno para ver el panel de comando.
        </p>
      </div>
    );
  }

  const projectMembership = user?.projectMembers?.find((m) => m.projectId === selectedProjectId);
  const projectRole = projectMembership?.role;
  const isGlobalAdmin = user?.role === 'ADMIN' || user?.role === 'ADMINISTRADOR';

  const hasTaskCreatePermission =
    isGlobalAdmin ||
    [
      'PROJECT_ADMIN',
      'DIRECTOR',
      'PM',
      'PMO',
      'PROJECT_MANAGER',
      'SUPERVISOR',
      'CONTRACTOR_LEAD',
      'FIELD_OPERATOR',
    ].includes(projectRole || '');

  console.log('[DEBUG FieldDashboardV2 Permissions]', {
    userRole: user?.role,
    isGlobalAdmin,
    projectRole,
    selectedProjectId,
    hasTaskCreatePermission,
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-20 md:pb-0">
      {/* Header Compacto Mobile con Dropdown */}
      <div className="bg-white border-b px-4 py-3 sm:px-6 shrink-0 relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              Módulo de Campo
            </h1>
            <div className="relative flex items-center">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={loadingProjects}
                className="appearance-none bg-transparent font-bold text-lg text-slate-900 pr-6 py-0 focus:outline-none focus:ring-0 cursor-pointer"
              >
                {loadingProjects ? (
                  <option>Cargando proyectos...</option>
                ) : (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {selectedProjectId && hasTaskCreatePermission && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Crear tarea</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 max-w-7xl mx-auto">
        {/* Main Content (3 columns on desktop) */}
        <div className="md:col-span-3 space-y-6">
          <KpiCardGroup kpis={kpis} onKpiClick={(id) => setActiveFilter(id)} />
          <FilterBar
            currentFilter={activeFilter}
            onFilterChange={setActiveFilter}
            filters={[
              { label: 'Todos', value: 'All' },
              { label: 'Issues', value: 'ISSUE' },
              { label: 'Incidentes', value: 'INCIDENT' },
              { label: 'Bitácora', value: 'LOG' },
            ]}
          />

          <div className="bg-slate-50 p-2 md:p-6 rounded-2xl border border-slate-100 min-h-[500px]">
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm animate-pulse"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-200" />
                        <div className="w-20 h-4 bg-slate-200 rounded" />
                      </div>
                      <div className="w-16 h-4 bg-slate-200 rounded" />
                    </div>
                    <div className="w-3/4 h-5 bg-slate-200 rounded mb-2" />
                    <div className="w-full h-4 bg-slate-100 rounded mb-1" />
                    <div className="w-2/3 h-4 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center p-12 text-rose-500 bg-rose-50 rounded-xl border border-rose-100">
                <AlertCircle className="w-8 h-8 mb-4 opacity-80" />
                <span className="font-medium">Error al cargar registros. Intenta nuevamente.</span>
              </div>
            ) : records?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Sin Registros</h3>
                <p className="text-slate-500 text-center max-w-xs leading-relaxed">
                  {hasTaskCreatePermission
                    ? "No hay reportes de campo disponibles. Puedes crear uno tocando en 'Crear tarea'."
                    : 'No hay reportes de campo. Tu rol actual solo permite visualización.'}
                </p>
              </div>
            ) : (
              <RecordList
                records={records || []}
                isLoading={false}
                isError={false}
                onRecordClick={(id) => navigate(`/field/records/${id}`)}
              />
            )}
          </div>
        </div>

        {/* Sidebar (1 column on desktop) */}
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 className="font-bold text-blue-900 mb-2">Clima (Placeholder)</h3>
            <p className="text-sm text-blue-800">24°C, Soleado. Condiciones óptimas para colado.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center justify-between">
              Estado Sincronización
              {!isOnline && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </h3>
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`}
              />
              {isOnline ? 'Online (Sincronizado)' : 'Offline (Cambios locales pendientes)'}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile-first Floating Action Button for Quick Create */}
      {selectedProjectId && hasTaskCreatePermission && (
        <div className="fixed bottom-24 right-5 md:hidden z-[99]">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refetch}
        projectId={selectedProjectId}
      />
    </div>
  );
}
