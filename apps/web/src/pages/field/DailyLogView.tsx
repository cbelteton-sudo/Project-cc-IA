import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Save, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNetwork } from '../../context/NetworkContext';
import { getDB } from '../../services/db';
import { SyncQueue } from '../../services/sync-queue';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface DailyLogContent {
    labor: string;
    equipment: string;
    weather: string;
    notes: string;
}

interface DailyLogEntry {
    id: string;
    projectId: string;
    date: string;
    data: DailyLogContent;
    status: 'DRAFT' | 'SYNCED' | 'PENDING_SYNC';
    updatedAt: number;
}

export const DailyLogView: React.FC = () => {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const { isOnline, syncStatus } = useNetwork();

    // State
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [log, setLog] = useState<DailyLogEntry>({
        id: uuidv4(),
        projectId: projectId || '',
        date: format(new Date(), 'yyyy-MM-dd'),
        data: {
            labor: '',
            equipment: '',
            weather: '',
            notes: ''
        },
        status: 'DRAFT',
        updatedAt: Date.now(),
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load Data Effect
    useEffect(() => {
        if (!projectId) return;
        loadLog(selectedDate);
    }, [projectId, selectedDate]);

    const loadLog = async (date: string) => {
        setLoading(true);
        try {
            const db = await getDB();
            // Get all logs for project and find by date
            const projectLogs = await db.getAllFromIndex('daily_logs', 'by-project', projectId!);
            const localLog = projectLogs.find(l => l.date === date);

            if (localLog) {
                setLog(localLog);
            } else {
                // Reset form for new date
                setLog({
                    id: uuidv4(),
                    projectId: projectId || '',
                    date: date,
                    data: {
                        labor: '',
                        equipment: '',
                        weather: '',
                        notes: ''
                    },
                    status: 'DRAFT',
                    updatedAt: Date.now(),
                });
            }
        } catch (err) {
            console.error("Failed to load log:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedLog: DailyLogEntry = {
                ...log,
                updatedAt: Date.now(),
                status: isOnline ? 'SYNCED' : 'PENDING_SYNC' // Optimistic
            };

            // 1. Save to IDB
            const db = await getDB();
            await db.put('daily_logs', updatedLog);

            // 2. Queue Sync
            await SyncQueue.add(
                '/daily-logs',
                'POST',
                updatedLog
            );

            setLog(updatedLog);
        } catch (err) {
            console.error("Error saving:", err);
            alert("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <button onClick={() => navigate(-1)} className="mr-3 p-1 rounded-full hover:bg-gray-100">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="font-bold text-gray-800 text-lg">Bitácora de Obra</h1>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                {isOnline ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-500" />}
                                {isOnline ? 'Online' : 'Offline'} •
                                {syncStatus === 'SYNCING' ? <span className="text-blue-500 flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> Sincronizando...</span> :
                                    syncStatus === 'ERROR' ? <span className="text-red-500">Error de Sync</span> :
                                        <span className="text-gray-400">Sincronizado</span>}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        <Save size={18} />
                        <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                    </button>
                </div>

                {/* Date Selector */}
                <div className="flex items-center bg-gray-100 p-2 rounded-lg">
                    <Calendar size={20} className="text-gray-500 mr-2" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent font-medium text-gray-700 outline-none w-full"
                    />
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Cargando...</div>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Resumen de Clima</label>
                            <input
                                type="text"
                                placeholder="Ej: Soleado, 25°C, Viento leve..."
                                value={log.data.weather}
                                onChange={e => setLog({ ...log, data: { ...log.data, weather: e.target.value } })}
                                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                            />
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mano de Obra</label>
                            <textarea
                                placeholder="Registra el personal presente y horas..."
                                rows={4}
                                value={log.data.labor}
                                onChange={e => setLog({ ...log, data: { ...log.data, labor: e.target.value } })}
                                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none"
                            />
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Maquinaria y Equipo</label>
                            <textarea
                                placeholder="Equipo activo, paros, mantenimiento..."
                                rows={4}
                                value={log.data.equipment}
                                onChange={e => setLog({ ...log, data: { ...log.data, equipment: e.target.value } })}
                                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none"
                            />
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notas Generales</label>
                            <textarea
                                placeholder="Observaciones adicionales, incidentes menores..."
                                rows={4}
                                value={log.data.notes}
                                onChange={e => setLog({ ...log, data: { ...log.data, notes: e.target.value } })}
                                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition resize-none"
                            />
                        </div>

                        <div className="text-xs text-center text-gray-400 pb-4">
                            ID: {log.id} • Última actualización: {new Date(log.updatedAt).toLocaleTimeString()}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
