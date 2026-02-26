import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Filter, Wifi, WifiOff, X, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { getDB } from '../../services/db';
import { SyncQueue } from '../../services/sync-queue';
import { isFieldRecordsV1Enabled } from '../../services/field-records';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface IssueData {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId?: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'DRAFT' | 'SYNCED' | 'PENDING_SYNC';
}

export const IssueTracker: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { isOnline } = useNetwork();
  const { user } = useAuth();
  const projectMember = user?.projectMembers?.find(
    (m: { projectId: string; role: string }) => m.projectId === projectId,
  );
  const isExecutiveViewer = projectMember?.role === 'EXECUTIVE_VIEWER';

  // State
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Issue Form State
  const [newIssue, setNewIssue] = useState<Partial<IssueData>>({
    title: '',
    description: '',
    severity: 'MEDIUM',
    status: 'OPEN',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadIssues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      let projectIssues: IssueData[] = [];

      // 1. Fetch from API if online
      if (isOnline) {
        if (isFieldRecordsV1Enabled()) {
          const res = await api.get(`/field-records?projectId=${projectId}&type=ISSUE`);
          const apiIssues = res.data.map(
            (r: {
              id: string;
              projectId: string;
              content: Record<string, unknown>;
              status: string;
              createdAt: string;
              updatedAt: string;
              syncStatus?: string;
            }) => ({
              id: r.id,
              projectId: r.projectId,
              title: r.content.title,
              description: r.content.description,
              status: r.status,
              severity: r.content.severity,
              createdAt: new Date(r.createdAt).getTime(),
              updatedAt: new Date(r.updatedAt).getTime(),
              syncStatus: r.syncStatus || 'SYNCED',
            }),
          );
          // Save to local DB for offline access
          for (const i of apiIssues) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await db.put('issues', i as any);
          }
          projectIssues = apiIssues;
        } else {
          try {
            const res = await api.get(`/projects/${projectId}/issues`);
            projectIssues = res.data;
            for (const i of projectIssues) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await db.put('issues', { ...i, syncStatus: 'SYNCED' } as any);
            }
          } catch (e) {
            console.warn('Fallback to local issues due to legacy API fail', e);
          }
        }
      }

      // 2. Load from local DB (includes pending ones or fetched ones)
      const localIssues = await db.getAllFromIndex('issues', 'by-project', projectId!);

      // Merge: prefer local pending over remote if conflict (simple approach: just use local if offline)
      if (!isOnline || projectIssues.length === 0) {
        projectIssues = localIssues as unknown as IssueData[];
      } else {
        // Merge pending sync issues from localDB that aren't in API yet
        const pendingLocal = (localIssues as unknown as IssueData[]).filter(
          (i) => i.syncStatus === 'PENDING_SYNC',
        );
        projectIssues = [...projectIssues, ...pendingLocal];
        // Deduplicate
        projectIssues = projectIssues.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
      }

      // Sort by date desc
      projectIssues.sort((a, b) => {
        const dateA =
          typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() : a.updatedAt;
        const dateB =
          typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() : b.updatedAt;
        return dateB - dateA;
      });
      setIssues(projectIssues);
    } catch (err) {
      console.error('Error loading issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async () => {
    if (!newIssue.title || !projectId) return;

    setIsSubmitting(true);
    try {
      const issue: IssueData = {
        id: uuidv4(),
        projectId,
        title: newIssue.title,
        description: newIssue.description || '',
        status: 'OPEN',
        severity: (newIssue.severity as IssueData['severity']) || 'MEDIUM',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: isOnline ? 'SYNCED' : 'PENDING_SYNC',
      };

      // 1. Save Local
      const db = await getDB();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.put('issues', issue as any); // Type assertion to bypass strict DB type check if needed

      // 2. Queue Sync
      if (isFieldRecordsV1Enabled()) {
        const payload = {
          type: 'ISSUE' as const,
          projectId,
          status: 'OPEN',
          content: {
            title: newIssue.title,
            description: newIssue.description || '',
            severity: newIssue.severity || 'MEDIUM',
          },
        };
        await SyncQueue.add('/field-records', 'POST', payload);
      } else {
        await SyncQueue.add('/issues', 'POST', issue);
      }

      // 3. Update UI
      setIssues([issue, ...issues]);
      setIsModalOpen(false);
      setNewIssue({ title: '', description: '', severity: 'MEDIUM', status: 'OPEN' });
      toast.success('Incidencia creada');
    } catch (err) {
      console.error('Error creating issue:', err);
      toast.error('Error al crear incidencia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (s: string) => {
    switch (s) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  const filteredIssues =
    filterStatus === 'ALL' ? issues : issues.filter((i) => i.status === filterStatus);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm z-10 sticky top-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900 text-xl tracking-tight">
                Reporte de Incidencias
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                {isOnline ? (
                  <Wifi size={14} className="text-green-600" />
                ) : (
                  <WifiOff size={14} className="text-red-500" />
                )}
                <span className="font-medium">{issues.length}</span> registradas
              </p>
            </div>
          </div>
          {!isExecutiveViewer && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-black text-white p-2.5 rounded-full hover:bg-gray-800 shadow-md shadow-gray-200 transition-all active:scale-95"
            >
              <Plus size={22} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                filterStatus === status
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'ALL' ? 'Todos' : status}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col gap-3 animate-pulse"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="w-16 h-5 bg-gray-200 rounded-md"></div>
                  <div className="w-16 h-5 bg-gray-200 rounded-md"></div>
                </div>
                <div className="w-3/4 h-5 bg-gray-200 rounded mb-1.5"></div>
                <div className="w-full h-3 bg-gray-100 rounded"></div>
                <div className="w-5/6 h-3 bg-gray-100 rounded"></div>
                <div className="mt-2 text-xs font-medium text-gray-400 w-24 h-4 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-10 text-gray-400 flex flex-col items-center">
            <div className="bg-gray-100 p-4 rounded-full mb-3">
              <Filter size={24} className="text-gray-300" />
            </div>
            <p>No hay incidencias registradas</p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100 active:scale-[0.99] transition transform hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide ${getSeverityColor(issue.severity)}`}
                >
                  {issue.severity}
                </span>
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide ${getStatusColor(issue.status)}`}
                >
                  {issue.status}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5 text-base leading-tight">
                {issue.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                {issue.description}
              </p>
              <div className="mt-4 flex justify-between items-center border-t border-gray-50 pt-3">
                <div className="text-xs font-medium text-gray-400">
                  {new Date(issue.updatedAt).toLocaleDateString()}
                </div>
                {issue.syncStatus === 'PENDING_SYNC' && (
                  <span className="text-[11px] text-orange-600 bg-orange-50 px-2 py-1 rounded-md font-bold flex items-center gap-1.5">
                    <WifiOff size={12} /> PENDIENTE
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Nueva Incidencia
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Título</label>
                <input
                  autoFocus
                  type="text"
                  className="w-full p-3.5 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium"
                  placeholder="¿Qué pasó / Qué se necesita?"
                  value={newIssue.title}
                  onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Prioridad</label>
                  <select
                    className="w-full p-3.5 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all text-gray-900 font-medium appearance-none"
                    value={newIssue.severity}
                    onChange={(e) =>
                      setNewIssue({
                        ...newIssue,
                        severity: e.target.value as IssueData['severity'],
                      })
                    }
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Estado</label>
                  <select
                    className="w-full p-3.5 bg-gray-100 rounded-xl border border-gray-200 outline-none text-gray-500 font-medium appearance-none"
                    value={newIssue.status}
                    disabled
                  >
                    <option value="OPEN">Abierto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Descripción</label>
                <textarea
                  rows={3}
                  className="w-full p-3.5 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all resize-none placeholder:text-gray-400 text-gray-900 font-medium"
                  placeholder="Detalles adicionales..."
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                />
              </div>

              <button
                onClick={handleCreateIssue}
                disabled={isSubmitting || !newIssue.title}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-base hover:bg-gray-800 disabled:opacity-50 disabled:bg-gray-400 active:scale-[0.98] transition-all shadow-lg mt-4 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Save size={18} /> Crear Incidencia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
