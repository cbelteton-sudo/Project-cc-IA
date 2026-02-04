import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';

export const MaterialRequests = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Simple state for new request
    const [projectId, setProjectId] = useState('');
    const [title, setTitle] = useState('');
    const [itemsText, setItemsText] = useState('[{"materialId": "desc", "quantity": 1}]');

    // Fetch Requests
    const { data: requests, isLoading } = useQuery({
        queryKey: ['material-requests'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/material-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token
    });

    // Fetch Projects for dropdown
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
            // Basic parsing for MVP
            let items = [];
            try {
                items = JSON.parse(itemsText);
            } catch (e) {
                alert('Invalid JSON items');
                return;
            }

            return axios.post('http://localhost:4180/material-requests', {
                projectId,
                title,
                items
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['material-requests'] });
            setIsModalOpen(false);
        }
    });

    if (isLoading) return <div className="p-8">Loading requests...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Material Requests</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    New Request
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">Title</th>
                            <th className="px-6 py-3">Project</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests?.map((req: any) => (
                            <tr key={req.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-sm font-medium text-gray-900">{req.title}</td>
                                <td className="px-6 py-3 text-sm text-gray-600">{req.project?.name}</td>
                                <td className="px-6 py-3">
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-500">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {requests?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">No requests found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">New Request</h3>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    className="w-full border rounded px-3 py-2"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
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
                                <p className="text-xs text-gray-500 mt-1">Format: {`[{"materialId": "string", "quantity": 10}]`}</p>
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
