import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { changeOrdersService, type CreateChangeOrderDto } from '../services/change-orders';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Plus, ArrowLeft, FileText, CheckCircle, XCircle, AlertCircle,
    Search, Filter, DollarSign, Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

export const ChangeOrders = () => {
    const { id: projectId } = useParams();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => (await axios.get(`${API_URL}/projects/${projectId}`)).data
    });

    const { data: budgetData } = useQuery({
        queryKey: ['budget-summary', project?.budgets?.[0]?.id],
        queryFn: async () => (await axios.get(`${API_URL}/budgets/${project?.budgets?.[0]?.id}/summary`)).data,
        enabled: !!project?.budgets?.[0]?.id
    });

    const { data: changeOrders, isLoading } = useQuery({
        queryKey: ['change-orders', projectId],
        queryFn: changeOrdersService.getAll
    });

    const createMutation = useMutation({
        mutationFn: changeOrdersService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['change-orders', projectId] });
            setIsCreateOpen(false);
            toast.success('Orden de Cambio creada');
        },
        onError: () => toast.error('Error al crear Orden de Cambio')
    });

    const approveMutation = useMutation({
        mutationFn: changeOrdersService.approve,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['change-orders', projectId] });
            queryClient.invalidateQueries({ queryKey: ['budget-summary'] }); // Refresh budget
            toast.success('Orden de Cambio aprobada');
        },
        onError: () => toast.error('Error al aprobar Orden de Cambio')
    });

    // Form State
    const [formData, setFormData] = useState<Partial<CreateChangeOrderDto>>({
        title: '',
        description: '',
        items: []
    });

    const [newItem, setNewItem] = useState({
        budgetLineId: '',
        description: '',
        amount: 0
    });

    const handleAddItem = () => {
        if (!newItem.budgetLineId || !newItem.amount) return;
        setFormData(prev => ({
            ...prev,
            items: [...(prev.items || []), { ...newItem }]
        }));
        setNewItem({ budgetLineId: '', description: '', amount: 0 });
    };

    const handleCreate = () => {
        if (!formData.title || !formData.items?.length) return;
        createMutation.mutate({
            projectId: projectId!,
            title: formData.title!,
            description: formData.description,
            items: formData.items!
        });
    };

    const filteredCOs = changeOrders?.filter(co =>
        co.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        co.items.some(i => i.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const currency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: project?.currency || 'USD' }).format(amount);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to={`/projects/${projectId}`} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Órdenes de Cambio</h1>
                        <p className="text-sm text-gray-500">Gestión de variaciones al presupuesto original</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition shadow-sm"
                >
                    <Plus size={18} /> Nueva Orden
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar órdenes de cambio..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Cargando...</div>
                ) : filteredCOs?.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <FileText size={48} className="text-gray-200 mb-4" />
                        <p className="text-lg font-medium text-gray-900">No hay órdenes de cambio</p>
                        <p className="text-sm">Crea una nueva orden para registrar variaciones.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredCOs?.map((co) => (
                            <div key={co.id} className="p-6 hover:bg-gray-50 transition border-l-4 border-transparent hover:border-blue-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-gray-800">{co.title}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${co.status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' :
                                                co.status === 'DRAFT' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                }`}>
                                                {co.status === 'APPROVED' ? 'Aprobada' :
                                                    co.status === 'DRAFT' ? 'Borrador' : co.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {format(new Date(co.createdAt), 'dd MMM yyyy')}
                                            </span>
                                            <span>•</span>
                                            <span>{co.items.length} partidas afectadas</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-gray-900">{currency(co.amount)}</div>
                                        {co.status === 'DRAFT' && (
                                            <button
                                                onClick={() => approveMutation.mutate(co.id)}
                                                disabled={approveMutation.isPending}
                                                className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 ml-auto"
                                            >
                                                {approveMutation.isPending ? 'Procesando...' : (
                                                    <>
                                                        <CheckCircle size={14} /> Aprobar e Impactar Presupuesto
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Items Preview */}
                                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                    {co.items.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-gray-700 break-all">{item.description}</span>
                                            <span className={`font-mono font-medium ${item.amount >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
                                                {currency(item.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">Nueva Orden de Cambio</h2>
                            <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Header Info */}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ej: Ampliación de Cimentación"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <hr />

                            {/* Item Builder */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <DollarSign size={18} className="text-blue-500" />
                                    Partidas Afectadas
                                </h3>

                                <div className="bg-blue-50 p-4 rounded-lg flex flex-col gap-3 mb-4 border border-blue-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <select
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newItem.budgetLineId}
                                            onChange={e => setNewItem({ ...newItem, budgetLineId: e.target.value })}
                                        >
                                            <option value="">Seleccionar Partida...</option>
                                            {budgetData?.budgetLines?.map((line: any) => (
                                                <option key={line.id} value={line.id}>
                                                    {line.code} - {line.name} ({line.costType})
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            placeholder="Monto (+ Aumento / - Disminución)"
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newItem.amount || ''}
                                            onChange={e => setNewItem({ ...newItem, amount: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Descripción del cambio específico..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newItem.description}
                                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                    />
                                    <button
                                        onClick={handleAddItem}
                                        disabled={!newItem.budgetLineId || !newItem.amount}
                                        className="self-end px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                                    >
                                        Agregar Partida
                                    </button>
                                </div>

                                {/* Items List */}
                                <div className="space-y-2">
                                    {formData.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div>
                                                <div className="font-medium text-sm text-gray-900">
                                                    {budgetData?.budgetLines?.find((l: any) => l.id === item.budgetLineId)?.name || 'Partida Desconocida'}
                                                </div>
                                                <div className="text-xs text-gray-500">{item.description}</div>
                                            </div>
                                            <div className="font-mono font-bold text-gray-800">
                                                {currency(item.amount)}
                                            </div>
                                        </div>
                                    ))}
                                    {(!formData.items || formData.items.length === 0) && (
                                        <div className="text-center text-gray-400 py-4 text-sm italic">
                                            No has agregado partidas aún
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <div className="text-lg">
                                    Total: <span className="font-bold">{currency(formData.items?.reduce((s, i) => s + i.amount, 0) || 0)}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsCreateOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        disabled={createMutation.isPending || !formData.items?.length}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg shadow-green-200 disabled:opacity-50 transition"
                                    >
                                        {createMutation.isPending ? 'Guardando...' : 'Crear Orden'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
