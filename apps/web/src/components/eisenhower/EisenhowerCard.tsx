import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EisenhowerCardProps {
  item: any;
  isOverlay?: boolean;
}

export const EisenhowerCard = ({ item, isOverlay }: EisenhowerCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-50">
        <Card className="h-24 bg-gray-100 border-dashed border-2" />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn('touch-none', isOverlay && 'cursor-grabbing scale-105 shadow-xl')}
    >
      <Card className="cursor-grab hover:shadow-md transition-shadow bg-white">
        <CardHeader className="p-3 pb-0">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium leading-none">{item.title}</CardTitle>
            <Badge variant="outline" className="text-[10px] h-4">
              {item.storyPoints ? `${item.storyPoints} pts` : '-'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="text-xs text-gray-500 line-clamp-2">
            {item.description || 'Sin descripción'}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {item.assigneeUser && (
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">
                {item.assigneeUser.name?.[0] || 'U'}
              </div>
            )}
            {item.dueDate && (
              <span
                className={cn(
                  'text-[10px]',
                  new Date(item.dueDate) < new Date() ? 'text-red-500' : 'text-gray-400',
                )}
              >
                {new Date(item.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
