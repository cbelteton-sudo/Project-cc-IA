
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    FileText, ArrowLeft, Printer, Download,
    AlertTriangle, CheckCircle, Clock, Calendar, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ExecutiveReport = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

    // Filters
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [contractorId, setContractorId] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'issues'>('overview');

    // Fetch Contractors for Filter
    const { data: contractors } = useQuery({
        queryKey: ['contractors'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/contractors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        }
    });

    const { data: report, isLoading, error } = useQuery({
        queryKey: ['executive-report', id, dateRange, contractorId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (dateRange.from) params.append('from', dateRange.from);
            if (dateRange.to) params.append('to', dateRange.to);
            if (contractorId) params.append('contractorId', contractorId);

            const res = await axios.get(`${API_URL}/reports/project/${id}/executive?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        }
    });

    if (isLoading) return <div className="p-10 text-center animate-pulse">Generando Reporte Ejecutivo...</div>;
    if (error) return (
        <div className="p-10 text-center text-red-500">
            <p className="font-bold text-lg">No se pudo cargar el reporte.</p>
            <p className="text-sm mb-2">{(error as any)?.response?.data?.message || (error as any).message || 'Error desconocido'}</p>
            <p className="text-xs text-red-400">Posiblemente está deshabilitado para este proyecto o hubo un error de conexión.</p>
            <Link to={`/projects/${id}`} className="mt-4 inline-block text-blue-600 hover:underline">Volver al Proyecto</Link>
        </div>
    );

    const { project, kpis, narrative, evidence, issues } = report;

    return (
        <div className="min-h-screen bg-gray-50 print:bg-white">
            {/* Toolbar - Hidden in Print */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden section-no-print">
                <div className="flex items-center gap-4">
                    <Link to={`/projects/${id}`} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-800">Reporte Ejecutivo</h1>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        <Calendar size={16} className="text-gray-400" />
                        <input
                            type="date"
                            className="bg-transparent text-sm outline-none"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            className="bg-transparent text-sm outline-none"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                        />
                    </div>

                    <select
                        className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none"
                        value={contractorId}
                        onChange={(e) => setContractorId(e.target.value)}
                    >
                        <option value="">Todos los Contratistas</option>
                        {contractors?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <div className="h-6 w-px bg-gray-300 mx-2"></div>

                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition text-sm font-medium shadow-sm"
                    >
                        <Printer size={16} />
                        Imprimir / PDF
                    </button>
                </div>
            </div>

            {/* Main Report Content */}
            <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] p-8 md:p-12 shadow-lg print:shadow-none print:p-0 my-8 print:my-0">
                {/* Header */}
                <header className="border-b border-gray-200 pb-6 mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">{project.name}</h1>
                        <p className="text-slate-500 text-sm font-medium">{project.code} • Reporte de Progreso</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-semibold">Generado el</p>
                        <p className="font-mono text-slate-700">{format(new Date(), 'PPP', { locale: es })}</p>
                    </div>
                </header>

                {/* Narrative & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Resumen Ejecutivo</h3>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 italic text-slate-700 leading-relaxed shadow-sm">
                            "{narrative}"
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Estado General</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-sm text-gray-600">Tiempo Transcurrido</span>
                                <span className="font-bold text-slate-900">{project.timeElapsedPercent}%</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-sm text-gray-600">Updates Recientes</span>
                                <span className="font-bold text-blue-600">{evidence.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Issues Abiertos</span>
                                <span className={`font-bold ${kpis.issuesOpen > 0 ? 'text-red-600' : 'text-green-600'}`}>{kpis.issuesOpen}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards (Print Friendly Row) */}
                <div className="grid grid-cols-4 gap-4 mb-10">
                    <div className="p-4 rounded-lg bg-orange-50 border border-orange-100 print:border-gray-200 print:bg-white text-center">
                        <p className="text-3xl font-bold text-orange-600 print:text-black">{kpis.stalledCount}</p>
                        <p className="text-xs font-semibold text-orange-800 uppercase print:text-gray-500">Estancadas ({'>'}3d)</p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 border border-red-100 print:border-gray-200 print:bg-white text-center">
                        <p className="text-3xl font-bold text-red-600 print:text-black">{kpis.blockedCount}</p>
                        <p className="text-xs font-semibold text-red-800 uppercase print:text-gray-500">Bloqueadas</p>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100 print:border-gray-200 print:bg-white text-center">
                        <p className="text-3xl font-bold text-yellow-600 print:text-black">{kpis.issuesOpen}</p>
                        <p className="text-xs font-semibold text-yellow-800 uppercase print:text-gray-500">Punch List</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 print:border-gray-200 print:bg-white text-center">
                        <p className="text-3xl font-bold text-slate-600 print:text-black">{kpis.issuesOverdue}</p>
                        <p className="text-xs font-semibold text-slate-800 uppercase print:text-gray-500">Vencidos</p>
                    </div>
                </div>

                {/* Tabs for Screen / Sections for Print */}
                <div className="print:block hidden mb-6 print:mb-2">
                    <h2 className="text-xl font-bold border-b-2 border-slate-800 pb-2 mb-4">Evidencia Fotográfica</h2>
                </div>

                {/* On screen, we check tabs. On print, we show logic usually, but here user wants specific sections. 
                    Let's just render the sections sequentially for print, and use tabs for screen.
                */}
                <div className="print:hidden border-b border-gray-200 mb-6 flex gap-6">
                    <button onClick={() => setActiveTab('evidence')} className={`pb-3 text-sm font-medium transition ${activeTab === 'evidence' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>Evidencia ({evidence.length})</button>
                    <button onClick={() => setActiveTab('issues')} className={`pb-3 text-sm font-medium transition ${activeTab === 'issues' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>Punch List ({issues.length})</button>
                </div>

                {/* Evidence Section */}
                <div className={`${activeTab === 'evidence' ? 'block' : 'hidden'} print:block mb-10 break-inside-avoid-page`}>
                    <div className="space-y-6">
                        {evidence.map((entry: any) => (
                            <div key={entry.id} className="flex gap-4 border-b border-gray-100 pb-6 break-inside-avoid">
                                {/* Date Column */}
                                <div className="w-24 flex-shrink-0 text-right pt-1">
                                    <p className="font-bold text-gray-900 text-sm">{format(new Date(entry.date), 'dd MMM')}</p>
                                    <p className="text-xs text-gray-500">{format(new Date(entry.date), 'yyyy')}</p>
                                </div>
                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{entry.activityName}</h4>
                                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                                <span className="font-mono bg-gray-100 px-1 rounded">{entry.activityCode}</span>
                                                {entry.contractorName && <span>• {entry.contractorName}</span>}
                                            </p>
                                        </div>
                                        <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                            {entry.author}
                                        </div>
                                    </div>

                                    {entry.note && (
                                        <p className="text-sm text-gray-700 bg-yellow-50/50 p-2 rounded mb-3 border-l-2 border-yellow-200">
                                            {entry.note}
                                        </p>
                                    )}

                                    {/* Photos Grid */}
                                    {entry.photos.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {entry.photos.map((photo: any) => (
                                                <div key={photo.id} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                    <img
                                                        src={photo.urlThumb || photo.urlMain}
                                                        className="w-full h-full object-cover"
                                                        alt="Evidence"
                                                        crossOrigin="anonymous" // Important for print to capture image
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {evidence.length === 0 && <p className="text-center text-gray-400 italic">No evidence found in this period.</p>}
                    </div>
                </div>

                {/* Issues Section */}
                <div className="print:block print:break-before-page hidden mb-6">
                    <h2 className="text-xl font-bold border-b-2 border-slate-800 pb-2 mb-4">Punch List / Issues</h2>
                </div>

                <div className={`${activeTab === 'issues' ? 'block' : 'hidden'} print:block`}>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-2 px-3">Severidad</th>
                                <th className="text-left py-2 px-3">Asunto</th>
                                <th className="text-left py-2 px-3">Resp.</th>
                                <th className="text-left py-2 px-3">Vence</th>
                                <th className="text-center py-2 px-3">Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {issues.map((issue: any) => (
                                <tr key={issue.id} className="break-inside-avoid">
                                    <td className="py-2 px-3">
                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                            ${issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                issue.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-blue-50 text-blue-700'}`}>
                                            {issue.severity}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3">
                                        <p className="font-medium text-gray-900">{issue.title}</p>
                                        {issue.lastComment && <p className="text-xs text-gray-500 truncate max-w-[200px]">{issue.lastComment}</p>}
                                    </td>
                                    <td className="py-2 px-3 text-gray-600">{issue.contractorName || '-'}</td>
                                    <td className="py-2 px-3 text-gray-600 font-mono text-xs">{issue.dueDate ? format(new Date(issue.dueDate), 'dd/MM') : '-'}</td>
                                    <td className="py-2 px-3 text-center">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${issue.status === 'DONE' || issue.status === 'CLOSED' ? 'text-green-700 bg-green-50' :
                                            issue.status === 'BLOCKED' ? 'text-red-700 bg-red-50' :
                                                'text-gray-600 bg-gray-100'
                                            }`}>
                                            {issue.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {issues.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-6 text-gray-400 italic">No active issues.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Print Only */}
                <div className="hidden print:block fixed bottom-0 left-0 right-0 text-center text-[10px] text-gray-400 py-4 border-t border-gray-100">
                    Generado por C-Construcciones ERP • {project.id} • Pagina 1
                </div>
            </div>
        </div>
    );
};
