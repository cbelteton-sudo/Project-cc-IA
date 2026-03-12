import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkAsRead } from '@/services/notifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '@/services/notifications';

const getContextLabel = (entityType: string) => {
  switch (entityType) {
    case 'PROJECT':
      return 'Proyecto';
    case 'ACTIVITY':
      return 'Actividad';
    case 'MATERIAL':
      return 'Materiales';
    case 'ISSUE':
      return 'Problema';
    case 'PURCHASE_ORDER':
      return 'Orden de Compra';
    default:
      return 'Sistema';
  }
};

export const NotificationBell = () => {
  const { data: notifications } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = (n: Notification) => {
    if (!n.readAt) {
      markAsRead.mutate(n.id);
    }
    
    setOpen(false);

    if (n.entityType === 'PROJECT') {
      navigate(`/projects/${n.entityId}`);
    } else if (n.projectId) {
      switch (n.entityType) {
        case 'ACTIVITY':
          navigate(`/projects/${n.projectId}/wbs?activityId=${n.entityId}`);
          break;
        case 'MATERIAL':
          navigate(`/projects/${n.projectId}/materials?materialId=${n.entityId}`);
          break;
        case 'ISSUE':
          navigate(`/projects/${n.projectId}/issues?issueId=${n.entityId}`);
          break;
        // Add more routing cases if needed
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          {unreadCount && unreadCount > 0 && (
            <span className="text-xs text-blue-600">{unreadCount} nuevas</span>
          )}
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
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-gray-800 leading-tight pr-2">{n.message}</p>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 shrink-0">
                      {getContextLabel(n.entityType)}
                    </span>
                  </div>
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
