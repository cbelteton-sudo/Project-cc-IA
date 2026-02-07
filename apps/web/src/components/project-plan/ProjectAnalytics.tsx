import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface ProjectAnalyticsProps {
    projectId: string;
    token: string | null;
}

export const ProjectAnalytics = ({ projectId, token }: ProjectAnalyticsProps) => {

    // Fetch S-Curve Data
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const { data: sCurveData, isLoading: isLoadingSCurve } = useQuery({
        queryKey: ['s-curve', projectId],
        queryFn: async () => {
            const { data } = await axios.get(`${API_URL}/reports/project/${projectId}/s-curve`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return data;
        },
        enabled: !!token
    });

    // Fetch Histogram Data
    const { data: histogramData, isLoading: isLoadingHistogram } = useQuery({
        queryKey: ['histogram', projectId],
        queryFn: async () => {
            const { data } = await axios.get(`${API_URL}/reports/project/${projectId}/histogram`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return data;
        },
        enabled: !!token
    });

    if (isLoadingSCurve || isLoadingHistogram) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-500" /></div>;
    }

    // Get contractor keys dynamically for Stacked Bar
    const contractorKeys = histogramData && histogramData.length > 0
        ? Object.keys(histogramData[0]).filter(k => k !== 'date')
        : [];

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="p-6 space-y-8 h-full overflow-y-auto bg-gray-50/50">

            {/* S-Curve Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Curva S - Valor Ganado</h3>
                    <p className="text-sm text-gray-500">Comparativa de Valor Planificado (PV), Valor Ganado (EV) y Costo Real (AC).</p>
                </div>

                <div className="h-[400px] w-full">
                    {sCurveData && sCurveData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sCurveData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" tickFormatter={(val) => `$${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                <Line
                                    type="monotone"
                                    dataKey="pv"
                                    name="Planned Value (PV)"
                                    stroke="#9CA3AF"
                                    strokeWidth={2}
                                    dot={false}
                                    strokeDasharray="5 5"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="ev"
                                    name="Earned Value (EV)"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    activeDot={{ r: 8 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="ac"
                                    name="Actual Cost (AC)"
                                    stroke="#EF4444"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            No hay datos suficientes para generar la curva.
                        </div>
                    )}
                </div>
            </div>

            {/* Resource Histogram Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Histograma de Recursos</h3>
                    <p className="text-sm text-gray-500">Carga de trabajo activa por contratista (Número de actividades simultáneas).</p>
                </div>

                <div className="h-[400px] w-full">
                    {histogramData && histogramData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                {contractorKeys.map((key, index) => (
                                    <Bar
                                        key={key}
                                        dataKey={key}
                                        stackId="a"
                                        fill={colors[index % colors.length]}
                                        radius={[0, 0, 0, 0]}
                                        barSize={40}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            No hay asignaciones de contratistas activas.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
