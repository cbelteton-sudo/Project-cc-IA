import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Wrench,
  Loader2,
  Camera,
  Ticket,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCreateFieldRecordV2 } from '../hooks/useCreateFieldRecordV2';
import type { FieldRecordPayload } from '../../../services/field-records';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { compressImage } from '../../../lib/image-compression';
import type { CompressionResult } from '../../../lib/image-compression';

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
  id: 'ISSUE' | 'BLOCKER' | 'DAILY_ENTRY' | 'MATERIAL_REQUEST';
  backendType: FieldRecordPayload['type'];
  label: string;
  icon: LucideIcon;
  color: string;
}> = [
  {
    id: 'ISSUE',
    backendType: 'ISSUE',
    label: 'Problema',
    icon: AlertTriangle,
    color: 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100',
  },
  {
    id: 'BLOCKER',
    backendType: 'ISSUE',
    label: 'Bloqueo',
    icon: X,
    color: 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100',
  },
  {
    id: 'DAILY_ENTRY',
    backendType: 'DAILY_ENTRY',
    label: 'Bitácora',
    icon: FileText,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
  },
  {
    id: 'MATERIAL_REQUEST',
    backendType: 'MATERIAL_REQUEST',
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
  const [selectedType, setSelectedType] = useState<(typeof typeOptions)[number]['id']>('ISSUE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBacklogItem, setSelectedBacklogItem] = useState('');
  const [status, setStatus] = useState('ON_TRACK');

  // New features state
  const [photos, setPhotos] = useState<CompressionResult[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<string | null>(null);

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
        ['IN_SPRINT', 'IN_PROGRESS', 'READY', 'BACKLOG', 'PENDING_PLANNING'].includes(
          item.status,
        ) && item.type !== 'EPIC',
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
      const typeDef = typeOptions.find((t) => t.id === selectedType);

      if (!typeDef) return;

      const ticketId = `FC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const prefix = selectedType === 'BLOCKER' ? '[BLOQUEO] ' : '';
      const finalTitle = `${prefix}${title.trim()}`;

      const ticketDescription = `Ticket: ${ticketId}\n\n${description.trim()}`;

      await createRecord({
        projectId,
        type: typeDef.backendType,
        status: 'PENDING',
        content: {
          title: finalTitle,
          description: ticketDescription,
          activityId: selectedTask?.linkedWbsActivityId || undefined,
          status:
            selectedType === 'DAILY_ENTRY'
              ? status
              : selectedType === 'BLOCKER'
                ? 'BLOCKED'
                : undefined,
          // Attach photos in the format expected by ActivityLogTimeline / FieldEntryDetail
          photos: photos.map((p) => ({
            id: crypto.randomUUID(),
            urlMain: p.base64,
            urlThumb: p.base64,
          })),
        },
      });

      // Show success screen instead of closing immediately
      setCreatedTicket(ticketId);
    } catch {
      // Error is handled by the hook's toast
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsCompressing(true);
    try {
      const newPhotos: CompressionResult[] = [];
      for (const file of Array.from(e.target.files)) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file);
        newPhotos.push(compressed);
      }
      setPhotos((prev) => [...prev, ...newPhotos]);
    } catch (err) {
      console.error('Photo compression error', err);
    } finally {
      setIsCompressing(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleFullClose = () => {
    setTitle('');
    setDescription('');
    setSelectedType('ISSUE');
    setSelectedBacklogItem('');
    setStatus('ON_TRACK');
    setPhotos([]);
    setCreatedTicket(null);
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="w-full sm:max-w-md bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-4 py-3 sm:py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-900">Crear Rápido</h2>
          <button
            onClick={handleFullClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdTicket ? (
          <div className="p-8 flex flex-col items-center justify-center flex-1 text-center bg-slate-50">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Registro Creado</h3>
            <p className="text-slate-500 mb-6">Tu registro ha sido guardado exitosamente.</p>

            <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 flex items-center gap-3 mb-8 shadow-sm">
              <Ticket className="w-5 h-5 text-indigo-500" />
              <span className="text-lg font-mono font-bold text-slate-700">{createdTicket}</span>
            </div>

            <button
              onClick={handleFullClose}
              className="w-full px-4 py-3 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all active:scale-[0.98]"
            >
              Cerrar y Continuar
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-4 overflow-y-auto flex-1 flex flex-col gap-5 sm:gap-6 pb-8"
          >
            {/* Type Selection Grid */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Tipo de Registro
              </label>
              <div className="grid grid-cols-2 gap-2">
                {typeOptions.map((opt) => {
                  const isSelected = selectedType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedType(opt.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                        isSelected
                          ? `border-transparent ring-2 ring-offset-1 ring-slate-900 ${opt.color.split(' ')[0]} ${opt.color.split(' ')[1]}`
                          : `border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50`
                      }`}
                    >
                      <opt.icon className={`w-6 h-6 ${isSelected ? '' : 'text-slate-400'}`} />
                      <span
                        className={`font-semibold text-sm ${isSelected ? 'text-slate-900' : ''}`}
                      >
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

            {selectedType === 'DAILY_ENTRY' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Estado de este Registro
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm font-medium text-slate-900"
                >
                  <option value="ON_TRACK">En Curso / A Tiempo</option>
                  <option value="DONE">Completado</option>
                  <option value="BLOCKED">Bloqueado (Registrar Bloqueo)</option>
                </select>
              </div>
            )}

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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Evidencia (Fotos)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {photos.map((photo, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group"
                  >
                    <img
                      src={photo.previewUrl}
                      alt="Evidencia"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, index) => index !== i))}
                      className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <label
                  className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-slate-50 ${isCompressing ? 'border-indigo-300 bg-indigo-50 text-indigo-500' : 'border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-500'}`}
                >
                  {isCompressing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-current" />
                  )}
                  <span className="text-xs font-semibold text-center px-2 leading-tight">
                    {isCompressing ? 'Procesando...' : 'Añadir Foto'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    disabled={isCompressing}
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {photos.length > 0 && (
                <p className="text-xs text-slate-400 font-medium">
                  {photos.length} foto{photos.length !== 1 ? 's' : ''} adjunta
                  {photos.length !== 1 ? 's' : ''} (optimizadas para campo).
                </p>
              )}
            </div>

            <div className="mt-2 sm:mt-auto pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2 sticky bottom-0 bg-white z-10 sm:static pb-2 sm:pb-0">
              <button
                type="button"
                onClick={handleFullClose}
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
        )}
      </div>
    </div>
  );
};
