import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ShoppingCart, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BudgetProcurementProps {
    projectId: string;
    currency?: string;
}

export const BudgetProcurement = ({ projectId, currency = 'USD' }: BudgetProcurementProps) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

    const { data: pos, isLoading: isLoadingPOs } = useQuery({
        queryKey: ['project-pos', projectId],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/purchase-orders?projectId=${projectId}`);
            return res.data;
        }
    });

    const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
        queryKey: ['project-invoices', projectId],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/invoices?projectId=${projectId}`);
            return res.data;
        }
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-GT', { style: 'currency', currency }).format(amount || 0);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': case 'ISSUED': case 'POSTED': return 'bg-green-100 text-green-700';
            case 'PENDING': case 'DRAFT': return 'bg-yellow-100 text-yellow-700';
            case 'REJECTED': case 'VOIDED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (isLoadingPOs || isLoadingInvoices) return <div className="p-8 text-center text-gray-500">Cargando adquisiciones...</div>;

    return (
        <div className="space-y-8">
            {/* POs Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-purple-50">
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={20} className="text-purple-600" />
                        <h3 className="font-semibold text-gray-800">Órdenes de Compra (Comprometido)</h3>
                    </div>
                    <Link to="/procurement/orders" className="text-sm text-purple-600 hover:text-purple-700 font-medium">Ver Todas</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3 text-left">Fecha</th>
                                <th className="px-6 py-3 text-left">Proveedor</th>
                                <th className="px-6 py-3 text-left">Estado</th>
                                <th className="px-6 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pos?.map((po: any) => (
                                <tr key={po.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{po.vendor}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                                            {po.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-bold text-gray-700">{formatCurrency(po.total)}</td>
                                </tr>
                            ))}
                            {pos?.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay órdenes de compra registradas</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoices Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50">
                    <div className="flex items-center gap-2">
                        <FileText size={20} className="text-green-600" />
                        <h3 className="font-semibold text-gray-800">Facturas / Estimaciones (Ejecutado)</h3>
                    </div>
                    <Link to="/invoices" className="text-sm text-green-600 hover:text-green-700 font-medium">Ver Todas</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3 text-left">Fecha</th>
                                <th className="px-6 py-3 text-left">No. Factura</th>
                                <th className="px-6 py-3 text-left">Proveedor</th>
                                <th className="px-6 py-3 text-left">Estado</th>
                                <th className="px-6 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoices?.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-3 font-mono text-gray-600">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{inv.vendor}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-bold text-gray-700">{formatCurrency(inv.total)}</td>
                                </tr>
                            ))}
                            {invoices?.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay facturas registradas</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
