import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Check, X, Users, AlertTriangle, Calendar, Building } from 'lucide-react';
import { usePunchList } from '../../hooks/usePunchList';
import { useProjects } from '../../hooks/useProjects';

interface Props {
    projectId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const PunchQuickCreate: React.FC<Props> = ({ projectId, onClose, onSuccess }) => {
    const { createItem } = usePunchList(projectId);
    const { data: projects } = useProjects();

    // State
    const [selectedProjectId, setSelectedProjectId] = useState(projectId);
    const [step, setStep] = useState(1);

    const [form, setForm] = useState({
        title: '',
        location: '',
        severity: 'MEDIUM',
        trade: 'CIVIL',
        assignee: '',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Update selected project if prop changes (though usually component is remounted)
    useEffect(() => {
        if (projectId) setSelectedProjectId(projectId);
    }, [projectId]);

    const handleSubmit = async () => {
        if (!form.title) return;

        await createItem({
            projectId: selectedProjectId, // Override hook's projectId
            title: form.title,
            locationZone: form.location,
            severity: form.severity as any,
            trade: form.trade,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        onSuccess();
        onClose();
    };

    const severityColors = {
        LOW: 'bg-green-100 text-green-800 border-green-200',
        MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
        CRITICAL: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-blue-600" />
                        Nuevo Punch
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-5 space-y-5">

                    {/* Project Selector (Optional if multiple) */}
                    {projects && projects.length > 1 && (
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                Proyecto
                            </label>
                            <div className="relative">
                                <Building size={18} className="absolute left-3 top-3 text-gray-400" />
                                <select
                                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none"
                                    value={selectedProjectId}
                                    onChange={e => setSelectedProjectId(e.target.value)}
                                >
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* 1. Location & Photo (Top Priority) */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                Ubicación
                            </label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    autoFocus
                                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    placeholder="Ej: Nivel 2, Depto 204..."
                                    value={form.location}
                                    onChange={e => setForm({ ...form, location: e.target.value })}
                                />
                            </div>
                        </div>
                        <button className="flex flex-col items-center justify-center w-16 h-12 bg-gray-100 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-200 active:scale-95 transition">
                            <Camera size={20} />
                        </button>
                    </div>

                    {/* 2. Title / What happened */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                            Descripción Corta
                        </label>
                        <input
                            className="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-medium placeholder-gray-300"
                            placeholder="Ej: Pintura dañada en muro..."
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                        />
                        {/* Quick tags */}
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                            {['Pintura', 'Limpieza', 'Golpe', 'Falta material'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setForm({ ...form, title: tag + ' ' })}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-600 whitespace-nowrap"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Severity & Trade */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                Importancia
                            </label>
                            <div className="grid grid-cols-4 gap-1">
                                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(sev => (
                                    <button
                                        key={sev}
                                        onClick={() => setForm({ ...form, severity: sev })}
                                        className={`h-8 rounded-lg border flex items-center justify-center transition-all ${form.severity === sev
                                            ? severityColors[sev] + ' ring-2 ring-offset-1 ring-blue-500'
                                            : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                                            }`}
                                        title={sev}
                                    >
                                        <div className={`w-3 h-3 rounded-full ${sev === 'CRITICAL' ? 'bg-red-500' :
                                            sev === 'HIGH' ? 'bg-orange-500' :
                                                sev === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                                            }`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                Especialidad
                            </label>
                            <select
                                className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                                value={form.trade}
                                onChange={e => setForm({ ...form, trade: e.target.value })}
                            >
                                <option value="CIVIL">Obra Civil</option>
                                <option value="FINISHES">Acabados</option>
                                <option value="MEP">Instalaciones</option>
                                <option value="NET">Voz y Datos</option>
                            </select>
                        </div>
                    </div>

                    {/* 4. Action Button */}
                    <button
                        onClick={handleSubmit}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2"
                    >
                        <Check size={20} strokeWidth={3} />
                        Crear Punch (20s)
                    </button>
                </div>
            </div>
        </div>
    );
};
