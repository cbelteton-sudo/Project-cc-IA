import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useRegion } from '../../context/RegionContext';
import { generatePurchaseOrderPDF } from '../../utils/pdf/generatePurchaseOrder';
import { FileDown, CheckCircle, AlertCircle } from 'lucide-react';

export const PortalProjects = () => {
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const { data: assignments } = useQuery({
        queryKey: ['portal-projects'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/portal/contractor/projects`, { headers: { Authorization: `Bearer ${token}` } });
            return res.data;
        }, enabled: !!token
    });

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Mis Proyectos Asignados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments?.map((a: any) => (
                    <div key={a.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{a.project.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">Rol: <span className="font-medium text-blue-600">{a.roleInProject || 'Contratista'}</span></p>
                        <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                            <span>Asignado: {new Date(a.assignedAt).toLocaleDateString()}</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{a.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PortalTasks = () => {
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const { data: tasks } = useQuery({
        queryKey: ['portal-tasks'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/portal/contractor/tasks`, { headers: { Authorization: `Bearer ${token}` } });
            return res.data;
        }, enabled: !!token
    });

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Listado de Tareas (Backlog)</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">Tarea</th>
                            <th className="px-6 py-3">Proyecto</th>
                            <th className="px-6 py-3">Fechas</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3">Avance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasks?.map((t: any) => (
                            <tr key={t.id} className={`hover:bg-gray-50 ${t.risk ? 'bg-red-50/30' : ''}`}>
                                <td className="px-6 py-3">
                                    <div className="font-medium text-gray-900">{t.name}</div>
                                    {t.risk && <span className="text-xs text-red-600 font-bold flex items-center gap-1"><AlertCircle size={10} /> EN RIESGO</span>}
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-600">{t.project?.name}</td>
                                <td className="px-6 py-3 text-xs text-gray-500">
                                    del {new Date(t.startDate).toLocaleDateString()} al {new Date(t.endDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                        t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                        }`}>{t.status}</span>
                                </td>
                                <td className="px-6 py-3 text-sm font-medium">{t.percent}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const PortalOrders = () => {
    const { token } = useAuth();
    const { formatCurrency, currency } = useRegion();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const { data: orders } = useQuery({
        queryKey: ['portal-orders'],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/portal/contractor/orders`, { headers: { Authorization: `Bearer ${token}` } });
            return res.data;
        }, enabled: !!token
    });

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Órdenes de Compra</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3"># Orden</th>
                            <th className="px-6 py-3">Proyecto</th>
                            <th className="px-6 py-3">Monto Total</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-right">Descargar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders?.map((po: any) => (
                            <tr key={po.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-sm font-mono text-gray-900">{po.id.substring(0, 8)}</td>
                                <td className="px-6 py-3 text-sm text-gray-600">{po.project?.name}</td>
                                <td className="px-6 py-3 text-sm font-medium">{formatCurrency(po.total)}</td>
                                <td className="px-6 py-3">
                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">{po.status}</span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button
                                        onClick={() => generatePurchaseOrderPDF({ ...po, project: po.project?.name, date: new Date(po.createdAt).toLocaleDateString(), currency })}
                                        className="text-gray-500 hover:text-blue-600"
                                    >
                                        <FileDown size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
