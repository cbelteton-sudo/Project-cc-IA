import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown, Flag, UserPlus, User, Eye, Plus, GripVertical } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface Activity {
    id: string;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    status: string;
    parentId: string | null;
    children?: Activity[];
    contractor?: { name: string };
    progressRecords?: { percent: number; weekStartDate: string }[];
    plannedWeight?: number;
    milestones?: { id: string; name: string; date: string; status: string }[];
    orderIndex?: number;
}

interface ActivitiesTreeProps {
    activities: Activity[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAssignContractor: (activityId: string) => void;
    onCreate?: () => void;
    onReorder?: (orderedIds: string[]) => void;
}

export const ActivitiesTree = ({ activities, selectedId, onSelect, onAssignContractor, onCreate, onReorder }: ActivitiesTreeProps) => {
    const { t } = useTranslation();
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Helpers to find nodes
    const findNode = (id: string, nodes: Activity[]): Activity | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNode(id, node.children);
                if (found) return found;
            }
        }
        return null;
    };

    const findParent = (id: string, nodes: Activity[], parent: Activity | null = null): Activity | null => {
        for (const node of nodes) {
            if (node.id === id) return parent;
            if (node.children) {
                const found = findParent(id, node.children, node);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    };

    // Better findParent logic handling "Root" as null parent
    const findParentAndList = (id: string, nodes: Activity[]): { parent: Activity | null, list: Activity[] } | null => {
        // Check root level
        if (nodes.find(n => n.id === id)) return { parent: null, list: nodes };

        for (const node of nodes) {
            if (node.children) {
                if (node.children.find(c => c.id === id)) return { parent: node, list: node.children };
                const found = findParentAndList(id, node.children);
                if (found) return found;
            }
        }
        return null;
    };


    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (active.id !== over?.id) {
            // Find parents to ensure we are reordering siblings
            const activeInfo = findParentAndList(active.id as string, activities);
            const overInfo = findParentAndList(over?.id as string, activities);

            if (activeInfo && overInfo && activeInfo.parent === overInfo.parent) {
                // Siblings!
                const oldIndex = activeInfo.list.findIndex(x => x.id === active.id);
                const newIndex = overInfo.list.findIndex(x => x.id === over?.id);

                const newOrder = arrayMove(activeInfo.list, oldIndex, newIndex);
                // Call reorder with just IDs
                if (onReorder) {
                    onReorder(newOrder.map(x => x.id));
                }
            }
        }
    };

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
        >
            <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="flex items-center bg-gray-50 border-b border-gray-200 px-4 py-2 text-[10px] font-bold text-black uppercase tracking-wider">
                    <div className="w-8 flex justify-center">#</div>
                    <div className="flex-1">ACTIVIDAD</div>
                    <div className="w-32 text-center">RESPONSABLE</div>
                    <div className="w-24 text-center">INICIO</div>
                    <div className="w-24 text-center">FIN</div>
                    <div className="w-20 text-center">DURACIÓN</div>
                    <div className="w-24 text-center">PROGRESO</div>
                    <div className="w-32 text-center">ESTADO</div>
                    <div className="w-10"></div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto">
                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-gray-400">
                            <p className="text-sm mb-4">No hay actividades registradas.</p>
                            {onCreate && (
                                <button
                                    onClick={onCreate}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm text-sm font-medium"
                                >
                                    <Plus size={16} />
                                    Crear Primera Actividad
                                </button>
                            )}
                        </div>
                    ) : (
                        <SortableContext
                            items={activities.map(a => a.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {activities.map(root => (
                                <ActivityRow
                                    key={root.id}
                                    node={root}
                                    selectedId={selectedId}
                                    onSelect={onSelect}
                                    onAssignContractor={onAssignContractor}
                                    onCreate={onCreate}
                                />
                            ))}
                        </SortableContext>
                    )}

                    {/* Bottom Create Button Row */}
                    {onCreate && activities.length > 0 && (
                        <div
                            className="px-4 py-3 border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors flex items-center text-gray-500 hover:text-blue-600 group"
                            onClick={onCreate}
                        >
                            <div className="w-6 flex justify-center mr-2">
                                <Plus size={16} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-sm font-medium">Crear nueva actividad...</span>
                        </div>
                    )}
                </div>
            </div>
            {/* Overlay for Dragged Item (Optional but good for visuals) */}
            <DragOverlay>
                {activeId ? (
                    <div className="bg-white border border-blue-500 shadow-xl opacity-90 p-2 rounded flex items-center">
                        <span className="font-bold text-sm text-gray-800">Moviendo actividad...</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

const ActivityRow = ({ node, level = 0, selectedId, onSelect, onAssignContractor, onCreate }: { node: Activity, level?: number, selectedId: string | null, onSelect: (id: string) => void, onAssignContractor: (id: string) => void, onCreate?: () => void }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    // DnD Hooks
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: node.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    // Progress
    const currentProgress = (node as any).percent ?? node.progressRecords?.[0]?.percent ?? 0;

    // Duration Calculation
    const startDate = new Date(node.startDate);
    const endDate = new Date(node.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

    // Status Styling
    const statusConfig: Record<string, { label: string; className: string }> = {
        'NOT_STARTED': { label: 'No Iniciado', className: 'bg-gray-100 text-gray-500 border-gray-200' },
        'IN_PROGRESS': { label: 'En Progreso', className: 'bg-blue-50 text-blue-700 border-blue-200' },
        'BLOCKED': { label: 'Bloqueado', className: 'bg-red-50 text-red-700 border-red-200' },
        'DONE': { label: 'Completado', className: 'bg-green-50 text-green-700 border-green-200' },
        'CLOSED': { label: 'Cerrado', className: 'bg-green-100 text-green-800 border-green-300' },
    };

    const defaultConfig = { label: node.status, className: 'bg-gray-100 text-gray-500 border-gray-200' };
    const status = statusConfig[node.status] || defaultConfig;

    // Delayed Logic
    const isDelayed = new Date(node.endDate) < new Date() && node.status !== 'DONE' && node.status !== 'CLOSED';

    return (
        <div ref={setNodeRef} style={style} className="group/row">
            <div className="select-none text-sm border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                {/* Row Content */}
                <div
                    className={`flex items-center px-4 py-1.5 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                    onClick={() => onSelect(node.id)}
                >
                    {/* Drag Handle */}
                    <div className="w-8 flex justify-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500" {...attributes} {...listeners}>
                        <GripVertical size={14} />
                    </div>

                    {/* Name Col */}
                    <div className="flex-1 flex items-center gap-3 overflow-hidden pr-4" style={{ paddingLeft: `${level * 20}px` }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className={`p-0.5 rounded hover:bg-gray-200 text-gray-400 transition-colors ${hasChildren ? 'visible' : 'invisible'}`}
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <div className="flex flex-col min-w-0">
                            <span className={`font-medium truncate ${isSelected ? 'text-blue-700' : isDelayed ? 'text-red-600' : 'text-gray-900'}`} title={node.name}>
                                {node.name}
                            </span>
                        </div>
                    </div>

                    {/* Contractor Col (Avatar) */}
                    <div className="w-32 flex justify-center">
                        {node.contractor ? (
                            <div
                                className="flex items-center gap-2 bg-white border border-gray-200 pl-1 pr-2 py-0.5 rounded-full shadow-sm hover:border-blue-300 transition-colors cursor-pointer group/contractor"
                                onClick={(e) => { e.stopPropagation(); onAssignContractor(node.id); }}
                                title={node.contractor.name}
                            >
                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-bold uppercase border border-indigo-200">
                                    {node.contractor.name.substring(0, 2)}
                                </div>
                                <span className="truncate max-w-[70px] text-[10px] text-gray-600 font-medium group-hover/contractor:text-blue-600">
                                    {node.contractor.name}
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAssignContractor(node.id); }}
                                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all opacity-0 group-hover/row:opacity-100"
                                title="Asignar Responsable"
                            >
                                <UserPlus size={14} />
                            </button>
                        )}
                    </div>

                    {/* Date Cols */}
                    <div className="w-24 text-center text-gray-600 text-xs font-medium">
                        {new Date(node.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="w-24 text-center text-gray-600 text-xs font-medium">
                        {new Date(node.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>

                    {/* Duration Col */}
                    <div className="w-20 text-center text-gray-500 text-xs font-mono">
                        {durationDays}d
                    </div>

                    {/* Progress Col (Bar + Text) */}
                    <div className="w-24 px-2 flex flex-col justify-center gap-1">
                        <div className="flex justify-between items-end text-[10px] font-bold mb-0.5">
                            <span className={currentProgress === 100 ? 'text-green-600' : 'text-blue-600'}>{currentProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${currentProgress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${currentProgress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Status Col (Pill) */}
                    <div className="w-32 flex justify-center">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${status.className} uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] text-center`}>
                            {status.label}
                        </span>
                    </div>

                    {/* Actions Col */}
                    <div className="w-10 flex justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver Detalles"
                        >
                            <Eye size={16} />
                        </button>
                    </div>
                </div>

                {/* Children Recursion */}
                {isExpanded && node.children && node.children.length > 0 && (
                    <SortableContext
                        items={node.children.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div>
                            {/* Milestones are NOT sortable for now, kept as is */}
                            {node.milestones?.map(milestone => {
                                const msStatusConfig: any = {
                                    'PLANNED': { label: 'No Iniciado', className: 'bg-gray-100 text-gray-500 border-gray-200' },
                                    'ACHIEVED': { label: 'Terminado', className: 'bg-green-100 text-green-800 border-green-300' },
                                    'MISSED': { label: 'No Logrado', className: 'bg-red-100 text-red-800 border-red-300' },
                                };

                                let statusKey = milestone.status;
                                // Check for overdue PLANNED milestones
                                if (statusKey === 'PLANNED') {
                                    const milestoneDate = new Date(milestone.date);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0); // Compare dates only
                                    if (milestoneDate < today) {
                                        statusKey = 'MISSED';
                                    }
                                }

                                const config = msStatusConfig[statusKey] || { label: milestone.status, className: 'bg-gray-100 text-gray-500 border-gray-200' };

                                return (
                                    <div key={`ms-${milestone.id}`} className="select-none text-sm border-b border-gray-50 last:border-0 hover:bg-purple-50/20 transition-colors bg-purple-50/10">
                                        <div className="flex items-center px-4 py-1.5 border-l-4 border-l-transparent pl-[calc(1rem+4px)]">
                                            <div className="w-8"></div> {/* Spacer for handle */}
                                            <div className="flex-1 flex items-center gap-3 overflow-hidden" style={{ paddingLeft: `${(level + 1) * 20}px` }}>
                                                <div className="w-4 flex justify-center">
                                                    <Flag size={12} className="text-purple-500" fill="currentColor" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-purple-700 truncate">{milestone.name}</span>
                                                    <span className="text-[9px] text-purple-400 font-mono tracking-wider">MILESTONE</span>
                                                </div>
                                            </div>
                                            {/* Empty Cols for alignment */}
                                            <div className="w-32"></div>
                                            <div className="w-24"></div>
                                            <div className="w-24 text-center text-purple-600 text-xs font-medium">
                                                {new Date(milestone.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="w-20"></div> {/* Spacer for Duration */}
                                            <div className="w-24"></div>
                                            <div className="w-32 flex justify-center">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${config.className}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            <div className="w-10"></div>
                                        </div>
                                    </div>
                                )
                            })}

                            {node.children.map(child => (
                                <ActivityRow
                                    key={child.id}
                                    node={child}
                                    level={level + 1}
                                    selectedId={selectedId}
                                    onSelect={onSelect}
                                    onAssignContractor={onAssignContractor}
                                />
                            ))}
                        </div>
                    </SortableContext>
                )}
            </div>
        </div>
    );
};
