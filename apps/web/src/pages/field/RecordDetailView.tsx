import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle2,
  Camera,
  Check,
  X as XIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canApprove } from '../../components/field/utils/rbacHelpers';
import { useFieldRecordV2 } from '../../components/field/hooks/useFieldRecordV2';
import { format } from 'date-fns';
import { typeConfig, statusConfig } from '../../components/field/constants';

export default function RecordDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { data: record, isLoading, isError } = useFieldRecordV2(id || '', projectId || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-4 sm:p-6 gap-6 pt-24 max-w-3xl mx-auto w-full">
        {/* Header Skeleton */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="h-6 w-24 bg-slate-200 rounded-md"></div>
            <div className="h-4 w-32 bg-slate-100 rounded-md"></div>
          </div>
          <div className="h-8 w-3/4 bg-slate-200 rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 rounded"></div>
            <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
            <div className="h-4 w-4/6 bg-slate-100 rounded"></div>
          </div>
        </div>
        {/* Photo Gallery Skeleton */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse">
          <div className="h-6 w-40 bg-slate-200 rounded-md mb-4"></div>
          <div className="flex gap-3 overflow-hidden">
            <div className="shrink-0 w-24 h-24 rounded-xl bg-slate-100 border border-slate-200"></div>
            <div className="shrink-0 w-24 h-24 rounded-xl bg-slate-50 border border-slate-100"></div>
            <div className="shrink-0 w-24 h-24 rounded-xl bg-slate-50 border border-slate-100"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 min-h-screen bg-slate-50">
        <AlertCircle className="w-12 h-12 mb-4 text-rose-300" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Registro no encontrado</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors"
        >
          Volver
        </button>
      </div>
    );
  }

  const config = typeConfig[record.type] || {
    label: 'Registro',
    icon: FileText,
    color: 'text-slate-600 bg-slate-50 border-slate-100',
  };

  const status = statusConfig[record.status] || {
    label: record.status,
    color: 'bg-slate-100 text-slate-600',
  };

  const Icon = config.icon;
  const isApprover = canApprove(user);

  const recordTitle = (record.content?.title as string) || config.label;
  const recordDesc = record.content?.description as string;
  const createdAt = record.createdAt
    ? format(new Date(record.createdAt), 'dd MMM yyyy, HH:mm')
    : 'N/A';

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-6">
      {/* Mobile-optimized Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${config.color}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <h1 className="text-sm font-bold truncate text-slate-900 leading-tight">
              {recordTitle}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Dynamic Header Section */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${status.color}`}
            >
              {status.label}
            </span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">{createdAt}</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-3 leading-snug">{recordTitle}</h2>

          {recordDesc ? (
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
              {recordDesc}
            </p>
          ) : (
            <p className="text-slate-400 italic text-sm">Sin detalles adicionales.</p>
          )}
        </section>

        {/* Photo Gallery Section - Dummy for now */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-400" />
              Evidencias (0)
            </h3>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">
              Agregar
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {/* Empty state photo uploader */}
            <button className="shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-1 transition-colors text-slate-400 hover:text-blue-500">
              <Camera className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase">Subir</span>
            </button>
            <div className="shrink-0 w-24 h-24 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
              {/* placeholder */}
            </div>
          </div>
        </section>

        {/* Fixed Action Bar at Bottom (Mobile specific) */}
        {record.status !== 'CLOSED' && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-xl md:relative md:bg-transparent md:border-t-0 md:p-0 md:shadow-none z-40">
            <div className="flex gap-3 max-w-3xl mx-auto">
              {!isApprover ? (
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                  <CheckCircle2 className="w-5 h-5" />
                  Marcar Completado
                </button>
              ) : (
                <>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 font-bold rounded-xl transition-colors">
                    <XIcon className="w-5 h-5" />
                    Rechazar
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors">
                    <Check className="w-5 h-5" />
                    Aprobar Cierre
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
