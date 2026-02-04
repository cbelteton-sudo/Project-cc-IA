import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    FileText, ArrowLeft, Printer, Download,
    TrendingUp, AlertTriangle, CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ProjectReport = () => {
    const { id } = useParams();
    const { token } = useAuth();

    const { data: report, isLoading } = useQuery({
        queryKey: ['project-report', id],
        queryFn: async () => {
            const res = await axios.get(`http://localhost:4180/reports/project/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        }
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Generating Report...</div>;

    const summary = report?.summary || {};
    const currency = report?.currency || 'USD';

    // Data for Chart
    const chartData = [
        { name: 'Total Project', Budget: summary.totalBudget, Committed: summary.totalCommitted, Executed: summary.totalExecuted }
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto bg-white min-h-screen">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <Link to={`/projects/${id}`} className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
                    <ArrowLeft size={18} /> Back to Project
                </Link>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50">
                        <Printer size={16} /> Print
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700">
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Report Header */}
            <div className="text-center mb-10 border-b pb-8">
                <div className="inline-block p-3 bg-blue-50 rounded-full mb-4">
                    <FileText size={32} className="text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{report?.projectName}</h1>
                <p className="text-gray-500 uppercase tracking-widest text-sm font-semibold">Financial Performance Report</p>
                <p className="text-gray-400 text-xs mt-2">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            {/* High Level Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Budget</p>
                    <p className="text-2xl font-bold text-gray-900">{currency} {summary.totalBudget?.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Committed (POs)</p>
                    <p className="text-2xl font-bold text-orange-600">{currency} {summary.totalCommitted?.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Executed (Invoiced)</p>
                    <p className="text-2xl font-bold text-blue-600">{currency} {summary.totalExecuted?.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-xs text-green-700 uppercase font-semibold mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-green-700">{currency} {summary.remainingBudget?.toLocaleString()}</p>
                </div>
            </div>

            {/* Chart */}
            <div className="mb-10 h-64 w-full bg-white p-4 border rounded-xl print:hidden">
                <h3 className="font-bold text-gray-700 mb-4">Financial Overview</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Budget" fill="#E5E7EB" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Committed" fill="#F97316" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Executed" fill="#2563EB" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Detailed Table */}
            <div>
                <h3 className="font-bold text-xl text-gray-900 mb-4">Budget Line Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold">Code</th>
                                <th className="text-left py-3 px-4 font-semibold">Item Name</th>
                                <th className="text-right py-3 px-4 font-semibold">Budget</th>
                                <th className="text-right py-3 px-4 font-semibold">Committed</th>
                                <th className="text-right py-3 px-4 font-semibold">Executed</th>
                                <th className="text-right py-3 px-4 font-semibold">Variance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report?.lines?.map((line: any) => (
                                <tr key={line.code} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-mono text-gray-500">{line.code}</td>
                                    <td className="py-3 px-4 font-medium text-gray-900">{line.name}</td>
                                    <td className="py-3 px-4 text-right">{line.budget?.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-right text-orange-600">{line.committed?.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-right text-blue-600">{line.executed?.toLocaleString()}</td>
                                    <td className={`py-3 px-4 text-right font-bold ${line.variance >= 0 ? 'text-green-600' : 'text-red-500'
                                        }`}>
                                        {line.variance?.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
