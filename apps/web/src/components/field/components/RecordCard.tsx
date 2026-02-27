import React from 'react';
import { Clock, FileText } from 'lucide-react';
import type { FieldRecordPayload } from '../../../services/field-records';
import { format } from 'date-fns';
import { typeConfig, statusConfig } from '../constants';

interface RecordCardProps {
  record: FieldRecordPayload;
  onClick?: (id: string) => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({ record, onClick }) => {
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

  const isClickable = !!onClick;

  const recordTitle = (record.content?.title as string) || config.label;
  const recordDesc = record.content?.description as string;

  return (
    <div
      onClick={() => onClick?.(record.id || '')}
      role={isClickable ? 'button' : 'article'}
      tabIndex={isClickable ? 0 : undefined}
      className={`relative bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-all duration-200 
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-slate-300 active:scale-[0.98]' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border flex items-center justify-center ${config.color}`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {config.label}
          </span>
        </div>

        {/* Sync Offline Status Indicator Component later */}
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      <h3 className="text-base font-bold text-slate-900 leading-snug mb-1 line-clamp-2">
        {recordTitle}
      </h3>

      {recordDesc && (
        <p className="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">{recordDesc}</p>
      )}

      <div className="flex items-center gap-4 mt-auto pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {format(new Date(record.createdAt || new Date()), 'dd MMM yyyy, HH:mm')}
          </span>
        </div>

        {/* Placeholder Metadata Metrics */}
        <div className="flex items-center gap-1.5 text-slate-400 ml-auto">
          {/* Replace this with dynamic values if available */}
          {record.type !== 'DAILY_ENTRY' && (
            <span className="text-xs font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
              Prioridad Alta
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
