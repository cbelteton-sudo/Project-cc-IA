import { Camera, FileText, User, BookOpen, CheckSquare, Bug, Mountain } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all group h-full cursor-grab active:cursor-grabbing flex flex-col gap-2 relative">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-1.5">
          {(() => {
            const type = item.backlogItem.type;
            if (type === 'STORY')
              return (
                <span title="Story" className="bg-green-100 p-1 rounded-md text-green-700">
                  <BookOpen size={14} />
                </span>
              );
            if (type === 'TASK')
              return (
                <span title="Task" className="bg-blue-100 p-1 rounded-md text-blue-700">
                  <CheckSquare size={14} />
                </span>
              );
            if (type === 'BUG')
              return (
                <span title="Bug" className="bg-red-100 p-1 rounded-md text-red-700">
                  <Bug size={14} />
                </span>
              );
            if (type === 'EPIC')
              return (
                <span title="Epic" className="bg-purple-100 p-1 rounded-md text-purple-700">
                  <Mountain size={14} />
                </span>
              );
            return <BookOpen size={14} className="text-gray-500" />;
          })()}
          <span className="text-xs font-medium text-gray-500 line-through decoration-transparent">
            {item.backlogItem.id.slice(0, 4).toUpperCase()}
          </span>
        </div>

        <div className="flex gap-1">
          {item.backlogItem.storyPoints && (
            <div
              className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold border border-gray-200"
              title="Story Points"
            >
              {item.backlogItem.storyPoints}
            </div>
          )}
          {item.backlogItem.priority >= 4 ? (
            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded-full border border-red-100">
              CRITICAL
            </span>
          ) : item.backlogItem.priority === 3 ? (
            <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
              HIGH
            </span>
          ) : item.backlogItem.priority === 2 ? (
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
              MEDIUM
            </span>
          ) : (
            <span className="text-[10px] text-gray-500 font-bold bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              LOW
            </span>
          )}
        </div>
      </div>

      {/* Parent Story Badge */}
      {item.backlogItem.parent && (
        <div className="text-[10px] text-gray-500 flex items-center gap-1 bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100/50 w-fit max-w-full">
          <span className="font-semibold text-indigo-400">↳</span>
          <span className="truncate">{item.backlogItem.parent.title}</span>
        </div>
      )}

      <p className="font-medium text-sm text-gray-800 leading-tight line-clamp-2">
        {item.backlogItem.title}
      </p>

      {/* Contractor Display Logic */}
      {(() => {
        const contractor =
          item.backlogItem.contractor ||
          item.backlogItem.linkedWbsActivity?.contractor ||
          item.backlogItem.parent?.contractor;

        if (!contractor) return null;

        return (
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <span>🏗️</span> <span className="font-semibold">{contractor.name}</span>
          </div>
        );
      })()}

      <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-50">
        {/* Action Buttons for Progress/Log */}
        <div className="flex gap-1">
          {(columnId === 'IN_PROGRESS' || columnId === 'IN_REVIEW') && (
            <>
              <button
                onClick={() => onReport(item)}
                className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded transition-colors"
                title="Reportar Avance"
              >
                <Camera size={14} />
              </button>
              <button
                onClick={() => onViewLog(item)}
                className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded transition-colors"
                title="Ver Bitácora"
              >
                <FileText size={14} />
              </button>
            </>
          )}
        </div>

        <div className="relative group/assignee" onPointerDown={(e) => e.stopPropagation()}>
          <Popover open={isAssigning} onOpenChange={setIsAssigning}>
            <PopoverTrigger asChild>
              {/* Assignee Avatar */}
              {item.backlogItem.assigneeUserId ? (
                <div
                  className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-white border border-blue-200 cursor-pointer shadow-sm"
                  title="Cambiar responsable"
                >
                  {users
                    ?.find((u: any) => u.id === item.backlogItem.assigneeUserId)
                    ?.name?.charAt(0) || <User size={12} />}
                </div>
              ) : (
                <button
                  className="w-7 h-7 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 border border-gray-200 border-dashed transition-colors"
                  title="Asignar responsable"
                >
                  <User size={14} />
                </button>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end">
              <div className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1 border-b border-gray-100">
                Asignar a...
              </div>
              <div className="max-h-40 overflow-y-auto">
                {users?.map((u: any) => (
                  <div
                    key={u.id}
                    onClick={() => {
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
            </PopoverContent>
          </Popover>
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
