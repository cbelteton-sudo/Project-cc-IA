import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';

export const PurchaseOrders = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Simple state
    const [projectId, setProjectId] = useState('');
    const [vendor, setVendor] = useState('');
    // JSON input for ease
    const [itemsText, setItemsText] = useState('[{"description": "Cement", "quantity": 10, "unitPrice": 150, "budgetLineId": "OPTIONAL_ID"}]');

    // Fetch POs
    const { data: pos, isLoading } = useQuery({
        queryKey: ['purchase-orders'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/purchase-orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token
    });

    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/projects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            let items = [];
            try {
                items = JSON.parse(itemsText);
            } catch (e) {
                alert('Invalid message');
                return;
            }
            return axios.post('http://localhost:4180/purchase-orders', {
                projectId,
                vendor,
                items
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            setIsModalOpen(false);
        }
    });

    if (isLoading) return <div className="p-8">Loading POs...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Purchase Orders</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    Create PO
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">Vendor</th>
                            <th className="px-6 py-3">Project</th>
                            <th className="px-6 py-3">Total</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {pos?.map((po: any) => (
                            <tr key={po.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-sm font-medium text-gray-900">{po.vendor}</td>
                                <td className="px-6 py-3 text-sm text-gray-600">{po.project?.name}</td>
                                <td className="px-6 py-3 text-sm font-medium">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(po.total)}
                                </td>
                                <td className="px-6 py-3">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                        {po.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {pos?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">No POs found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Create Purchase Order</h3>
                        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                                <select
                                    className="w-full border rounded px-3 py-2"
                                    value={projectId}
                                    onChange={e => setProjectId(e.target.value)}
                                    required
                                >
                                    <option value="">Select Project</option>
                                    {projects?.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                                <input
                                    className="w-full border rounded px-3 py-2"
                                    value={vendor}
                                    onChange={e => setVendor(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Items (JSON Array)</label>
                                <textarea
                                    className="w-full border rounded px-3 py-2 text-sm font-mono h-24"
                                    value={itemsText}
                                    onChange={e => setItemsText(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Format: {`[{"description": "Item", "quantity": 1, "unitPrice": 100}]`}
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
