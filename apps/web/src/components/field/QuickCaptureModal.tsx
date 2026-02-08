
import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Search, Clock, Save, Image as ImageIcon, Check, AlertTriangle, FileText } from 'lucide-react';
import { useQuickCapture } from '../../context/QuickCaptureContext';
import { OfflineManager } from '../../services/offline-manager';
import { toast } from 'sonner';
import { getDB } from '../../services/db';
import { useNetwork } from '../../context/NetworkContext';

// Basic Activity Interface for Search
interface ActivityResult {
    id: string;
    name: string;
    code: string;
    path: string; // Project > Parent
}

export const QuickCaptureModal: React.FC = () => {
    const { isOpen, closeCapture, state } = useQuickCapture();
    const { isOnline } = useNetwork();
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Data
    const [photos, setPhotos] = useState<File[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<ActivityResult | null>(null);
    const [status, setStatus] = useState<string>('IN_PROGRESS'); // IN_PROGRESS, BLOCKED, DONE
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ActivityResult[]>([]);
    const [recentActivities, setRecentActivities] = useState<ActivityResult[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset on Open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setPhotos([]);
            setSelectedActivity(null);
            setStatus('IN_PROGRESS');
            setNote('');
            setSearchQuery('');
            loadRecents();
        }
    }, [isOpen]);

    const loadRecents = () => {
        const stored = localStorage.getItem('recent_activities');
        if (stored) {
            try {
                setRecentActivities(JSON.parse(stored).slice(0, 5));
            } catch (e) { }
        }
    };

    const saveRecent = (act: ActivityResult) => {
        const existing = recentActivities.filter(a => a.id !== act.id);
        const updated = [act, ...existing].slice(0, 10);
        setRecentActivities(updated);
        localStorage.setItem('recent_activities', JSON.stringify(updated));
    };

    // Mock Search (In real app, query API or Local DB)
    // For MVP, we'll try to use what's in 'field_daily_entries' history or 'projects' cache if available.
    // Or just fetch active activities if online.
    useEffect(() => {
        if (step === 2 && searchQuery.length > 2) {
            // Mock search or API call
            // We'll skip implementation detail for searching entire DB here and assume user uses Recents or we have a context list.
            // If online, we could fetch.
        }
    }, [searchQuery, step]);


    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setPhotos(Array.from(e.target.files));
            setStep(2); // Auto advance if photo selected
        }
    };

    const handleSave = async () => {
        if (!selectedActivity) return;

        setSaving(true);
        try {
            await OfflineManager.addToQueue({
                projectId: state.projectId || 'UNKNOWN', // Ideally we get project from activity or context
                activityId: selectedActivity.id,
                activityName: selectedActivity.name,
                status,
                note,
                photos
            });

            saveRecent(selectedActivity);

            toast.success(isOnline ? "Guardado y subiendo..." : "Guardado en cola (Offline)");
            closeCapture();
        } catch (e) {
            console.error(e);
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={closeCapture} />

            {/* Modal Card */}
            <div className="bg-white w-full sm:w-[480px] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] pointer-events-auto overflow-hidden animate-in slide-in-from-bottom duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-lg">
                        {step === 1 && "Capturar Evidencia"}
                        {step === 2 && "Seleccionar Actividad"}
                        {step === 3 && "Detalles"}
                    </h3>
                    <button onClick={closeCapture} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto min-h-[300px]">

                    {/* STEP 1: PHOTOS */}
                    {step === 1 && (
                        <div className="flex flex-col gap-4 h-full">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-4 hover:bg-gray-100 hover:border-blue-400 transition-all p-10 group"
                            >
                                <div className="bg-blue-100 p-6 rounded-full group-hover:scale-110 transition-transform">
                                    <Camera size={48} className="text-blue-600" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-lg text-gray-700">Tomar Foto</p>
                                    <p className="text-sm text-gray-400">o seleccionar de galería</p>
                                </div>
                            </button>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                multiple
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handlePhotoSelect}
                            />

                            <button
                                onClick={() => setStep(2)}
                                className="p-4 text-center text-gray-500 font-medium hover:text-gray-800"
                            >
                                Omitir foto (solo nota)
                            </button>
                        </div>
                    )}

                    {/* STEP 2: ACTIVITY */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {/* Preview Photos */}
                            {photos.length > 0 && (
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                    {photos.map((f, i) => (
                                        <div key={i} className="w-16 h-16 rounded-lg relative overflow-hidden shrink-0">
                                            <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar actividad..."
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-100 outline-none"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                // In a real implementation, we'd hook up a search service here
                                // For now, users rely on "Recents" or Manual Entry
                                />
                            </div>

                            {/* Recents */}
                            {recentActivities.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recientes</h4>
                                    <div className="flex flex-col gap-2">
                                        {recentActivities.map(act => (
                                            <button
                                                key={act.id}
                                                onClick={() => { setSelectedActivity(act); setStep(3); }}
                                                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-sm text-left transition-all"
                                            >
                                                <div className="bg-gray-100 p-2 rounded-lg"><Clock size={16} className="text-gray-500" /></div>
                                                <div>
                                                    <div className="font-semibold text-sm text-gray-900">{act.name}</div>
                                                    <div className="text-xs text-gray-400">{act.path}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fallback for MVP if no search */}
                            <div className="p-4 bg-yellow-50 rounded-xl text-yellow-800 text-sm flex gap-2">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <div>
                                    Modo Offline: Solo se muestran actividades recientes.
                                    Para otras, usa el listado completo del proyecto.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: DETAILS */}
                    {step === 3 && selectedActivity && (
                        <div className="space-y-6">
                            {/* Activity Context */}
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="bg-white p-2 rounded-lg shadow-sm font-bold text-xs text-blue-600 border border-blue-50">
                                    {selectedActivity.code}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{selectedActivity.name}</div>
                                    <div className="text-xs text-gray-500">{selectedActivity.path}</div>
                                </div>
                                <button onClick={() => setStep(2)} className="ml-auto text-xs text-blue-600 font-medium">Cambiar</button>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Estado</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setStatus('IN_PROGRESS')}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${status === 'IN_PROGRESS' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                    >
                                        <div className={`p-1.5 rounded-full ${status === 'IN_PROGRESS' ? 'bg-blue-200' : 'bg-gray-200'}`} />
                                        <span className="text-xs font-bold">Avance</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus('BLOCKED')}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${status === 'BLOCKED' ? 'border-red-500 bg-red-50 text-red-700' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                    >
                                        <AlertTriangle size={16} />
                                        <span className="text-xs font-bold">Bloqueo</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus('DONE')}
                                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${status === 'DONE' ? 'border-green-500 bg-green-50 text-green-700' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                    >
                                        <Check size={16} />
                                        <span className="text-xs font-bold">Listo</span>
                                    </button>
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Nota (Opcional)</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black/10 outline-none text-sm resize-none"
                                    rows={3}
                                    placeholder="Escribe una nota rápida..."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                    {step > 1 && (
                        <button onClick={() => setStep(step - 1 as any)} className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm">
                            Atrás
                        </button>
                    )}

                    {step < 3 ? (
                        // Next is handled by selection usually, but in case we need explicit next
                        <div className="flex-1" />
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-black text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-black/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? "Guardando..." : "Guardar Reporte"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
