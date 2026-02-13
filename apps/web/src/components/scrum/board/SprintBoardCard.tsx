import { Camera, FileText, User } from 'lucide-react';
import { useState } from 'react';
import { SortableItem } from './SortableItem';

interface SprintBoardCardProps {
  item: any;
  users: any[];
  columnId: string;
  onAssign: (userId: string) => void;
  onReport: (item: any) => void;
  onViewLog: (item: any) => void;
  onMoveUpdated: (itemId: string, status: string) => void;
}

export const SprintBoardCardInner = ({
  item,
  users,
  columnId,
  onAssign,
  onReport,
  onViewLog,
  onMoveUpdated,
}: SprintBoardCardProps) => {
  const [isAssigning, setIsAssigning] = useState(false);

  // Helper to determine next/prev status for manual buttons
  const getNextStatus = (current: string) => {
    if (current === 'TODO') return 'IN_PROGRESS';
    if (current === 'IN_PROGRESS') return 'IN_REVIEW';
    if (current === 'IN_REVIEW') return 'DONE';
    return null;
  };

  const getPrevStatus = (current: string) => {
    if (current === 'IN_PROGRESS') return 'TODO';
    if (current === 'IN_REVIEW') return 'IN_PROGRESS';
    if (current === 'DONE') return 'IN_REVIEW';
    return null;
  };

  const nextStatus = getNextStatus(columnId);
  const prevStatus = getPrevStatus(columnId);

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all group h-full cursor-grab active:cursor-grabbing">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-gray-400">{item.backlogItem.type}</span>
        {item.backlogItem.priority >= 4 && (
          <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
            Alta
          </span>
        )}
      </div>

      {/* Parent Story Badge */}
      {item.backlogItem.parent && (
        <div className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1 bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100/50 w-fit max-w-full">
          <span className="font-semibold text-indigo-400">↳</span>
          <span className="truncate">{item.backlogItem.parent.title}</span>
        </div>
      )}

      <p className="font-medium text-sm text-gray-800 mb-2">{item.backlogItem.title}</p>

      {/* Contractor Display Logic */}
      {(() => {
        const contractor =
          item.backlogItem.contractor ||
          item.backlogItem.linkedWbsActivity?.contractor ||
          item.backlogItem.parent?.contractor;

        if (!contractor) return null;

        return (
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <span>🏗️</span> <span className="font-semibold">{contractor.name}</span>
          </div>
        );
      })()}

      {/* Assignee */}
      <div className="mb-3 flex justify-end">
        <div className="relative group/assignee" onPointerDown={(e) => e.stopPropagation()}>
          {/* Stop propagation to allow clicking assignee without dragging */}
          {item.backlogItem.assigneeUserId ? (
            <div
              className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-200 cursor-pointer"
              title="Cambiar responsable"
              onClick={(e) => {
                e.preventDefault();
                setIsAssigning(!isAssigning);
              }}
            >
              {users
                ?.find((u: any) => u.id === item.backlogItem.assigneeUserId)
                ?.name?.charAt(0) || <User size={12} />}
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsAssigning(!isAssigning);
              }}
              className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-200 border border-gray-200 border-dashed transition-colors"
              title="Asignar responsable"
            >
              <User size={12} />
            </button>
          )}

          {/* Dropdown for Assignment */}
          {isAssigning && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-1">
              <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1 border-b border-gray-100">
                Asignar a...
              </div>
              <div className="max-h-40 overflow-y-auto">
                {users?.map((u: any) => (
                  <div
                    key={u.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssign(u.id);
                      setIsAssigning(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 rounded cursor-pointer text-xs text-gray-700"
                  >
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                      {u.name?.charAt(0)}
                    </div>
                    <span className="truncate">{u.name}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAssigning(false);
                }}
                className="w-full text-center text-[10px] text-gray-400 hover:text-gray-600 mt-1 py-1"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div
        className="pt-2 border-t border-gray-50 flex items-center justify-between"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Report Buttons */}
        {columnId === 'IN_PROGRESS' || columnId === 'IN_REVIEW' ? (
          <div className="flex gap-1">
            <button
              onClick={() => onReport(item)}
              className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded text-xs font-medium transition-colors border border-gray-200 border-dashed hover:border-solid hover:border-gray-300 flex items-center gap-1"
              title="Reportar Avance"
            >
              <Camera size={12} />
            </button>
            <button
              onClick={() => onViewLog(item)}
              className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded text-xs transition-colors border border-gray-200 hover:border-gray-300"
              title="Ver Bitácora"
            >
              <FileText size={12} />
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* Manual Move Buttons (Fallback) */}
        <div className="flex gap-1">
          {prevStatus && (
            <button
              onClick={() => onMoveUpdated(item.id, prevStatus)}
              className="text-gray-400 hover:text-gray-600 px-1"
              title="Mover atrás"
            >
              ←
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => onMoveUpdated(item.id, nextStatus)}
              className="text-blue-600 hover:text-blue-800 text-xs font-bold px-1"
              title="Mover siguiente"
            >
              →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const SprintBoardCard = (props: SprintBoardCardProps) => {
  return (
    <SortableItem id={props.item.id}>
      <SprintBoardCardInner {...props} />
    </SortableItem>
  );
};
