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
import { SortableItem } from './SortableItem';

interface SprintBoardCardProps {
  item: any;
  users: any[];
  columnId: string;
  onReport: (item: any) => void;
  onViewLog: (item: any) => void;
  onMoveUpdated: (itemId: string, status: string) => void;
}

export const SprintBoardCardInner = ({
  item,
  users,
  columnId,
  onReport,
  onViewLog,
  onMoveUpdated,
}: SprintBoardCardProps) => {
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
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
          {(() => {
            const type = item.backlogItem.type;
            if (type === 'STORY')
              return (
                <span title="Story" className="bg-green-100 p-1 rounded text-green-700 shrink-0">
                  <BookOpen size={13} />
                </span>
              );
            if (type === 'TASK')
              return (
                <span title="Task" className="bg-blue-100 p-1 rounded text-blue-700 shrink-0">
                  <CheckSquare size={13} />
                </span>
              );
            if (type === 'BUG')
              return (
                <span title="Bug" className="bg-red-100 p-1 rounded text-red-700 shrink-0">
                  <Bug size={13} />
                </span>
              );
            if (type === 'EPIC')
              return (
                <span title="Epic" className="bg-purple-100 p-1 rounded text-purple-700 shrink-0">
                  <Mountain size={13} />
                </span>
              );
            return <BookOpen size={13} className="text-gray-500 shrink-0" />;
          })()}

          {item.backlogItem.parent && (
            <div className="text-[10px] text-gray-500 flex items-center gap-1 bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100/50 truncate">
              <span className="font-semibold text-indigo-400">↳</span>
              <span className="truncate">{item.backlogItem.parent.title}</span>
            </div>
          )}
        </div>
      </div>

      <p className="font-medium text-sm text-gray-800 leading-snug line-clamp-2 mb-1">
        {item.backlogItem.title}
      </p>

      <div className="mt-2 pt-2 border-t border-gray-50 flex flex-col gap-2">
        {/* Assignee Information (Left Side / Full Width) */}
        <div className="relative group/assignee" title="Responsable">
          {item.backlogItem.assigneeUserId ? (
            <div
              className="w-full px-2 py-1 rounded bg-blue-50 text-blue-700 flex items-start gap-1.5 text-xs font-medium border border-blue-100"
              title="Miembro de Proyecto Asignado"
            >
              <User size={12} className="shrink-0 mt-0.5" />
              <span className="whitespace-normal break-words text-left overflow-wrap-anywhere">
                {users?.find((u: any) => u.id === item.backlogItem.assigneeUserId)?.name ||
                  'Usuario'}
              </span>
            </div>
          ) : item.backlogItem.assigneeContractorResourceId ? (
            <div
              className="w-full px-2 py-1 rounded bg-orange-50 text-orange-700 flex items-start gap-1.5 text-xs font-medium border border-orange-100"
              title="Recurso de Contratista Asignado"
            >
              <Building2 size={12} className="shrink-0 mt-0.5" />
              <span className="whitespace-normal break-words text-left overflow-wrap-anywhere">
                {item.backlogItem.assigneeContractorResource?.name || 'Recurso'}
              </span>
            </div>
          ) : (
            <div
              className="w-full px-2 py-1 rounded bg-gray-50 text-gray-500 flex items-center gap-1.5 text-xs font-medium border border-gray-200 border-dashed"
              title="Sin asignar"
            >
              <User size={12} className="shrink-0" />
              <span>Sin asignar</span>
            </div>
          )}
        </div>

        {/* Action Buttons (Always Visible at Bottom Right) */}
        <div className="flex shrink-0 gap-1 justify-end">
          {columnId === 'TODO' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUpdated(item.id, 'IN_PROGRESS');
              }}
              className="p-1.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors border border-gray-100"
              title="Mover a En Progreso"
            >
              <Mountain size={14} />
            </button>
          )}

          {(columnId === 'IN_PROGRESS' || columnId === 'IN_REVIEW') && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReport(item);
                }}
                className="p-1.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors border border-gray-100"
                title="Reportar Avance"
              >
                <Camera size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewLog(item);
                }}
                className="p-1.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors border border-gray-100"
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
              className="p-1.5 bg-gray-50 hover:bg-yellow-50 text-gray-500 hover:text-yellow-600 rounded transition-colors border border-gray-100"
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
              className="p-1.5 bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-600 rounded transition-colors border border-gray-100"
              title="Aprobar (Terminado)"
            >
              <CheckSquare size={14} className="text-green-500" />
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
