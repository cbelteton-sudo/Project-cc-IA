import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, Plus, FileText, ArrowLeft, Download } from 'lucide-react';
import { usePunchList } from '../../hooks/usePunchList';
import { PunchKanban } from '../../components/punch-list/PunchKanban';
import { PunchQuickCreate } from '../../components/punch-list/PunchQuickCreate';

export const PunchListPro: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
    const [showCreate, setShowCreate] = useState(false);

    if (!projectId) return null;

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg text-gray-900 leading-tight">Punch List Pro</h1>
                        <p className="text-xs text-gray-500 font-medium">Gestión de Cierre y Calidad</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm active:scale-95"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Nuevo Punch</span>
                        <span className="sm:hidden">Nuevo</span>
                    </button>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('KANBAN')}
                            className={`p-1.5 rounded-md transition ${viewMode === 'KANBAN' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('LIST')}
                            className={`p-1.5 rounded-md transition ${viewMode === 'LIST' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>

                    <button className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition">
                        <Download size={16} />
                        PDF
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-hidden relative">
                {viewMode === 'KANBAN' ? (
                    <PunchKanban projectId={projectId} />
                ) : (
                    <div className="p-10 text-center text-gray-400">
                        <List size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Vista de lista en desarrollo</p>
                    </div>
                )}
            </main>

            {/* Create Modal */}
            {showCreate && (
                <PunchQuickCreate
                    projectId={projectId}
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => {
                        // Optimistic update handled in hook, but could refresh here
                    }}
                />
            )}
        </div>
    );
};
