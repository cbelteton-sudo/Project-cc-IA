import React from 'react';
import { WidgetCard } from './WidgetCard';
import type { ProjectDashboardOverview } from '../../../hooks/useProjectDashboard';

interface TimeWidgetProps {
  data?: ProjectDashboardOverview['time'];
}

export const TimeWidget: React.FC<TimeWidgetProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <WidgetCard title="Tiempo">
        <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
          Sin datos de tiempo ingresados
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Tiempo">
      <div className="flex items-center space-x-4 mb-4 text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-1 bg-[#3b82f6]"></div> Planificado
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-1 bg-[#10b981]"></div> Real
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-1 bg-[#f59e0b]"></div> Atrasado
        </div>
      </div>

      <div className="flex-1 w-full relative mt-8 flex flex-col h-full overflow-hidden">
        <div className="flex flex-col space-y-6 flex-1 pr-6 z-10 relative">
          {data.map((item, idx) => {
            const isDelayed = item.planned > item.actual;
            const diff = Math.abs(item.planned - item.actual);

            return (
              <div key={idx} className="flex flex-col mb-2 relative">
                <span className="text-xs text-gray-700 mb-1 font-medium">{item.name}</span>
                <div className="relative w-full h-8 flex flex-col justify-between">
                  {/* Planificado (Barra superior más delgada) */}
                  <div className="w-full h-3 bg-gray-100 rounded-full flex relative overflow-hidden">
                    <div
                      className="h-full bg-[#3b82f6] flex justify-end items-center px-1"
                      style={{ width: `${item.planned}%` }}
                    ></div>
                  </div>

                  {/* Real (Barra inferior de progreso) */}
                  <div className="w-full h-3 bg-gray-100 rounded-full flex relative overflow-hidden mt-1">
                    <div
                      className="h-full bg-[#10b981] flex justify-end items-center px-1"
                      style={{ width: `${item.actual}%` }}
                    ></div>
                    {/* Indicador visual de Atraso en la barra si aplica */}
                    {isDelayed && (
                      <div
                        className="h-full bg-[#f59e0b] opacity-80"
                        style={{
                          width: `${diff}%`,
                          position: 'absolute',
                          left: `${item.actual}%`,
                        }}
                      ></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Eje X (Valores de 0 a 100) */}
        <div className="absolute inset-0 pl-32 pt-2 pb-6 z-0 flex pointer-events-none w-full">
          {[0, 25, 50, 75, 100].map((val, i) => (
            <div
              key={`axis-${i}`}
              className={`flex-1 border-r border-gray-200 ${i === 4 ? 'border-r-0' : ''} relative h-full flex flex-col justify-end min-w-[20px]`}
            >
              <span className="absolute bottom-[-20px] right-0 translate-x-1/2 text-[10px] text-gray-500">
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
};
