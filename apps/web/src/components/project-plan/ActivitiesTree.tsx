
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown, Flag, UserPlus, User } from 'lucide-react';


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
}

interface ActivitiesTreeProps {
    activities: Activity[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAssignContractor: (activityId: string) => void;
}

export const ActivitiesTree = ({ activities, selectedId, onSelect, onAssignContractor }: ActivitiesTreeProps) => {
    // Header
    // Header
    const { t } = useTranslation();
    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="flex items-center bg-gray-50 border-b border-gray-200 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="flex-1">{t('activities.table.name')}</div>
                <div className="w-32 text-center">Contratista</div>
                <div className="w-24 text-center">{t('activities.table.start')}</div>
                <div className="w-24 text-center">{t('activities.table.end')}</div>
                <div className="w-16 text-center">{t('activities.table.weight')}</div>
                <div className="w-16 text-center">{t('activities.table.progress')}</div>
                <div className="w-20 text-center">{t('activities.table.status')}</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto">
                {activities.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        No activities found. Add one to get started.
                    </div>
                ) : (
                    activities.map(root => (
                        <ActivityRow
                            key={root.id}
                            node={root}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onAssignContractor={onAssignContractor}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

const ActivityRow = ({ node, level = 0, selectedId, onSelect, onAssignContractor }: { node: Activity, level?: number, selectedId: string | null, onSelect: (id: string) => void, onAssignContractor: (id: string) => void }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    // Progress
    // Use cached cumulative percent if available, otherwise fallback (though schema now has it)
    // We cast to any because TS might not know about the new field yet in frontend types until we regen/update FE types
    const currentProgress = (node as any).percent ?? node.progressRecords?.[0]?.percent ?? 0;

    // Status Color
    // Status Color
    const { t } = useTranslation();
    const statusBadges: Record<string, string> = {
        'NOT_STARTED': 'bg-gray-100 text-gray-600',
        'IN_PROGRESS': 'bg-blue-100 text-blue-700',
        'BLOCKED': 'bg-red-100 text-red-700',
        'DONE': 'bg-green-100 text-green-700',
    };
    const badgeClass = statusBadges[node.status] || 'bg-gray-100 text-gray-600';

    return (
        <div className="select-none text-sm border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
            {/* Row Content */}
            <div
                className={`flex items-center px-4 py-2 cursor-pointer ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                onClick={() => onSelect(node.id)}
            >
                {/* Name Col */}
                <div className="flex-1 flex items-center gap-2 overflow-hidden" style={{ paddingLeft: `${level * 20}px` }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className={`p-1 rounded hover:bg-gray-200 text-gray-500 ${hasChildren ? 'visible' : 'invisible'}`}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <div className="flex flex-col truncate">
                        <span className="font-medium text-gray-800 truncate" title={node.name}>{node.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{node.code}</span>
                    </div>
                </div>

                {/* Contractor Col */}
                <div className="w-32 flex justify-center">
                    {node.contractor ? (
                        <div
                            className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs hover:bg-gray-200"
                            onClick={(e) => { e.stopPropagation(); onAssignContractor(node.id); }}
                            title="Click to reassign"
                        >
                            <User size={12} />
                            <span className="truncate max-w-[80px]">{node.contractor.name}</span>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAssignContractor(node.id); }}
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"
                            title="Asignar Contratista"
                        >
                            <UserPlus size={14} />
                        </button>
                    )}
                </div>

                {/* Date Cols */}
                <div className="w-24 text-center text-gray-600 text-xs">
                    {new Date(node.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
                <div className="w-24 text-center text-gray-600 text-xs">
                    {new Date(node.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>

                {/* Weight Col */}
                <div className="w-16 text-center text-gray-500 text-xs">
                    {node.plannedWeight?.toFixed(1) || '-'}
                </div>

                {/* Progress Col */}
                <div className="w-16 text-center">
                    <div className={`text-xs font-bold ${currentProgress === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                        {currentProgress}%
                    </div>
                </div>

                {/* Status Col */}
                <div className="w-20 flex justify-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
                        {t(`status.${node.status}`, node.status.replace('_', ' '))}
                    </span>
                </div>
            </div>

            {/* Children Recursion */}
            {isExpanded && (
                <div>
                    {/* Render Milestones First (if any) */}
                    {node.milestones?.map(milestone => (
                        <div key={`ms-${milestone.id}`} className="select-none text-sm border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors bg-purple-50/30">
                            <div className="flex items-center px-4 py-2 border-l-4 border-l-transparent pl-[calc(1rem+4px)]">
                                <div className="flex-1 flex items-center gap-2 overflow-hidden" style={{ paddingLeft: `${(level + 1) * 20}px` }}>
                                    <div className="p-1 text-purple-600">
                                        <Flag size={14} fill="currentColor" />
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <span className="font-bold text-purple-700 truncate">{milestone.name}</span>
                                        <span className="text-[10px] text-purple-400 font-mono">MILESTONE</span>
                                    </div>
                                </div>
                                <div className="w-24 text-center text-purple-600 text-xs font-medium">
                                    {new Date(milestone.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                                <div className="w-32 text-center text-gray-400 text-xs">-</div>
                                <div className="w-24 text-center text-gray-400 text-xs">-</div>
                                <div className="w-16 text-center text-gray-400 text-xs">-</div>
                                <div className="w-16 text-center text-gray-400 text-xs">-</div>
                                <div className="w-20 flex justify-center">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                                        {t(`status.${milestone.status}`, milestone.status) as string}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Render Children Activities */}
                    {node.children?.map(child => (
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
            )}
        </div>
    );
};
