import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, AlertTriangle, CheckCircle, Search, Plus } from 'lucide-react';

export const Field = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'rfis' | 'inspections'>('rfis');

    // Fetch Data
    const { data: rfis } = useQuery({
        queryKey: ['rfis'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/rfis', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        }
    });

    const { data: inspections } = useQuery({
        queryKey: ['inspections'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/inspections', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        }
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Field Management</h1>
                    <p className="text-gray-500">Track RFIs, Inspections, and Site Issues</p>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('rfis')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'rfis' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        RFIs
                    </button>
                    <button
                        onClick={() => setActiveTab('inspections')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'inspections' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Inspections
                    </button>
                </div>
            </div>

            {/* RFI Section */}
            {activeTab === 'rfis' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-400 bg-gray-50 px-3 py-2 rounded-lg w-64">
                            <Search size={18} />
                            <input type="text" placeholder="Search RFIs..." className="bg-transparent text-sm w-full focus:outline-none" />
                        </div>
                        <button className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700">
                            <Plus size={16} /> New RFI
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rfis?.map((rfi: any) => (
                            <div key={rfi.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{rfi.code}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${rfi.status === 'OPEN' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                                        }`}>
                                        {rfi.status}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-800 mb-1">{rfi.subject}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{rfi.question}</p>

                                <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-3">
                                    <span>{new Date(rfi.createdAt).toLocaleDateString()}</span>
                                    <span>{rfi.project?.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inspections Section */}
            {activeTab === 'inspections' && (
                <div className="space-y-4">
                    <div className="flex justify-end mb-2">
                        <button className="bg-purple-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-purple-700">
                            <Plus size={16} /> New Inspection
                        </button>
                    </div>
                    {inspections?.map((insp: any) => (
                        <div key={insp.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${insp.status === 'PASSED' ? 'bg-green-100 text-green-600' :
                                        insp.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                    {insp.status === 'PASSED' ? <CheckCircle size={24} /> :
                                        insp.status === 'FAILED' ? <AlertTriangle size={24} /> : <ClipboardList size={24} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{insp.type} Inspection</h4>
                                    <p className="text-sm text-gray-500">{new Date(insp.date).toLocaleDateString()} • {insp.project?.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-sm font-medium text-gray-700">{insp.status}</span>
                                <span className="text-xs text-gray-400">ID: {insp.id.slice(0, 8)}</span>
                            </div>
                        </div>
                    ))}
                    {inspections?.length === 0 && (
                        <div className="text-center py-12 text-gray-400">No inspections found.</div>
                    )}
                </div>
            )}
        </div>
    );
};
