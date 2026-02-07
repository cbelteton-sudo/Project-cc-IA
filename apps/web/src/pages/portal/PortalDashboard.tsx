import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Clock, PlayCircle, FileText } from 'lucide-react';
import { useRegion } from '../../context/RegionContext';

const StatCard = ({ title, value, icon: Icon, color, subText }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            {subText && <p className={`text-xs mt-1 ${color}`}>{subText}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '50')} ${color}`}>
            <Icon size={24} />
        </div>
    </div>
);

export const PortalDashboard = () => {
    const { token } = useAuth();
    const { formatCurrency } = useRegion();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const { data: dashboard, isLoading } = useQuery({
        queryKey: ['portal-dashboard'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/portal/contractor/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token
    });

    if (isLoading) return <div className="p-8">Cargando dashboard...</div>;

    const stats = dashboard?.stats || { tasksPending: 0, tasksInProgress: 0, tasksAtRisk: 0, openOrders: 0 };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Hola, bienvenido a tu portal</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Tareas Pendientes"
                    value={stats.tasksPending}
                    icon={Clock}
                    color="text-gray-600"
                />
                <StatCard
                    title="En Curso"
                    value={stats.tasksInProgress}
                    icon={PlayCircle}
                    color="text-blue-600"
                />
                <StatCard
                    title="En Riesgo / Atrasadas"
                    value={stats.tasksAtRisk}
                    icon={AlertTriangle}
                    color="text-red-600"
                    subText="Requiere atención inmediata"
                />
                <StatCard
                    title="Órdenes Abiertas"
                    value={stats.openOrders}
                    icon={FileText}
                    color="text-green-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* At Risk / Recent Tasks */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 mb-4">Tareas Prioritarias</h3>
                    <div className="space-y-4">
                        {dashboard?.recentTasks?.map((task: any) => (
                            <div key={task.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium text-gray-900">{task.name}</p>
                                    <p className="text-xs text-gray-500">{task.project?.name} • Vence: {new Date(task.endDate).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${task.risk ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {task.risk ? 'RIESGO' : task.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {dashboard?.recentTasks?.length === 0 && <p className="text-gray-400 text-sm">No hay tareas prioritarias.</p>}
                    </div>
                </div>

                {/* Recent POs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 mb-4">Órdenes Recientes</h3>
                    <div className="space-y-4">
                        {dashboard?.recentOrders?.map((po: any) => (
                            <div key={po.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium text-gray-900">PO #{po.id.substring(0, 8)}</p>
                                    <p className="text-xs text-gray-500">{po.project?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-800">{formatCurrency(po.total)}</p>
                                    <span className="text-xs text-green-600 font-medium">{po.status}</span>
                                </div>
                            </div>
                        ))}
                        {dashboard?.recentOrders?.length === 0 && <p className="text-gray-400 text-sm">No hay órdenes recientes.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
