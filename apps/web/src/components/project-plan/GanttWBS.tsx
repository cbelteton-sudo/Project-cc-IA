import { useGantt } from './GanttProvider';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const GanttWBS = () => {
  const { visibleActivities, headerHeight, rowHeight, expanded, toggleExpand, onSelectActivity } =
    useGantt();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center border-b border-gray-200 bg-gray-50 font-semibold text-[10px] text-gray-500 uppercase flex-shrink-0"
        style={{ height: headerHeight }}
      >
        <div className="flex-1 px-4 border-r border-gray-200 h-full flex items-center">
          Actividad
        </div>
        <div className="w-12 px-2 h-full flex items-center justify-center">%</div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {visibleActivities.map((act) => (
          <div
            key={act.id}
            className="flex items-center border-b border-gray-100 hover:bg-blue-50 transition-colors group text-xs"
            style={{ height: rowHeight }}
          >
            {/* Name Column */}
            <div
              className="flex-1 px-4 flex items-center overflow-hidden border-r border-gray-100 h-full cursor-pointer hover:text-blue-600"
              onClick={() => onSelectActivity?.(act.id)}
            >
              <div style={{ width: act.depth * 20 }} className="flex-shrink-0"></div>
              {act.hasChildren ? (
                <button
                  onClick={() => toggleExpand(act.id)}
                  className="p-1 rounded hover:bg-gray-200 mr-1 text-gray-500"
                >
                  {expanded.has(act.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : act.type === 'MILESTONE' ? (
                <div className="w-6 mr-1 flex items-center justify-center">
                  <div
                    className={`w-2 h-2 transform rotate-45 
                                        ${
                                          act.status === 'ACHIEVED'
                                            ? 'bg-green-500'
                                            : act.status === 'MISSED' ||
                                                new Date(act.startDate) < new Date()
                                              ? 'bg-red-500'
                                              : 'bg-gray-400'
                                        }
                                    `}
                  ></div>
                </div>
              ) : (
                <div className="w-6 mr-1"></div>
              )}
              <span
                className={`truncate ml-2 font-medium group-hover:text-blue-700 ${
                  act.type === 'MILESTONE'
                    ? 'text-purple-700 font-bold'
                    : act.percent < 100 && new Date(act.endDate) < new Date()
                      ? 'text-red-600 font-semibold'
                      : 'text-gray-700'
                }`}
              >
                {act.name}
              </span>
            </div>

            {/* Progress Column */}
            <div className="w-12 px-2 h-full flex items-center justify-center font-mono text-gray-600">
              {act.type === 'MILESTONE' ? '' : `${Math.round(act.percent)}%`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
