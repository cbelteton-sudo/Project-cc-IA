import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, CheckCircle, Clock, PlayCircle, Filter } from 'lucide-react';
import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DailyUpdateModal } from './DailyUpdateModal';
import { SprintClosureModal } from './SprintClosureModal';
import { DailyUpdateLogModal } from './DailyUpdateLogModal';
import { useContractors } from '../../hooks/useContractors';
import { SprintBoardColumn } from './board/SprintBoardColumn';
import { SprintBoardCardInner } from './board/SprintBoardCard';

export const SprintBoard = ({ projectId }: { projectId: string }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
  const queryClient = useQueryClient();
  const [reportingItem, setReportingItem] = useState<{
    id: string;
    title: string;
    backlogItemId: string;
  } | null>(null);
  const [viewLogItem, setViewLogItem] = useState<{
    id: string;
    title: string;
    backlogItemId: string;
  } | null>(null);
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);
  const { contractors } = useContractors();
  const [contractorFilter, setContractorFilter] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { data: sprints } = useQuery({
    queryKey: ['scrum', 'sprints', projectId],
    queryFn: async () => (await axios.get(`${API_URL}/scrum/sprints/${projectId}`)).data,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await axios.get(`${API_URL}/users`)).data,
  });

  const activeSprint = sprints?.find((s: any) => s.status === 'ACTIVE');

  const assignMutation = useMutation({
    mutationFn: async ({ itemId, userId }: { itemId: string; userId: string }) => {
      return axios.patch(`${API_URL}/scrum/backlog/${itemId}/assign`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrum', 'sprints', projectId] });
      setAssigningItemId(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      return axios.patch(`${API_URL}/scrum/items/${itemId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrum', 'sprints', projectId] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine target status
    let targetStatus: string | null = null;

    // Check if over is a column
    if (['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(overId)) {
      targetStatus = overId;
    } else {
      // Check if over is another item
      // We need to find which column the over item belongs to
      // Since we don't have a quick lookup, we iterate or check activeSprint
      const overItem = activeSprint?.items?.find((i: any) => i.id === overId);
      if (overItem) {
        targetStatus = overItem.boardStatus;
      }
    }

    const activeItem = activeSprint?.items?.find((i: any) => i.id === activeId);

    if (activeItem && targetStatus && targetStatus !== activeItem.boardStatus) {
      updateStatusMutation.mutate({ itemId: activeId, status: targetStatus });
    }

    setActiveId(null);
  };

  const handleReport = (item: any) => {
    setReportingItem({
      id: item.id,
      title: item.backlogItem.title,
      backlogItemId: item.backlogItem.id,
    });
  };

  const handleViewLog = (item: any) => {
    setViewLogItem({
      id: item.id,
      title: item.backlogItem.title,
      backlogItemId: item.backlogItem.id,
    });
  };

  const handleAssign = (itemId: string, userId: string) => {
    assignMutation.mutate({ itemId, userId });
  };

  // Handler for manual moves (fallback)
  const handleMoveUpdated = (itemId: string, status: string) => {
    updateStatusMutation.mutate({ itemId, status });
  };

  if (!activeSprint) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <AlertCircle size={48} className="mb-4 text-gray-300" />
        <h3 className="text-lg font-medium">No hay Sprint Activo</h3>
        <p>Ve a la pestaña de Planificación para iniciar uno.</p>
      </div>
    );
  }

  const columns = [
    {
      id: 'TODO',
      label: 'Por Hacer',
      icon: <Clock size={16} />,
      color: 'bg-gray-100 border-gray-200',
    },
    {
      id: 'IN_PROGRESS',
      label: 'En Progreso',
      icon: <PlayCircle size={16} />,
      color: 'bg-blue-50 border-blue-200',
    },
    {
      id: 'IN_REVIEW',
      label: 'Revisión / Validar',
      icon: <AlertCircle size={16} />,
      color: 'bg-yellow-50 border-yellow-200',
    },
    {
      id: 'DONE',
      label: 'Terminado',
      icon: <CheckCircle size={16} />,
      color: 'bg-green-50 border-green-200',
    },
  ];

  const getItems = (status: string) =>
    activeSprint.items?.filter((i: any) => {
      if (i.boardStatus !== status) return false;
      if (!contractorFilter) return true;

      const itemContractorId = i.backlogItem.contractorId;
      // Safety check for contractor object
      const itemContractorObjId = i.backlogItem.contractor?.id;

      // Also check parent's contractor if item has no direct contractor
      const parentContractorId = i.backlogItem.parent?.contractorId;
      const parentContractorObjId = i.backlogItem.parent?.contractor?.id;

      const linkedWbsContractorId = i.backlogItem.linkedWbsActivity?.contractorId;
      const linkedWbsContractorObjId = i.backlogItem.linkedWbsActivity?.contractor?.id;

      const matches =
        itemContractorId === contractorFilter ||
        itemContractorObjId === contractorFilter ||
        linkedWbsContractorId === contractorFilter ||
        linkedWbsContractorObjId === contractorFilter ||
        ((parentContractorId === contractorFilter || parentContractorObjId === contractorFilter) &&
          !itemContractorId &&
          !itemContractorObjId &&
          !linkedWbsContractorId &&
          !linkedWbsContractorObjId);

      return matches;
    }) || [];

  const activeDraggingItem = activeId
    ? activeSprint.items.find((i: any) => i.id === activeId)
    : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 px-2">
        <div>
          <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
            {activeSprint.name}
            <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              Activo
            </span>
          </h2>
          <div className="text-sm text-gray-500 mt-1">
            Objetivo: <span className="italic">{activeSprint.goal || 'Sin objetivo definido'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1">
            <Filter size={14} className="text-gray-400" />
            <select
              className="text-sm text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer"
              value={contractorFilter || ''}
              onChange={(e) => setContractorFilter(e.target.value || null)}
            >
              <option value="">Todos los Contratistas</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsClosureModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-colors text-sm"
          >
            <CheckCircle size={16} />
            Finalizar Sprint
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 grid grid-cols-4 gap-4 overflow-hidden min-h-0">
          {columns.map((col) => (
            <SprintBoardColumn
              key={col.id}
              column={col}
              items={getItems(col.id)}
              users={users}
              onAssign={handleAssign}
              onReport={handleReport}
              onViewLog={handleViewLog}
              onMoveUpdated={handleMoveUpdated}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDraggingItem ? (
            <div style={{ height: 'auto', width: '280px' }}>
              <SprintBoardCardInner
                item={activeDraggingItem}
                users={users}
                columnId={activeDraggingItem.boardStatus}
                onAssign={(userId) => handleAssign(activeDraggingItem.backlogItem.id, userId)}
                onReport={handleReport}
                onViewLog={handleViewLog}
                onMoveUpdated={handleMoveUpdated}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {reportingItem && (
        <DailyUpdateModal
          isOpen={!!reportingItem}
          onClose={() => setReportingItem(null)}
          projectId={projectId}
          sprintId={activeSprint.id}
          backlogItemId={reportingItem.backlogItemId}
          backlogItemTitle={reportingItem.title}
        />
      )}

      {viewLogItem && (
        <DailyUpdateLogModal
          isOpen={!!viewLogItem}
          onClose={() => setViewLogItem(null)}
          projectId={projectId}
          backlogItemId={viewLogItem.backlogItemId}
          backlogItemTitle={viewLogItem.title}
        />
      )}

      {isClosureModalOpen && (
        <SprintClosureModal
          isOpen={isClosureModalOpen}
          onClose={() => setIsClosureModalOpen(false)}
          projectId={projectId}
          sprintId={activeSprint.id}
          sprintName={activeSprint.name}
          completedCount={
            activeSprint.items?.filter((i: any) => i.boardStatus === 'DONE').length || 0
          }
          totalCount={activeSprint.items?.length || 0}
        />
      )}
    </div>
  );
};
