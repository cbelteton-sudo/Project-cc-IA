import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { projectMaterialsService } from '../../services/projectMaterials';
import { projectsService } from '../../services/projects';

export const FinancialVarianceReport = () => {
  const { id: projectId } = useParams<{ id: string }>();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getById(projectId!),
    enabled: !!projectId,
  });

  const { data: variances = [], isLoading } = useQuery({
    queryKey: ['projectMaterialsVariance', projectId],
    queryFn: () => projectMaterialsService.getFinancialVariance(projectId!),
    enabled: !!projectId,
  });

  const currency = project?.currency || '$';

  const formatCurrency = (val: number) => {
    return `${currency} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalBAC = variances.reduce((sum, v) => sum + v.budgetAtCompletion, 0);
  const totalEAC = variances.reduce((sum, v) => sum + v.eac, 0);
  const totalVariance = variances.reduce((sum, v) => sum + v.totalVariance, 0);

  const isFavorable = totalVariance >= 0;

  return (
    <div className="h-full flex flex-col p-6 space-y-6 bg-slate-50 overflow-y-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control Financiero (Materiales)</h1>
          <p className="text-slate-500 text-sm mt-1">
            Análisis de Desviación de Costos (EVM-Lite) y Proyecciones al Cierre.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <p className="text-slate-400 animate-pulse">Calculando varianzas financieras...</p>
        </div>
      ) : (
        <>
          {/* Executive KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Presupuesto Inicial (BAC)</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">
                    {formatCurrency(totalBAC)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <DollarSign size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Proyección al Cierre (EAC)</p>
                  <p
                    className={`text-3xl font-bold mt-2 ${totalEAC > totalBAC ? 'text-red-600' : 'text-slate-800'}`}
                  >
                    {formatCurrency(totalEAC)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            <div
              className={`p-6 rounded-xl border ${isFavorable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p
                    className={`text-sm font-medium ${isFavorable ? 'text-green-700' : 'text-red-700'}`}
                  >
                    Desviación Total
                  </p>
                  <p
                    className={`text-3xl font-bold mt-2 ${isFavorable ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {formatCurrency(totalVariance)}
                  </p>
                  <p className={`text-xs mt-1 ${isFavorable ? 'text-green-600' : 'text-red-600'}`}>
                    {isFavorable
                      ? 'Ahorro proyectado vs Presupuesto'
                      : 'Sobrecosto proyectado vs Presupuesto'}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${isFavorable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {isFavorable ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                </div>
              </div>
            </div>
          </div>

          {/* Variance DataGrid */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">
                Semáforo de Desviaciones (Top Bleeders)
              </h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3 text-right">Precio Planeado</th>
                    <th className="px-4 py-3 text-right">Costo Promedio (WAC)</th>
                    <th className="px-4 py-3 text-right">Var. Precio</th>
                    <th className="px-4 py-3 text-right">Var. Cantidad</th>
                    <th className="px-4 py-3 text-right">Var. Total</th>
                    <th className="px-4 py-3 text-center">Índice Benchmark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {variances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        No hay reportes financieros calculados aún.
                      </td>
                    </tr>
                  ) : (
                    variances.map((v) => {
                      const isPriceFav = v.priceVariance >= 0;
                      const isQtyFav = v.quantityVariance >= 0;
                      const isTotalFav = v.totalVariance >= 0;
                      const isBenchFav = v.benchmarkIndex <= 1.0;

                      return (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{v.materialName}</div>
                            <div className="text-xs text-slate-500">
                              Consumo: {v.stockConsumed} / {v.plannedQty} {v.unit}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatCurrency(v.plannedPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">
                            {formatCurrency(v.wac)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-medium ${isPriceFav ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {formatCurrency(v.priceVariance)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-medium ${isQtyFav ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {formatCurrency(v.quantityVariance)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-bold ${isTotalFav ? 'text-green-600' : 'text-red-700'}`}
                          >
                            {formatCurrency(v.totalVariance)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                isBenchFav ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {v.benchmarkIndex.toFixed(2)}x
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
