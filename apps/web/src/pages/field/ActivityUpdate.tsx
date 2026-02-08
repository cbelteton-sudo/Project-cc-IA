import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNetwork } from '../../context/NetworkContext';
import { SyncQueue } from '../../services/sync-queue';
import { saveDraft } from '../../services/db';
import axios from 'axios';
import { ArrowLeft, Save, Upload, Camera, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { ActivityLogTimeline } from './ActivityLogTimeline';
import { PhotoLightbox } from './PhotoLightbox';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

export const ActivityUpdate: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isOnline } = useNetwork();

    // State
    const [activity, setActivity] = useState<any>(null);
    const [qtyDone, setQtyDone] = useState<number>(0);
    const [manualPercent, setManualPercent] = useState<number>(0);
    const [notes, setNotes] = useState('');
    const [isRisk, setIsRisk] = useState(false);
    const [photos, setPhotos] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);

    // Log State
    const [activeTab, setActiveTab] = useState<'UPDATE' | 'LOG'>('UPDATE');
    const [logItems, setLogItems] = useState<any[]>([]);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState('');

    useEffect(() => {
        // Fetch activity details (Network only for MVP)
        if (id) {
            axios.get(`${API_URL}/activities/${id}`)
                .then(res => {
                    setActivity(res.data);
                    setManualPercent(res.data.percent || 0); // Default to current
                })
                .finally(() => setLoading(false));

            // Fetch Log (Parallel)
            // In real app, fetch when tab changes or parallel
            axios.get(`${API_URL}/field/reports/activities/${id}/log?limit=20`)
                .then(res => setLogItems(res.data.items))
                .catch(err => console.error("Failed to fetch log", err));
        }
    }, [id]);

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newPhotos = Array.from(e.target.files);
            setPhotos(prev => [...prev, ...newPhotos]);
        }
    };

    const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
        if (!activity) return;

        const updateData = {
            projectId: activity.projectId,
            date: new Date().toISOString(), // Today
            items: [{
                activityId: activity.id,
                qtyDone: activity.measurementType === 'QUANTITY' ? qtyDone : undefined,
                manualPercent,
                notes,
                isRisk
                // checklist/milestone state handling omitted for MVP brevity, can add later
            }]
        };

        if (status === 'DRAFT' || !isOnline) {
            // Save to IDB
            const draftId = uuidv4();
            await saveDraft({
                id: draftId,
                projectId: activity.projectId,
                date: updateData.date,
                items: updateData.items,
                status: 'DRAFT',
                updatedAt: Date.now()
            });
            // Also queue sync if online capability comes back? 
            // SyncQueue handles API calls, saveDraft handles IDB. 
            // Logic: If user hits "Submit" but uses SyncQueue due to offline, 
            // we add to SyncQueue.
            if (status === 'SUBMITTED') {
                await SyncQueue.add('/field-updates/draft', 'POST', updateData); // "draft" endpoint handles offline packets
            }
        } else {
            // Online Submit
            try {
                await axios.post(`${API_URL}/field-updates/draft`, updateData);
                // Also upload photos
                if (photos.length > 0) {
                    // Uploads are parallel usually
                    for (const photo of photos) {
                        const formData = new FormData();
                        formData.append('file', photo);
                        formData.append('projectId', activity.projectId);
                        formData.append('activityId', activity.id);
                        await axios.post(`${API_URL}/photos/upload`, formData);
                    }
                }
            } catch (e) {
                console.error("Submit failed", e);
                alert("Failed to submit. Saved to offline queue.");
                await SyncQueue.add('/field-updates/draft', 'POST', updateData);
            }
        }

        navigate(-1);
    };

    const openLightbox = (src: string) => {
        setLightboxSrc(src);
        setLightboxOpen(true);
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!activity) return <div className="p-10 text-center">Activity not found</div>;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white px-4 pt-4 pb-0 shadow-sm z-10 flex flex-col">
                <div className="flex items-center mb-4">
                    <button onClick={() => navigate(-1)} className="mr-3">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <div className="overflow-hidden">
                        <h1 className="font-bold text-gray-800 truncate">{activity.name}</h1>
                        <span className="text-xs text-gray-500">{activity.code}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('UPDATE')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'UPDATE' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
                    >
                        Update
                    </button>
                    <button
                        onClick={() => setActiveTab('LOG')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'LOG' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-6">
                {activeTab === 'UPDATE' ? (
                    <>
                        {/* Progress Input */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Progress</h2>

                            {activity.measurementType === 'QUANTITY' && (
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-1">Quantity Done (Today)</label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            className="border p-2 rounded w-full text-lg"
                                            value={qtyDone}
                                            onChange={e => setQtyDone(Number(e.target.value))}
                                        />
                                        <span className="ml-2 font-medium text-gray-500">{activity.unit || 'Units'}</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Total % Complete</label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="range" min="0" max="100"
                                        value={manualPercent}
                                        onChange={e => setManualPercent(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <input
                                        type="number"
                                        className="border p-2 rounded w-16 text-center"
                                        value={manualPercent}
                                        onChange={e => setManualPercent(Number(e.target.value))}
                                    />
                                    <span className="text-gray-500">%</span>
                                </div>
                                {/* Suggestion Placeholder */}
                                <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                    Attempted Suggested: {manualPercent}% (Offline estimate)
                                </div>
                            </div>
                        </div>

                        {/* Evidence */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Evidence</h2>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {photos.map((p, i) => (
                                    <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden relative">
                                        <img src={URL.createObjectURL(p)} alt="preview" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                                <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer active:bg-gray-100">
                                    <Camera size={24} className="text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1">Add</span>
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                                </label>
                            </div>
                        </div>

                        {/* Notes & Risk */}
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Notes</h2>
                                <label className="flex items-center space-x-2">
                                    <span className={`text-sm font-medium ${isRisk ? 'text-red-600' : 'text-gray-500'}`}>At Risk</span>
                                    <input type="checkbox" checked={isRisk} onChange={e => setIsRisk(e.target.checked)} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                                </label>
                            </div>

                            <textarea
                                className={`w-full border rounded p-3 text-sm focus:ring-2 focus:outline-none ${isRisk ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-100'}`}
                                rows={3}
                                placeholder={isRisk ? "Explain the risk/blocker (Required)..." : "Any observations..."}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </>
                ) : (
                    <ActivityLogTimeline
                        items={logItems}
                        onPhotoClick={openLightbox}
                        onReportToday={() => setActiveTab('UPDATE')}
                    />
                )}
            </div>

            {/* Footer - Only show in UPDATE mode */}
            {activeTab === 'UPDATE' && (
                <div className="bg-white p-4 border-t border-gray-200 flex space-x-3">
                    <button
                        onClick={() => handleSave('DRAFT')}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium active:bg-gray-200 transition-colors"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={() => handleSave('SUBMITTED')}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium active:bg-blue-700 shadow-md transition-colors flex justify-center items-center"
                    >
                        <Save size={18} className="mr-2" />
                        Submit Update
                    </button>
                </div>
            )}

            <PhotoLightbox isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} imageSrc={lightboxSrc} />
        </div>
    );
};
