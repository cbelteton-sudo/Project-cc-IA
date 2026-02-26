import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetwork } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import { getDB } from '../../services/db';
import { Search, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { format } from 'date-fns';

import { toast } from 'sonner';

export interface DashboardActivity {
  id: string;
  code: string;
  name: string;
  status?: string;
  percent: number;
  measurementType: string;
  startDate?: string;
  endDate?: string;
  project?: { id: string; name: string };
}

export const FieldDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isOnline } = useNetwork();
  const [projectActivities, setProjectActivities] = useState<DashboardActivity[]>([]);
  const [drafts, setDrafts] = useState<{ items: { activityId: string }[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [debugError, setDebugError] = useState<string>(''); // NEW: Debug state

  // Project Selection State
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loadingProjects, setLoadingProjects] = useState(true);

  const { logout } = useAuth();

  // 1. Load Projects on Mount
  useEffect(() => {
    const fetchProjects = async () => {
      if (!isOnline) return;
      setLoadingProjects(true);
      setDebugError('');
      try {
        const res = await api.get(`/projects`);
        setProjects(res.data);
        if (res.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(res.data[0].id);
        } else if (res.data.length === 0) {
          setDebugError(
            'El servidor respondió correctamente pero la lista de proyectos está vacía.',
          );
        }
      } catch (err: any) {
        console.error('Failed to load projects', err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout();
          navigate('/login');
          return;
        }
        setDebugError(`Error de conexión: ${err.message}`);
        toast.error(`Error de conexión al obtener proyectos.`);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const loadActivities = async () => {
    setLoading(true);

    // A. Fetch Activities
    if (isOnline) {
      try {
        const { data } = await api.get(`/activities/project/${selectedProjectId}`);
        setProjectActivities(data);
      } catch (err) {
        console.error('Failed to fetch activities', err);
      }
    }

    // B. Load Local Drafts
    try {
      const db = await getDB();
      const localDrafts = await db.getAllFromIndex('updates', 'by-project', selectedProjectId);
      setDrafts(localDrafts);
    } catch (e) {
      console.error('Failed to load drafts', e);
    }

    setLoading(false);
  };

  // 2. Load Activities when Project or Date changes
  useEffect(() => {
    const handleLoad = async () => {
      if (selectedProjectId) {
        await loadActivities();
      } else {
        setLoading(false);
      }
    };
    handleLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, isOnline, selectedDate]);

  const getStatusBadge = (activityId: string) => {
    const draft = drafts.find((d) => d.items.some((i) => i.activityId === activityId));
    if (draft)
      return (
        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">Draft</span>
      );
    return null; // Could check 'submitted' state if data syncs back
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header / Date */}
      <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100">
        {/* Project Selector */}
        <div className="relative">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full text-xl font-extrabold text-gray-900 bg-transparent border-none focus:ring-0 cursor-pointer outline-none appearance-none pr-8 tracking-tight"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="text-base font-medium">
                {p.name}
              </option>
            ))}
            {loadingProjects && <option>Cargando proyectos...</option>}
            {!loadingProjects && projects.length === 0 && (
              <option value="">Sin proyectos encontrados</option>
            )}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg
              className="fill-current h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

        {/* API Error Message */}
        {projects.length === 0 && !loadingProjects && (
          <div className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            {debugError ||
              (selectedProjectId
                ? 'No se encontraron actividades.'
                : 'No se pudo conectar con el servidor.')}
          </div>
        )}

        <div className="flex justify-between items-center border-t border-gray-50 pt-3">
          <div className="flex items-center space-x-2.5">
            <Calendar size={18} className="text-gray-400" />
            <span className="font-bold text-gray-700 text-sm">
              {format(selectedDate, 'MMM dd, yyyy')}
            </span>
          </div>
          {/* Simplified Date Picker */}
          <input
            type="date"
            className="border border-gray-200 rounded-lg p-1.5 text-sm font-medium text-gray-600 focus:outline-none focus:border-black focus:ring-1 focus:ring-black cursor-pointer bg-gray-50 hover:bg-white transition-colors"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search
          className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-black transition-colors"
          size={18}
        />
        <input
          type="text"
          placeholder="Buscar WBS o actividad..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-medium text-gray-900 placeholder:text-gray-400 transition-all shadow-sm"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="w-1/3 h-3 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-2/3 h-5 bg-gray-200 rounded"></div>
              <div className="w-full h-2 bg-gray-100 rounded-full mt-2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {projectActivities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => navigate(`/field/activity/${activity.id}/update`)}
              className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100 active:scale-[0.99] transition transform hover:shadow-md cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex-1 pr-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5 line-clamp-1">
                    {activity.code || 'NO-CODE'}
                  </span>
                  <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-black transition-colors">
                    {activity.name}
                  </h3>
                </div>
                {getStatusBadge(activity.id)}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-bold text-gray-500">
                <span className="text-gray-600">{activity.percent}% Completado</span>
                <span
                  className={`px-2 py-0.5 rounded-md ${
                    activity.measurementType === 'QUANTITY'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-purple-50 text-purple-700'
                  }`}
                >
                  {activity.measurementType}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className="bg-black h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${activity.percent}%` }}
                />
              </div>
            </div>
          ))}
          {projectActivities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Search size={28} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium">
                No se encontraron actividades para este proyecto y fecha.
              </p>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-20 right-4 flex flex-col space-y-3 z-40">
        <button
          onClick={() => navigate('/field/issues/new')}
          className="bg-black hover:bg-gray-800 text-white p-3.5 rounded-full shadow-lg shadow-gray-300 flex items-center justify-center transition-all active:scale-95 group"
          aria-label="Report Issue"
        >
          <AlertCircle size={26} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  );
};
