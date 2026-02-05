
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { CheckCircle, Calendar, User, TrendingUp, Clock, AlertTriangle, Flag } from 'lucide-react';
import { toast } from 'sonner';

interface ActivityDetailsProps {
    activityId: string;
    token: string;
    onUpdate: () => void;
}

export const ActivityDetails = ({ activityId, token, onUpdate }: ActivityDetailsProps) => {
    const queryClient = useQueryClient();

    // Fetch full details
    const { data: activity, isLoading } = useQuery({
        queryKey: ['activity', activityId],
        queryFn: async () => {
            const res = await axios.get(`http://localhost:4180/activities/${activityId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            return axios.patch(`http://localhost:4180/activities/${activityId}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            toast.success('Activity updated');
            queryClient.invalidateQueries({ queryKey: ['activity', activityId] });
            onUpdate(); // Refresh tree
        },
        onError: () => toast.error('Failed to update')
    });

    const { t } = useTranslation();

    const handleProgressUpdate = (e: any) => {
        e.preventDefault();
        const percent = parseInt(e.target.percent.value);
        if (isNaN(percent) || percent < 0 || percent > 100) return toast.error(t('activities.invalid_percentage'));

        // Frontend Validation: Regression
        if (percent < currentPercent) return toast.error(t('activities.error_lower_progress', { current: currentPercent }));

        const notes = e.target.notes.value;
        if (!notes || notes.trim() === "") return toast.error(t('activities.notes_required'));

        // For progress history, we might need a dedicated endpoint, but let's stick to simple PATCH 'percent' for MVP Visuals
        updateMutation.mutate({ percent, notes });
    };

    if (isLoading) return <div className="p-8 text-center text-gray-400">{t('common.loading')}</div>;
    if (!activity) return <div className="p-8 text-center">{t('activities.not_found')}</div>;

    // Use cumulative total from activity, distinct from the latest weekly record
    const currentPercent = (activity as any).percent ?? activity.progressRecords?.[0]?.percent ?? 0;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="border-b border-gray-100 pb-4 mb-4">
                <div className="flex justify-between md:items-start mb-2">
                    <div>
                        <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">{activity.code}</span>
                        <h2 className="text-xl font-bold text-gray-800 mt-2 leading-tight">{activity.name}</h2>
                    </div>
                </div>
                <div className="flex gap-2 mt-2">
                    <Badge status={activity.status} />
                    {activity.parentId && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">{t('activities.sub_activity')}</span>}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {/* Progress Card */}
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-3">
                        <TrendingUp size={16} /> {t('activities.progress')}
                    </h4>

                    <div className="mb-4">
                        <div className="flex justify-between text-xs font-medium text-blue-700 mb-1">
                            <span>{currentPercent}% {t('activities.completed')}</span>
                            <span>{t('activities.target')}: 100%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${currentPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    <form onSubmit={handleProgressUpdate} className="flex flex-col gap-3">
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-[10px] uppercase text-blue-600 font-bold mb-1">{t('activities.update_percent')}</label>
                                <input
                                    name="percent"
                                    type="number"
                                    min={currentPercent} max="100"
                                    defaultValue={currentPercent}
                                    className="w-full text-sm border border-blue-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm h-[34px]">
                                {t('common.save')}
                            </button>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-blue-600 font-bold mb-1">{t('activities.notes')} <span className="text-red-500">*</span></label>
                            <textarea
                                name="notes"
                                required
                                rows={2}
                                placeholder={t('activities.notes_placeholder')}
                                className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-blue-50/50"
                            />
                        </div>
                    </form>

                    {/* Progress History */}
                    {activity.progressRecords && activity.progressRecords.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-blue-200/50">
                            <h5 className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">{t('activities.history')}</h5>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-200">
                                {activity.progressRecords.map((record: any) => (
                                    <div key={record.id} className="text-xs bg-white p-2 rounded border border-blue-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-700">{new Date(record.weekStartDate).toLocaleDateString()}</span>
                                            <span className="font-bold text-blue-600">{record.percent}%</span>
                                        </div>
                                        {record.notes && <p className="text-gray-500 leading-tight italic">{record.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Dates & Schedule */}
                <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                        <Calendar size={16} /> {t('activities.schedule')}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">{t('activities.start_date')}</label>
                            <div className="text-sm font-medium text-gray-800">
                                {new Date(activity.startDate).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">{t('activities.end_date')}</label>
                            <div className="text-sm font-medium text-gray-800">
                                {new Date(activity.endDate).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contractor */}
                <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                        <User size={16} /> {t('activities.execution')}
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                        <div>
                            <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">{t('activities.contractor')}</label>
                            <div className="text-sm font-medium text-gray-800">
                                {activity.contractor?.name || t('activities.unassigned')}
                            </div>
                        </div>
                        <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">{t('common.change')}</button>
                    </div>
                </div>

                {/* Dependencies (Read Only for now) */}
                {activity.dependencies && activity.dependencies.length > 0 && (
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                            <Clock size={16} /> {t('activities.dependencies')}
                        </h4>
                        <div className="space-y-2">
                            {activity.dependencies.map((dep: any) => (
                                <div key={dep.id} className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 p-2 rounded border border-orange-100">
                                    <AlertTriangle size={12} className="text-orange-500" />
                                    {t('activities.depends_on')}: <span className="font-medium">{dep.dependsOn?.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Linked Milestones */}
                {activity.milestones && activity.milestones.length > 0 && (
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-purple-900 mb-3">
                            <Flag size={16} /> {t('activities.key_milestones')}
                        </h4>
                        <div className="space-y-2">
                            {activity.milestones.map((ms: any) => (
                                <div key={ms.id} className="flex items-center justify-between text-xs bg-purple-50 p-3 rounded-lg border border-purple-100">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-200 p-1.5 rounded-full text-purple-700">
                                            <Flag size={12} fill="currentColor" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800">{ms.name}</div>
                                            <div className="text-purple-600">{new Date(ms.date).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-purple-700 border border-purple-100 uppercase">
                                        {t(`status.${ms.status}`, ms.status) as string}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end">
                {currentPercent === 100 ? (
                    <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm w-full justify-center">
                        <CheckCircle size={18} /> {t('activities.validate_close')}
                    </button>
                ) : (
                    <button className="text-red-500 text-sm hover:bg-red-50 px-4 py-2 rounded w-full">
                        {t('activities.delete_activity')}
                    </button>
                )}
            </div>
        </div>
    );
};

// Helper
const Badge = ({ status }: { status: string }) => {
    const { t } = useTranslation();
    const colors: any = {
        'NOT_STARTED': 'bg-gray-100 text-gray-600',
        'IN_PROGRESS': 'bg-blue-100 text-blue-800',
        'DONE': 'bg-green-100 text-green-800',
        'BLOCKED': 'bg-red-100 text-red-800'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${colors[status] || colors['NOT_STARTED']}`}>
            {t(`status.${status}`)}
        </span>
    );
};
