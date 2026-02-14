import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { EisenhowerQuadrant } from './EisenhowerQuadrant';
import { EisenhowerCard } from './EisenhowerCard';
import { Loader2, AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface MatrixData {
  matrix: {
    do: any[];
    schedule: any[];
    delegate: any[];
    eliminate: any[];
    unclassified: any[];
  };
  stats: {
    do: number;
    schedule: number;
    delegate: number;
    eliminate: number;
    unclassified: number;
    total: number;
    overdue: number;
  };
}

export const EisenhowerMatrix = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

  const { data, isLoading, error } = useQuery<MatrixData>({
    queryKey: ['eisenhower', projectId],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/scrum/projects/${projectId}/eisenhower`);
      return res.data;
    },
    enabled: !!projectId,
  });

  const mutation = useMutation({
    mutationFn: async ({
      itemId,
      isUrgent,
      isImportant,
    }: {
      itemId: string;
      isUrgent: boolean;
      isImportant: boolean;
    }) => {
      return axios.patch(`${API_URL}/scrum/backlog/${itemId}/eisenhower`, {
        isUrgent,
        isImportant,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eisenhower', projectId] });
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;
    const quadrantId = over.id as string; // 'do', 'schedule', 'delegate', 'eliminate'

    let isUrgent = false;
    let isImportant = false;

    switch (quadrantId) {
      case 'do':
        isUrgent = true;
        isImportant = true;
        break;
      case 'schedule':
        isUrgent = false;
        isImportant = true;
        break;
      case 'delegate':
        isUrgent = true;
        isImportant = false;
        break;
      case 'eliminate':
        isUrgent = false;
        isImportant = false;
        // Logic: Dropping to eliminate might mean we want to actually delete or just set as false/false
        // For now, it stays false/false
        break;
      case 'unclassified':
        isUrgent = false;
        isImportant = false;
        break;
      default:
        return; // Invalid drop
    }

    // Optimistic update or just mutation? Let's do mutation for now
    mutation.mutate({ itemId, isUrgent, isImportant });
  };

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  if (error)
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        <AlertCircle className="mr-2" /> Error al cargar la matriz
      </div>
    );

  const activeItem = activeId
    ? Object.values(data?.matrix || {})
        .flat()
        .find((item: any) => item.id === activeId)
    : null;

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold">Matriz de Eisenhower</h2>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>Total: {data?.stats.total}</span>
          <span>Vencidos: {data?.stats.overdue}</span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 h-full min-h-[600px]">
          {/* Unclassified Sidebar - Left Side */}
          <div className="w-80 border-r pr-4 border-gray-200 flex flex-col gap-4">
            <div className="font-semibold text-gray-700">Sin Clasificar / Backlog</div>
            <EisenhowerQuadrant
              id="unclassified"
              title="Por Categorizar"
              color="bg-gray-100 border-gray-300 border-dashed"
              items={data?.matrix.unclassified || []}
            />
          </div>

          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
            <EisenhowerQuadrant
              id="do"
              title="Hacer (Urgente + Importante)"
              color="bg-red-50 border-red-200"
              items={data?.matrix.do || []}
            />
            <EisenhowerQuadrant
              id="schedule"
              title="Agendar (No Urgente + Importante)"
              color="bg-blue-50 border-blue-200"
              items={data?.matrix.schedule || []}
            />
            <EisenhowerQuadrant
              id="delegate"
              title="Delegar (Urgente + No Importante)"
              color="bg-orange-50 border-orange-200"
              items={data?.matrix.delegate || []}
            />
            <EisenhowerQuadrant
              id="eliminate"
              title="Eliminar (No Urgente + No Importante)"
              color="bg-gray-50 border-gray-200"
              items={data?.matrix.eliminate || []}
            />
          </div>
        </div>

        <DragOverlay>
          {activeItem ? <EisenhowerCard item={activeItem} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
