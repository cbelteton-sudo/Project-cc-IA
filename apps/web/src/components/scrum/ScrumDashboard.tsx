import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutList, Kanban, Calendar, PieChart, AlertTriangle } from 'lucide-react';
import { BacklogView } from './BacklogView';
import { SprintPlanning } from './SprintPlanning';
import { SprintBoard } from './SprintBoard';
import { ImpedimentTracker } from './ImpedimentTracker';
import { ScrumKPIs } from './ScrumKPIs';

interface ScrumDashboardProps {
    projectId: string;
}

export const ScrumDashboard = ({ projectId }: ScrumDashboardProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') as any || 'backlog';
    const [activeTab, setActiveTab] = useState<'backlog' | 'planning' | 'board' | 'impediments' | 'metrics'>(initialTab);

    // Sync state with URL
    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Sub-Navigation */}
            <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-gray-200">
                <button
                    onClick={() => handleTabChange('backlog')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'backlog' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <LayoutList size={16} />
                    Backlog
                </button>
                <button
                    onClick={() => handleTabChange('planning')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'planning' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <Calendar size={16} />
                    Planificación
                </button>
                <button
                    onClick={() => handleTabChange('board')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'board' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <Kanban size={16} />
                    Sprint Board
                </button>
                <div className="h-4 w-px bg-gray-300 mx-2"></div>
                <button
                    onClick={() => handleTabChange('impediments')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'impediments' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <AlertTriangle size={16} />
                    Impedimentos
                </button>
                <button
                    onClick={() => handleTabChange('metrics')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'metrics' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <PieChart size={16} />
                    Métricas
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden p-4">
                {activeTab === 'backlog' && <BacklogView projectId={projectId} />}
                {activeTab === 'planning' && <SprintPlanning projectId={projectId} onSprintStarted={() => handleTabChange('board')} />}
                {activeTab === 'board' && <SprintBoard projectId={projectId} />}
                {activeTab === 'impediments' && <ImpedimentTracker projectId={projectId} />}
                {activeTab === 'metrics' && <ScrumKPIs projectId={projectId} />}
            </div>
        </div>
    );
};
