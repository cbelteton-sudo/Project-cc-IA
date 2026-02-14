import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { EisenhowerCard } from './EisenhowerCard';
import { cn } from '@/lib/utils'; // Assuming this utility exists

interface EisenhowerQuadrantProps {
  id: string;
  title: string;
  color: string;
  items: any[];
}

export const EisenhowerQuadrant = ({ id, title, color, items }: EisenhowerQuadrantProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg border p-4 h-full',
        color,
        isOver && 'ring-2 ring-primary ring-inset',
      )}
    >
      <h3 className="font-semibold text-lg mb-4 text-gray-700">{title}</h3>
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {items.map((item) => (
          <EisenhowerCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic">
            Arrastra tareas aquí
          </div>
        )}
      </div>
    </div>
  );
};
