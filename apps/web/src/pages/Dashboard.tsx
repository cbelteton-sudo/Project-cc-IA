import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  Briefcase,
  FileText,
  AlertCircle,
  TrendingUp,
  Clock,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useRegion } from '../context/RegionContext';

import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// StatCard Component with TailPanel look
const StatCard = ({ title, value, icon: Icon, iconBg, iconColor, subValue, trend }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
      </div>
      <div
        className={`p-3 rounded-lg ${iconBg} ${iconColor} transition-transform group-hover:scale-105`}
      >
        <Icon size={24} />
      </div>
    </div>
    {subValue && (
      <div className="flex items-center gap-2 mt-2">
        <span
          className={`text-xs px-2 py-1 rounded font-semibold ${
            trend === 'up'
              ? 'text-emerald-700 bg-emerald-50'
              : trend === 'down'
                ? 'text-rose-700 bg-rose-50'
                : 'text-slate-600 bg-slate-50'
          }`}
        >
          {subValue}
        </span>
        <span className="text-xs text-slate-400">overview</span>
      </div>
    )}
  </div>
);

export const Dashboard = () => {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const { formatCurrency } = useRegion();
  const navigate = useNavigate();

  // Redirect PMs and Operators who land here by accident (e.g. direct URL)
  useEffect(() => {
    if (user?.role === 'PM' || user?.role === 'PROJECT_MANAGER') {
      navigate('/field/dashboard', { replace: true });
    } else if (
      user?.projectMembers?.some((m: { role: string }) =>
        ['FIELD_OPERATOR', 'RESIDENTE'].includes(m.role),
      )
    ) {
      if (!['ADMIN', 'ORG_ADMIN', 'PLATFORM_ADMIN'].includes(user.role)) {
        navigate('/field/operator', { replace: true });
      }
    }
  }, [user, navigate]);

  const [period, setPeriod] = useState('6m');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: async () => {
      const res = await api.get(`/reports/dashboard?period=${period}`);
      return res.data;
    },
    enabled: !!token,
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          {t('dashboard.welcome', { name: user?.name || 'User' })}
        </h1>
        <p className="text-gray-500">{t('dashboard.subtitle')}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.kpi.activeProjects')}
          value={stats?.projects?.active || 0}
          icon={Briefcase}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          subValue={`${t('dashboard.kpi.total')}: ${stats?.projects?.total || 0}`}
          trend="neutral"
        />
        <StatCard
          title={t('dashboard.kpi.budgetVsExecuted')}
          value={formatCurrency(stats?.financials?.totalExecuted || 0)}
          icon={Wallet}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          subValue={`${t('dashboard.kpi.budget')}: ${formatCurrency(stats?.financials?.totalBudget || 0)}`}
          trend="up"
        />
        <StatCard
          title={t('dashboard.kpi.pendingApprovals')}
          value={
            (stats?.pendingActions?.purchaseOrders || 0) +
            (stats?.pendingActions?.materialRequests || 0)
          }
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          subValue="POs & Requests"
          trend="neutral"
        />
        <StatCard
          title={t('dashboard.kpi.openIssues')}
          value={stats?.pendingActions?.rfis || 0}
          icon={AlertCircle}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          subValue="RFIs & Inspections"
          trend="down"
        />

        {/* FIELD MODE CARD */}
        <div
          onClick={() => navigate('/field')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-brand-ambar/30 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
        >
          <div>
            <p className="text-brand-ambar text-sm font-medium mb-1">Modo Campo</p>
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-brand-ambar transition-colors">
              Ir a Campo
            </h3>
            <p className="text-xs mt-2 text-gray-500">Reportes, Bitácora y Avance</p>
          </div>
          <div className="p-3 rounded-xl bg-brand-ambar/10 group-hover:bg-brand-ambar transition-colors">
            <Activity
              size={24}
              className="text-brand-ambar group-hover:text-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Activity size={18} className="text-purple-600" />
              {t('dashboard.charts.financialPerformance')}
            </h3>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm px-2 py-1 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
            >
              <option value="6m">{t('dashboard.charts.last6Months')}</option>
              <option value="4w">Last 4 Weeks</option>
              <option value="q">By Quarter</option>
            </select>
          </div>

          <div className="h-[250px] sm:h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData || []}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="5 5" />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Area
                  type="monotone"
                  dataKey="Actual"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorActual)"
                  name={t('dashboard.kpi.actual') || 'Executed'}
                />
                <Area
                  type="monotone"
                  dataKey="Budget"
                  stroke="#82ca9d"
                  fillOpacity={0}
                  strokeDasharray="5 5"
                  name={t('dashboard.kpi.budget') || 'Planned'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Actions List */}
        <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] border border-slate-100">
          <h3 className="font-bold text-gray-800 mb-4">{t('dashboard.actions.title')}</h3>
          <div className="space-y-4">
            {stats?.pendingActions?.invoices > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl text-red-700">
                <FileText size={20} />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{t('dashboard.actions.reviewInvoices')}</h4>
                  <p className="text-xs opacity-80">
                    {stats.pendingActions.invoices} {t('dashboard.actions.waitingApproval')}
                  </p>
                </div>
                <button className="text-xs bg-white px-2 py-1 rounded border border-red-200 shadow-sm hover:bg-gray-50">
                  {t('dashboard.actions.view')}
                </button>
              </div>
            )}
            {stats?.pendingActions?.materialRequests > 0 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl text-orange-700">
                <Clock size={20} />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{t('sidebar.materialRequests')}</h4>
                  <p className="text-xs opacity-80">
                    {stats.pendingActions.materialRequests} pending
                  </p>
                </div>
                <button className="text-xs bg-white px-2 py-1 rounded border border-orange-200 shadow-sm hover:bg-gray-50">
                  {t('dashboard.actions.view')}
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl text-green-700">
              <TrendingUp size={20} />
              <div className="flex-1">
                <h4 className="font-medium text-sm">{t('dashboard.actions.budgetHealth')}</h4>
                <p className="text-xs opacity-80">{t('dashboard.actions.underBudget')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
