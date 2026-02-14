import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  FileText,
  ArrowLeft,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Activity,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
} from 'recharts';

export const ReportsView = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'cost-control' | 'pnl' | 's-curve' | 'resources'>(
    'cost-control',
  );
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

  // 1. Fetch Cost Control Data
  const {
    data: costData,
    isLoading: isCostLoading,
    refetch: refetchCost,
  } = useQuery({
    queryKey: ['report-cost', id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/reports/project/${id}`);
      return res.data;
    },
  });

  // 2. Fetch P&L Data
  const {
    data: pnlData,
    isLoading: isPnlLoading,
    refetch: refetchPnl,
  } = useQuery({
    queryKey: ['report-pnl', id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/reports/project/${id}/pnl`);
      return res.data;
    },
  });

  // 3. Fetch S-Curve Data
  const {
    data: sCurveData,
    isLoading: isSCurveLoading,
    refetch: refetchSCurve,
  } = useQuery({
    queryKey: ['report-scurve', id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/reports/project/${id}/s-curve`);
      return res.data;
    },
    enabled: activeTab === 's-curve',
  });

  // 4. Fetch Resource Histogram
  const {
    data: histogramData,
    isLoading: isHistogramLoading,
    refetch: refetchHistogram,
  } = useQuery({
    queryKey: ['report-histogram', id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/reports/project/${id}/histogram`);
      return res.data;
    },
    enabled: activeTab === 'resources',
  });

  const currency = (amount: number, curr = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(
      amount || 0,
    );
  };

  const handleExport = () => {
    toast.success('Generando reporte PDF/Excel... (Simulado)');
  };

  const handleRefresh = () => {
    refetchCost();
    refetchPnl();
    if (activeTab === 's-curve') refetchSCurve();
    if (activeTab === 'resources') refetchHistogram();
    toast.success('Datos actualizados');
  };

  if (isCostLoading && activeTab === 'cost-control')
    return <div className="p-8">Cargando reporte...</div>;
  if (isPnlLoading && activeTab === 'pnl') return <div className="p-8">Cargando P&L...</div>;
  if (isSCurveLoading && activeTab === 's-curve')
    return <div className="p-8">Calculando Curva S...</div>;
  if (isHistogramLoading && activeTab === 'resources')
    return <div className="p-8">Cargando histograma...</div>;

  // Helper for Histogram Colors
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  // Transform Histogram Data for Recharts (Recharts expects keys for stack)
  // The data comes as [{date: '2024-01-01', ContractorA: 5, ContractorB: 2}, ...]
  // We need to extract the keys dynamically.
  const histogramKeys =
    histogramData && histogramData.length > 0
      ? Object.keys(histogramData[0]).filter((k) => k !== 'date')
      : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/projects/${id}`} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reportes Financieros</h1>
            <p className="text-gray-500 text-sm">{costData?.projectName || 'Proyecto'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition font-medium"
          >
            <Download size={18} /> Exportar
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('cost-control')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === 'cost-control' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <DollarSign size={16} /> Control de Costos
          </div>
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === 'pnl' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <PieChart size={16} /> P&L
          </div>
        </button>
        <button
          onClick={() => setActiveTab('s-curve')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === 's-curve' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} /> Curva S
          </div>
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === 'resources' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} /> Recursos
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="animate-fade-in min-h-[400px]">
        {activeTab === 'cost-control' && costData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Presupuesto</p>
                <p className="text-xl font-bold text-blue-600">
                  {currency(costData.summary.totalBudget, costData.currency)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Comprometido</p>
                <p className="text-xl font-bold text-purple-600">
                  {currency(costData.summary.totalCommitted, costData.currency)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Ejecutado (Real)</p>
                <p className="text-xl font-bold text-green-600">
                  {currency(costData.summary.totalExecuted, costData.currency)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">Variación</p>
                <p
                  className={`text-xl font-bold ${costData.summary.remainingBudget >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {currency(costData.summary.remainingBudget, costData.currency)}
                </p>
              </div>
            </div>

            {/* Data Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Código</th>
                    <th className="px-6 py-3">Partida</th>
                    <th className="px-6 py-3 text-right">Presupuesto</th>
                    <th className="px-6 py-3 text-right">Comprometido</th>
                    <th className="px-6 py-3 text-right">Ejecutado</th>
                    <th className="px-6 py-3 text-right">Variación</th>
                    <th className="px-6 py-3 text-center">% Ejec</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {costData.lines.map((line: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">{line.code}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{line.name}</td>
                      <td className="px-6 py-3 text-right text-gray-600">
                        {currency(line.budget, costData.currency)}
                      </td>
                      <td className="px-6 py-3 text-right text-purple-600">
                        {currency(line.committed, costData.currency)}
                      </td>
                      <td className="px-6 py-3 text-right text-green-600 font-medium">
                        {currency(line.executed, costData.currency)}
                      </td>
                      <td
                        className={`px-6 py-3 text-right font-bold ${line.variance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                      >
                        {currency(line.variance, costData.currency)}
                      </td>
                      <td className="px-6 py-3 text-center text-gray-500">
                        {line.budget > 0 ? Math.round((line.executed / line.budget) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'pnl' && pnlData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Revenue Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ingresos Estimados</p>
                    <p className="text-xs text-blue-500">
                      Base: {pnlData.overallProgress.toFixed(1)}% Avance
                    </p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {currency(pnlData.revenue, pnlData.currency)}
                </p>
              </div>

              {/* Expenses Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-full">
                    <TrendingDown size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Costos Operativos</p>
                    <p className="text-xs text-red-500">Acumulado Real</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {currency(pnlData.expenses, pnlData.currency)}
                </p>
              </div>

              {/* Margin Card */}
              <div
                className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${pnlData.margin >= 0 ? 'border-b-4 border-b-emerald-500' : 'border-b-4 border-b-red-500'}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`p-3 rounded-full ${pnlData.margin >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}
                  >
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Margen Neto</p>
                    <p
                      className={`text-xs ${pnlData.marginPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                    >
                      {pnlData.marginPercent.toFixed(1)}% Rendimiento
                    </p>
                  </div>
                </div>
                <p
                  className={`text-3xl font-bold ${pnlData.margin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {currency(pnlData.margin, pnlData.currency)}
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Resumen Financiero</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Ingresos', value: pnlData.revenue, fill: '#3b82f6' },
                    { name: 'Gastos', value: pnlData.expenses, fill: '#ef4444' },
                    {
                      name: 'Margen',
                      value: pnlData.margin,
                      fill: pnlData.margin >= 0 ? '#10b981' : '#f43f5e',
                    },
                  ]}
                  layout="vertical"
                  barSize={40}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(val) => `$${val / 1000}k`} />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip formatter={(val: any) => currency(val, pnlData.currency)} />
                  <Legend />
                  <Bar dataKey="value" name="Monto" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* S-Curve Tab */}
        {activeTab === 's-curve' && sCurveData && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[500px]">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Curva S - Valor Ganado (EVM)</h3>
            <p className="text-sm text-gray-500 mb-6">
              Comparativa de Valor Planificado (PV), Valor Ganado (EV) y Costo Actual (AC) a lo
              largo del tiempo.
            </p>

            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart data={sCurveData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip formatter={(val: any) => currency(val)} labelStyle={{ color: '#333' }} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pv"
                  name="Valor Planificado (PV)"
                  fill="#e0f2fe"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="ev"
                  name="Valor Ganado (EV)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="ac"
                  name="Costo Actual (AC)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Resource Histogram Tab */}
        {activeTab === 'resources' && histogramData && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[500px]">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Histograma de Recursos</h3>
            <p className="text-sm text-gray-500 mb-6">
              Distribución de carga de trabajo por contratista/recurso por semana.
            </p>

            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis
                  allowDecimals={false}
                  label={{ value: 'Tareas Activas', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Legend />
                {histogramKeys.length > 0 ? (
                  histogramKeys.map((key, index) => (
                    <Bar key={key} dataKey={key} stackId="a" fill={stringToColor(key)} name={key} />
                  ))
                ) : (
                  <Bar dataKey="value" fill="#eee" name="Sin datos" />
                )}
              </BarChart>
            </ResponsiveContainer>
            {histogramData.length === 0 && (
              <div className="text-center text-gray-400 mt-[-200px]">
                No hay datos de asignación de recursos disponibles.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
