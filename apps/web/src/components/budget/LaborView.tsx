import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar, ChevronLeft, ChevronRight, Save, User, Clock, Plus } from 'lucide-react';

interface TimesheetEntry {
    id: string;
    wbsActivityId: string;
    date: string;
    hours: number;
    wbsActivity?: { name: string; code: string };
}

interface Timesheet {
    id: string;
    weekStartDate: string;
    workerName: string;
    entries: TimesheetEntry[];
}

export const LaborView = ({ projectId }: { projectId: string }) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const queryClient = useQueryClient();

    // State for week selection (always starts on Monday)
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const { data: timesheets, isLoading } = useQuery({
        queryKey: ['timesheets', projectId, currentWeekStart.toISOString()],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/timesheets?projectId=${projectId}`);
            // Client-side filter for now, ideally backend filters by week
            return res.data.filter((t: any) => t.weekStartDate.startsWith(currentWeekStart.toISOString().split('T')[0]));
        }
    });

    const { data: wbsActivities } = useQuery({
        queryKey: ['project-activities', projectId],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/activities/project/${projectId}`);
            return res.data;
        }
    });

    const createTimesheetMutation = useMutation({
        mutationFn: async (workerName: string) => {
            return axios.post(`${API_URL}/timesheets`, {
                projectId,
                weekStartDate: currentWeekStart.toISOString().split('T')[0],
                workerName
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timesheets'] });
            toast.success('Parte de horas creado');
            setIsAddModalOpen(false);
        },
        onError: (err: any) => {
            console.error('Error creating timesheet:', err);
            toast.error(err.response?.data?.message || 'Error al crear parte');
        }
    });

    const updateEntryMutation = useMutation({
        mutationFn: async ({ timesheetId, date, wbsActivityId, hours }: any) => {
            return axios.post(`${API_URL}/timesheets/${timesheetId}/entries`, {
                date,
                wbsActivityId,
                hours: Number(hours)
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timesheets'] });
            // Invalidate budget summary to refresh the dashboard KPIs
            queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
            toast.success('Horas actualizadas');
        },
        onError: () => toast.error('Error al guardar horas')
    });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedActivities, setSelectedActivities] = useState<Record<string, string>>({});

    // Initialize selectedActivities from loaded timesheets
    // Initialize selectedActivities from loaded timesheets
    useEffect(() => {
        if (Array.isArray(timesheets)) {
            const initialSelection: Record<string, string> = {};
            timesheets.forEach((sheet: any) => {
                if (!sheet.entries) return;
                // Find the first entry with an activity ID
                const entryWithActivity = sheet.entries.find((e: any) => e.wbsActivityId);
                if (entryWithActivity) {
                    initialSelection[sheet.id] = entryWithActivity.wbsActivityId;
                }
            });
            setSelectedActivities(prev => ({ ...prev, ...initialSelection }));
        }
    }, [timesheets]);


    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    const changeWeek = (offset: number) => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + (offset * 7));
        setCurrentWeekStart(d);
    };

    const handleCellChange = (timesheetId: string, date: string, wbsActivityId: string, hours: string) => {
        if (!wbsActivityId) {
            toast.error('Selecciona una actividad primero');
            return;
        }
        updateEntryMutation.mutate({ timesheetId, date, wbsActivityId, hours });
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando personal...</div>;

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
                    <div className="flex items-center gap-2 font-medium text-gray-700">
                        <Calendar size={18} className="text-blue-600" />
                        Semana del {currentWeekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </div>
                    <button onClick={() => changeWeek(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    <Plus size={18} /> Agregar Trabajador
                </button>
            </div>

            {/* Timesheet Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium">
                        <tr>
                            <th className="px-4 py-3 text-left w-48">Trabajador / Actividad</th>
                            {weekDays.map(d => (
                                <th key={d.toISOString()} className="px-2 py-3 text-center w-24 border-l border-gray-200">
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase text-gray-400">{d.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                        <span className="font-bold">{d.getDate()}</span>
                                    </div>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-right font-bold border-l border-gray-200 w-24 bg-gray-100">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(!timesheets || !Array.isArray(timesheets) || timesheets.length === 0) ? (
                            <tr>
                                <td colSpan={9} className="p-8 text-center text-gray-400">
                                    {isLoading ? 'Cargando registros...' : 'No hay registros para esta semana. Agrega un trabajador para comenzar.'}
                                </td>
                            </tr>
                        ) : timesheets.map((sheet: any) => (
                            <tr key={sheet.id} className="hover:bg-gray-50 group">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {sheet.workerName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{sheet.workerName}</div>
                                            {/* Activity Selector specific to this worker for now (simplified) */}
                                            <select
                                                className="mt-1 w-full text-xs border border-gray-200 rounded p-1 bg-white text-gray-600 focus:ring-1 focus:border-blue-500"
                                                value={selectedActivities[sheet.id] || ''}
                                                onChange={(e) => {
                                                    setSelectedActivities(prev => ({ ...prev, [sheet.id]: e.target.value }));
                                                }}
                                            >
                                                <option value="">Seleccionar Actividad...</option>
                                                {wbsActivities?.map((a: any) => <option key={a.id} value={a.id}>{a.code} {a.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </td>
                                {weekDays.map(d => {
                                    const dateStr = d.toISOString().split('T')[0];
                                    const entry = (sheet.entries || []).find((e: any) => e.date.startsWith(dateStr));
                                    return (
                                        <td key={dateStr} className="p-0 border-l border-gray-100 relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="24"
                                                className="w-full h-full py-4 text-center bg-transparent focus:bg-blue-50 focus:outline-none transition font-medium text-gray-700"
                                                placeholder="-"
                                                defaultValue={entry?.hours || ''}
                                                onBlur={(e) => {
                                                    const val = e.target.value;
                                                    const activityId = entry?.wbsActivityId || selectedActivities[sheet.id];

                                                    if (val && activityId) {
                                                        updateEntryMutation.mutate({
                                                            timesheetId: sheet.id,
                                                            date: dateStr,
                                                            wbsActivityId: activityId,
                                                            hours: val
                                                        });
                                                    } else if (val) {
                                                        toast.error('Selecciona una actividad para guardar horas');
                                                    }
                                                }}
                                            />
                                        </td>
                                    );
                                })}
                                <td className="px-4 py-3 text-right font-bold text-gray-800 bg-gray-50 border-l border-gray-200">
                                    {(sheet.entries || []).reduce((sum: number, e: any) => sum + (e.hours || 0), 0)}h
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Worker Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl">
                        <h3 className="font-bold text-lg mb-4">Agregar Trabajador</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            createTimesheetMutation.mutate(formData.get('workerName') as string);
                        }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Trabajador</label>
                                <input name="workerName" required className="w-full border border-gray-300 rounded-lg p-2" placeholder="Ej. Juan Pérez" />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Agregar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
