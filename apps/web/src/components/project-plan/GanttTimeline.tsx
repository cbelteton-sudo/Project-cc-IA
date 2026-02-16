import { useMemo, useRef } from 'react';
import { useGantt } from './GanttProvider';
import { differenceInDays, addDays, format, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';

export const GanttTimeline = () => {
  const {
    visibleActivities,
    startDate,
    endDate,
    viewMode,
    columnWidth,
    headerHeight,
    rowHeight,
    onSelectActivity,
  } = useGantt();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate Grid
  const totalDays = differenceInDays(endDate, startDate) + 1 + (viewMode === 'Week' ? 7 : 0); // Buffer for week view
  const totalWidth = totalDays * columnWidth; // Recalculated based on days for consistency

  const getX = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = differenceInDays(d, startDate);
    return diff * columnWidth;
  };

  const headers = useMemo(() => {
    const top: any[] = [];
    const bottom: any[] = [];

    // --- Bottom Headers (Days/Weeks) ---
    if (viewMode === 'Week' || viewMode === 'Month') {
      let current = startDate;
      // Iterate by week
      while (differenceInDays(endDate, current) >= 0) {
        bottom.push({
          label: `Sem ${format(current, 'w')}`,
          width: columnWidth * 7,
          left: getX(current.toISOString()),
          isWeekend: false,
          date: current,
        });
        current = addDays(current, 7);
      }
    } else {
      // Day View
      for (let i = 0; i < totalDays; i++) {
        const date = addDays(startDate, i);
        bottom.push({
          label: format(date, 'd'),
          width: columnWidth,
          left: i * columnWidth,
          isWeekend: isWeekend(date),
          date,
        });
      }
    }

    // --- Top Headers (Months) - Range Based ---
    let currentMonthStart = startDate;
    let currentMonthLabel = format(startDate, 'MMMM yyyy', { locale: es });

    // Iterate day by day to find month boundaries
    // We go up to totalDays to capture the last closing block
    for (let i = 0; i <= totalDays; i++) {
      const date = addDays(startDate, i);
      const label = format(date, 'MMMM yyyy', { locale: es });

      if (label !== currentMonthLabel || i === totalDays) {
        // Close previous block
        const widthDays = differenceInDays(date, currentMonthStart);
        if (widthDays > 0) {
          top.push({
            label: currentMonthLabel,
            left: getX(currentMonthStart.toISOString()),
            width: widthDays * columnWidth,
          });
        }
        // Start new block
        currentMonthLabel = label;
        currentMonthStart = date;
      }
    }

    return { top, bottom };
  }, [startDate, totalDays, columnWidth, viewMode, endDate]); // Added endDate dependency

  const getWidth = (startStr: string, endStr: string) => {
    const diff = differenceInDays(new Date(endStr), new Date(startStr));
    return Math.max(diff * columnWidth, columnWidth); // Min 1 unit
  };

  return (
    <div
      className="flex flex-col h-full overflow-auto custom-scrollbar relative"
      ref={scrollContainerRef}
    >
      <div
        style={{ width: totalWidth, height: visibleActivities.length * rowHeight + headerHeight }}
      >
        {/* Header Layer */}
        <div
          className="sticky top-0 z-30 bg-white border-b border-gray-200"
          style={{ height: headerHeight }}
        >
          {/* Top Row: Months */}
          <div className="h-1/2 border-b border-gray-100 flex relative overflow-hidden">
            {headers.top.map((h, i) => (
              <div
                key={i}
                className="absolute top-0 h-full flex items-center px-2 text-xs font-bold text-gray-500 border-l border-gray-100 whitespace-nowrap capitalize overflow-hidden"
                style={{ left: h.left, width: h.width }}
                title={h.label}
              >
                <span className="truncate w-full">{h.label}</span>
              </div>
            ))}
          </div>
          {/* Bottom Row: Days/Weeks */}
          <div className="h-1/2 flex relative">
            {headers.bottom.map((h, i) => (
              <div
                key={i}
                className={`absolute top-0 h-full flex items-center justify-center text-[10px] text-gray-400 border-l border-gray-50 
                                    ${h.isWeekend ? 'bg-gray-50' : ''} 
                                    ${viewMode === 'Week' ? 'border-l border-gray-200' : ''}
                                `}
                style={{ left: h.left, width: h.width }}
              >
                {viewMode === 'Month' ? '' : h.label}

                {/* Current Week Indicator (Red Line) - Only in Week View */}
                {viewMode === 'Week' &&
                  (() => {
                    const today = new Date();
                    const hEnd = addDays(h.date, 6);
                    if (today >= h.date && today <= hEnd) {
                      return <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-500" />;
                    }
                    return null;
                  })()}
              </div>
            ))}
          </div>
        </div>

        {/* Grid Body */}
        <div className="relative" style={{ height: visibleActivities.length * rowHeight }}>
          {/* Weekend Backgrounds (Hidden in Week View to reduce noise?) Or show subtly inside? */}
          <div className="absolute inset-0 z-0 flex pointer-events-none">
            {/* In Week View, we draw borders for Weeks, in Day View for Days */}
            {headers.bottom.map((h, i) => (
              <div
                key={i}
                className={`h-full border-r border-gray-50 
                                    ${h.isWeekend ? 'bg-gray-50/50' : ''}
                                    ${viewMode === 'Week' ? 'border-r-2 border-gray-100' : ''}
                                `}
                style={{ left: h.left, width: h.width, position: 'absolute' }}
              />
            ))}
          </div>

          {/* Today Vertical Line */}
          {(() => {
            const today = new Date();
            const diff = differenceInDays(today, startDate);
            // Ensure we are within range
            if (diff >= 0 && diff <= totalDays) {
              return (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-red-500 z-50 pointer-events-none"
                  style={{ left: diff * columnWidth }}
                >
                  {/* Optional: Label or Dot at top */}
                  <div className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-red-500" />
                </div>
              );
            }
            return null;
          })()}

          {/* Dependency Arrows Layer */}
          <svg
            className="absolute inset-0 pointer-events-none z-20"
            width={totalWidth}
            height={visibleActivities.length * rowHeight}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="4"
                refX="0"
                refY="2"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,4 L6,2 z" fill="#94a3b8" />
              </marker>
            </defs>

            {(() => {
              const idMap = new Map<string, number>();
              visibleActivities.forEach((a, i) => idMap.set(a.id, i));

              return visibleActivities.map((act, idx) =>
                act.dependencies?.map((dep: any) => {
                  const predIdx = idMap.get(dep.dependsOnId);
                  if (predIdx === undefined) return null; // Predecessor not visible

                  const pred = dep.dependsOn; // Uses the included relation from Prisma
                  // Careful: The 'pred' object from dependency include might be slightly different or stale if we manipulated 'activities' state?
                  // Ideally we look up 'pred' in 'activities' or 'visibleActivities' to get latest View dates if we had dragging.
                  // For now, read from 'dep.dependsOn' is safe for read-only.

                  // Coord calculations
                  const x1 = getX(pred.startDate) + getWidth(pred.startDate, pred.endDate);
                  const y1 = predIdx * rowHeight + rowHeight / 2;
                  const x2 = getX(act.startDate);
                  const y2 = idx * rowHeight + rowHeight / 2;

                  // Orthogonal Path
                  const midX = x1 + 10;
                  // If moving backwards in time (x2 < x1), we need nicer routing?
                  // Standard Orthogonal: Right -> Down/Up -> Right

                  let d = '';
                  if (x2 > x1 + 20) {
                    // Simple Case
                    d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
                  } else {
                    // Complex Case (Overlap or close)
                    // Go down first?
                    // Simple fallback
                    d = `M ${x1} ${y1} L ${x1 + 10} ${y1} L ${x1 + 10} ${y1 + (y2 > y1 ? 10 : -10)} L ${x2 - 10} ${y1 + (y2 > y1 ? 10 : -10)} L ${x2 - 10} ${y2} L ${x2} ${y2}`;
                  }

                  return (
                    <path
                      key={`${act.id}-${dep.dependsOnId}`}
                      d={d}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      markerEnd="url(#arrowhead)"
                      opacity={0.6}
                    />
                  );
                }),
              );
            })()}
          </svg>

          {/* Rows */}
          {visibleActivities.map((act, idx) => (
            <div
              key={act.id}
              className="absolute w-full border-b border-gray-50 hover:bg-blue-50/10 transition-colors"
              style={{
                top: idx * rowHeight,
                height: rowHeight,
                width: totalWidth,
              }}
            >
              {/* Item (Activity Bar or Milestone) */}
              {act.type === 'MILESTONE' ? (
                <div
                  className="absolute top-2 w-6 h-6 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                  style={{ left: getX(act.startDate) - 12 }} // Center on date
                  title={`${act.name} (${act.status})`}
                >
                  <div
                    className={`w-4 h-4 transform rotate-45 border-2 shadow-sm
                                            ${
                                              act.status === 'ACHIEVED'
                                                ? 'bg-green-500 border-green-600'
                                                : act.status === 'MISSED' ||
                                                    new Date(act.startDate) < new Date()
                                                  ? 'bg-red-500 border-red-600'
                                                  : 'bg-gray-200 border-gray-400'
                                            }
                                        `}
                  />
                </div>
              ) : (
                <div
                  onClick={() => onSelectActivity?.(act.id)}
                  className={`absolute top-2 h-6 rounded-md shadow-sm border border-white/20 overflow-hidden cursor-pointer hover:brightness-110
                                        ${act.hasChildren ? 'h-4 top-3 rounded-sm' : ''}
                                        ${(() => {
                                          const isOverdue =
                                            act.percent < 100 && new Date(act.endDate) < new Date();
                                          if (act.percent === 100)
                                            return 'bg-green-200 border-green-300';
                                          if (isOverdue) return 'bg-red-200 border-red-300';
                                          if (act.percent > 0) return 'bg-blue-200 border-blue-300';
                                          return 'bg-gray-100 border-gray-300';
                                        })()}
                                    `}
                  style={{
                    left: getX(act.startDate),
                    width: getWidth(act.startDate, act.endDate),
                  }}
                >
                  {/* Progress Fill (Solid Color) */}
                  <div
                    className={`h-full ${(() => {
                      const isOverdue = act.percent < 100 && new Date(act.endDate) < new Date();
                      if (act.percent === 100) return 'bg-green-500';
                      if (isOverdue) return 'bg-red-500';
                      if (act.percent > 0) return 'bg-blue-500';
                      return 'bg-gray-400';
                    })()}`}
                    style={{ width: `${act.percent}%` }}
                  />
                  {/* Text Removed as requested */}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
