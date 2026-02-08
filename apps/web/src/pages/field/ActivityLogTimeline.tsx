import React, { useState } from 'react';
import { format } from 'date-fns';
import { Camera, AlertTriangle, FileText, Clock, AlignJustify, Grid, PlusCircle } from 'lucide-react';

interface LogItem {
    id: string;
    date: string;
    status: string;
    author?: string;
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
}

export const ActivityLogTimeline: React.FC<Props> = ({ items, onPhotoClick, onReportToday }) => {
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
    const allPhotos = items.flatMap(item =>
        item.photos.map(p => ({ ...p, date: item.date, author: item.author }))
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
                        Timeline
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

            {/* TIMELINE VIEW */}
            {viewMode === 'TIMELINE' && (
                <div className="space-y-6 pt-2">
                    {items.map((item) => (
                        <div key={item.id} className="relative pl-6 border-l-2 border-gray-200">
                            <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${getStatusDotColor(item.status)}`} />

                            <div className="mb-2 flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-900">
                                        {format(new Date(item.date), 'dd MMM yyyy')}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                        por {item.author || 'Usuario'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {/* Badges */}
                                    {item.isPending && (
                                        <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Clock size={10} /> Subiendo...
                                        </span>
                                    )}
                                    {item.status === 'BLOCKED' && (
                                        <AlertTriangle size={14} className="text-red-500" />
                                    )}
                                    {item.note && (
                                        <FileText size={14} className="text-gray-400" />
                                    )}
                                    {item.photos.length > 0 && (
                                        <div className="flex items-center text-gray-400">
                                            <Camera size={14} />
                                            <span className="text-[10px] ml-0.5">{item.photos.length}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={`bg-white rounded-lg shadow-sm border border-gray-100 ${item.status === 'BLOCKED' ? 'border-red-100 bg-red-50/10' : ''} flex flex-col md:flex-row overflow-hidden`}>
                                {/* Left Col: Content */}
                                <div className="p-3 flex-1 min-w-0">
                                    {item.status === 'BLOCKED' && (
                                        <div className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1">
                                            <AlertTriangle size={12} /> Bloqueado
                                        </div>
                                    )}

                                    {item.note ? (
                                        <p className="text-sm text-gray-700 italic whitespace-pre-wrap">"{item.note}"</p>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Sin nota adjunta</span>
                                    )}
                                </div>

                                {/* Right Col: Photos (if any) */}
                                {item.photos.length > 0 && (
                                    <div className="bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 p-2 md:w-48 lg:w-56 shrink-0">
                                        <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                                            {item.photos.slice(0, 4).map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => onPhotoClick(p.urlMain)}
                                                    className="aspect-square bg-gray-200 rounded-md overflow-hidden hover:opacity-90 border border-gray-200 block"
                                                >
                                                    <img src={p.urlThumb} alt="evidence" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                        {item.photos.length > 4 && (
                                            <div className="mt-2 text-[10px] text-center text-gray-500 font-medium">
                                                +{item.photos.length - 4} fotos más
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PHOTOS VIEW */}
            {viewMode === 'PHOTOS' && (
                <div className="grid grid-cols-3 gap-1 pt-2">
                    {allPhotos.map((p, idx) => (
                        <div key={p.id + idx} className="relative aspect-square group">
                            <button
                                onClick={() => onPhotoClick(p.urlMain)}
                                className="w-full h-full bg-gray-100 overflow-hidden"
                            >
                                <img src={p.urlThumb} alt="evidence" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
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

const getStatusDotColor = (status: string) => {
    switch (status) {
        case 'DONE': return 'bg-green-500';
        case 'BLOCKED': return 'bg-red-500';
        case 'IN_PROGRESS': return 'bg-blue-500';
        default: return 'bg-gray-300';
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'DONE': return 'bg-green-100 text-green-700';
        case 'BLOCKED': return 'bg-red-100 text-red-700';
        case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-600';
    }
};
