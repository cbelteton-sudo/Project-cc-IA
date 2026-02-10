import React, { useEffect, useState } from 'react';
import { usePunchList } from '../../hooks/usePunchList';
import type { PunchItem } from '../../hooks/usePunchList';
import { MoreHorizontal, Calendar, User, MapPin, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { PunchDetailView } from './PunchDetailView';

interface Props {
    projectId: string;
    filter?: string;
}

export const PunchKanban: React.FC<Props> = ({ projectId, filter }) => {
    const { items, updateItem } = usePunchList(projectId);

    const COLUMNS = [
        { id: 'OPEN', label: 'Abierto', color: 'border-blue-500' },
        { id: 'IN_PROGRESS', label: 'En Proceso', color: 'border-yellow-500' },
        { id: 'READY_FOR_VALIDATION', label: 'Por Validar', color: 'border-purple-500' },
        { id: 'DONE', label: 'Cerrado', color: 'border-green-500' }
    ];

    const getItemsByStatus = (status: string) => {
        // Map simplified columns to actual statuses if needed
        // For DONE column, include DONE and CLOSED
        const safeItems = Array.isArray(items) ? items : [];
        if (status === 'DONE') {
            return safeItems.filter(i => i.status === 'DONE' || i.status === 'CLOSED');
        }
        return safeItems.filter(i => i.status === status);
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        await updateItem(id, { status: status as any });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const activeItem = items.find(i => i.id === selectedItemId) || null;

    return (
        <>
            <div className="flex h-full overflow-x-auto gap-4 p-4 pb-10">
                {COLUMNS.map(col => (
                    <div
                        key={col.id}
                        className="min-w-[280px] w-[300px] flex flex-col h-full rounded-xl bg-gray-50/50 border border-gray-100"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        {/* Column Header */}
                        <div className={`p-3 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 rounded-t-xl ${col.color} border-t-4`}>
                            <h3 className="font-bold text-gray-700 text-sm">{col.label}</h3>
                            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                                {getItemsByStatus(col.id).length}
                            </span>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {getItemsByStatus(col.id).map(item => (
                                <div key={item.id} onClick={() => setSelectedItemId(item.id)}>
                                    <PunchCard item={item} onDragStart={handleDragStart} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {activeItem && (
                <PunchDetailView
                    item={activeItem}
                    projectId={projectId}
                    onClose={() => setSelectedItemId(null)}
                />
            )}
        </>
    );
};

const PunchCard: React.FC<{ item: PunchItem; onDragStart: (e: React.DragEvent, id: string) => void }> = ({ item, onDragStart }) => {
    const priorityColor = {
        LOW: 'bg-green-100 text-green-700',
        MEDIUM: 'bg-yellow-100 text-yellow-700',
        HIGH: 'bg-orange-100 text-orange-700',
        CRITICAL: 'bg-red-100 text-red-700 font-bold animate-pulse'
    };

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, item.id)}
            className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition cursor-grab active:cursor-grabbing group relative select-none"
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold ${priorityColor[item.severity] || 'bg-gray-100'}`}>
                    {item.severity}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                    #{item.code || '---'}
                </span>
            </div>

            <h4 className="font-medium text-gray-800 text-sm mb-1 leading-snug">
                {item.title}
            </h4>

            {item.locationZone && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <MapPin size={12} />
                    <span className="truncate">{item.locationZone}</span>
                </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-50 pt-2 mt-2">
                <div className="flex items-center gap-2">
                    {item.dueDate && (
                        <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${new Date(item.dueDate) < new Date() ? 'bg-red-50 text-red-600 font-bold' : 'bg-gray-50 text-gray-500'}`}>
                            <Calendar size={10} />
                            {new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                </div>

                {item.status === 'READY_FOR_VALIDATION' && (
                    <div className="flex items-center gap-1 text-[10px] text-purple-600 font-bold px-1.5 py-0.5 bg-purple-50 rounded">
                        <CheckCircle2 size={10} />
                        Validar
                    </div>
                )}
            </div>
        </div>
    );
};
