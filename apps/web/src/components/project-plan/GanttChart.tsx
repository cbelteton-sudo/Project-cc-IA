import { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface Activity {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    depth?: number;
    children?: Activity[];
    percent?: number;
    isCritical?: boolean;
}

interface GanttChartProps {
    activities: Activity[];
}

export const GanttChart = ({ activities }: GanttChartProps) => {
    const [viewMode, setViewMode] = useState<'quarter' | 'month' | 'week' | 'fit'>('fit');
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Update container width on resize
    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    // Flatten logic
    const flatActivities = useMemo(() => {
        const flatten = (nodes: Activity[], depth = 0): any[] => {
            return nodes.reduce((acc: any[], node) => {
                acc.push({ ...node, depth });
                if (node.children) {
                    acc.push(...flatten(node.children, depth + 1));
                }
                return acc;
            }, []);
        };
        return flatten(activities);
    }, [activities]);

    // Calculate Range
    const { minDate, maxDate, totalDays } = useMemo(() => {
        if (flatActivities.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 0 };

        let min = new Date(flatActivities[0].startDate);
        let max = new Date(flatActivities[0].endDate);

        flatActivities.forEach(a => {
            const start = new Date(a.startDate);
            const end = new Date(a.endDate);
            if (start < min) min = start;
            if (end > max) max = end;
        });

        // Add padding
        min.setDate(min.getDate() - 7);
        max.setDate(max.getDate() + 14);

        const diffTime = Math.abs(max.getTime() - min.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return { minDate: min, maxDate: max, totalDays };
    }, [flatActivities]);

    // Scales
    const DAY_WIDTH = useMemo(() => {
        if (viewMode === 'fit' && totalDays > 0 && containerWidth > 0) {
            // Strictly fit to container, no minimum width to avoid scroll
            return containerWidth / totalDays;
        }
        return viewMode === 'quarter' ? 5 : viewMode === 'month' ? 15 : 40;
    }, [viewMode, totalDays, containerWidth]);
    const HEADER_HEIGHT = 50;
    const ROW_HEIGHT = 40;
    const TOTAL_WIDTH = totalDays * DAY_WIDTH;

    // Helper to get position
    const getX = (dateStr: string) => {
        const d = new Date(dateStr);
        const diff = Math.ceil((d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        return diff * DAY_WIDTH;
    };

    const getWidth = (startStr: string, endStr: string) => {
        const x1 = getX(startStr);
        const x2 = getX(endStr);
        return Math.max(x2 - x1, DAY_WIDTH); // Min width 1 day
    };

    // Generate Headers
    const { topHeaders, bottomHeaders } = useMemo(() => {
        const top = [];
        const bottom = [];
        const current = new Date(minDate);

        // Align current to start of week for cleanliness if needed
        // current.setDate(current.getDate() - current.getDay());

        const daySpan = (d1: Date, d2: Date) => Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

        if (viewMode === 'week') {
            // Top: Weeks, Bottom: Days
            let wStart = new Date(current);
            // Adjust to Monday? Let's stick to standard flow
            while (wStart <= maxDate) {
                const wEnd = new Date(wStart);
                wEnd.setDate(wEnd.getDate() + 6);
                top.push({
                    label: `Semana ${getWeekNumber(wStart)}`,
                    x: getX(wStart.toISOString()),
                    width: 7 * DAY_WIDTH
                });
                wStart.setDate(wStart.getDate() + 7);
            }

            let d = new Date(current);
            while (d <= maxDate) {
                bottom.push({
                    label: d.getDate().toString(),
                    x: getX(d.toISOString()),
                    width: DAY_WIDTH,
                    isWeekend: d.getDay() === 0 || d.getDay() === 6
                });
                d.setDate(d.getDate() + 1);
            }
        }
        else if (viewMode === 'month') {
            // Top: Month, Bottom: Weeks
            let mStart = new Date(current);
            mStart.setDate(1); // Snap to 1st relative to minDate? 
            // Better: Iterate months covering minDate to maxDate
            let iterM = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

            while (iterM <= maxDate) {
                const mEnd = new Date(iterM.getFullYear(), iterM.getMonth() + 1, 0);
                // Clip start/end for drawing?
                // Simple approach: Draw full month, clip via overflow hidden
                top.push({
                    label: iterM.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
                    x: getX(iterM.toISOString()),
                    width: daySpan(iterM, new Date(iterM.getFullYear(), iterM.getMonth() + 1, 0)) * DAY_WIDTH + DAY_WIDTH // approx
                });
                iterM.setMonth(iterM.getMonth() + 1);
            }

            // Bottom: Weeks
            let wStart = new Date(minDate);
            wStart.setDate(wStart.getDate() - wStart.getDay() + 1); // Monday
            while (wStart <= maxDate) {
                bottom.push({
                    label: `Sem ${getWeekNumber(wStart)}`,
                    x: getX(wStart.toISOString()),
                    width: 7 * DAY_WIDTH
                });
                wStart.setDate(wStart.getDate() + 7);
            }
        }
        else if (viewMode === 'quarter') {
            // Top: Quarters, Bottom: Months
            let qStart = new Date(minDate.getFullYear(), Math.floor(minDate.getMonth() / 3) * 3, 1);

            while (qStart <= maxDate) {
                const qEnd = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0);
                const qNum = Math.floor(qStart.getMonth() / 3) + 1;
                top.push({
                    label: `Q${qNum} ${qStart.getFullYear()}`,
                    x: getX(qStart.toISOString()),
                    width: daySpan(qStart, qEnd) * DAY_WIDTH
                });
                qStart.setMonth(qStart.getMonth() + 3);
            }

            let mStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
            while (mStart <= maxDate) {
                const nextM = new Date(mStart.getFullYear(), mStart.getMonth() + 1, 1);
                bottom.push({
                    label: mStart.toLocaleDateString(undefined, { month: 'short' }),
                    x: getX(mStart.toISOString()),
                    width: daySpan(mStart, nextM) * DAY_WIDTH
                });
                mStart.setMonth(mStart.getMonth() + 1);
            }
        }

        return { topHeaders: top, bottomHeaders: bottom };
    }, [minDate, maxDate, DAY_WIDTH, viewMode]);

    function getWeekNumber(d: Date) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    return (
        <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xs font-bold text-gray-500 uppercase px-2">Cronograma Interactivo</h3>
                <div className="flex bg-white rounded-lg border border-gray-200 p-0.5">
                    <button
                        onClick={() => setViewMode('quarter')}
                        className={`text-xs px-3 py-1 rounded-md transition-all ${viewMode === 'quarter' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Vista Q
                    </button>
                    <button
                        onClick={() => setViewMode('month')}
                        className={`text-xs px-3 py-1 rounded-md transition-all ${viewMode === 'month' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Vista Mes
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`text-xs px-3 py-1 rounded-md transition-all ${viewMode === 'week' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Vista Semanal
                    </button>
                    <button
                        onClick={() => setViewMode('fit')}
                        className={`text-xs px-3 py-1 rounded-md transition-all ${viewMode === 'fit' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Ajustar
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden" ref={containerRef}>
                {/* Left Panel: Activity Names */}
                <div className="w-64 flex-shrink-0 border-r border-gray-200 overflow-y-hidden bg-white z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                    <div className="h-[50px] border-b border-gray-200 bg-gray-50 flex items-center px-4 font-bold text-xs text-gray-500 uppercase">
                        Actividad
                    </div>
                    <div className="overflow-hidden">
                        {flatActivities.map((act, idx) => (
                            <div
                                key={act.id}
                                className="border-b border-gray-50 flex items-center px-4 hover:bg-gray-50 transition-colors truncate"
                                style={{ height: ROW_HEIGHT, paddingLeft: `${(act.depth || 0) * 16 + 16}px` }}
                                title={act.name}
                            >
                                <span className={`text-sm truncate ${act.children?.length ? 'font-bold text-gray-800' : 'text-gray-700'}`}>
                                    {act.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Gantt Chart */}
                <div className="flex-1 overflow-auto relative custom-scrollbar">
                    <div style={{ width: TOTAL_WIDTH, height: flatActivities.length * ROW_HEIGHT + HEADER_HEIGHT }}>
                        {/* Header */}
                        <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 h-[50px]">
                            {/* Top Header Row */}
                            <div className="absolute top-0 left-0 w-full h-[25px] border-b border-gray-200/50 flex items-center overflow-hidden">
                                {topHeaders.map((h, i) => (
                                    <div key={i} className="absolute text-[10px] font-bold text-gray-600 px-2 truncate border-l border-gray-200 pl-1 whitespace-nowrap"
                                        style={{ left: Math.max(0, h.x), width: h.width }}>
                                        {h.label}
                                    </div>
                                ))}
                            </div>
                            {/* Bottom Header Row */}
                            <div className="absolute top-[25px] left-0 w-full h-[25px] flex items-center overflow-hidden">
                                {bottomHeaders.map((h, i) => (
                                    <div
                                        key={i}
                                        className={`absolute text-[9px] text-gray-400 text-center border-l border-gray-100 h-full flex items-center justify-center translate-y-[2px] ${h.isWeekend ? 'bg-gray-100/50' : ''}`}
                                        style={{ left: h.x, width: h.width }}
                                    >
                                        {h.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Grid Lines Grouped by Bottom Header Unit */}
                        <div className="absolute top-[50px] left-0 w-full h-full pointer-events-none">
                            {bottomHeaders.map((h, i) => (
                                <div
                                    key={i}
                                    className={`absolute top-0 bottom-0 border-l border-gray-50 ${h.isWeekend ? 'bg-gray-50/40' : ''}`}
                                    style={{ left: h.x, width: h.width }}
                                />
                            ))}
                        </div>

                        {/* Current Date Line */}
                        {(() => {
                            const now = new Date();
                            if (now >= minDate && now <= maxDate) {
                                const x = getX(now.toISOString());
                                return (
                                    <div
                                        className="absolute top-[50px] bottom-0 border-l-2 border-red-500 border-dashed z-30 pointer-events-none opacity-80"
                                        style={{ left: x }}
                                        title="Hoy"
                                    >
                                        <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500" />
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {/* Bars Layer */}
                        <div className="absolute top-[50px] left-0 w-full">
                            {flatActivities.map((act, idx) => {
                                const x = getX(act.startDate);
                                const w = getWidth(act.startDate, act.endDate);
                                const isParent = act.children && act.children.length > 0;
                                const percent = act.percent || 0;

                                // Color Logic
                                // Delayed: End Date passed AND percent < 100
                                const isDelayed = new Date(act.endDate) < new Date() && percent < 100;
                                const isNotStarted = percent === 0;

                                let barColor = 'bg-blue-500';
                                if (isParent) barColor = 'bg-gray-800';
                                else if (isNotStarted) barColor = 'bg-gray-900'; // Black per request
                                else if (isDelayed) barColor = 'bg-red-500'; // Red per request
                                else barColor = 'bg-green-500'; // On time (default for active)

                                return (
                                    <div
                                        key={act.id}
                                        className="absolute group"
                                        style={{
                                            top: idx * ROW_HEIGHT,
                                            left: 0,
                                            width: '100%',
                                            height: ROW_HEIGHT
                                        }}
                                    >
                                        {/* Row Line */}
                                        <div className="absolute bottom-0 w-full border-b border-gray-50 pointer-events-none" />

                                        {/* Row Hover Highlight */}
                                        <div className="absolute inset-0 hover:bg-blue-50/10 transition-colors pointer-events-none" />

                                        {/* Bar Container */}
                                        <div
                                            className={`absolute h-6 top-2 shadow-sm transition-all cursor-pointer hover:brightness-110 hover:shadow-md flex items-center overflow-visible
                                                ${barColor}
                                                ${isParent ? 'rounded-sm h-4 top-3' : 'rounded-md'}
                                            `}
                                            style={{
                                                left: x,
                                                width: w,
                                            }}
                                            title={`${act.name}: ${Math.round(percent)}%`}
                                        >
                                            {/* Label next to bar or inside if wide enough */}
                                            {!isParent && (
                                                <span className={`text-[10px] font-bold px-2 whitespace-nowrap ${w > 40 ? 'text-white' : 'absolute left-full text-gray-700 ml-1'}`}>
                                                    {percent}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
