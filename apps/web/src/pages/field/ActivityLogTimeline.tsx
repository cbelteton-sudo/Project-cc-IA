import React from 'react';
import { format } from 'date-fns';
import { Camera } from 'lucide-react';

interface LogItem {
    id: string;
    date: string;
    status: string;
    author?: string;
    progressChip?: number;
    note?: string;
    createdAt: string;
    photos: { id: string; urlThumb: string; urlMain: string }[];
}

interface Props {
    items: LogItem[];
    onPhotoClick: (url: string) => void;
}

export const ActivityLogTimeline: React.FC<Props> = ({ items, onPhotoClick }) => {
    if (items.length === 0) {
        return <div className="text-center text-gray-400 py-10">No history available</div>;
    }

    return (
        <div className="space-y-6">
            {items.map((item) => (
                <div key={item.id} className="relative pl-6 border-l-2 border-gray-200">
                    <div className="absolute -left-2 top-0 w-4 h-4 bg-gray-200 rounded-full border-2 border-white" />

                    <div className="mb-1 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase">
                            {format(new Date(item.date), 'MMM dd, yyyy')}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${getStatusColor(item.status)}`}>
                            {item.status.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                        <div className="mb-2">
                            <span className="text-xs font-bold text-gray-900">
                                {item.author || 'Usuario'} dijo:
                            </span>
                        </div>

                        {item.note && (
                            <p className="text-sm text-gray-700 mb-3 italic">"{item.note}"</p>
                        )}

                        {item.photos.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                                {item.photos.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => onPhotoClick(p.urlMain)}
                                        className="aspect-square bg-gray-100 rounded overflow-hidden hover:opacity-90"
                                    >
                                        <img src={p.urlThumb} alt="evidence" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Camera size={12} /> No evidence
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'DONE': return 'bg-green-100 text-green-700';
        case 'BLOCKED': return 'bg-red-100 text-red-700';
        case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-600';
    }
};
