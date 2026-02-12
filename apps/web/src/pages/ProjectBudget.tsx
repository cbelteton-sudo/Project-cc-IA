import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, ArrowLeft, DollarSign, PieChart, ShoppingCart, FileText, Wallet, TrendingUp, AlertCircle, CheckCircle, Settings, Grid, Users, Receipt, Target } from 'lucide-react';
import { BudgetGrid } from '../components/budget/BudgetGrid';
import { BudgetProcurement } from '../components/budget/BudgetProcurement';
import { LaborView } from '../components/budget/LaborView';

const KPICard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white px-5 py-5 rounded-xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-lg ${color.split(' ')[0]} bg-opacity-60 group-hover:bg-opacity-100 transition-all`}>
                <Icon size={18} className={color.split(' ')[1]} strokeWidth={2} />
            </div>
            {/* Optional: Add a sparkline or trend indicator here if available */}
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-800 tracking-tight leading-none mb-1">{value}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        </div>
    </div>
);

export const ProjectBudget = () => {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'matrix' | 'procurement' | 'labor'>('dashboard');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

    const { data: projectData, isLoading: isProjectLoading } = useQuery({
        queryKey: ['project', id],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/projects/${id}`);
            return res.data;
        }
    });

    const budgetId = projectData?.budgets?.[0]?.id;

    const { data: budgetData, isLoading: isBudgetLoading } = useQuery({
        queryKey: ['budget-summary', budgetId],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/budgets/${budgetId}/summary`);
            return res.data;
        },
        enabled: !!budgetId
    });

    const updateProjectMutation = useMutation({
        mutationFn: async (data: any) => {
            return axios.patch(`${API_URL}/projects/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', id] });
            setIsSettingsOpen(false);
            toast.success('Project settings updated');
        },
        onError: () => toast.error('Failed to update settings')
    });

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const createBudgetMutation = useMutation({
        mutationFn: async () => {
            return axios.post(`${API_URL}/budgets`, { projectId: id, name: 'Project Budget' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', id] });
            toast.success('Presupuesto inicializado correctamente');
            setActiveTab('matrix');
        },
        onError: (err: any) => {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error al crear presupuesto');
        }
    });

    if (isProjectLoading) return <div className="p-8">Loading project...</div>;
    if (!projectData) return <div className="p-8">Project not found</div>;

    // Formatter
    const currency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: projectData.currency || 'USD',
            maximumFractionDigits: 0
        }).format(amount || 0);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/projects" className="p-2 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{projectData?.name}</h1>
                        <div className="flex items-center gap-2 text-gray-500 mt-1">
                            <span className="text-xs">Control Presupuestario</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link to={`/projects/${id}/plan`} className="p-2 hover:bg-gray-50 rounded-lg text-gray-600 transition flex items-center gap-2 text-xs font-medium border border-transparent hover:border-gray-200">
                        <FileText size={16} /> Cronograma
                    </Link>
                    <Link to={`/projects/${id}/reports`} className="p-2 hover:bg-gray-50 rounded-lg text-gray-600 transition flex items-center gap-2 text-xs font-medium border border-transparent hover:border-gray-200">
                        <PieChart size={16} /> Reportes
                    </Link>
                    <Link to={`/projects/${id}/change-orders`} className="p-2 hover:bg-gray-50 rounded-lg text-gray-600 transition flex items-center gap-2 text-xs font-medium border border-transparent hover:border-gray-200">
                        <FileText size={16} /> Órdenes de Cambio
                    </Link>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 hover:bg-gray-50 rounded-lg text-gray-600 transition border border-transparent hover:border-gray-200"
                        title="Project Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`${activeTab === 'dashboard'
                            ? 'border-gray-900 text-gray-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('matrix')}
                        className={`${activeTab === 'matrix'
                            ? 'border-gray-900 text-gray-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        Matriz de Presupuesto
                    </button>
                    <button
                        onClick={() => setActiveTab('procurement')}
                        className={`${activeTab === 'procurement'
                            ? 'border-gray-900 text-gray-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        Adquisiciones
                    </button>
                    <button
                        onClick={() => setActiveTab('labor')}
                        className={`${activeTab === 'labor'
                            ? 'border-gray-900 text-gray-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        Mano de Obra
                    </button>
                </nav>
            </div>

            {!budgetId ? (
                <div className="space-y-6">
                    {projectData.globalBudget && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPICard
                                title="Global Budget Cap"
                                value={currency(projectData.globalBudget)}
                                icon={Wallet}
                                color="bg-blue-100 text-blue-600"
                            />
                        </div>
                    )}
                    <div className="bg-yellow-50 border border-yellow-200 p-8 rounded-xl text-yellow-800 flex flex-col items-center gap-4 text-center">
                        <Wallet size={48} className="text-yellow-400" />
                        <div>
                            <p className="font-bold text-lg">No hay presupuesto definido</p>
                            <p className="text-sm max-w-md mx-auto mt-2">Este proyecto aún no tiene líneas de presupuesto detalladas. Inicializa el presupuesto para comenzar.</p>
                        </div>
                        <button
                            onClick={() => createBudgetMutation.mutate()}
                            disabled={createBudgetMutation.isPending}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium disabled:opacity-50"
                        >
                            {createBudgetMutation.isPending ? 'Creando...' : 'Inicializar Presupuesto'}
                        </button>
                    </div>
                </div>
            ) : isBudgetLoading ? (
                <div className="p-8 text-center text-gray-500">Cargando presupuesto...</div>
            ) : (
                <>
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                <KPICard
                                    title="Ppto. Global (Meta)"
                                    value={currency(projectData.globalBudget)}
                                    icon={Target}
                                    color="bg-indigo-50 text-indigo-600"
                                />
                                <KPICard
                                    title="Presupuesto Actual"
                                    value={currency(budgetData.summary.totalPlanned)}
                                    icon={Wallet}
                                    color="bg-blue-50 text-blue-600"
                                />
                                <KPICard
                                    title="Reformas (Cambios)"
                                    value={currency(budgetData.budgetLines.reduce((acc: number, line: any) => acc + (line.budgetCO || 0), 0))}
                                    icon={FileText}
                                    color="bg-orange-50 text-orange-600"
                                />
                                <KPICard
                                    title="Comprometido"
                                    value={currency(budgetData.summary.totalCommitted)}
                                    icon={CheckCircle}
                                    color="bg-purple-50 text-purple-600"
                                />
                                <KPICard
                                    title="Ejecutado"
                                    value={currency(budgetData.summary.totalExecuted)}
                                    icon={TrendingUp}
                                    color="bg-green-50 text-green-600"
                                />
                                <KPICard
                                    title="Variación"
                                    value={currency(budgetData.summary.variance)}
                                    icon={AlertCircle}
                                    color={budgetData.summary.variance >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Top Variations */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <AlertCircle size={18} className="text-red-500" />
                                        Alertas de Desviación
                                    </h3>
                                    <div className="space-y-4">
                                        {budgetData.budgetLines
                                            .filter((l: any) => {
                                                const current = (l.budgetBase || 0) + (l.budgetCO || 0) + (l.budgetTransfer || 0);
                                                const spent = (l.amountCommitted || 0) + (l.amountExecuted || 0);
                                                return (current - spent) < 0;
                                            })
                                            .sort((a: any, b: any) => {
                                                const varA = (a.budgetBase + a.budgetCO + a.budgetTransfer) - (a.amountCommitted + a.amountExecuted);
                                                const varB = (b.budgetBase + b.budgetCO + b.budgetTransfer) - (b.amountCommitted + b.amountExecuted);
                                                return varA - varB; // Most negative first
                                            })
                                            .slice(0, 5)
                                            .map((line: any) => {
                                                const current = (line.budgetBase || 0) + (line.budgetCO || 0) + (line.budgetTransfer || 0);
                                                const spent = (line.amountCommitted || 0) + (line.amountExecuted || 0);
                                                const variance = current - spent;
                                                const percent = current > 0 ? (spent / current) * 100 : 0;

                                                return (
                                                    <div key={line.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="font-medium text-sm text-gray-800">{line.name}</div>
                                                            <div className="font-bold text-sm text-red-600">{currency(variance)}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                            <span>{line.code}</span>
                                                            <span>•</span>
                                                            <span>{line.costType}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                            <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                                        </div>
                                                        <div className="text-[10px] text-right text-gray-400 mt-1">
                                                            Gastado: {currency(spent)} / Ppto: {currency(current)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        {budgetData.budgetLines.filter((l: any) => ((l.budgetBase || 0) + (l.budgetCO || 0) + (l.budgetTransfer || 0) - ((l.amountCommitted || 0) + (l.amountExecuted || 0))) < 0).length === 0 && (
                                            <div className="text-center py-8 text-gray-400 flex flex-col items-center">
                                                <CheckCircle size={32} className="text-green-500 mb-2 opacity-50" />
                                                <p>¡Todo bajo control! No hay partidas excedidas.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cost Distribution */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4">Distribución por Tipo de Costo</h3>
                                    {(() => {
                                        const typeTotals: Record<string, number> = {};
                                        let grandTotal = 0;
                                        budgetData.budgetLines.forEach((l: any) => {
                                            const val = (l.budgetBase || 0) + (l.budgetCO || 0) + (l.budgetTransfer || 0);
                                            typeTotals[l.costType] = (typeTotals[l.costType] || 0) + val;
                                            grandTotal += val;
                                        });

                                        const types = [
                                            { id: 'MATERIAL', label: 'Material', color: 'bg-blue-500' },
                                            { id: 'LABOR', label: 'Mano de Obra', color: 'bg-blue-400' },
                                            { id: 'SUB', label: 'Subcontrato', color: 'bg-indigo-500' },
                                            { id: 'EQUIPMENT', label: 'Equipo', color: 'bg-sky-500' },
                                            { id: 'OVERHEAD', label: 'Indirectos', color: 'bg-gray-400' },
                                        ];

                                        if (grandTotal === 0) return <div className="text-center py-12 text-gray-400">Sin datos de presupuesto</div>;

                                        return (
                                            <div className="space-y-6">
                                                <div className="flex h-8 rounded-lg overflow-hidden w-full">
                                                    {types.map(t => {
                                                        const val = typeTotals[t.id] || 0;
                                                        if (val === 0) return null;
                                                        const pct = (val / grandTotal) * 100;
                                                        return (
                                                            <div key={t.id} className={`${t.color} hover:opacity-90 transition cursor-help`} style={{ width: `${pct}%` }} title={`${t.label}: ${currency(val)}`}></div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {types.map(t => {
                                                        const val = typeTotals[t.id] || 0;
                                                        if (val === 0) return null;
                                                        const pct = (val / grandTotal) * 100;
                                                        return (
                                                            <div key={t.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-3 h-3 rounded-full ${t.color}`}></div>
                                                                    <span className="text-sm font-medium text-gray-700">{t.label}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm font-bold text-gray-900">{Math.round(pct)}%</div>
                                                                    <div className="text-xs text-gray-500">{currency(val)}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'matrix' && (
                        <div className="animate-fade-in">
                            <BudgetGrid budgetId={budgetId} projectId={id!} currency={projectData.currency} />
                        </div>
                    )}

                    {activeTab === 'procurement' && (
                        <div className="animate-fade-in">
                            <BudgetProcurement projectId={id!} currency={projectData.currency} />
                        </div>
                    )}

                    {activeTab === 'labor' && (
                        <div className="animate-fade-in">
                            <LaborView projectId={id!} />
                        </div>
                    )}
                </>
            )}

            {/* Settings Modal - Keeping existing logic */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-bold text-gray-800">Configuración del Proyecto</h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600"><Plus size={24} className="rotate-45" /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">PM Dashboard</h4>
                                    <p className="text-sm text-gray-500">Habilitar panel de control avanzado.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={projectData?.enablePMDashboard || false}
                                    onChange={(e) => updateProjectMutation.mutate({ enablePMDashboard: e.target.checked })}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
