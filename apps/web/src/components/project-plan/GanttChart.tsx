import { useState, useRef, useEffect } from 'react';
import { GanttProvider, useGantt } from './GanttProvider';
import { GanttWBS } from './GanttWBS';
import { GanttTimeline } from './GanttTimeline';
import { ZoomIn, ZoomOut, Filter } from 'lucide-react';
import type { Activity } from './ActivitiesTree';

interface GanttChartProps {
    activities: Activity[];
    milestones?: any[];
    onSelect?: (id: string) => void;
}

export const GanttChart = ({ activities, milestones, onSelect }: GanttChartProps) => {
    return (
        <GanttProvider activities={activities} milestones={milestones} onSelectActivity={onSelect}>
            <GanttLayout />
        </GanttProvider>
    );
};

const GanttLayout = () => {
    const { viewMode, setViewMode, zoom, setZoom, setFilterOwner, setFilterStatus } = useGantt();
    const [splitPos, setSplitPos] = useState(30); // Percentage

    // Drag Resizer Logic
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = () => {
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        // Add overlay to prevent iframe stealing events if any
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || !containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const newPos = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            if (newPos > 15 && newPos < 85) setSplitPos(newPos);
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex bg-white rounded-lg border border-gray-300 p-0.5 shadow-sm">
                        <button
                            onClick={() => setViewMode('Day')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'Day' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Día
                        </button>
                        <button
                            onClick={() => setViewMode('Week')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'Week' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Semana
                        </button>
                        <button
                            onClick={() => setViewMode('Month')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'Month' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Mes
                        </button>
                    </div>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-1.5 hover:bg-gray-200 rounded text-gray-500"><ZoomOut size={16} /></button>
                        <span className="text-xs font-medium w-8 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(Math.min(2, zoom + 0.25))} className="p-1.5 hover:bg-gray-200 rounded text-gray-500"><ZoomIn size={16} /></button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-600 hover:bg-white bg-white shadow-sm">
                        <Filter size={14} />
                        Filtros
                    </button>
                </div>
            </div>

            {/* Split View */}
            <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
                {/* Left: WBS Grid */}
                <div style={{ width: `${splitPos}%` }} className="flex flex-col border-r border-gray-200 bg-white z-10">
                    <GanttWBS />
                </div>

                {/* Resizer Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    className="absolute top-0 bottom-0 w-1 bg-gray-100 hover:bg-blue-400 cursor-col-resize z-20 transition-colors border-l border-gray-200"
                    style={{ left: `${splitPos}%`, transform: 'translateX(-50%)' }}
                ></div>

                {/* Right: Timeline */}
                <div style={{ width: `${100 - splitPos}%` }} className="flex flex-col bg-gray-50 relative overflow-hidden">
                    <GanttTimeline />
                </div>
            </div>
        </div>
    );
};
