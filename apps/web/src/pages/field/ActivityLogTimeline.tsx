import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Camera,
  AlertTriangle,
  FileText,
  Clock,
  AlignJustify,
  Grid,
  PlusCircle,
} from 'lucide-react';

interface LogItem {
  id: string;
  date: string;
  status: string;
  author?: string | { name: string };
  progressChip?: number;
  note?: string;
  createdAt: string;
  isPending?: boolean;
  photos: { id: string; urlThumb: string; urlMain: string }[];
}

interface Props {
  items: LogItem[];
  onPhotoClick: (url: string) => void;
  onReportToday?: () => void;
  currentUser?: string;
}

export const ActivityLogTimeline: React.FC<Props> = ({
  items,
  onPhotoClick,
  onReportToday,
  currentUser,
}) => {
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'PHOTOS'>('TIMELINE');

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 space-y-4">
        <span>No hay historial disponible</span>
        {onReportToday && (
          <button
            onClick={onReportToday}
            className="bg-blue-600 text-white px-4 py-2 rounded-full font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Reportar Hoy
          </button>
        )}
      </div>
    );
  }

  // Aggregate photos for Grid View
  const allPhotos = items.flatMap((item) =>
    item.photos.map((p) => ({ ...p, date: item.date, author: item.author })),
  );

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-gray-50 p-1 rounded-lg border border-gray-200">
        <div className="flex p-0.5 bg-gray-200/50 rounded-md">
          <button
            onClick={() => setViewMode('TIMELINE')}
            className={`p-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'TIMELINE' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <AlignJustify size={14} />
            Chat
          </button>
          <button
            onClick={() => setViewMode('PHOTOS')}
            className={`p-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'PHOTOS' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Grid size={14} />
            Fotos ({allPhotos.length})
          </button>
        </div>

        {onReportToday && (
          <button
            onClick={onReportToday}
            className="text-blue-600 font-bold text-xs flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
          >
            <PlusCircle size={14} />
            Reportar
          </button>
        )}
      </div>

      {/* TIMELINE VIEW (CHAT STYLE) */}
      {viewMode === 'TIMELINE' && (
        <div className="space-y-6 pt-2 px-1">
          {items.map((item) => {
            const isMe =
              currentUser &&
              (item.author === currentUser ||
                (typeof item.author === 'object' && item.author.name === currentUser) ||
                (typeof item.author === 'string' && item.author.includes(currentUser)));

            const authorName =
              typeof item.author === 'object' ? item.author.name : item.author || 'Usuario';

            return (
              <div key={item.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Date Header (Optional: Group by date eventually) */}
                <div className="text-[10px] text-gray-400 mb-1 px-1">
                  {format(new Date(item.date), 'dd MMM HH:mm')} • {authorName}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm relative ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {/* Badges/Status inside bubble */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {item.isPending && (
                      <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Clock size={10} /> Subiendo
                      </span>
                    )}
                    {item.status !== 'NOT_STARTED' && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                          isMe ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.status === 'DONE' && '✅ Terminado'}
                        {item.status === 'BLOCKED' && '🔴 Bloqueado'}
                        {item.status === 'IN_PROGRESS' && '🔵 En Curso'}
                      </span>
                    )}
                    {item.progressChip !== undefined && item.progressChip > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isMe ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.progressChip}%
                      </span>
                    )}
                  </div>

                  {/* Note Content */}
                  {item.note ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.note}</p>
                  ) : (
                    <div className={`text-xs italic ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                      Reporte de avance sin comentarios
                    </div>
                  )}

                  {/* Photos Grid inside Bubble */}
                  {item.photos.length > 0 && (
                    <div
                      className={`mt-3 grid grid-cols-2 gap-1 rounded-lg overflow-hidden ${isMe ? 'bg-blue-700/30 p-1' : 'bg-gray-50 p-1'}`}
                    >
                      {item.photos.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => onPhotoClick(p.urlMain)}
                          className="aspect-square rounded-md overflow-hidden hover:opacity-90 block relative"
                        >
                          <img
                            src={p.urlThumb}
                            alt="evidence"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PHOTOS VIEW (Keep Grid) */}
      {viewMode === 'PHOTOS' && (
        <div className="grid grid-cols-3 gap-1 pt-2">
          {allPhotos.map((p, idx) => (
            <div key={p.id + idx} className="relative aspect-square group">
              <button
                onClick={() => onPhotoClick(p.urlMain)}
                className="w-full h-full bg-gray-100 overflow-hidden"
              >
                <img
                  src={p.urlThumb}
                  alt="evidence"
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                <span className="text-[8px] text-white font-medium block truncate">
                  {format(new Date(p.date), 'dd MMM')}
                </span>
              </div>
            </div>
          ))}
          {allPhotos.length === 0 && (
            <div className="col-span-3 py-10 text-center text-gray-400 text-sm">
              No hay fotos en el historial.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
