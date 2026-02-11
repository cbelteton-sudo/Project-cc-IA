import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface BudgetLine {
    id: string;
    code: string;
    name: string;
    costType: string;
    budgetBase: number;
    budgetCO: number;
    budgetTransfer: number;
    amountCommitted: number;
    amountExecuted: number;
    variance: number;
    wbsActivity?: { name: string; code: string };
    wbsActivityId?: string;
}

interface BudgetGridProps {
    budgetId: string;
    projectId: string; // For fetching WBS if needed
    currency?: string;
}

export const BudgetGrid = ({ budgetId, projectId, currency = 'USD' }: BudgetGridProps) => {
    const queryClient = useQueryClient();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);

    const { data: budgetData, isLoading } = useQuery({
        queryKey: ['budget-summary', budgetId],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/budgets/${budgetId}/summary`);
            return res.data;
        }
    });

    const createLineMutation = useMutation({
        mutationFn: async (data: any) => {
            return axios.post(`${API_URL}/budgets/${budgetId}/lines`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget-summary', budgetId] });
            setIsAddModalOpen(false);
            toast.success('Línea de presupuesto creada');
        },
        onError: (err: any) => {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error al crear línea');
        }
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-GT', { style: 'currency', currency }).format(amount || 0);


    const deleteLineMutation = useMutation({
        mutationFn: async (id: string) => {
            return axios.delete(`${API_URL}/budgets/lines/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget-summary', budgetId] });
            toast.success('Línea eliminada');
        },
        onError: () => toast.error('Error al eliminar línea')
    });

    const updateLineMutation = useMutation({
        mutationFn: async (data: { id: string; d: any }) => {
            return axios.patch(`${API_URL}/budgets/lines/${data.id}`, data.d);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget-summary', budgetId] });
            setIsAddModalOpen(false); // Reusing modal for edit? Or separate?
            setEditingLine(null);
            toast.success('Línea actualizada');
        },
        onError: () => toast.error('Error al actualizar línea')
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            code: formData.get('code'),
            costType: formData.get('costType'),
            budgetBase: Number(formData.get('budgetBase')),
            wbsActivityId: formData.get('wbsActivityId') || undefined
        };

        if (editingLine) {
            updateLineMutation.mutate({ id: editingLine.id, d: data });
        } else {
            createLineMutation.mutate(data);
        }
    };

    const openForEdit = (line: BudgetLine) => {
        setEditingLine(line);
        setIsAddModalOpen(true);
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar "${name}"?`)) {
            deleteLineMutation.mutate(id);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando matriz...</div>;

    const lines = budgetData?.budgetLines || [];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-800">Matriz de Control Presupuestario</h3>
                <button
                    onClick={() => { setEditingLine(null); setIsAddModalOpen(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                >
                    <Plus size={16} /> Agregar Cuenta
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3 text-left">Código</th>
                            <th className="px-6 py-3 text-left">Concepto (Cuenta de Control)</th>
                            <th className="px-6 py-3 text-left">Tipo</th>
                            <th className="px-6 py-3 text-right bg-blue-50/50">Presupuesto Base</th>
                            <th className="px-6 py-3 text-right">Traslados/OC</th>
                            <th className="px-6 py-3 text-right font-bold bg-gray-100/50">Presupuesto Actual</th>
                            <th className="px-6 py-3 text-right text-purple-700">Comprometido</th>
                            <th className="px-6 py-3 text-right text-green-700">Ejecutado (Real)</th>
                            <th className="px-6 py-3 text-right">Variación</th>
                            <th className="px-6 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {lines.map((line: BudgetLine) => {
                            const currentBudget = (line.budgetBase || 0) + (line.budgetCO || 0) + (line.budgetTransfer || 0);
                            const variance = currentBudget - (line.amountCommitted + line.amountExecuted);
                            return (
                                <tr key={line.id} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{line.code || '-'}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900">
                                        {line.wbsActivity ? (
                                            <div className="flex flex-col">
                                                <span>{line.wbsActivity.name}</span>
                                                <span className="text-[10px] text-gray-400">{line.name !== line.wbsActivity.name ? line.name : ''}</span>
                                            </div>
                                        ) : line.name}
                                    </td>
                                    <td className="px-6 py-3 text-xs bg-gray-50/50">
                                        <span className="px-2 py-0.5 rounded text-gray-600 bg-white border border-gray-200">
                                            {line.costType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-medium">{formatCurrency(line.budgetBase)}</td>
                                    <td className="px-6 py-3 text-right text-gray-500">{formatCurrency(line.budgetCO + line.budgetTransfer)}</td>
                                    <td className="px-6 py-3 text-right font-bold bg-gray-50/30">{formatCurrency(currentBudget)}</td>
                                    <td className="px-6 py-3 text-right text-purple-700">{formatCurrency(line.amountCommitted)}</td>
                                    <td className="px-6 py-3 text-right text-green-700">{formatCurrency(line.amountExecuted)}</td>
                                    <td className={`px-6 py-3 text-right font-bold ${variance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {formatCurrency(variance)}
                                    </td>
                                    <td className="px-6 py-3 flex justify-center gap-2">
                                        <button onClick={() => openForEdit(line)} className="p-1 hover:bg-gray-200 rounded text-blue-600"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(line.id, line.name)} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                        <tr>
                            <td colSpan={3} className="px-6 py-3 text-right">TOTALES</td>
                            <td className="px-6 py-3 text-right">{formatCurrency(lines.reduce((s: number, l: any) => s + l.budgetBase, 0))}</td>
                            <td className="px-6 py-3 text-right">-</td>
                            <td className="px-6 py-3 text-right">{formatCurrency(lines.reduce((s: number, l: any) => s + (l.budgetBase + l.budgetCO + l.budgetTransfer), 0))}</td>
                            <td className="px-6 py-3 text-right text-purple-700">{formatCurrency(lines.reduce((s: number, l: any) => s + l.amountCommitted, 0))}</td>
                            <td className="px-6 py-3 text-right text-green-700">{formatCurrency(lines.reduce((s: number, l: any) => s + l.amountExecuted, 0))}</td>
                            <td className="px-6 py-3 text-right">{formatCurrency(lines.reduce((s: number, l: any) => s + ((l.budgetBase + l.budgetCO + l.budgetTransfer) - (l.amountCommitted + l.amountExecuted)), 0))}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">{editingLine ? 'Editar Línea' : 'Nueva Línea de Presupuesto'}</h3>
                            <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto / Nombre</label>
                                <input name="name" required defaultValue={editingLine?.name} className="w-full border border-gray-300 rounded-lg p-2" placeholder="Ej. Concreto Cimentación" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Código (Opcional)</label>
                                    <input name="code" defaultValue={editingLine?.code} className="w-full border border-gray-300 rounded-lg p-2" placeholder="01.01" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Costo</label>
                                    <select name="costType" defaultValue={editingLine?.costType} className="w-full border border-gray-300 rounded-lg p-2">
                                        <option value="MATERIAL">Material</option>
                                        <option value="LABOR">Mano de Obra</option>
                                        <option value="SUB">Subcontrato</option>
                                        <option value="EQUIPMENT">Equipos</option>
                                        <option value="OVERHEAD">Indirectos</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto Base</label>
                                <input name="budgetBase" type="number" step="0.01" required defaultValue={editingLine?.budgetBase} className="w-full border border-gray-300 rounded-lg p-2" placeholder="0.00" />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    {editingLine ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
