import React from 'react';
import { RecordCard } from './RecordCard';
import type { FieldRecordPayload } from '../../../services/field-records';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface RecordListProps {
  records?: FieldRecordPayload[];
  isLoading: boolean;
  isError: boolean;
  onRecordClick?: (id: string) => void;
}

export const RecordList: React.FC<RecordListProps> = ({
  records,
  isLoading,
  isError,
  onRecordClick,
}) => {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm animate-pulse flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-6 w-24 bg-slate-200 rounded-lg"></div>
              <div className="h-5 w-16 bg-slate-100 rounded flex-shrink-0"></div>
            </div>
            <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
            <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">No pudimos cargar los registros</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          Verifica tu conexión a internet o intenta de nuevo más tarde. Estamos trabajando para
          solucionarlo.
        </p>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">¡Todo al día!</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          No hay registros pendientes con los filtros actuales.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 bg-slate-50/50">
      {records.map((record) => (
        <RecordCard key={record.id} record={record} onClick={onRecordClick} />
      ))}
    </div>
  );
};
