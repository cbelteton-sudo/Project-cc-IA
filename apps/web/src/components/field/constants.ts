import { CheckCircle2, AlertTriangle, FileText, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const typeConfig: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  ISSUE: {
    label: 'Problema',
    icon: AlertTriangle,
    color: 'text-rose-600 bg-rose-50 border-rose-100',
  },
  INCIDENT: {
    label: 'Incidente',
    icon: AlertTriangle,
    color: 'text-orange-600 bg-orange-50 border-orange-100',
  },
  DAILY_ENTRY: {
    label: 'Bitácora',
    icon: FileText,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  },
  INSPECTION: {
    label: 'Inspección',
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  MATERIAL_REQUEST: {
    label: 'Materiales',
    icon: Wrench,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
};

export const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-slate-100 text-slate-700' },
  IN_PROGRESS: { label: 'En Proceso', color: 'bg-blue-50 text-blue-700 border border-blue-100' },
  RESOLVED: {
    label: 'Resuelto',
    color: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  },
  CLOSED: {
    label: 'Cerrada',
    color: 'bg-slate-50 text-slate-500 line-through decoration-slate-300',
  },
  Draft: {
    label: 'Borrador Guardado',
    color: 'bg-amber-100 text-amber-800 border border-amber-200 shadow-sm',
  },
};
