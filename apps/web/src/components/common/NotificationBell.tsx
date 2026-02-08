
import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkAsRead } from '@/services/notifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const NotificationBell = () => {
    const { data: notifications } = useNotifications();
    const { data: unreadCount } = useUnreadCount();
    const markAsRead = useMarkAsRead();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-slate-600" />
                    {unreadCount && unreadCount > 0 ? (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    ) : null}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                    <h4 className="font-semibold text-sm">Notificaciones</h4>
                    {unreadCount && unreadCount > 0 && <span className="text-xs text-blue-600">{unreadCount} nuevas</span>}
                </div>
                <ScrollArea className="h-64">
                    {notifications?.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">No tienes notificaciones</div>
                    ) : (
                        <div className="divide-y">
                            {notifications?.map((n) => (
                                <div
                                    key={n.id}
                                    className={`p-3 text-sm hover:bg-slate-50 cursor-pointer ${!n.readAt ? 'bg-blue-50/50' : ''}`}
                                    onClick={() => !n.readAt && markAsRead.mutate(n.id)}
                                >
                                    <p className="text-gray-800 leading-tight mb-1">{n.message}</p>
                                    <span className="text-xs text-gray-400">
                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};
