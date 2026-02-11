// ... imports
import { useState, useRef, useEffect, useMemo } from 'react'; // Added useMemo
import { GanttProvider, useGantt } from './GanttProvider';
import { GanttWBS } from './GanttWBS';
import { GanttTimeline } from './GanttTimeline';
import { ZoomIn, ZoomOut, Filter, Check, X, User } from 'lucide-react'; // Added icons
import type { Activity } from './ActivitiesTree';

interface GanttChartProps {
    activities: Activity[];
    milestones?: any[];
    onSelect?: (id: string) => void;
    contractors?: any[]; // Added contractors prop
}

export const GanttChart = ({ activities, milestones, onSelect, contractors = [] }: GanttChartProps) => {
    return (
        <GanttProvider activities={activities} milestones={milestones} onSelectActivity={onSelect}>
            <GanttLayout contractors={contractors} />
        </GanttProvider>
    );
};

const GanttLayout = ({ contractors }: { contractors: any[] }) => {
    const { viewMode, setViewMode, zoom, setZoom, filterOwner, setFilterOwner, filterStatus, setFilterStatus } = useGantt();
    const [splitPos, setSplitPos] = useState(30); // Percentage
    const [isFilterOpen, setIsFilterOpen] = useState(false); // Filter dropdown state
    const filterRef = useRef<HTMLDivElement>(null);

    // Close filter on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ... (Drag Resizer Logic remains same)
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = () => {
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
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

    const activeFiltersCount = (filterOwner ? 1 : 0) + (filterStatus ? 1 : 0);

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50 flex-shrink-0 relative z-50">
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

                <div className="flex items-center gap-2 relative" ref={filterRef}>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-medium shadow-sm transition-colors ${isFilterOpen || activeFiltersCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-white bg-white'}`}
                    >
                        <Filter size={14} />
                        Filtros
                        {activeFiltersCount > 0 && (
                            <span className="bg-blue-600 text-white min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] px-1">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    {/* Filter Dropdown */}
                    {isFilterOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-fade-in-down origin-top-right overflow-hidden">
                            <div className="p-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtrar Vistas</span>
                                {(filterOwner || filterStatus) && (
                                    <button
                                        onClick={() => { setFilterOwner(null); setFilterStatus(null); }}
                                        className="text-[10px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                                    >
                                        <X size={10} /> Limpiar todo
                                    </button>
                                )}
                            </div>

                            <div className="p-2 space-y-1 max-h-[80vh] overflow-y-auto">
                                {/* Status Section */}
                                <div className="px-2 py-2">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Estado</h4>
                                    <div className="space-y-1">
                                        {[
                                            { id: null, label: 'Todos' },
                                            { id: 'IN_PROGRESS', label: 'En Progreso', color: 'bg-blue-100 text-blue-700' },
                                            { id: 'DELAYED', label: 'Retrasados', color: 'bg-red-100 text-red-700' },
                                            { id: 'DONE', label: 'Completados', color: 'bg-green-100 text-green-700' },
                                            { id: 'BLOCKED', label: 'Bloqueados', color: 'bg-red-50 text-red-600' }
                                        ].map(status => (
                                            <button
                                                key={status.id || 'all'}
                                                onClick={() => setFilterStatus(status.id)}
                                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${filterStatus === status.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {status.id && status.color && (
                                                        <span className={`w-2 h-2 rounded-full ${status.color.split(' ')[0]}`}></span>
                                                    )}
                                                    {status.label}
                                                </span>
                                                {filterStatus === status.id && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 my-1 mx-2"></div>

                                {/* Contractor Section */}
                                <div className="px-2 py-2">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Responsable</h4>
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => setFilterOwner(null)}
                                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${filterOwner === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <span>Todos los responsables</span>
                                            {filterOwner === null && <Check size={14} />}
                                        </button>
                                        {contractors.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => setFilterOwner(c.id)}
                                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${filterOwner === c.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-bold border border-indigo-200">
                                                        {c.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="truncate max-w-[160px]">{c.name}</span>
                                                </div>
                                                {filterOwner === c.id && <Check size={14} />}
                                            </button>
                                        ))}
                                        {contractors.length === 0 && (
                                            <p className="text-[10px] text-gray-400 italic px-2">No hay contratistas disponibles.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
