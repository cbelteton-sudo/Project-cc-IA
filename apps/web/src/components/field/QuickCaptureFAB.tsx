
import React from 'react';
import { Plus } from 'lucide-react';
import { useQuickCapture } from '../../context/QuickCaptureContext';

export const QuickCaptureFAB: React.FC = () => {
    const { openCapture } = useQuickCapture();

    return (
        <button
            onClick={() => openCapture()}
            className="fixed bottom-6 right-6 z-40 bg-black text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all md:bottom-8 md:right-8 group"
            aria-label="Reportar"
        >
            <Plus size={24} />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Reporte Rápido
            </span>
        </button>
    );
};
