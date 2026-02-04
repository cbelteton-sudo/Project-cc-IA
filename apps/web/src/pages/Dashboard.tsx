import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Wallet, Briefcase, FileText,
    AlertCircle, TrendingUp, TrendingDown, Clock, Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard = () => {
    const { token, user } = useAuth();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/reports/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        }
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    // Stat Card Component
    const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
                {subValue && <p className={`text-xs mt-2 font-medium ${subValue.includes('+') ? 'text-green-600' : 'text-red-500'}`}>{subValue}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.name || 'User'}!</h1>
                <p className="text-gray-500">Here's what's happening across your projects today.</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Projects"
                    value={stats?.projects?.active || 0}
                    icon={Briefcase}
                    color="bg-blue-500"
                    subValue={`Total: ${stats?.projects?.total}`}
                />
                <StatCard
                    title="Budget vs Executed"
                    value={`$${(stats?.financials?.totalExecuted || 0).toLocaleString()}`}
                    icon={Wallet}
                    color="bg-purple-500"
                    subValue={`Budget: $${(stats?.financials?.totalBudget || 0).toLocaleString()}`}
                />
                <StatCard
                    title="Pending Approvals"
                    value={(stats?.pendingActions?.purchaseOrders || 0) + (stats?.pendingActions?.materialRequests || 0)}
                    icon={Clock}
                    color="bg-orange-500"
                    subValue="POs & Requests"
                />
                <StatCard
                    title="Open Field Issues"
                    value={stats?.pendingActions?.rfis || 0}
                    icon={AlertCircle}
                    color="bg-red-500"
                    subValue="RFIs & Inspections"
                />
            </div>

            {/* Quick Actions & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Activity size={18} className="text-purple-600" />
                            Financial Performance
                        </h3>
                        <select className="border border-gray-200 rounded-lg text-sm px-2 py-1 bg-gray-50 focus:outline-none">
                            <option>Last 6 Months</option>
                            <option>Year to Date</option>
                        </select>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { name: 'Jan', Budget: 4000, Actual: 2400 },
                                { name: 'Feb', Budget: 3000, Actual: 1398 },
                                { name: 'Mar', Budget: 2000, Actual: 9800 },
                                { name: 'Apr', Budget: 2780, Actual: 3908 },
                                { name: 'May', Budget: 1890, Actual: 4800 },
                                { name: 'Jun', Budget: 2390, Actual: 3800 },
                            ]}>
                                <defs>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="5 5" />
                                <Tooltip />
                                <Area type="monotone" dataKey="Actual" stroke="#8884d8" fillOpacity={1} fill="url(#colorActual)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pending Actions List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Pending Actions</h3>
                    <div className="space-y-4">
                        {stats?.pendingActions?.invoices > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl text-red-700">
                                <FileText size={20} />
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm">Review Invoices</h4>
                                    <p className="text-xs opacity-80">{stats.pendingActions.invoices} invoices waiting for approval</p>
                                </div>
                                <button className="text-xs bg-white px-2 py-1 rounded border border-red-200 shadow-sm hover:bg-gray-50">View</button>
                            </div>
                        )}
                        {stats?.pendingActions?.materialRequests > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl text-orange-700">
                                <Clock size={20} />
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm">Material Requests</h4>
                                    <p className="text-xs opacity-80">{stats.pendingActions.materialRequests} requests pending</p>
                                </div>
                                <button className="text-xs bg-white px-2 py-1 rounded border border-orange-200 shadow-sm hover:bg-gray-50">View</button>
                            </div>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl text-green-700">
                            <TrendingUp size={20} />
                            <div className="flex-1">
                                <h4 className="font-medium text-sm">Budget Health</h4>
                                <p className="text-xs opacity-80">Projects are 5% under budget</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
