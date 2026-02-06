import { useState } from 'react';
import { X, CheckCircle, FileText, PenTool } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { jsPDF } from "jspdf";

interface CloseActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    activity: any;
    token: string;
}

const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

export const CloseActivityModal = ({ isOpen, onClose, activity, token, existingRecord }: CloseActivityModalProps & { existingRecord?: any }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    // If existingRecord is provided, we start in Success mode
    const [isSuccess, setIsSuccess] = useState(!!existingRecord);
    const [closureRecord, setClosureRecord] = useState<any>(existingRecord || null);

    // Pre-fill form if existing record (though partial since names might be in record)
    const [formData, setFormData] = useState({
        pmName: existingRecord?.pmName || '',
        directorName: existingRecord?.directorName || '',
        contractorName: existingRecord?.contractorName || '',
        notes: ''
    });

    const closeMutation = useMutation({
        mutationFn: async (data: any) => {
            return axios.post(`http://localhost:4180/activities/${activity.id}/close`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: async (response) => {
            toast.success(t('activities.closure_success'));
            setClosureRecord(response.data);
            setIsSuccess(true);
            queryClient.invalidateQueries({ queryKey: ['activity', activity.id] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to close activity');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        closeMutation.mutate(formData);
    };

    const handleGeneratePDF = () => {
        try {
            toast.info("Generando PDF...");
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(41, 128, 185); // Blue
            doc.text("CERTIFICADO DE FINALIZACIÓN", 105, 20, { align: "center" });

            doc.setFontSize(12);
            doc.setTextColor(127, 140, 141); // Grey
            doc.text(`Código de Cierre: ${closureRecord?.closureCode || 'PENDING'}`, 105, 30, { align: "center" });
            doc.text(`${new Date().toLocaleDateString()}`, 105, 36, { align: "center" });

            // Line
            doc.setDrawColor(189, 195, 199);
            doc.line(20, 45, 190, 45);

            // Details Section
            let y = 60;
            const lineHeight = 10;
            const labelX = 20;
            const valueX = 60;

            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text("Detalles de la Actividad", 20, 55);

            doc.setFontSize(10);

            const addRow = (label: string, value: string) => {
                doc.setFont("helvetica", "bold");
                doc.setTextColor(52, 73, 94);
                doc.text(label, labelX, y);

                doc.setFont("helvetica", "normal");
                doc.setTextColor(44, 62, 80);
                doc.text(value, valueX, y);
                y += lineHeight;
            };

            addRow("Actividad:", activity.name);
            addRow("Código:", activity.code);
            addRow("Inicio:", new Date(activity.startDate).toLocaleDateString());
            addRow("Fin:", new Date(activity.endDate).toLocaleDateString());
            addRow("Contratista:", activity.contractor?.name || 'N/A');

            // Signatures
            y += 40;
            const sigY = y;

            const addSignature = (name: string, role: string, x: number) => {
                doc.setDrawColor(0);
                doc.line(x, sigY, x + 40, sigY); // Line
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(name, x + 20, sigY + 5, { align: "center" });
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(127, 140, 141);
                doc.text(role, x + 20, sigY + 10, { align: "center" });
            };

            const pmName = closureRecord?.pmName || formData.pmName || 'N/A';
            const dirName = closureRecord?.directorName || formData.directorName || 'N/A';
            const contName = closureRecord?.contractorName || formData.contractorName || 'N/A';

            addSignature(pmName, "Project Manager", 20);
            addSignature(dirName, "Director de Obra", 85);
            addSignature(contName, "Contratista", 150);

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(189, 195, 199);
            doc.text("Generado automáticamente por Antigravity Project Management System", 105, 280, { align: "center" });

            // Save
            const fileName = `Certificado_${sanitizeFilename(activity.name)}_${activity.code}_${closureRecord?.closureCode || 'FINAL'}.pdf`;

            // Explicit Blob generation for better cross-browser compatibility (Chrome/Firefox)
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            requestAnimationFrame(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            });

            toast.success("PDF descargado correctamente");

        } catch (error: any) {
            console.error("PDF Fail:", error);
            toast.error("Error al generar PDF: " + error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <CheckCircle size={18} className={isSuccess ? "text-green-600" : "text-gray-600"} />
                        {isSuccess ?
                            (existingRecord ? 'Certificado de Cierre' : 'Actividad Cerrada Exitosamente')
                            : t('activities.validate_close')}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {isSuccess && closureRecord ? (
                    <div className="p-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-green-600" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">
                                {existingRecord ? 'Actividad Completada' : '¡Felicitaciones!'}
                            </h4>
                            <p className="text-gray-500 text-sm">
                                La actividad <strong>{activity.name}</strong> está cerrada.
                                <br />Cierre registrado el: {new Date(closureRecord?.closedAt || new Date()).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={handleGeneratePDF}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-md"
                            >
                                <FileText size={20} />
                                Descargar Certificado PDF
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-sm text-green-800 mb-4">
                            <p className="font-semibold">Esta acción es irreversible.</p>
                            <p className="text-xs mt-1">Al cerrar la actividad, se generará un certificado PDF y no se podrán registrar más avances.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project Manager</label>
                            <div className="relative">
                                <PenTool className="absolute left-3 top-2.5 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="Nombre del PM"
                                    value={formData.pmName}
                                    onChange={e => setFormData({ ...formData, pmName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Director de Obra</label>
                            <div className="relative">
                                <PenTool className="absolute left-3 top-2.5 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="Nombre del Director"
                                    value={formData.directorName}
                                    onChange={e => setFormData({ ...formData, directorName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contratista</label>
                            <div className="relative">
                                <PenTool className="absolute left-3 top-2.5 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="Representante del Contratista"
                                    value={formData.contractorName}
                                    onChange={e => setFormData({ ...formData, contractorName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={closeMutation.isPending}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm flex items-center gap-2"
                            >
                                {closeMutation.isPending ? 'Procesando...' : (
                                    <>
                                        <FileText size={16} />
                                        Firmar y Generar PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
