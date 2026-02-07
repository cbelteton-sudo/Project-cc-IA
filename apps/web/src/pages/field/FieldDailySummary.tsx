import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, UploadCloud } from 'lucide-react';

export const FieldDailySummary: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <div className="bg-white p-4 shadow-sm flex items-center gap-2">
                <button onClick={() => navigate(-1)}><ArrowLeft /></button>
                <h1 className="font-bold text-lg">Daily Summary</h1>
            </div>

            <div className="flex-1 p-4 flex flex-col items-center justify-center text-gray-500 space-y-4">
                <FileText size={48} className="text-gray-300" />
                <p>No reports generated yet.</p>

                {/* Pending Items */}
                <div className="w-full bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-2">Pending Sync</h3>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span>3 items in queue</span>
                        <UploadCloud size={18} className="text-orange-500" />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white border-t">
                <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
                    Generate PDF Report
                </button>
            </div>
        </div>
    );
};
