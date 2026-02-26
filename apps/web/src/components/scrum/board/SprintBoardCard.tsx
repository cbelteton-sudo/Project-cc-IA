import {
  Camera,
  FileText,
  User,
  BookOpen,
  CheckSquare,
  Bug,
  Mountain,
  Building2,
} from 'lucide-react';
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

  const priorityColors = {
    5: 'border-l-red-600 bg-red-50/30', // Critical
    4: 'border-l-red-500', // Very High
    3: 'border-l-orange-500', // High
    2: 'border-l-blue-500', // Medium
    1: 'border-l-gray-300', // Low
  };

  const priorityColorClass =
    priorityColors[item.backlogItem.priority as keyof typeof priorityColors] || 'border-l-gray-300';

  return (
    <div
      className={`bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all group h-full cursor-grab active:cursor-grabbing flex flex-col gap-2 relative border-l-4 ${priorityColorClass}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-1.5">
          {(() => {
            const type = item.backlogItem.type;
            if (type === 'STORY')
              return (
                <span title="Story" className="bg-green-100 p-1 rounded text-green-700">
                  <BookOpen size={13} />
                </span>
              );
            if (type === 'TASK')
              return (
                <span title="Task" className="bg-blue-100 p-1 rounded text-blue-700">
                  <CheckSquare size={13} />
                </span>
              );
            if (type === 'BUG')
              return (
                <span title="Bug" className="bg-red-100 p-1 rounded text-red-700">
                  <Bug size={13} />
                </span>
              );
            if (type === 'EPIC')
              return (
                <span title="Epic" className="bg-purple-100 p-1 rounded text-purple-700">
                  <Mountain size={13} />
                </span>
              );
            return <BookOpen size={13} className="text-gray-500" />;
          })()}
          <span className="text-[10px] font-mono font-medium text-gray-500">
            {item.backlogItem.id.slice(0, 4).toUpperCase()}
          </span>
        </div>

        <div className="flex gap-1 items-center">
          {item.backlogItem.storyPoints !== null && (
            <div
              className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200"
              title="Story Points"
            >
              {item.backlogItem.storyPoints} pts
            </div>
          )}
        </div>
      </div>

      {/* Parent Story Badge */}
      {item.backlogItem.parent && (
        <div className="text-[10px] text-gray-500 flex items-center gap-1 bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100/50 w-fit max-w-full">
          <span className="font-semibold text-indigo-400">↳</span>
          <span className="truncate max-w-[150px]">{item.backlogItem.parent.title}</span>
        </div>
      )}

      <p className="font-medium text-sm text-gray-800 leading-snug line-clamp-2 mb-1">
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
          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-auto pt-1">
            <Building2 size={12} className="text-slate-400" />
            <span className="font-medium truncate max-w-[160px]">{contractor.name}</span>
          </div>
        );
      })()}

      <div className="mt-2 pt-2 flex items-center justify-between border-t border-gray-50">
        {/* Action Buttons for Progress/Log/Transitions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {columnId === 'TODO' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUpdated(item.id, 'IN_PROGRESS');
              }}
              className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
              title="Mover a En Progreso"
            >
              <Mountain size={14} />{' '}
              {/* Reusing Mountain as an action or we can just use text, but Mountain works as metaphor */}
            </button>
          )}

          {(columnId === 'IN_PROGRESS' || columnId === 'IN_REVIEW') && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReport(item);
                }}
                className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                title="Reportar Avance"
              >
                <Camera size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewLog(item);
                }}
                className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                title="Ver Bitácora"
              >
                <FileText size={14} />
              </button>
            </>
          )}

          {columnId === 'IN_PROGRESS' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUpdated(item.id, 'IN_REVIEW');
              }}
              className="p-1.5 hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 rounded transition-colors"
              title="Solicitar Revisión"
            >
              <CheckSquare size={14} />
            </button>
          )}

          {columnId === 'IN_REVIEW' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUpdated(item.id, 'DONE');
              }}
              className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded transition-colors"
              title="Aprobar (Terminado)"
            >
              <CheckSquare size={14} className="text-green-500" />
            </button>
          )}
        </div>

        <div className="relative group/assignee" onPointerDown={(e) => e.stopPropagation()}>
          <Popover open={isAssigning} onOpenChange={setIsAssigning}>
            <PopoverTrigger asChild>
              {/* Assignee Avatar */}
              {item.backlogItem.assigneeUserId ? (
                <div
                  className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-white border border-blue-200 cursor-pointer shadow-sm hover:scale-110 transition-transform"
                  title="Cambiar responsable"
                >
                  {users
                    ?.find((u: any) => u.id === item.backlogItem.assigneeUserId)
                    ?.name?.charAt(0) || <User size={10} />}
                </div>
              ) : (
                <button
                  className="w-6 h-6 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-gray-100 border border-gray-200 border-dashed transition-colors"
                  title="Asignar responsable"
                >
                  <User size={12} />
                </button>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1" align="end">
              <div className="text-xs font-semibold text-gray-500 px-2 py-1.5 mb-1 border-b border-gray-100">
                Asignar a...
              </div>
              <div className="max-h-48 overflow-y-auto">
                {users?.map((u: any) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      onAssign(u.id);
                      setIsAssigning(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 rounded cursor-pointer text-xs text-gray-700 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      {u.name?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{u.name}</span>
                      <span className="text-[10px] text-gray-400">{u.role}</span>
                    </div>
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
