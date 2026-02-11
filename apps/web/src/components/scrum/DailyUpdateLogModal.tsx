import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { X, Calendar, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PhotoLightbox } from '../../pages/field/PhotoLightbox'; // Import Lightbox

interface DailyUpdateLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    backlogItemId: string;
    backlogItemTitle: string;
}

export const DailyUpdateLogModal = ({ isOpen, onClose, projectId, backlogItemId, backlogItemTitle }: DailyUpdateLogModalProps) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const BASE_URL = API_URL.replace('/api', '');

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState('');

    const { data: updates, isLoading } = useQuery({
        queryKey: ['scrum', 'daily-updates', projectId, backlogItemId],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/scrum/daily-updates/${projectId}?backlogItemId=${backlogItemId}`);
            return res.data;
        },
        enabled: isOpen
    });

    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;

        // If path already contains /uploads, it's relative to root
        // But our controller is at /api/uploads
        // path from DB is like /uploads/filename.webp

        // API_URL is localhost:4180/api
        // We want localhost:4180/api/uploads/filename.webp

        // Ensure path starts with /
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        // If the path from DB starts with /uploads, we need to make sure we don't duplicate it if the API route was different
        // But here we mapped @Controller('uploads') so route is /api/uploads
        // And DB path is /uploads/filename
        // So concatenating API_URL + cleanPath (if cleanPath starts with /uploads) would be .../api/uploads/filename
        // This is exactly what we want.

        // Handle case where API_URL might have trailing slash
        const cleanApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

        // However, if path is /uploads/file, and we append to .../api, we get .../api/uploads/file.
        // This matches our controller @Controller('uploads') relative to global prefix 'api'.

        return `${cleanApiUrl}${cleanPath}`;
    };

    const handleImageClick = (src: string) => {
        setLightboxSrc(src);
        setLightboxOpen(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">Bitácora de Avance</h3>
                        <p className="text-xs text-gray-500 truncate max-w-md">{backlogItemTitle}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto bg-gray-50/50 flex-1">
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400">Cargando historial...</div>
                    ) : updates && updates.length > 0 ? (
                        <div className="space-y-6">
                            {updates.map((update: any) => (
                                <div key={update.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {update.user?.name?.charAt(0) || <UserIcon size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {update.user?.name || 'Usuario'}
                                                    <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                        {update.source || 'Bitácora'}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {format(new Date(update.createdAt), "d 'de' MMMM, yyyy - h:mm a", { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-gray-700 text-sm mb-4 whitespace-pre-wrap">
                                        {update.text}
                                    </div>

                                    {update.photos && update.photos.length > 0 && (
                                        <div className="grid grid-cols-4 gap-2">
                                            {update.photos.map((photo: any) => {
                                                const thumbUrl = getImageUrl(photo.urlThumb || photo.urlMain || photo.url);
                                                const mainUrl = getImageUrl(photo.urlMain || photo.url || photo.urlThumb);
                                                return (
                                                    <div
                                                        key={photo.id}
                                                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 group cursor-pointer"
                                                        onClick={() => handleImageClick(mainUrl)}
                                                    >
                                                        <img
                                                            src={thumbUrl}
                                                            alt="evidencia"
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                            <div className="bg-gray-100 p-4 rounded-full mb-3">
                                <Calendar size={24} className="text-gray-300" />
                            </div>
                            <p>No hay reportes registrados aún.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>

            <PhotoLightbox
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                imageSrc={lightboxSrc}
            />
        </div>
    );
};
