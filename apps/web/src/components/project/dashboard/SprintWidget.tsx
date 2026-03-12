import React from 'react';
import { WidgetCard } from './WidgetCard';
import { Target, CheckCircle2, AlertTriangle, CalendarDays, Rocket } from 'lucide-react';
import type { ProjectDashboardOverview } from '../../../hooks/useProjectDashboard';

interface SprintWidgetProps {
  data: ProjectDashboardOverview['activeSprint'];
}

export const SprintWidget: React.FC<SprintWidgetProps> = ({ data }) => {
  if (!data) {
    return (
      <WidgetCard title="Sprint Actual">
        <div className="flex flex-col items-center justify-center p-6 h-[180px]">
           <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
             <Rocket className="w-6 h-6 text-slate-300" />
           </div>
           <h3 className="text-slate-600 font-medium mb-1">Sin Sprint Activo</h3>
           <p className="text-sm text-slate-400 text-center max-w-[200px]">
             No hay un sprint en curso para este proyecto en este momento.
           </p>
        </div>
      </WidgetCard>
    );
  }

  const { name, goal, endDate, completedTasks, totalTasks, blockedTasks } = data;
  
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate days remaining
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return (
    <WidgetCard title="Sprint Actual">
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white -mx-6 px-6 py-3 border-y border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100/50 text-blue-600 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">{name}</h3>
              <div className="flex items-center text-xs text-slate-500 mt-0.5 space-x-1">
                <CalendarDays className="w-3 h-3" />
                <span>{daysRemaining} días restantes</span>
              </div>
            </div>
          </div>
          
          {blockedTasks > 0 && (
            <div className="flex items-center px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-100/50 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {blockedTasks} Bloqueos
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col pt-2">
          {/* Goal Section */}
          <div className="mb-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center">
              Meta del Sprint
            </p>
            <div className="flex items-start bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
              <Rocket className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-slate-700 italic leading-snug">
                "{goal}"
              </p>
            </div>
          </div>

          {/* Progress Bar Section */}
          <div className="mt-auto">
            <div className="flex justify-between text-sm mb-2 items-end">
              <span className="text-slate-500 font-medium">Progreso</span>
              <div className="flex items-center font-bold text-slate-700">
                <span className="text-xl">{completionPercentage}%</span>
              </div>
            </div>
            
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
               {/* Progress bar gradient */}
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${completionPercentage === 100 ? 'from-emerald-400 to-emerald-500' : 'from-blue-400 to-indigo-500'}`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-3 text-xs">
               <div className="flex items-center text-slate-500">
                   <CheckCircle2 className={`w-3.5 h-3.5 mr-1 ${completionPercentage === 100 ? 'text-emerald-500' : 'text-slate-400'}`} />
                   <span>{completedTasks} de {totalTasks} tareas</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
};
