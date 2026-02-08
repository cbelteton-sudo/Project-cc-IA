
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { usePMDashboard, useBlockActivity, useCommitActivity, useRequestUpdate } from '@/services/pm-dashboard';
import { RiskCard } from '@/components/pm/RiskCard';
import { BlockModal } from '@/components/pm/BlockModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PMDashboard = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const { data, isLoading, error } = usePMDashboard(projectId!);
    const blockMutation = useBlockActivity();
    const commitMutation = useCommitActivity();
    const requestUpdateMutation = useRequestUpdate();

    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
    const [commitDate, setCommitDate] = useState('');

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (error) return <div className="p-8 text-center text-red-500">Error al cargar dashboard o no autorizado.</div>;

    const handleAction = (item: any, action: 'BLOCK' | 'COMMIT' | 'REQUEST') => {
        setSelectedActivity(item);
        if (action === 'BLOCK') setIsBlockModalOpen(true);
        if (action === 'COMMIT') setIsCommitModalOpen(true);
        if (action === 'REQUEST') {
            requestUpdateMutation.mutate({ activityId: item.id });
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">PM Dashboard</h1>
                    <p className="text-slate-500">Gestión de Riesgos y Compromisos</p>
                </div>
            </header>

            {/* Risk Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <RiskCard
                    title="Estancadas (+3 días)"
                    count={data?.stalled?.length || 0}
                    type="stalled"
                    items={data?.stalled || []}
                    onItemClick={(item) => handleAction(item, 'REQUEST')}
                />
                <RiskCard
                    title="Bloqueadas"
                    count={data?.blocked?.length || 0}
                    type="blocked"
                    items={data?.blocked || []}
                    onItemClick={(item) => handleAction(item, 'COMMIT')} // Simplified for MVP
                />
                {/* Issues Card logic would go here, simplified to use existing items for now or mock */}
                <RiskCard
                    title="Alertas & Vencidos"
                    count={data?.issues?.overdue?.length || 0}
                    type="overdue"
                    items={data?.issues?.overdue || []}
                    onItemClick={(item) => console.log('Issue clicked', item)}
                />
            </div>

            {/* PPC / Top Contractors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-slate-200">
                <div>
                    <h3 className="font-semibold text-lg mb-4">Top Contratistas (Riesgo)</h3>
                    <div className="space-y-3">
                        {data?.topContractors?.map((c: any, i: number) => (
                            <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                                <span className="font-medium text-slate-700">{c.name}</span>
                                <div className="flex gap-3 text-sm">
                                    <span className="text-red-600 font-bold">{c.blocked} Bloqueos</span>
                                    <span className="text-orange-600 font-bold">{c.overdue} Vencidos</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-4">PPC Semanal (Lite)</h3>
                    <div className="h-40 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400">
                        Próximamente: Gráfica de Cumplimiento
                    </div>
                </div>
            </div>

            {/* Modals */}
            <BlockModal
                isOpen={isBlockModalOpen}
                onClose={() => setIsBlockModalOpen(false)}
                activityName={selectedActivity?.name}
                onConfirm={(data) => blockMutation.mutate({ ...data, activityId: selectedActivity.id })}
            />

            <Dialog open={isCommitModalOpen} onOpenChange={setIsCommitModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Definir Fecha Compromiso</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <Label>Nueva Fecha</Label>
                        <Input type="date" value={commitDate} onChange={e => setCommitDate(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button onClick={() => {
                            commitMutation.mutate({ activityId: selectedActivity.id, date: commitDate });
                            setIsCommitModalOpen(false);
                            setCommitDate('');
                        }}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PMDashboard;
