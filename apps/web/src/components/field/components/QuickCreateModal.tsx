import React, { useState } from 'react';
import { X, AlertTriangle, FileText, CheckCircle2, Wrench, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCreateFieldRecordV2 } from '../hooks/useCreateFieldRecordV2';
import type { FieldRecordPayload } from '../../../services/field-records';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projectId: string;
}

interface BacklogItem {
  id: string;
  title: string;
  status: string;
  type: string;
  assigneeUserId?: string;
  linkedWbsActivityId?: string;
}

const typeOptions: Array<{
  value: FieldRecordPayload['type'];
  label: string;
  icon: LucideIcon;
  color: string;
}> = [
  {
    value: 'ISSUE',
    label: 'Problema',
    icon: AlertTriangle,
    color: 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100',
  },
  {
    value: 'DAILY_ENTRY',
    label: 'Bitácora',
    icon: FileText,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
  },
  {
    value: 'INSPECTION',
    label: 'Inspección',
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  },
  {
    value: 'MATERIAL_REQUEST',
    label: 'Material',
    icon: Wrench,
    color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100',
  },
];

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
}) => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<FieldRecordPayload['type']>('ISSUE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBacklogItem, setSelectedBacklogItem] = useState('');

  const { data: backlogItems } = useQuery({
    queryKey: ['scrum', 'backlog', projectId],
    queryFn: async () => {
      const res = await api.get(`/scrum/backlog/${projectId}`);
      return res.data;
    },
    enabled: isOpen && !!projectId,
  });

  const activeUserTasks = React.useMemo(() => {
    if (!backlogItems) return [];
    const tasks = (backlogItems as BacklogItem[]).filter(
      (item) =>
        ['IN_SPRINT', 'IN_PROGRESS', 'READY', 'BACKLOG'].includes(item.status) &&
        item.type !== 'EPIC',
    );
    const assignedTasks = tasks.filter((t) => t.assigneeUserId === user?.userId);
    return assignedTasks.length > 0 ? assignedTasks : tasks;
  }, [backlogItems, user?.userId]);

  const { mutateAsync: createRecord, isPending } = useCreateFieldRecordV2();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    try {
      const selectedTask = activeUserTasks?.find((t) => t.id === selectedBacklogItem);

      await createRecord({
        projectId,
        type: selectedType,
        status: 'PENDING',
        content: {
          title: title.trim(),
          description: description.trim(),
          activityId: selectedTask?.linkedWbsActivityId || undefined,
        },
      });

      // Reset and close
      setTitle('');
      setDescription('');
      setSelectedType('ISSUE');
      setSelectedBacklogItem('');
      onSuccess?.();
      onClose();
    } catch {
      // Error is handled by the hook's toast
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Crear Rápido</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Type Selection Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Tipo de Registro
            </label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((opt) => {
                const isSelected = selectedType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedType(opt.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? `border-transparent ring-2 ring-offset-1 ring-slate-900 ${opt.color.split(' ')[0]} ${opt.color.split(' ')[1]}`
                        : `border-slate-200 bg-white text-slate-600 hover:border-slate-300`
                    }`}
                  >
                    <opt.icon className={`w-5 h-5 ${isSelected ? '' : 'text-slate-400'}`} />
                    <span className={`font-semibold text-sm ${isSelected ? 'text-slate-900' : ''}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
            >
              Título
            </label>
            <input
              id="title"
              type="text"
              required
              autoFocus
              placeholder="Ej: Fuga de agua en Nivel 2..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-medium text-slate-900 placeholder:text-slate-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Tarea Asociada
            </label>
            <select
              value={selectedBacklogItem}
              onChange={(e) => setSelectedBacklogItem(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm font-medium text-slate-900"
            >
              <option value="">Seleccione una tarea (Opcional)</option>
              {activeUserTasks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
            >
              Detalles (Opcional)
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Agrega notas adicionales o descripción del problema..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm text-slate-900 placeholder:text-slate-400 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mt-2 sm:mt-4 pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 sm:py-2.5 font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? 'Guardando...' : 'Crear Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
