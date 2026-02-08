import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, ArrowLeft, DollarSign, PieChart, ShoppingCart, FileText, Wallet, TrendingUp, AlertCircle, CheckCircle, Settings } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={24} />
        </div>
    </div>
);

export const ProjectBudget = () => {
    const { id } = useParams();
    const queryClient = useQueryClient();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const { data: project, isLoading, error } = useQuery({
        queryKey: ['project-budget', id],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/budgets/${id}/summary`);
            return res.data;
        },
        // We currently query by budget ID directly for simplicity in this MVP view, 
        // but typically we'd look up the budget FOR a project. 
        // For now assuming ID passed is the BUDGET ID or we link from Project to Budget.
        // Actually, let's fix the flow: Project List -> Project Detail -> Budget Tab.
        // But to match the route, I'll fetch the project first to find its budget.
        // Wait, the backend endpoint `GET /projects/:id` returns `budgets[]`.
        // So let's fetch Project first.
    });

    // Refetch strategy: Get Project -> Get Budget ID -> Get Budget Summary
    // For MVP speed, let's just make the route /projects/:projectId/budget/:budgetId
    // Or better: Fetch Project, find the first budget (Active), show summary.

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

    if (isProjectLoading) return <div className="p-8">Loading project...</div>;
    if (!projectData) return <div className="p-8">Project not found</div>;

    // Formatter
    const currency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: projectData.currency || 'USD' }).format(amount || 0);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/projects" className="p-2 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{projectData?.name}</h1>
                        <div className="flex items-center gap-2 text-gray-500 mt-1">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-mono">{projectData?.code}</span>
                            <span>•</span>
                            {projectData.globalBudget && (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-mono font-bold">
                                    Global Budget: {currency(projectData.globalBudget)}
                                </span>
                            )}
                            <span>•</span>
                            <Link to={`/reports/project/${id}`} className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                                <FileText size={14} /> View Financial Report
                            </Link>
                            <span>•</span>
                            <Link to={`/projects/${id}/report`} className="text-purple-600 hover:underline flex items-center gap-1 text-sm font-bold">
                                <FileText size={14} /> Executive Report
                            </Link>
                            {projectData?.enablePMDashboard && (
                                <>
                                    <span>•</span>
                                    <Link to={`/projects/${id}/pm`} className="text-orange-600 hover:underline flex items-center gap-1 text-sm font-bold">
                                        <PieChart size={14} /> PM Dashboard
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
                    title="Project Settings"
                >
                    <Settings size={20} />
                </button>
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
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-800 flex flex-col gap-2">
                        <p className="font-bold">No detailed budget lines yet.</p>
                        <p className="text-sm">You have defined a Global Budget, but haven't broken it down into specific lines (Materials, Labor, etc.).</p>
                    </div>
                </div>
            ) : isBudgetLoading ? (
                <div className="p-8">Loading budget details...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            title="Planned Budget"
                            value={currency(budgetData.summary.totalPlanned)}
                            icon={Wallet}
                            color="bg-blue-100 text-blue-600"
                        />
                        <KPICard
                            title="Committed (PO)"
                            value={currency(budgetData.summary.totalCommitted)}
                            icon={CheckCircle}
                            color="bg-purple-100 text-purple-600"
                        />
                        <KPICard
                            title="Executed (Invoiced)"
                            value={currency(budgetData.summary.totalExecuted)}
                            icon={TrendingUp}
                            color="bg-green-100 text-green-600"
                        />
                        <KPICard
                            title="Variance"
                            value={currency(budgetData.summary.variance)}
                            icon={AlertCircle}
                            color={budgetData.summary.variance >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}
                        />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">Budget Lines</h3>
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Add Line</button>
                        </div>
                        <table className="w-full">
                            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Code</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3 text-right">Planned</th>
                                    <th className="px-6 py-3 text-right">Committed</th>
                                    <th className="px-6 py-3 text-right">Executed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {budgetData.budgetLines.map((line: any) => (
                                    <tr key={line.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">{line.code}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{line.name}</td>
                                        <td className="px-6 py-3 text-sm text-right">{currency(line.amountParam)}</td>
                                        <td className="px-6 py-3 text-sm text-right">{currency(line.amountCommitted)}</td>
                                        <td className="px-6 py-3 text-sm text-right">{currency(line.amountExecuted)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {budgetData.budgetLines.length === 0 && (
                            <div className="p-8 text-center text-gray-500 text-sm">No budget lines defined</div>
                        )}
                    </div>
                </>
            )}

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="text-xl font-bold text-gray-800">Project Settings</h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600"><Plus size={24} className="rotate-45" /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">PM Dashboard</h4>
                                    <p className="text-sm text-gray-500">Enable advanced risk tracking and dashboard.</p>
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
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
