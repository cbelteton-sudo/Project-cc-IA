import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SprintBoardCard } from './SprintBoardCard';

interface SprintBoardColumnProps {
  column: {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
  };
  items: any[];
  users: any[];
  onAssign: (itemId: string, userId: string) => void;
  onReport: (item: any) => void;
  onViewLog: (item: any) => void;
  onMoveUpdated: (itemId: string, status: string) => void;
}

export const SprintBoardColumn = ({
  column,
  items,
  users,
  onAssign,
  onReport,
  onViewLog,
  onMoveUpdated,
}: SprintBoardColumnProps) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border ${column.color} h-full overflow-hidden`}
    >
      <div className="p-3 border-b border-gray-200/50 bg-white/50 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-2 font-bold text-gray-700 text-sm">
          {column.icon}
          {column.label}
        </div>
        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold border border-gray-200 text-gray-500">
          {items.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SprintBoardCard
              key={item.id}
              item={item}
              users={users}
              columnId={column.id}
              onAssign={(userId) => onAssign(item.backlogItem.id, userId)}
              onReport={onReport}
              onViewLog={onViewLog}
              onMoveUpdated={onMoveUpdated}
            />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div className="h-20 flex items-center justify-center text-gray-400 text-xs italic border-2 border-dashed border-gray-200 rounded-lg">
            Arrastra items aquí
          </div>
        )}
      </div>
    </div>
  );
};
