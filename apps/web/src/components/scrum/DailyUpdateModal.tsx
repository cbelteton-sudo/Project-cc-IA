import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { X, Upload, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DailyUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    sprintId: string;
    backlogItemId: string;
    backlogItemTitle: string;
}

export const DailyUpdateModal = ({ isOpen, onClose, projectId, sprintId, backlogItemId, backlogItemTitle }: DailyUpdateModalProps) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [note, setNote] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    };

    const submitMutation = useMutation({
        mutationFn: async () => {
            setIsSubmitting(true);
            setUploadProgress(10);

            // 1. Upload Photos sequentially (for simplicity in MVP)
            const photoIds: string[] = [];

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('projectId', projectId);
                // We don't have a direct link to fieldUpdateId here, just Scrum context. 
                // We'll link photos to DailyUpdate later via ID.

                try {
                    const res = await axios.post(`${API_URL}/photos/upload`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    photoIds.push(res.data.id);
                    setUploadProgress(10 + ((i + 1) / selectedFiles.length) * 40); // Up to 50%
                } catch (err) {
                    console.error('Error uploading photo', err);
                    // Continue with other photos or fail? For MVP, continue.
                }
            }

            // 2. Create Daily Update
            setUploadProgress(70);
            const res = await axios.post(`${API_URL}/scrum/daily-updates`, {
                projectId,
                sprintId,
                backlogItemId,
                note,
                date: new Date(),
                photoIds,
                createdByUserId: (user as any)?.id || (user as any)?.userId || '4044f19e-764f-4109-9f73-d590b61116ca'
            });

            setUploadProgress(100);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scrum', 'daily-updates', projectId] });
            queryClient.invalidateQueries({ queryKey: ['scrum', 'sprints', projectId] });

            // Reset and close
            setNote('');
            setSelectedFiles([]);
            setIsSubmitting(false);
            setUploadProgress(0);
            onClose();
        },
        onError: (err) => {
            console.error(err);
            setIsSubmitting(false);
            setUploadProgress(0);
            alert('Error al enviar el reporte. Inténtalo de nuevo.');
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">Reportar Avance Diario</h3>
                        <p className="text-xs text-gray-500 truncate max-w-md">{backlogItemTitle}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="space-y-4">
                        {/* Note Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notas del día / Bitácora</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] resize-none"
                                placeholder="Describe qué se avanzó hoy, problemas encontrados, o detalles técnicos..."
                                autoFocus
                            />
                        </div>

                        {/* Photo Upload Area */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Evidencia Fotográfica</label>

                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {selectedFiles.map((file, idx) => (
                                    <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => removeFile(idx)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors bg-gray-50 hover:bg-blue-50"
                                >
                                    <Camera size={24} />
                                    <span className="text-xs mt-1">Añadir</span>
                                </button>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Upload size={12} /> Sube fotos para documentar el avance.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => submitMutation.mutate()}
                        disabled={isSubmitting || (!note && selectedFiles.length === 0)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Enviando ({Math.round(uploadProgress)}%)...
                            </>
                        ) : (
                            'Guardar Reporte'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
