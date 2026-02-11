import React from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
}

export const PhotoLightbox: React.FC<Props> = ({ isOpen, onClose, imageSrc }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
            >
                <X size={32} />
            </button>
            <img
                src={imageSrc}
                alt="Full size"
                className="max-h-full max-w-full object-contain"
            />
        </div>,
        document.body
    );
};
