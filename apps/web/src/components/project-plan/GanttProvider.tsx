import { createContext, useContext, useMemo, useState } from 'react';
import type { Activity } from './ActivitiesTree';
import {
  addDays,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface GanttContextType {
  activities: any[];
  visibleActivities: any[];
  startDate: Date;
  endDate: Date;
  viewMode: 'Day' | 'Week' | 'Month';
  setViewMode: (mode: 'Day' | 'Week' | 'Month') => void;
  columnWidth: number;
  headerHeight: number;
  rowHeight: number;
  zoom: number;
  setZoom: (zoom: number) => void;
  toggleExpand: (id: string) => void;
  expanded: Set<string>;
  filterOwner: string | null;
  setFilterOwner: (owner: string | null) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
  onSelectActivity?: (id: string) => void;
}

const GanttContext = createContext<GanttContextType | undefined>(undefined);

export const useGantt = () => {
  const context = useContext(GanttContext);
  if (!context) throw new Error('useGantt must be used within a GanttProvider');
  return context;
};

interface GanttProviderProps {
  children: React.ReactNode;
  activities: Activity[];
  milestones?: any[];
  onSelectActivity?: (id: string) => void;
}

export const GanttProvider = ({
  children,
  activities,
  milestones,
  onSelectActivity,
}: GanttProviderProps) => {
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Day');
  const [zoom, setZoom] = useState(1); // 1 = Normal, 0.5 = Zoom Out
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filterOwner, setFilterOwner] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const isValidDate = (d: Date) => d instanceof Date && !isNaN(d.getTime());

  // Initial Expansion (Expand all by default or first level)
  useMemo(() => {
    const ids = new Set<string>();
    const traverse = (nodes: any[]) => {
      nodes.forEach((node) => {
        ids.add(node.id);
        if (node.children) traverse(node.children);
      });
    };
    traverse(activities);
    setExpanded(ids);
  }, [activities.length]); // Only re-calc on load

  const toggleExpand = (id: string) => {
    const newSet = new Set(expanded);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpanded(newSet);
  };

  // Calculate Global Range
  const { startDate, endDate } = useMemo(() => {
    if (!activities.length) return { startDate: new Date(), endDate: new Date() };

    // Initialize with extreme values to ensure we capture the actual activity range
    // instead of defaulting to Today if activities are in the future.
    let min = new Date(8640000000000000); // Max Date
    let max = new Date(-8640000000000000); // Min Date

    const traverse = (nodes: any[]) => {
      nodes.forEach((node) => {
        const start = new Date(node.startDate);
        const end = new Date(node.endDate);
        if (isValidDate(start)) {
          if (start < min) min = start;
        }
        if (isValidDate(end)) {
          if (end > max) max = end;
        }
        if (node.children) traverse(node.children);
      });
    };
    traverse(activities);

    // Fallback if no valid dates found (shouldn't happen if activities.length > 0 but safe)
    if (min.getTime() === 8640000000000000) min = new Date();
    if (max.getTime() === -8640000000000000) max = new Date();

    // Include Milestones in Range
    if (milestones && milestones.length > 0) {
      milestones.forEach((m: any) => {
        const mDate = new Date(m.date);
        if (isValidDate(mDate)) {
          if (mDate < min) min = mDate;
          if (mDate > max) max = mDate;
        }
      });
    }

    // Include Today in the range only if needed?
    // User requesting to hide empty past weeks.
    // So we REMOVE the forced "Include Today" logic.
    // const today = new Date();
    // if (today < min) min = today;
    // if (today > max) max = today;

    // Add padding
    // Reduced start padding from -7 to -1 (or 0) to avoid showing previous month unnecessarily
    // Keep end padding for adding new tasks
    return {
      startDate: startOfWeek(min), // Was addDays(min, -7)
      endDate: endOfWeek(addDays(max, 14)),
    };
  }, [activities, milestones]);

  // Flatten visible activities for rendering
  const visibleActivities = useMemo(() => {
    // Group Milestones by Activity ID
    const milestonesByParent: Record<string, any[]> = {};
    if (milestones) {
      milestones.forEach((m) => {
        const pid = m.activityId || 'root';
        if (!milestonesByParent[pid]) milestonesByParent[pid] = [];
        milestonesByParent[pid].push(m);
      });
    }

    // Recursive Filter Check
    const matchesFilter = (node: any): boolean => {
      // Check self
      let selfMatch = true;
      if (filterOwner && node.contractorId !== filterOwner) selfMatch = false; // Changed responsibleId to contractorId
      if (filterStatus) {
        if (filterStatus === 'DELAYED') {
          const isDelayed =
            new Date(node.endDate) < new Date() &&
            node.status !== 'DONE' &&
            node.status !== 'CLOSED';
          if (!isDelayed) selfMatch = false;
        } else if (node.status !== filterStatus) {
          selfMatch = false;
        }
      }

      if (selfMatch) return true;

      // Check children
      if (node.children && node.children.length > 0) {
        if (node.children.some((child: any) => matchesFilter(child))) return true;
      }

      // Check milestones (optional: if we want milestones to trigger parent visibility)
      // For now, let's say NO, milestones don't force parent visibility unless parent itself matches or sibling activity matches.
      // Actually, if a milestone matches filter, parent should probably show?
      // Milestones don't usually have "owner", but might have status.
      // Let's keep it simple: Activity Filters drive visibility.

      return false;
    };

    const flatten = (nodes: any[], depth = 0): any[] => {
      return nodes.reduce((acc, node) => {
        const isMatch = matchesFilter(node);
        const nodeMilestones = milestonesByParent[node.id] || [];
        const hasChildren = !!node.children?.length || nodeMilestones.length > 0;

        // If it's a match OR a descendant matches (which matchesFilter checks for children), strictly speaking matchesFilter returns true if SELF or CHILDREN match.
        // But we need to distinguish:
        // 1. Show fully (Self match)
        // 2. Show dimmed (Only child match) - Not implementing dimming yet, just visibility.

        if (isMatch) {
          acc.push({ ...node, depth, hasChildren });

          if (expanded.has(node.id)) {
            if (node.children) {
              acc.push(...flatten(node.children, depth + 1));
            }
            // Append Milestones for this node
            if (nodeMilestones.length > 0) {
              // Sort milestones by date
              const sortedMs = [...nodeMilestones].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
              );
              sortedMs.forEach((m) => {
                // Define standard milestone matching?
                // For now milestones always show if parent is expanded
                acc.push({
                  id: m.id,
                  name: m.name,
                  startDate: m.date,
                  endDate: m.date,
                  percent: m.status === 'ACHIEVED' ? 100 : 0,
                  status: m.status,
                  depth: depth + 1, // Indented under parent
                  hasChildren: false,
                  type: 'MILESTONE',
                });
              });
            }
          }
        }
        return acc;
      }, []);
    };

    const list = flatten(activities);

    // Append Root Milestones (if any)
    const rootMilestones = milestonesByParent['root'];
    if (rootMilestones && rootMilestones.length > 0) {
      // Root milestones visible always? Or apply logic?
      // Let's show them always for now as they are top level
      const sortedMs = [...rootMilestones].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      sortedMs.forEach((m) => {
        list.push({
          id: m.id,
          name: m.name,
          startDate: m.date,
          endDate: m.date,
          percent: m.status === 'ACHIEVED' ? 100 : 0,
          status: m.status,
          depth: 0,
          hasChildren: false,
          type: 'MILESTONE',
        });
      });
    }

    return list;
  }, [activities, milestones, expanded, filterOwner, filterStatus]);

  const columnWidth = viewMode === 'Day' ? 40 * zoom : viewMode === 'Week' ? 30 * zoom : 20 * zoom;
  const headerHeight = 50;
  const rowHeight = 40;

  return (
    <GanttContext.Provider
      value={{
        activities,
        visibleActivities,
        startDate,
        endDate,
        viewMode,
        setViewMode,
        columnWidth,
        headerHeight,
        rowHeight,
        zoom,
        setZoom,
        toggleExpand,
        expanded,
        filterOwner,
        setFilterOwner,
        filterStatus,
        setFilterStatus,
        onSelectActivity,
      }}
    >
      {children}
    </GanttContext.Provider>
  );
};
