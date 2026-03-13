import React from 'react';
import { useStartupChecklist } from '../../hooks/useStartupChecklist';
import { CheckCircle2, Circle, AlertCircle, Loader2, FileDown } from 'lucide-react';
import { generateStartupChecklistPDF } from '../../utils/pdf/generateStartupChecklist';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StartupMaterialChecklistProps {
  projectId: string;
  projectName?: string;
  pmName?: string;
}

export const StartupMaterialChecklist: React.FC<StartupMaterialChecklistProps> = ({ projectId, projectName, pmName }) => {
  const { data, isLoading, error } = useStartupChecklist(projectId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-center justify-center min-h-[300px] h-full">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">Cargando checklist...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-center justify-center min-h-[300px] h-full">
        <div className="flex flex-col items-center text-red-500">
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-sm">Error al cargar el checklist de inicio</span>
        </div>
      </div>
    );
  }

  const { overallProgress, totalItems, completeItems, items } = data;
  const isReadyToStart = overallProgress === 100 && totalItems > 0;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col h-full col-span-1 md:col-span-2 lg:col-span-3">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Checklist de Materiales Iniciales</h3>
          <p className="text-sm text-gray-500">Validación de bodega vs planeación para arranque</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (data && isReadyToStart) {
                generateStartupChecklistPDF({
                  projectName: projectName || 'Proyecto Desconocido',
                  date: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es }),
                  overallProgress: data.overallProgress,
                  totalItems: data.totalItems,
                  completeItems: data.completeItems,
                  pmName: pmName,
                  items: data.items,
                });
              }
            }}
            disabled={!isReadyToStart}
            title={!isReadyToStart ? 'Debe completar el 100% de los materiales para descargar la constancia' : ''}
            className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-lg shadow-sm transition-colors ${
              isReadyToStart
                ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
            }`}
          >
            <FileDown className="w-4 h-4 mr-1.5" />
            Descargar Constancia
          </button>

          {isReadyToStart ? (
            <span className="flex items-center text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
              <CheckCircle2 className="w-5 h-5 mr-1.5" />
              Listo para arrancar
            </span>
          ) : (
            <span className="flex items-center text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 shadow-sm">
              <AlertCircle className="w-5 h-5 mr-1.5" />
              Abastecimiento en curso
            </span>
          )}
        </div>
      </div>

      <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex justify-between items-center text-sm mb-2 text-gray-700 font-medium">
          <span>Progreso General de Abastecimiento</span>
          <span className="text-gray-900">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${
              isReadyToStart ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-600 flex justify-between">
          <span>Materiales Completos: {completeItems} de {totalItems}</span>
          <span className="text-xs text-gray-400">Sólo contabiliza items previstos en arranque</span>
        </div>
      </div>

      <div className="flex-1 mt-4">
        {items.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No hay materiales planificados vinculados a este proyecto. <br/>
            Contacta al administrador para que ingrese el catálogo inicial.
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all">
                {/* Izquierda: Info del material */}
                <div className="flex items-center flex-1 min-w-0 mr-6">
                  <div className="mr-5">
                    {item.isComplete ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    ) : (
                      <Circle className="w-7 h-7 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900 truncate" title={item.materialName}>
                      {item.materialName}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        item.isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.progressPercentage}% completado
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Derecha: Cantidades */}
                <div className="flex items-center space-x-6 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider font-semibold">Requerido</p>
                    <p className="text-base font-semibold text-gray-800">{item.plannedQty} <span className="text-sm font-normal text-gray-500">{item.unit}</span></p>
                  </div>
                  <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
                  <div className={`text-right px-4 py-2 rounded-lg border min-w-[120px] ${
                    item.isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                  }`}>
                    <p className={`text-xs mb-0.5 uppercase tracking-wider font-semibold ${item.isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>En Bodega</p>
                    <p className={`text-base font-bold ${item.isComplete ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {item.stockAvailable} <span className="text-sm font-normal opacity-75">{item.unit}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
